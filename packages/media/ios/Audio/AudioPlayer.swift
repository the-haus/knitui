import ExpoModulesCore
import Combine

private enum AudioConstants {
  static let playbackStatus = "playbackStatusUpdate"
}

public class AudioPlayer: SharedRef<AVPlayer>, Playable, LockScreenPlayable {
  let id = UUID().uuidString
  var shouldCorrectPitch = true
  var pitchCorrectionQuality: AVAudioTimePitchAlgorithm = .timeDomain
  var isActiveForLockScreen = false
  var metadata: Metadata?
  var lockScreenOptions: LockScreenOptions?
  var currentRate: Float = 1.0 {
    didSet {
      currentRate = max(0, currentRate)
    }
  }
  let interval: Double
  var wasPlaying = false
  var isPaused: Bool {
    ref.rate == 0.0
  }
  var samplingEnabled = false
  var keepAudioSessionActive = false
  /// Forward-buffer preference. `AVPlayerItem.preferredForwardBufferDuration` is per item and
  /// resets to the default when the item is replaced (source swap, reconnect, media-services
  /// reset), so the value is stored and re-applied to every new item.
  var preferredForwardBufferDuration: TimeInterval = 0 {
    didSet {
      applyPreferredForwardBufferDuration()
    }
  }
  var onRelease: (() -> Void)?

  var isLooping = false {
    didSet {
      guard isLooping != oldValue else {
        return
      }
      if isLooping {
        ref.actionAtItemEnd = .advance
        enqueueNextLoopItem()
      } else {
        removeQueuedLoopItems()
        ref.actionAtItemEnd = .pause
      }
      updateStatus(with: [:])
    }
  }

  private var source: AudioSource?

  // MARK: Observers
  private var timeToken: Any?
  private var cancellables = Set<AnyCancellable>()
  private var directPlaybackObserver: NSObjectProtocol?
  private var endObserver: NSObjectProtocol?

  /// Read from the JS thread once per drawn frame and replaced from the player's
  /// observers, so every access goes through the lock.
  private let audioProcessorLock = NSLock()
  private var unsafeAudioProcessor: KnitAudioTapProcessor?
  private var audioProcessor: KnitAudioTapProcessor? {
    get {
      audioProcessorLock.lock()
      defer { audioProcessorLock.unlock() }
      return unsafeAudioProcessor
    }
    set {
      audioProcessorLock.lock()
      let previous = unsafeAudioProcessor
      unsafeAudioProcessor = newValue
      audioProcessorLock.unlock()
      // Released outside the lock: the last reference may run the tap's teardown.
      _ = previous
    }
  }
  private var tapInstalled = false
  private var shouldInstallAudioTap = false
  weak var owningRegistry: AudioComponentRegistry?
  var onPlaybackComplete: (() -> Void)?

  // Length (seconds) computed from the MP3 header for a REMOTE source whose
  // duration AVFoundation reports as `.indefinite`. iOS won't measure a
  // progressive MP3 served without `Accept-Ranges` (no byte-range scan; no
  // proactive download while paused), so we fetch just the file's first bytes and
  // parse the frame header ourselves — Xing/Info gives an exact VBR length,
  // otherwise we estimate from the CBR bitrate + `Content-Length` (matching how
  // Android surfaces it). `0` until resolved (see `estimateDurationFromHeader`).
  private var estimatedDurationSeconds: Double = 0
  private var isEstimatingDuration = false
  // Whether the header-based duration estimate has finished (resolved OR failed).
  // Until it has, an indefinite duration means "not measured YET", not "live" — so
  // we don't flash the LIVE badge on every remote track during the brief
  // load/estimate window.
  private var didAttemptDurationEstimate = false

  var duration: Double {
    let seconds = ref.currentItem?.duration.seconds ?? 0.0
    if !seconds.isNaN, seconds > 0 {
      return seconds
    }
    // AVFoundation couldn't measure it — use our header-derived value if we have one.
    return estimatedDurationSeconds
  }

  var currentTime: Double {
    let seconds = ref.currentItem?.currentTime().seconds ?? 0.0
    return seconds.isNaN ? 0.0 : seconds
  }

