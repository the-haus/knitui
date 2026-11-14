// Copyright 2024-present 650 Industries. All rights reserved.

import AVFoundation

internal class ContentKeyManager {
  static let contentKeyDelegateQueue = DispatchQueue(label: "dev.knitui.media.video.ContentKeyDelegateQueue")
  let contentKeySession: AVContentKeySession
  let contentKeyDelegate: ContentKeyDelegate

  init() {
    contentKeySession = AVContentKeySession(keySystem: .fairPlayStreaming)
    contentKeyDelegate = ContentKeyDelegate()

    contentKeySession.setDelegate(contentKeyDelegate, queue: ContentKeyManager.contentKeyDelegateQueue)
  }

  func addContentKeyRequest(videoSource: VideoSource, asset: AVContentKeyRecipient) {
    contentKeyDelegate.videoSource = videoSource
    contentKeySession.addContentKeyRecipient(asset)
  }
}
