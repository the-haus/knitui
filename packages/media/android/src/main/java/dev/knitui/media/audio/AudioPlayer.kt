package dev.knitui.media.audio

import android.content.Context
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.session.MediaSession
import dev.knitui.media.audio.service.AudioPlaybackServiceConnection
import dev.knitui.media.shared.AudioSampleTap
import dev.knitui.media.shared.SamplingRenderersFactory
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.typedarray.Float32Array
import java.lang.ref.WeakReference

private const val PLAYBACK_STATUS_UPDATE = "playbackStatusUpdate"
private const val SEEK_JUMP_INTERVAL_MS: Long = 10_000

@UnstableApi
class AudioPlayer(
  context: Context,
  appContext: AppContext,
  source: MediaSource?,
  updateInterval: Double,
  bufferDurationMs: Long = 0,
  // The PCM tap visualizers read from (see [AudioSampleTap]). Defaulted so the
  // call site is unchanged.
  private val sampleTap: AudioSampleTap = AudioSampleTap()
) : BaseAudioPlayer(
  player = ExoPlayer.Builder(context, SamplingRenderersFactory(context, sampleTap))
    .setLooper(context.mainLooper)
    .setAudioAttributes(AudioAttributes.DEFAULT, false)
    .setHandleAudioBecomingNoisy(true)
    .setSeekForwardIncrementMs(SEEK_JUMP_INTERVAL_MS)
    .setSeekBackIncrementMs(SEEK_JUMP_INTERVAL_MS)
    .apply {
      if (bufferDurationMs > 0) {
        setLoadControl(
          DefaultLoadControl.Builder()
            .setBufferDurationsMs(
              DefaultLoadControl.DEFAULT_MIN_BUFFER_MS,
              bufferDurationMs.toInt().coerceAtLeast(DefaultLoadControl.DEFAULT_MIN_BUFFER_MS),
              DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_MS,
              DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS
            )
            .build()
        )
      }
    }
    .build(),
  appContext = appContext,
  updateInterval = updateInterval,
  statusEventName = PLAYBACK_STATUS_UPDATE
),
  LockScreenPlayable {
  var preservesPitch = true
  var keepAudioSessionActive = false
  var hlsFallback: (() -> MediaSource?)? = null

  // Lock screen controls
  override var isActiveForLockScreen = false
  override var metadata: Metadata? = null
  override var lockScreenOptions: AudioLockScreenOptions? = null
  override var mediaSession: MediaSession = buildBasicMediaSession(context, ref) { requestPlay() }
  override val serviceConnection = AudioPlaybackServiceConnection(WeakReference(this), appContext)

  override val isLive: Boolean
    get() = ref.isCurrentMediaItemLive

  val currentOffsetFromLive: Double?
    get() {
      val offset = ref.currentLiveOffset
      return if (offset == C.TIME_UNSET) {
        null
      } else {
        offset / 1000.0
      }
    }

  private val context by lazy {
    appContext.reactContext
      ?: throw Exceptions.ReactContextLost()
  }

  init {
    installPlayerListeners()
    source?.let {
      setMediaSource(source)
    }
  }

  fun setMediaSource(source: MediaSource) {
    previousPlaybackState = Player.STATE_IDLE
    ref.setMediaSource(source)
    ref.prepare()
    startUpdating()
  }

  fun clearMediaSource() {
    previousPlaybackState = Player.STATE_IDLE
    ref.pause()
    ref.clearMediaItems()
  }

  override fun onPlaybackStateUpdated(playbackState: Int, justFinished: Boolean) {
    val updateMap = mutableMapOf<String, Any?>(
      "playbackState" to playbackStateToString(playbackState)
    )
    if (justFinished) {
      updateMap["didJustFinish"] = true
      updateMap["playing"] = false
    }
    sendStatusUpdate(updateMap)
  }

  override fun onPlayerError(error: PlaybackException) {
    // Stream type is inferred from the URL, so HLS without an `.m3u8` path reaches the
    // progressive extractor, which can't read a playlist. Give it one try as HLS.
    val fallback = hlsFallback
    if (fallback != null && error.errorCode == PlaybackException.ERROR_CODE_PARSING_CONTAINER_UNSUPPORTED) {
      hlsFallback = null
      fallback()?.let {
        setMediaSource(it)
        return
      }
    }
    sendStatusUpdate(
      mapOf(
        "error" to error.message
      )
    )
  }

  fun readSamples(target: Float32Array): Int = sampleTap.read(target)

  fun setSamplingEnabled(enabled: Boolean) {
    sampleTap.enabled = enabled
  }

  override fun setPlaybackRate(rate: Float) {
    val playbackRate = rate.coerceIn(0.1f, 2.0f)
    val pitch = if (preservesPitch) {
      1f
    } else {
      playbackRate
    }
    ref.playbackParameters = PlaybackParameters(playbackRate, pitch)
  }

  override fun currentStatus(): Map<String, Any?> {
    val isMuted = ref.volume == 0f
    val isLooping = ref.repeatMode == Player.REPEAT_MODE_ONE
    val isLoaded = ref.playbackState == Player.STATE_READY
    val isBuffering = ref.playbackState == Player.STATE_BUFFERING
    val playingStatus = if (isBuffering) {
      intendedPlayingState
    } else {
      ref.isPlaying
    }

    return mapOf(
      "id" to id,
      "currentTime" to currentTime,
      "playbackState" to playbackStateToString(ref.playbackState),
      "timeControlStatus" to if (playingStatus) {
        "playing"
      } else {
        "paused"
      },
      "reasonForWaitingToPlay" to null,
      "mute" to isMuted,
      "duration" to duration,
      "playing" to playingStatus,
      "loop" to isLooping,
      "didJustFinish" to false,
      "isLoaded" to if (ref.playbackState == Player.STATE_ENDED) {
        true
      } else {
        isLoaded
      },
      "playbackRate" to ref.playbackParameters.speed,
      "shouldCorrectPitch" to preservesPitch,
      "isBuffering" to isBuffering,
      "isLive" to isLive,
      "currentOffsetFromLive" to currentOffsetFromLive,
      "error" to null
    )
  }

  override fun assignBasicMediaSession() {
    mediaSession.release()
    mediaSession = buildBasicMediaSession(context, ref) { requestPlay() }
  }

  private fun playbackStateToString(state: Int): String {
    return when (state) {
      Player.STATE_READY -> "ready"
      Player.STATE_BUFFERING -> "buffering"
      Player.STATE_IDLE -> "idle"
      Player.STATE_ENDED -> "ended"
      else -> "unknown"
    }
  }

  override fun sharedObjectDidRelease() {
    serviceConnection.release()
    super.sharedObjectDidRelease()
  }

  override fun releasePlayer() {
    mediaSession.release()
    if (isActiveForLockScreen) {
      serviceConnection.playbackServiceBinder?.service?.unregisterPlayable()
    }
    serviceConnection.unbind()
    sampleTap.enabled = false
    super.releasePlayer()
  }

  companion object {
    val TAG = AudioPlayer::class.simpleName
  }
}