  var isLive: Bool {
    // A finite player-item duration (or a finite header estimate) means NOT live.
    if let item = ref.currentItem, !item.duration.isIndefinite, !item.duration.seconds.isNaN {
      return false
    }
    if estimatedDurationSeconds > 0 {
      return false
    }
    // Still loading or estimating the length — don't claim "live" prematurely
    // (that's the LIVE-badge flash a finite remote track would otherwise show
    // before its duration resolves). Only a genuinely indefinite stream that
    // survives a completed estimate attempt is treated as live.
    guard didAttemptDurationEstimate, !isEstimatingDuration else { return false }
    return ref.currentItem?.duration.isIndefinite ?? false
  }

  /// When the player item's duration is `.indefinite`, fetch just the leading
  /// bytes of the source and derive the length from the MP3 header (Xing/Info for
  /// exact VBR, else CBR bitrate × `Content-Length`), then re-emit status so a
  /// length shows at rest — matching Android. Streams only the header (cancels
  /// after the first frame), never the whole file. No-op once resolved/in-flight.
  private func estimateDurationFromHeader() {
    guard let item = ref.currentItem, item.duration.isIndefinite, let url = source?.uri,
      estimatedDurationSeconds == 0, !isEstimatingDuration
    else {
      return
    }
    isEstimatingDuration = true
    let headers = source?.headers
    Task { [weak self] in
      let seconds = await MP3Duration.fetchAndEstimate(url: url, headers: headers)
      await MainActor.run {
        guard let self else { return }
        self.isEstimatingDuration = false
        self.didAttemptDurationEstimate = true
        if let seconds, seconds > 0 {
          self.estimatedDurationSeconds = seconds
        }
        // Re-emit either way: on success the length appears; on failure `isLive`
        // can now settle to its real value (truly indefinite → live).
        self.updateStatus(with: [:])
      }
    }
  }

  var lockScreenPlayer: AVPlayer {
    ref
  }

  var currentOffsetFromLive: Double? {
    // currentDate() blocks until the item has loaded, and a still-loading item looks live too.
    guard let item = ref.currentItem, item.status == .readyToPlay, item.duration.isIndefinite,
      let currentDate = item.currentDate()
    else {
      return nil
    }
    return Date().timeIntervalSince1970 - currentDate.timeIntervalSince1970
  }

  init(_ ref: AVPlayer, interval: Double, source: AudioSource? = nil) {
    self.interval = interval
    self.source = source
    super.init(ref)

    setupPublisher()
    observeDirectPlaybackRequests()
  }

  var isLoaded: Bool {
    ref.currentItem?.status == .readyToPlay
  }

  var isPlaying: Bool {
    ref.timeControlStatus == .playing
  }

  var isBuffering: Bool {
    ref.isBuffering(isPlaying: isPlaying)
  }

  private var effectiveRate: Float {
    currentRate > 0 ? currentRate : 1.0
  }

  func play(at rate: Float) {
    ref.actionAtItemEnd = isLooping ? .advance : .pause
    if isLooping {
      enqueueNextLoopItem()
    }
    addPlaybackEndNotification()
    registerTimeObserver()
    ref.playImmediately(atRate: rate)

    if isActiveForLockScreen {
      MediaController.shared.updateNowPlayingInfo(for: self)
    }
  }

  func setSamplingEnabled(enabled: Bool) {
    if samplingEnabled == enabled {
      return
    }
    samplingEnabled = enabled
    if enabled {
      if isLoaded {
        installTap()
      } else {
        shouldInstallAudioTap = true
      }
    } else {
      uninstallTap()
      shouldInstallAudioTap = false
    }
  }

