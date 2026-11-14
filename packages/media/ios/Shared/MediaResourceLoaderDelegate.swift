import AVFoundation
import Foundation
import ObjectiveC
import UniformTypeIdentifiers

/// Associated-object key binding a `MediaResourceLoaderDelegate`'s lifetime to
/// the `AVURLAsset` it serves.
private var lifetimeTokenKey: UInt8 = 0

/// Routes a progressive remote source through AVFoundation's resource
/// loader so we can *synthesize* byte-range access for it.
///
/// A server that responds without `Accept-Ranges` makes AVFoundation treat the
/// asset as `.indefinite` — no duration at rest, no scrubbing — even though the
/// bytes are a finite MP3/AAC file (Android resolves it fine). The fix is to let
/// this delegate answer the asset's *content-information* request with the real
/// length and `isByteRangeAccessSupported = true`. AVFoundation then computes the
/// true duration (and enables seeking), and satisfies the byte ranges it
/// subsequently asks for through this delegate.
///
/// Each origin falls into one of three modes, decided by its first response:
///  - **`206` (ranges honored)** — every AVFoundation request is proxied with a
///    `Range` header and streamed straight through. Behaves like the native path.
///  - **`200` with a known length (ranges ignored)** — one sequential download into
///    a temporary file, with every request answered from it as bytes land. Restarting
///    from byte 0 per request would make each read cost the whole prefix, so a slow
///    origin would never get past the opening seconds.
///  - **Anything byte ranges can't describe** — a live or chunked stream has no
///    length to report, and a playlist behind an extension-less URL isn't a byte
///    stream. Those are handed back to a plain `AVURLAsset` through
///    `directPlaybackRequired`.
final class MediaResourceLoaderDelegate: NSObject, AVAssetResourceLoaderDelegate, URLSessionDataDelegate {
  /// Posted on the main queue with the asset as `object` when it can't be served by
  /// this delegate and its item must be rebuilt without one.
  static let directPlaybackRequired = Notification.Name("dev.knitui.media.audio.directPlaybackRequired")

  /// Scheme prefix we swap in for `http`/`https` so `AVURLAsset` hands loading to
  /// us instead of fetching the URL itself. The real scheme is appended so it can
  /// be restored, e.g. `https://h/a.mp3` -> `knitui-media-loader.https://h/a.mp3`.
  private static let schemePrefix = "knitui-media-loader"

  private static let playlistMimeTypes: Set<String> = [
    "application/vnd.apple.mpegurl",
    "application/x-mpegurl",
    "audio/mpegurl",
    "audio/x-mpegurl"
  ]

  /// Largest slice handed to AVFoundation in one `respond(with:)`.
  private static let serveChunkSize = 256 * 1024

  private let originURL: URL
  private let headers: [String: String]?
  private weak var asset: AVURLAsset?
  private var session: URLSession!

  /// Serial queue shared by the resource loader and the URLSession callbacks, so
  /// everything below is only ever touched from one queue and needs no locking.
  private let queue = DispatchQueue(label: "dev.knitui.media.audio.resourceLoader")

  /// One in-flight proxied `AVAssetResourceLoadingRequest`.
  private final class Pending {
    let loadingRequest: AVAssetResourceLoadingRequest
    /// Bytes still to deliver; `.max` means "to the end of the resource".
    var remaining: Int64
    /// True when the request only needs content info (no data to stream).
    let infoOnly: Bool

    init(_ request: AVAssetResourceLoadingRequest, length: Int64, infoOnly: Bool) {
      self.loadingRequest = request
      self.remaining = length
      self.infoOnly = infoOnly
    }
  }

  private var pending: [URLSessionTask: Pending] = [:]

  /// The content information, once any response has provided it.
  private var contentLength: Int64?
  private var contentType: String?
  private var directPlaybackRequested = false

  /// Sequential mode (origin ignores `Range`).
  private var downloadTask: URLSessionTask?
  private var downloadFileURL: URL?
  private var downloadWriter: FileHandle?
  private var downloadReader: FileHandle?
  private var downloadedBytes: Int64 = 0
  private var downloadFinished = false
  private var waiting: [AVAssetResourceLoadingRequest] = []

  private init(originURL: URL, headers: [String: String]?) {
    self.originURL = originURL
    self.headers = headers
    super.init()
    let operations = OperationQueue()
    operations.underlyingQueue = queue
    operations.maxConcurrentOperationCount = 1
    self.session = URLSession(configuration: .default, delegate: self, delegateQueue: operations)
  }

