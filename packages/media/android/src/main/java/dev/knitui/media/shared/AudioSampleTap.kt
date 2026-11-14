package dev.knitui.media.shared

import android.content.Context
import androidx.media3.common.C
import androidx.media3.common.audio.AudioProcessor
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.audio.AudioSink
import androidx.media3.exoplayer.audio.DefaultAudioSink
import androidx.media3.exoplayer.audio.TeeAudioProcessor
import expo.modules.kotlin.typedarray.Float32Array
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * A PCM tap in the ExoPlayer audio pipeline, shared by the audio and the video
 * player. It keeps the most recent window of decoded audio, mixed down to mono, in a
 * ring buffer.
 *
 * Reading the decoded PCM needs no `RECORD_AUDIO` permission, unlike
 * `android.media.audiofx.Visualizer`. Nothing is pushed to JavaScript either: a
 * visualizer pulls the latest window with [read] when it is about to draw, straight
 * into its own typed array. So the audio thread allocates nothing, and an armed tap
 * that nobody reads costs one mix-down per buffer.
 */
@UnstableApi
class AudioSampleTap : TeeAudioProcessor.AudioBufferSink {
  /** The tap stays installed for the player's lifetime and is silent until armed. */
  @Volatile
  var enabled = false
    set(value) {
      field = value
      if (!value) {
        synchronized(lock) {
          writeIndex = 0
          filled = 0
          hasUnreadFrames = false
        }
      }
    }

  private val lock = Any()
  private val ring = FloatArray(CAPACITY)
  private var writeIndex = 0
  private var filled = 0
  private var hasUnreadFrames = false

  private var channelCount = 2
  private var pcmEncoding = C.ENCODING_PCM_16BIT

  override fun flush(sampleRateHz: Int, channelCount: Int, encoding: Int) {
    this.channelCount = if (channelCount > 0) channelCount else 1
    this.pcmEncoding = encoding
  }

  /** Runs on ExoPlayer's playback thread. */
  override fun handleBuffer(buffer: ByteBuffer) {
    if (!enabled) return
    val bytesPerSample = when (pcmEncoding) {
      C.ENCODING_PCM_16BIT -> 2
      C.ENCODING_PCM_FLOAT -> 4
      C.ENCODING_PCM_8BIT -> 1
      else -> return // 24/32-bit integer PCM: not worth a visualizer path
    }
    val channels = channelCount
    val frameBytes = bytesPerSample * channels
    val pcm = buffer.order(ByteOrder.nativeOrder())
    var frames = pcm.remaining() / frameBytes
    if (frames <= 0) return
    // Only the newest frames can survive in the ring, so skip the rest unread.
    if (frames > CAPACITY) {
      pcm.position(pcm.position() + (frames - CAPACITY) * frameBytes)
      frames = CAPACITY
    }
    val scale = 1f / channels

    synchronized(lock) {
      var write = writeIndex
      repeat(frames) {
        var sum = 0f
        for (ch in 0 until channels) {
          sum += when (bytesPerSample) {
            2 -> pcm.short / 32_768f
            4 -> pcm.float
            else -> ((pcm.get().toInt() and 0xFF) - 128) / 128f
          }
        }
        ring[write] = sum * scale
        write = if (write + 1 == CAPACITY) 0 else write + 1
      }
      writeIndex = write
      filled = minOf(filled + frames, CAPACITY)
      hasUnreadFrames = true
    }
  }

  /**
   * Copies the newest frames, oldest first, into [target]. Returns the number of
   * frames written, or 0 when no audio has arrived since the previous read.
   */
  fun read(target: Float32Array): Int {
    if (!enabled) return 0
    val out = target.toDirectBuffer().order(ByteOrder.nativeOrder()).asFloatBuffer()
    synchronized(lock) {
      if (!hasUnreadFrames) return 0
      val count = minOf(target.length, filled)
      val start = (writeIndex + CAPACITY - count) % CAPACITY
      val firstRun = minOf(count, CAPACITY - start)
      out.put(ring, start, firstRun)
      if (count > firstRun) out.put(ring, 0, count - firstRun)
      hasUnreadFrames = false
      return count
    }
  }

  private companion object {
    // Twice the largest window a visualizer asks for (a 4096-point FFT).
    const val CAPACITY = 8192
  }
}

/** A [DefaultRenderersFactory] whose audio sink feeds [tap]. */
@UnstableApi
class SamplingRenderersFactory(
  context: Context,
  private val tap: AudioSampleTap
) : DefaultRenderersFactory(context) {
  override fun buildAudioSink(
    context: Context,
    enableFloatOutput: Boolean,
    enableAudioTrackPlaybackParams: Boolean
  ): AudioSink =
    DefaultAudioSink.Builder(context)
      .setEnableFloatOutput(enableFloatOutput)
      .setEnableAudioOutputPlaybackParameters(enableAudioTrackPlaybackParams)
      .setAudioProcessors(arrayOf<AudioProcessor>(TeeAudioProcessor(tap)))
      .build()
}