  func currentStatus(knownCurrentTime: Double? = nil) -> [String: Any?] {
    let currentDuration = ref.status == .readyToPlay ? duration : 0.0
    let rate = isPlaying ? ref.rate : currentRate
    return [
      "id": id,
      "currentTime": knownCurrentTime ?? currentTime,
      "playbackState": statusToString(status: ref.status),
      "timeControlStatus": timeControlStatusString(status: ref.timeControlStatus),
      "reasonForWaitingToPlay": reasonForWaitingToPlayString(status: ref.reasonForWaitingToPlay),
      "mute": ref.isMuted,
      "duration": currentDuration,
      "playing": isPlaying,
      "loop": isLooping,
      "didJustFinish": false,
      "isLoaded": isLoaded,
      "playbackRate": rate,
      "shouldCorrectPitch": shouldCorrectPitch,
      "isBuffering": isBuffering,
      "isLive": isLive,
      "currentOffsetFromLive": currentOffsetFromLive,
      "error": nil
    ]
  }

  func setActiveForLockScreen(_ active: Bool = true, metadata: Metadata? = nil, options: LockScreenOptions?) {
    self.metadata = metadata
    self.isActiveForLockScreen = active
    self.lockScreenOptions = active ? options : nil
    if active {
      MediaController.shared.setActivePlayable(self, options: options)
    } else {
      MediaController.shared.setActivePlayable(nil)
    }
  }

  func updateStatus(with dict: [String: Any]) {
    // Reading currentTime waits on the player's lock while a source swap pauses it.
    var arguments = currentStatus(knownCurrentTime: dict["currentTime"] as? Double)
    arguments.merge(dict) { _, new in
      new
    }
    self.emit(event: AudioConstants.playbackStatus, payload: arguments)

    if isActiveForLockScreen {
      MediaController.shared.updateNowPlayingInfo(for: self)
    }
  }