  /// Tears down the session. Required because `URLSession` retains its delegate
  /// (this object) strongly until invalidated — without this the session and the
  /// delegate keep each other alive forever and `deinit` never runs. Driven by
  /// `LifetimeToken` below, which is released when the owning asset deallocates.
  private func invalidate() {
    session.invalidateAndCancel()
    queue.async { [self] in closeDownload() }
  }

  /// Ties the delegate's lifetime to the asset: the asset retains this token via
  /// an associated object, and the token is the *only* owner of the delegate that
  /// sits outside the session<->delegate cycle. When the asset deallocates, the
  /// token deallocates and breaks the cycle, letting the delegate go too.
  private final class LifetimeToken {
    let delegate: MediaResourceLoaderDelegate
    init(_ delegate: MediaResourceLoaderDelegate) { self.delegate = delegate }
    deinit { delegate.invalidate() }
  }

  /// The loader-scheme URL for a remote source, or `nil` for one that must not be
  /// intercepted: non-http(s) sources (local files, `data:` URLs) need no help, and
  /// a streaming manifest resolves its segment URLs relative to itself, so under a
  /// custom scheme they would all be misrouted to this one origin.
  private static func proxyURL(for originURL: URL) -> URL? {
    guard var components = URLComponents(url: originURL, resolvingAgainstBaseURL: false),
      let scheme = components.scheme?.lowercased(),
      scheme == "http" || scheme == "https" else {
      return nil
    }
    let ext = originURL.pathExtension.lowercased()
    if ext == "m3u8" || ext == "mpd" {
      return nil
    }
    components.scheme = "\(schemePrefix).\(scheme)"
    return components.url
  }

  /// Builds an asset whose loading is routed through a freshly created delegate
  /// and whose lifetime is bound to the asset. Returns `nil` for sources that need
  /// no interception, which should use a plain `AVURLAsset`.
  static func makeAsset(
    originURL: URL,
    headers: [String: String]?,
    assetOptions: [String: Any]
  ) -> AVURLAsset? {
    guard let proxyURL = proxyURL(for: originURL) else {
      return nil
    }
    let delegate = MediaResourceLoaderDelegate(originURL: originURL, headers: headers)
    let asset = AVURLAsset(url: proxyURL, options: assetOptions)
    delegate.asset = asset
    asset.resourceLoader.setDelegate(delegate, queue: delegate.queue)
    objc_setAssociatedObject(asset, &lifetimeTokenKey, LifetimeToken(delegate), .OBJC_ASSOCIATION_RETAIN)
    return asset
  }

  /// What a caller that builds its own asset needs to route it through a delegate.
  struct Transport {
    /// The URL to create the asset with.
    let assetURL: URL
    let delegate: MediaResourceLoaderDelegate
    let queue: DispatchQueue
    /// Must be retained by the asset: releasing it tears the delegate down.
    let lifetime: AnyObject
  }

  /// The video player's entry point: it has its own `AVURLAsset` subclass, so it
  /// takes the pieces and attaches them itself.
  static func makeTransport(originURL: URL, headers: [String: String]?) -> Transport? {
    guard let proxyURL = proxyURL(for: originURL) else {
      return nil
    }
    let delegate = MediaResourceLoaderDelegate(originURL: originURL, headers: headers)
    return Transport(assetURL: proxyURL, delegate: delegate, queue: delegate.queue, lifetime: LifetimeToken(delegate))
  }

  // MARK: - Range probe

  private static let probeLock = NSLock()
  private static var probeResults: [URL: Bool] = [:]

  /// Whether `url` is a finite file on a server that ignores `Range`, the one case
  /// AVFoundation can't seek or measure on its own and this delegate fixes.
  ///
  /// Asks for the first two bytes: a `206` means ranges work and the native loader
  /// should be left alone; a `200` with a length means the server ignored the range.
  /// A playlist or a response without a length (live, chunked) is not a byte stream
  /// this delegate can serve. Each URL is probed once per process.
  static func serverIgnoresRanges(url: URL, headers: [String: String]?) async -> Bool {
    guard proxyURL(for: url) != nil else {
      return false
    }
    if let known = probeLock.withLock({ probeResults[url] }) {
      return known
    }
    var request = URLRequest(url: url)
    request.timeoutInterval = 10
    headers?.forEach { request.setValue($0.value, forHTTPHeaderField: $0.key) }
    request.setValue("bytes=0-1", forHTTPHeaderField: "Range")

    var ignoresRanges = false
    if let (bytes, response) = try? await URLSession.shared.bytes(for: request),
      let http = response as? HTTPURLResponse {
      // The headers are all that's needed; don't pull a body the server sent in full.
      bytes.task.cancel()
      let isPlaylist = http.mimeType.map { playlistMimeTypes.contains($0.lowercased()) } ?? false
      ignoresRanges = http.statusCode == 200 && !isPlaylist && http.expectedContentLength > 0
    } else {
      // Unreachable right now: say no, and don't remember it.
      return false
    }
    probeLock.withLock {
      if probeResults.count >= 256 {
        probeResults.removeAll()
      }
      probeResults[url] = ignoresRanges
    }
    return ignoresRanges
  }

