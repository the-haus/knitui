package dev.knitui.media.video.listeners

import dev.knitui.media.video.VideoView

interface VideoManagerListener {
  fun onVideoViewRegistered(videoView: VideoView, allVideoViews: Collection<VideoView>) {}
  fun onVideoViewUnregistered(videoView: VideoView, allVideoViews: Collection<VideoView>) {}
  fun onAppBackgrounded() {}
  fun onAppForegrounded() {}
}
