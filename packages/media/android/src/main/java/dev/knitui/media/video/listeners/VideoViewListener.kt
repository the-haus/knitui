package dev.knitui.media.video.listeners

import dev.knitui.media.video.VideoView
import dev.knitui.media.video.records.PiPParams

interface VideoViewListener {
  /**
   * Called when the ability of the view to autoEnterPip has changed.
   * Note: This can be called when `autoEnterPiP` doesn't change, but other factors
   * influence the view's ability to enter PiP.
   */
  fun onPiPParamsChanged(videoView: VideoView, oldPiPParams: PiPParams, newPiPParams: PiPParams) = Unit
}