  // MARK: - AVAssetResourceLoaderDelegate

  func resourceLoader(
    _ resourceLoader: AVAssetResourceLoader,
    shouldWaitForLoadingOfRequestedResource loadingRequest: AVAssetResourceLoadingRequest
  ) -> Bool {
    if downloadTask != nil {
      waiting.append(loadingRequest)
      serveWaiting()
      return true
    }

    let dataRequest = loadingRequest.dataRequest
    let infoOnly = dataRequest == nil

    let offset = dataRequest?.requestedOffset ?? 0
    let length: Int64
    if let dataRequest {
      length = dataRequest.requestsAllDataToEndOfResource ? .max : Int64(dataRequest.requestedLength)
    } else {
      length = 0
    }

    var request = URLRequest(url: originURL)
    headers?.forEach { request.setValue($0.value, forHTTPHeaderField: $0.key) }
    if infoOnly {
      // Cheap probe: we only need the response headers (length, type, range).
      request.setValue("bytes=0-1", forHTTPHeaderField: "Range")
    } else if length == .max {
      request.setValue("bytes=\(offset)-", forHTTPHeaderField: "Range")
    } else {
      request.setValue("bytes=\(offset)-\(offset + length - 1)", forHTTPHeaderField: "Range")
    }

    let task = session.dataTask(with: request)
    pending[task] = Pending(loadingRequest, length: length, infoOnly: infoOnly)
    task.resume()
    return true
  }

  func resourceLoader(
    _ resourceLoader: AVAssetResourceLoader,
    didCancel loadingRequest: AVAssetResourceLoadingRequest
  ) {
    waiting.removeAll { $0 === loadingRequest }
    // A cancelled proxied request stops its own task; the sequential download
    // keeps going, since whatever comes next is read from the same file.
    for (task, context) in pending where context.loadingRequest === loadingRequest {
      task.cancel()
      pending[task] = nil
    }
  }

  // MARK: - URLSessionDataDelegate

  func urlSession(
    _ session: URLSession,
    dataTask: URLSessionDataTask,
    didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    guard let context = pending[dataTask], let http = response as? HTTPURLResponse else {
      completionHandler(.cancel)
      return
    }

    if !(200..<300).contains(http.statusCode) {
      context.loadingRequest.finishLoading(with: Self.httpError(http.statusCode))
      pending[dataTask] = nil
      completionHandler(.cancel)
      return
    }

    if let mime = http.mimeType?.lowercased(), Self.playlistMimeTypes.contains(mime) {
      requestDirectPlayback(context, task: dataTask)
      completionHandler(.cancel)
      return
    }

    guard let total = Self.totalLength(from: http) else {
      requestDirectPlayback(context, task: dataTask)
      completionHandler(.cancel)
      return
    }

    contentLength = total
    if let mime = http.mimeType, let uti = UTType(mimeType: mime)?.identifier {
      contentType = uti
    }
    fillContentInformation(context.loadingRequest)

    // An info-only request has its answer now; nothing to stream.
    if context.infoOnly {
      context.loadingRequest.finishLoading()
      pending[dataTask] = nil
      completionHandler(.cancel)
      return
    }

    if http.statusCode != 206 {
      pending[dataTask] = nil
      waiting.append(context.loadingRequest)
      guard downloadTask == nil else {
        // A request that raced the first `200` waits on that download instead.
        completionHandler(.cancel)
        return
      }
      startDownload(dataTask)
    }
    completionHandler(.allow)
  }

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    if dataTask === downloadTask {
      downloadWriter?.write(data)
      downloadedBytes += Int64(data.count)
      serveWaiting()
      return
    }

    guard let context = pending[dataTask] else {
      return
    }

    var payload = data
    if context.remaining != .max {
      if Int64(payload.count) > context.remaining {
        payload = payload.subdata(in: 0..<Int(context.remaining))
      }
      context.remaining -= Int64(payload.count)
    }

    if !payload.isEmpty {
      context.loadingRequest.dataRequest?.respond(with: payload)
    }

    if context.remaining == 0 {
      context.loadingRequest.finishLoading()
      pending[dataTask] = nil
      dataTask.cancel()
    }
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    if task === downloadTask {
      if let error {
        let requests = waiting
        waiting = []
        requests.forEach { $0.finishLoading(with: error) }
        closeDownload()
      } else {
        downloadFinished = true
        serveWaiting()
      }
      return
    }