  func seekTo(seconds: Double, toleranceMillisBefore: Double? = nil, toleranceMillisAfter: Double? = nil) async {
    let time = CMTime(seconds: seconds, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    let toleranceBefore = toleranceMillisBefore.map {
      CMTime(seconds: $0 / 1000.0, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    } ?? CMTime.positiveInfinity
    let toleranceAfter = toleranceMillisAfter.map {
      CMTime(seconds: $0 / 1000.0, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    } ?? CMTime.positiveInfinity

    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      ref.seek(to: time, toleranceBefore: toleranceBefore, toleranceAfter: toleranceAfter) { [weak self] _ in
        if let self {
          self.updateStatus(with: [
            "currentTime": self.currentTime
          ])
        }
        continuation.resume()
      }
    }
  }

  private func applyPreferredForwardBufferDuration() {
    guard preferredForwardBufferDuration > 0 else {
      return
    }
    ref.currentItem?.preferredForwardBufferDuration = preferredForwardBufferDuration
  }

  private func setupPublisher() {
    ref.publisher(for: \.currentItem?.status)
      .sink { [weak self] status in
        guard let self, let status else {
          return
        }
        if status == .readyToPlay {
          self.updateStatus(with: [
            "isLoaded": true
          ])
          // iOS can't measure remote-MP3 length at rest — derive it from the header.
          self.estimateDurationFromHeader()
          if self.isLooping {
            self.enqueueNextLoopItem()
          }
          if shouldInstallAudioTap || samplingEnabled {
            installTap()
            shouldInstallAudioTap = false
          }
        }
        if status == .failed {
          self.updateStatus(with: [
            "error": self.ref.currentItem?.error?.localizedDescription ?? "Unknown error"
          ])
        }
      }
      .store(in: &cancellables)

    // Status otherwise comes from the periodic time observer, which is silent the
    // moment time stops advancing, so a stall would never reach JS.
    ref.publisher(for: \.timeControlStatus)
      .removeDuplicates()
      .sink { [weak self] _ in
        self?.updateStatus(with: [:])
      }
      .store(in: &cancellables)

    ref.publisher(for: \.currentItem)
      .sink { [weak self] _ in
        guard let self else {
          return
        }
        self.applyPreferredForwardBufferDuration()
        if self.isLooping {
          self.enqueueNextLoopItem()
          self.addPlaybackEndNotification()
        }
        if self.samplingEnabled && self.isLoaded {
          self.uninstallTap()
          self.installTap()
        }
      }
      .store(in: &cancellables)

    // iOS resolves `AVPlayerItem.duration` ASYNCHRONOUSLY — typically a beat AFTER
    // the item reports `.readyToPlay` — and upstream emits no status when it lands
    // (it observes `currentItem.status`, not `currentItem.duration`, and only the
    // periodic time observer re-reads duration, and that runs solely DURING
    // playback). So a loaded-but-paused player reports duration `0` forever, which
    // is why the UI shows no track length at rest on iOS while Android (duration
    // known at prepare) is fine. Observe the item's duration directly and re-emit
    // the full status the moment it becomes known, so the length appears without
    // requiring playback.
    ref.publisher(for: \.currentItem?.duration)
      .sink { [weak self] _ in
        guard let self, self.isLoaded else {
          return
        }
        self.updateStatus(with: [:])
      }
      .store(in: &cancellables)
  }

  /// Take over a preloaded player, together with everything it has buffered.
  ///
  /// Moving only its item across is not possible: AVFoundation raises an exception
  /// when an item that has belonged to one `AVPlayer` is handed to another, which
  /// is what playing a preloaded source used to do. So the player itself becomes
  /// this object's player, and the settings of the one it replaces carry over.
  func adoptPreloadedPlayer(_ player: AVPlayer, source: AudioSource?) {
    let previous = ref
    let wasPlaying = previous.timeControlStatus == .playing
    let wasSamplingEnabled = samplingEnabled
    teardownPlayer()
    previous.replaceCurrentItem(with: nil)

    self.source = source
    estimatedDurationSeconds = 0
    isEstimatingDuration = false
    didAttemptDurationEstimate = false

    player.volume = previous.volume
    player.isMuted = previous.isMuted
    player.allowsExternalPlayback = previous.allowsExternalPlayback
    ref = player
    setupPublisher()

    if wasSamplingEnabled {
      shouldInstallAudioTap = true
    }
    if wasPlaying {
      play(at: effectiveRate)
    }
  }

  func replaceCurrentSource(source: AudioSource?) {
    self.source = source
    estimatedDurationSeconds = 0
    isEstimatingDuration = false
    didAttemptDurationEstimate = false
    let wasPlaying = ref.timeControlStatus == .playing
    let wasSamplingEnabled = samplingEnabled
    removeQueuedLoopItems()
    ref.pause()

    if samplingEnabled {
      uninstallTap()
    }
    let item = AudioUtils.createAVPlayerItem(from: source)
    replacePlayerItem(with: item)

    if wasSamplingEnabled {
      shouldInstallAudioTap = true
    }

    if wasPlaying {
      onReady { [weak self] in
        guard let self else { return }
        self.play(at: self.effectiveRate)
      }
    }
  }

  func handleMediaServicesReset() {
    guard let source else {
      updateStatus(with: ["mediaServicesDidReset": true])
      return
    }

    // Store these before we reset
    let shouldResume = wasPlaying
    let savedTime = currentTime
    let savedRate = currentRate > 0 ? currentRate : 1.0
    let wasSamplingEnabled = samplingEnabled

    replacePlayer(with: source, restoreSampling: wasSamplingEnabled)

    onReady { [weak self] in
      guard let self else { return }
      self.restorePlaybackState(time: savedTime, shouldResume: shouldResume, rate: savedRate)
      self.wasPlaying = false
      self.updateStatus(with: ["mediaServicesDidReset": true])
    }
  }

  private func replacePlayer(with source: AudioSource, restoreSampling: Bool) {
    teardownPlayer()
    estimatedDurationSeconds = 0
    isEstimatingDuration = false
    didAttemptDurationEstimate = false

    ref = AudioUtils.createAVPlayer(from: source)
    setupPublisher()

    if restoreSampling {
      shouldInstallAudioTap = true
    }
  }

  private func teardownPlayer() {
    removeQueuedLoopItems()
    if samplingEnabled {
      uninstallTap()
    }
    if let timeToken {
      ref.removeTimeObserver(timeToken)
      self.timeToken = nil
    }
    if let endObserver {
      NotificationCenter.default.removeObserver(endObserver)
      self.endObserver = nil
    }
    cancellables.removeAll()
    ref.pause()
  }

  private func onReady(_ completion: @escaping () -> Void) {
    ref.publisher(for: \.currentItem?.status)
      .compactMap { $0 }
      .filter { $0 == .readyToPlay }
      .first()
      .sink { _ in completion() }
      .store(in: &cancellables)
  }

  private func restorePlaybackState(time: Double, shouldResume: Bool, rate: Float) {
    let cmTime = CMTime(seconds: time, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    ref.seek(to: cmTime) { [weak self] _ in
      guard let self, shouldResume else { return }
      self.play(at: rate)
    }
  }

  private func installTap() {
    guard isLoaded else {
      shouldInstallAudioTap = true
      return
    }

    guard audioProcessor?.isTapInstalled != true else {
      tapInstalled = true
      return
    }

    if let audioProcessor {
      audioProcessor.invalidate()
    }

    audioProcessor = KnitAudioTapProcessor(player: ref)
    let success = audioProcessor?.installTap() ?? false
    tapInstalled = success
  }

  /// Copies the newest decoded frames (mono) into `target`; 0 when nothing is new.
  func readSamples(into target: UnsafeMutablePointer<Float>, capacity: Int) -> Int {
    guard samplingEnabled, let audioProcessor else {
      return 0
    }
    return audioProcessor.readLatest(into: target, capacity: capacity)
  }

  private func uninstallTap() {
    tapInstalled = false
    audioProcessor?.uninstallTap()
  }

  private func replacePlayerItem(with item: AVPlayerItem?) {
    if let queuePlayer = ref as? AVQueuePlayer {
      queuePlayer.removeAllItems()
      if let item {
        queuePlayer.insert(item, after: nil)
      }
    } else {
      ref.replaceCurrentItem(with: item)
    }
  }

  private func enqueueNextLoopItem() {
    guard let queuePlayer = ref as? AVQueuePlayer,
      let currentItem = queuePlayer.currentItem else {
      return
    }

    guard queuePlayer.items().count <= 1 else {
      return
    }
    let nextItem = AVPlayerItem(asset: currentItem.asset)
    nextItem.audioTimePitchAlgorithm = currentItem.audioTimePitchAlgorithm
    nextItem.preferredForwardBufferDuration = currentItem.preferredForwardBufferDuration
    queuePlayer.insert(nextItem, after: currentItem)
  }

  private func removeQueuedLoopItems() {
    guard let queuePlayer = ref as? AVQueuePlayer else {
      return
    }

    for item in queuePlayer.items() where item != queuePlayer.currentItem {
      queuePlayer.remove(item)
    }
  }

  private func addPlaybackEndNotification() {
    if let endObserver {
      NotificationCenter.default.removeObserver(endObserver)
    }

    endObserver = NotificationCenter.default.addObserver(
      forName: .AVPlayerItemDidPlayToEndTime,
      object: nil,
      queue: nil
    ) { [weak self] notification in
      guard let self,
        let finishedItem = notification.object as? AVPlayerItem else {
        return
      }

      guard let queuePlayer = self.ref as? AVQueuePlayer,
        finishedItem == queuePlayer.currentItem || queuePlayer.items().contains(finishedItem) else {
        return
      }

      if !self.isLooping {
        let currentTime = finishedItem.duration.seconds
        self.updateStatus(with: [
          "playing": false,
          "currentTime": currentTime.isNaN ? 0.0 : currentTime,
          "didJustFinish": true
        ])
        self.onPlaybackComplete?()
      }
    }
  }

  private func registerTimeObserver() {
    if let timeToken {
      ref.removeTimeObserver(timeToken)
    }

    let updateInterval = interval / 1000
    let interval = CMTime(seconds: updateInterval, preferredTimescale: CMTimeScale(NSEC_PER_SEC))

    timeToken = ref.addPeriodicTimeObserver(forInterval: interval, queue: nil) { [weak self] time in
      guard let self else {
        return
      }

      self.updateStatus(with: [
        "currentTime": time.seconds
      ])
    }
  }

  var volume: Float {
    get { ref.volume }
    set { ref.volume = newValue }
  }

  func pause() {
    ref.pause()
  }

  func resumePlayback() {
    ref.play()
  }

  private func observeDirectPlaybackRequests() {
    directPlaybackObserver = NotificationCenter.default.addObserver(
      forName: MediaResourceLoaderDelegate.directPlaybackRequired,
      object: nil,
      queue: .main
    ) { [weak self] notification in
      guard let self, let asset = notification.object as? AVAsset, self.ref.currentItem?.asset === asset,
        let item = AudioUtils.createDirectAVPlayerItem(from: self.source) else {
        return
      }
      self.ref.replaceCurrentItem(with: item)
    }
  }

  public override func sharedObjectWillRelease() {
    if let directPlaybackObserver {
      NotificationCenter.default.removeObserver(directPlaybackObserver)
    }
    onRelease?()
    onRelease = nil
    ref.currentItem?.cancelPendingSeeks()
    owningRegistry?.remove(self)

    if isActiveForLockScreen {
      MediaController.shared.setActivePlayable(nil)
    }

    teardownPlayer()

    audioProcessor?.invalidate()
    audioProcessor = nil
  }
}

/// Minimal MP3 duration estimator. Fetches only the leading bytes of a remote
/// source and derives the track length from the first frame header — a Xing/Info
/// VBR header gives an exact length, otherwise we estimate from the CBR bitrate and
/// the total `Content-Length`. Used only when AVFoundation reports `.indefinite`
/// for a progressive remote MP3 (e.g. a server without `Accept-Ranges`), where iOS
/// otherwise shows no length at rest while Android does.
enum MP3Duration {
  /// Hard cap on the leading bytes pulled while probing (covers a large ID3v2 tag
  /// with embedded artwork plus the first audio frame), so we never stream the file.
  private static let maxProbeBytes = 1_000_000

  static func fetchAndEstimate(url: URL, headers: [String: String]?) async -> Double? {
    var request = URLRequest(url: url)
    headers?.forEach { request.setValue($0.value, forHTTPHeaderField: $0.key) }
    guard let (bytes, response) = try? await URLSession.shared.bytes(for: request) else {
      return nil
    }
    let totalBytes = (response as? HTTPURLResponse)?.expectedContentLength ?? -1
    var buffer = [UInt8]()
    buffer.reserveCapacity(64 * 1024)
    var needed = 8 * 1024  // grows once an ID3v2 tag size is known
    var checkedID3 = false
    do {
      for try await byte in bytes {
        buffer.append(byte)
        if !checkedID3, buffer.count >= 10 {
          checkedID3 = true
          if buffer[0] == 0x49, buffer[1] == 0x44, buffer[2] == 0x33 {  // "ID3"
            let tagSize =
              (Int(buffer[6]) << 21) | (Int(buffer[7]) << 14) | (Int(buffer[8]) << 7)
              | Int(buffer[9])
            needed = min(maxProbeBytes, 10 + tagSize + 4 * 1024)
          }
        }
        if buffer.count >= needed { break }
      }
    } catch {
      // Use whatever we managed to read before the stream errored.
    }
    return estimate(bytes: buffer, totalBytes: totalBytes)
  }

  /// Parse the file's leading `bytes` for the first MP3 frame and return the track
  /// length in seconds, or `nil` if it can't be determined.
  static func estimate(bytes: [UInt8], totalBytes: Int64) -> Double? {
    var offset = 0
    // Skip an ID3v2 tag if present (its syncsafe size lives in bytes 6...9).
    if bytes.count >= 10, bytes[0] == 0x49, bytes[1] == 0x44, bytes[2] == 0x33 {
      let tagSize =
        (Int(bytes[6]) << 21) | (Int(bytes[7]) << 14) | (Int(bytes[8]) << 7) | Int(bytes[9])
      offset = 10 + tagSize
    }
    // Scan for the first frame sync (11 set bits) and parse its header.
    while offset + 4 <= bytes.count {
      if bytes[offset] == 0xFF, (bytes[offset + 1] & 0xE0) == 0xE0,
        let frame = Frame(bytes, at: offset)
      {
        // Exact VBR length from a Xing/Info header in the first frame, if present.
        if let frameCount = frame.xingFrameCount(bytes, frameOffset: offset), frameCount > 0 {
          return Double(frameCount) * Double(frame.samplesPerFrame) / Double(frame.sampleRate)
        }
        // Otherwise a CBR estimate from the total byte count.
        guard totalBytes > 0, frame.bitrate > 0 else { return nil }
        let audioBytes = Double(totalBytes) - Double(offset)
        guard audioBytes > 0 else { return nil }
        return audioBytes * 8.0 / Double(frame.bitrate)
      }
      offset += 1
    }
    return nil
  }

  /// A parsed MPEG audio frame header.
  private struct Frame {
    let bitrate: Int  // bits/sec
    let sampleRate: Int  // Hz
    let samplesPerFrame: Int
    let channelMode: Int  // 0 stereo, 1 joint, 2 dual, 3 mono
    let version: Int  // 3 = MPEG1, 2 = MPEG2, 0 = MPEG2.5
    let layer: Int  // 3 = Layer I, 2 = Layer II, 1 = Layer III

    init?(_ b: [UInt8], at o: Int) {
      guard o + 4 <= b.count else { return nil }
      version = Int((b[o + 1] >> 3) & 0x03)
      layer = Int((b[o + 1] >> 1) & 0x03)
      let bitrateIndex = Int((b[o + 2] >> 4) & 0x0F)
      let sampleRateIndex = Int((b[o + 2] >> 2) & 0x03)
      channelMode = Int((b[o + 3] >> 6) & 0x03)
      guard version != 1, layer != 0, bitrateIndex != 0, bitrateIndex != 15, sampleRateIndex != 3,
        let br = Frame.bitrate(version: version, layer: layer, index: bitrateIndex),
        let sr = Frame.sampleRate(version: version, index: sampleRateIndex)
      else {
        return nil
      }
      bitrate = br * 1000
      sampleRate = sr
      if layer == 3 {  // Layer I
        samplesPerFrame = 384
      } else if layer == 2 {  // Layer II
        samplesPerFrame = 1152
      } else {  // Layer III
        samplesPerFrame = version == 3 ? 1152 : 576
      }
    }

    /// Frame count from a Xing/Info VBR header after the side-info block, if any.
    func xingFrameCount(_ b: [UInt8], frameOffset: Int) -> Int? {
      let sideInfo: Int
      if version == 3 {  // MPEG1
        sideInfo = channelMode == 3 ? 17 : 32
      } else {  // MPEG2 / 2.5
        sideInfo = channelMode == 3 ? 9 : 17
      }
      let tag = frameOffset + 4 + sideInfo
      guard tag + 12 <= b.count else { return nil }
      let isXing =
        (b[tag] == 0x58 && b[tag + 1] == 0x69 && b[tag + 2] == 0x6E && b[tag + 3] == 0x67)  // "Xing"
        || (b[tag] == 0x49 && b[tag + 1] == 0x6E && b[tag + 2] == 0x66 && b[tag + 3] == 0x6F)  // "Info"
      guard isXing, Int(b[tag + 7]) & 0x01 == 0x01 else { return nil }  // frames-present flag
      let p = tag + 8
      return (Int(b[p]) << 24) | (Int(b[p + 1]) << 16) | (Int(b[p + 2]) << 8) | Int(b[p + 3])
    }

    private static func bitrate(version: Int, layer: Int, index: Int) -> Int? {
      let mpeg1L1 = [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 0]
      let mpeg1L2 = [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 0]
      let mpeg1L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
      let mpeg2L1 = [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, 0]
      let mpeg2L23 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0]  // L2 & L3
      let table: [Int]
      if version == 3 {  // MPEG1
        table = layer == 3 ? mpeg1L1 : (layer == 2 ? mpeg1L2 : mpeg1L3)
      } else {  // MPEG2 / 2.5
        table = layer == 3 ? mpeg2L1 : mpeg2L23
      }
      let value = table[index]
      return value > 0 ? value : nil
    }

    private static func sampleRate(version: Int, index: Int) -> Int? {
      let table: [Int]
      switch version {
      case 3: table = [44100, 48000, 32000]  // MPEG1
      case 2: table = [22050, 24000, 16000]  // MPEG2
      case 0: table = [11025, 12000, 8000]  // MPEG2.5
      default: return nil
      }
      return index >= 0 && index < table.count ? table[index] : nil
    }
  }
}
