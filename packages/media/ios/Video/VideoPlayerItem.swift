// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore
import AVKit

class VideoPlayerItem: AVPlayerItem {
  let urlAsset: VideoAsset
  let videoSource: VideoSource
  let isHls: Bool
  var videoTracks: [VideoTrack] {
    get async {
      return await tracksLoadingTask?.value ?? []
    }
  }

  private var tracksLoadingTask: Task<[VideoTrack], Never>?

  init?(videoSource: VideoSource) {
    guard let url = videoSource.uri else {
      return nil
    }
    self.videoSource = videoSource

    let asset = VideoAsset(url: url, videoSource: videoSource)
    self.urlAsset = asset
    self.isHls = asset.effectivePlaybackURL.isHLS || asset.effectiveContentType == .hls
    super.init(asset: urlAsset, automaticallyLoadedAssetKeys: nil)
    self.createTracksLoadingTask()
  }

  @VideoLoadingActor
  init?(videoSource: VideoSource, urlOverride: URL? = nil) async throws {
    try Task.checkCancellation()

    guard let url = urlOverride ?? videoSource.uri else {
      return nil
    }
    self.videoSource = videoSource

    var asset = VideoAsset(url: url, videoSource: videoSource)
    let duration = await Self.loadEagerly(asset)
    try Task.checkCancellation()

    // A finite file on a server that ignores `Range` either fails to load or comes
    // back with no duration and no seeking. Only then is the source routed through
    // the shared range-synthesis loader: a healthy server keeps the native path.
    if !asset.usesCustomTransport, !Self.isSeekable(duration), videoSource.drm == nil,
      videoSource.contentType == .auto || videoSource.contentType == .progressive,
      await MediaResourceLoaderDelegate.serverIgnoresRanges(url: url, headers: videoSource.headers) {
      try Task.checkCancellation()
      asset = VideoAsset(url: url, videoSource: videoSource, synthesizeRanges: true)
      _ = await Self.loadEagerly(asset)
    }

    self.urlAsset = asset
    self.isHls = asset.effectivePlaybackURL.isHLS || asset.effectiveContentType == .hls

    try Task.checkCancellation()
    super.init(asset: urlAsset, automaticallyLoadedAssetKeys: nil)
    try Task.checkCancellation()
    self.createTracksLoadingTask()
  }

  /// Loads what the player needs up front. Errors are ignored on purpose: the asset
  /// is assigned to the `VideoPlayer` anyway and puts it into the `.error` state,
  /// which is what triggers `onStatusChange`. Returns the duration, `nil` on failure.
  @VideoLoadingActor
  private static func loadEagerly(_ asset: VideoAsset) async -> CMTime? {
    do {
      try await asset.prepareForLoadingIfNeeded()
      let (duration, _, _, _, _, characteristics) = try await asset.load(
        .duration,
        .preferredTransform,
        .isPlayable,
        .hasProtectedContent,
        .tracks,
        .availableMediaCharacteristicsWithMediaSelectionOptions
      )
      for characteristic in characteristics {
        _ = try await asset.loadMediaSelectionGroup(for: characteristic)
      }
      return duration
    } catch {
      return nil
    }
  }

  /// Whether the asset loaded with a finite duration.
  private static func isSeekable(_ duration: CMTime?) -> Bool {
    guard let duration else {
      return false
    }
    return duration.isValid && !duration.isIndefinite && duration.seconds > 0
  }

  deinit {
    tracksLoadingTask?.cancel()
  }

  func createTracksLoadingTask() {
    tracksLoadingTask = Task { @VideoLoadingActor [weak self] in
      guard let self else {
        return []
      }
      let mainUrl = urlAsset.effectivePlaybackURL

      var tracks: [VideoTrack] = []
      if let assetTracks = try? await urlAsset.loadTracks(withMediaType: .video) {
        for avAssetTrack in assetTracks {
          tracks.append(await VideoTrack.from(assetTrack: avAssetTrack))
        }
      }

      guard isHls else {
        return tracks
      }

      let hlsTracks = await loadHlsTracks(mainUrl: mainUrl)
      return tracks + hlsTracks
    }
  }

  // MARK: - HLS Helpers

  @VideoLoadingActor
  private func loadHlsTracks(mainUrl: URL) async -> [VideoTrack] {
    let tracks: [VideoTrack]

    if #available(iOS 26.0, tvOS 26, *) {
      tracks = await loadModernHlsTracks(mainUrl: mainUrl)
    } else {
      tracks = await loadLegacyHlsTracks()
    }

    // For HLS sources with multiple audio renditions, the master playlist lists each video
    // rendition once per audio group, so the same video track is reported multiple times.
    // Deduplicate by id (the video playlist URL) to expose each variant only once.
    var seen: [VideoTrack] = []

    for track in tracks where !seen.contains(track) {
      seen.append(track)
    }

    return seen
  }

  @available(iOS 26.0, tvOS 26, *)
  @VideoLoadingActor
  private func loadModernHlsTracks(mainUrl: URL) async -> [VideoTrack] {
    guard let variants = try? await urlAsset.load(.variants) else {
      return []
    }
    let isPlayable = (try? await urlAsset.load(.isPlayable)) ?? false

    return variants.compactMap { variant in
      VideoTrack.from(assetVariant: variant, isPlayable: isPlayable, mainUrl: mainUrl)
    }
  }

  @VideoLoadingActor
  private func loadLegacyHlsTracks() async -> [VideoTrack] {
    do {
      return try await self.fetchHlsVideoTracks()
    } catch {
      log.warn("[knit-media] Failed to fetch HLS video tracks: \(error.localizedDescription)")
      return []
    }
  }

  // AVKit API doesn't provide us with a list of available tracks for a HLS source. We can download the playlist file and parse it ourselves
  // it's usually very small (1-2 kB), so we won't add too much overhead
  @VideoLoadingActor
  private func fetchHlsVideoTracks() async throws -> [VideoTrack] {
    let uri = urlAsset.effectivePlaybackURL
    var request = URLRequest(url: uri)
    if let headers = videoSource.headers {
      for (key, value) in headers {
        request.addValue(value, forHTTPHeaderField: key)
      }
    }

    let (data, _) = try await URLSession.shared.data(for: request)
    let content = String(data: data, encoding: .utf8) ?? ""
    return parseM3U8(content, mainUrl: uri)
  }

  private func parseM3U8(_ content: String, mainUrl: URL) -> [VideoTrack] {
    let lines = content.components(separatedBy: "\n")
    return zip(lines, lines.dropFirst()).compactMap { line, nextLine in
      VideoTrack.from(hlsHeaderLine: line, idLine: nextLine, mainUrl: mainUrl)
    }
  }
}

private extension URL {
  var isHLS: Bool {
    // https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8
    // Above is a valid link, even though the path extension is an empty string, we can use a more primitive suffix method as a fallback
    return self.pathExtension.lowercased() == "m3u8" || self.absoluteString.lowercased().hasSuffix("m3u8")
  }
}