    guard let context = pending[task] else {
      return  // already finished by a range/info completion above
    }
    pending[task] = nil
    if let error, (error as? URLError)?.code != .cancelled {
      context.loadingRequest.finishLoading(with: error)
    } else if context.remaining != .max && context.remaining > 0 {
      // A clean close short of what was asked for is a truncated response.
      context.loadingRequest.finishLoading(with: URLError(.networkConnectionLost))
    } else {
      context.loadingRequest.finishLoading()
    }
  }

  // MARK: - Sequential download

  private func startDownload(_ task: URLSessionTask) {
    let url = FileManager.default.temporaryDirectory
      .appendingPathComponent("knitui-audio-\(UUID().uuidString)")
    FileManager.default.createFile(atPath: url.path, contents: nil)
    downloadFileURL = url
    downloadWriter = try? FileHandle(forWritingTo: url)
    downloadReader = try? FileHandle(forReadingFrom: url)
    downloadedBytes = 0
    downloadFinished = false
    downloadTask = task
  }

  private func closeDownload() {
    downloadTask = nil
    try? downloadWriter?.close()
    try? downloadReader?.close()
    downloadWriter = nil
    downloadReader = nil
    if let downloadFileURL {
      try? FileManager.default.removeItem(at: downloadFileURL)
    }
    downloadFileURL = nil
  }

  /// Answers every waiting request as far as the download has got.
  private func serveWaiting() {
    waiting = waiting.filter { !serve($0) }
  }

  /// Returns true once `loadingRequest` has been finished.
  private func serve(_ loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
    fillContentInformation(loadingRequest)
    guard let dataRequest = loadingRequest.dataRequest else {
      loadingRequest.finishLoading()
      return true
    }
    guard let reader = downloadReader else {
      return false
    }

    let end = dataRequest.requestsAllDataToEndOfResource
      ? (contentLength ?? .max)
      : dataRequest.requestedOffset + Int64(dataRequest.requestedLength)

    while dataRequest.currentOffset < min(end, downloadedBytes) {
      let available = min(end, downloadedBytes) - dataRequest.currentOffset
      let count = Int(min(available, Int64(Self.serveChunkSize)))
      guard (try? reader.seek(toOffset: UInt64(dataRequest.currentOffset))) != nil,
        let chunk = try? reader.read(upToCount: count), !chunk.isEmpty else {
        return false
      }
      dataRequest.respond(with: chunk)
    }

    if dataRequest.currentOffset >= end || (downloadFinished && dataRequest.currentOffset >= downloadedBytes) {
      loadingRequest.finishLoading()
      return true
    }
    return false
  }

  // MARK: - Helpers

  private func fillContentInformation(_ loadingRequest: AVAssetResourceLoadingRequest) {
    guard let info = loadingRequest.contentInformationRequest, let contentLength else {
      return
    }
    info.isByteRangeAccessSupported = true
    info.contentLength = contentLength
    if let contentType {
      info.contentType = contentType
    }
  }

  private func requestDirectPlayback(_ context: Pending, task: URLSessionTask) {
    pending[task] = nil
    context.loadingRequest.finishLoading(with: URLError(.cannotDecodeContentData))
    guard !directPlaybackRequested, let asset else {
      return
    }
    directPlaybackRequested = true
    DispatchQueue.main.async {
      NotificationCenter.default.post(name: Self.directPlaybackRequired, object: asset)
    }
  }

  private static func httpError(_ statusCode: Int) -> Error {
    let message = HTTPURLResponse.localizedString(forStatusCode: statusCode)
    return NSError(
      domain: NSURLErrorDomain,
      code: NSURLErrorBadServerResponse,
      userInfo: [NSLocalizedDescriptionKey: "The server responded with \(statusCode) (\(message))."]
    )
  }

  /// Total resource length, or `nil` when the response doesn't reveal one: prefer
  /// the total from a `Content-Range` (`bytes 0-1/12345`, where `*` means unknown),
  /// falling back to `Content-Length` — which is the full length only on a `200`.
  private static func totalLength(from response: HTTPURLResponse) -> Int64? {
    if let contentRange = response.value(forHTTPHeaderField: "Content-Range") {
      guard let totalPart = contentRange.split(separator: "/").last, let total = Int64(totalPart), total > 0 else {
        return nil
      }
      return total
    }
    guard response.statusCode == 200, response.expectedContentLength > 0 else {
      return nil
    }
    return response.expectedContentLength
  }
}
