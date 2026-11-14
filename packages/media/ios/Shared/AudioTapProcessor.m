// Copyright 2016-present 650 Industries. All rights reserved.

#import "AudioTapProcessor.h"
#import <AudioToolbox/AudioToolbox.h>
#import <os/lock.h>

NS_ASSUME_NONNULL_BEGIN

// Twice the largest window a visualizer asks for (a 4096-point FFT).
#define kRingCapacity 8192

typedef struct AVAudioTapProcessorContext {
  Boolean isNonInterleaved;
  Boolean supportedTapProcessingFormat;
  void *self;
  Boolean isValid;
} AVAudioTapProcessorContext;

// File-local: another pod in the app may define callbacks with the same names.
static void tapInit(MTAudioProcessingTapRef tap, void *clientInfo, void **tapStorageOut);
static void tapFinalize(MTAudioProcessingTapRef tap);
static void tapPrepare(MTAudioProcessingTapRef tap, CMItemCount maxFrames, const AudioStreamBasicDescription *processingFormat);
static void tapProcess(MTAudioProcessingTapRef tap, CMItemCount numberFrames, MTAudioProcessingTapFlags flags, AudioBufferList *bufferListInOut, CMItemCount *numberFramesOut, MTAudioProcessingTapFlags *flagsOut);


@implementation KnitAudioTapProcessor {
  os_unfair_lock _lock;
  // Its own lock: the render thread must never wait on `_lock`, which is held
  // across `setAudioMix:`.
  os_unfair_lock _ringLock;
  MTAudioProcessingTapRef _audioProcessingTap;
  BOOL _isTapInstalled;
  BOOL _isInvalidated;
  // The newest mono frames. Written on the audio render thread, read from JS.
  float _ring[kRingCapacity];
  NSUInteger _ringWriteIndex;
  NSUInteger _ringFilled;
  BOOL _ringHasUnreadFrames;
}

- (instancetype)initWithPlayer:(AVPlayer *)player {
  self = [super init];
  if (self) {
    _player = player;
    _lock = OS_UNFAIR_LOCK_INIT;
    _ringLock = OS_UNFAIR_LOCK_INIT;
    _isTapInstalled = NO;
    _isInvalidated = NO;
    _audioProcessingTap = NULL;
  }
  return self;
}

- (BOOL)isTapInstalled {
  os_unfair_lock_lock(&_lock);
  BOOL installed = _isTapInstalled;
  os_unfair_lock_unlock(&_lock);
  return installed;
}

- (BOOL)installTap {
  os_unfair_lock_lock(&_lock);
  
  if (_isInvalidated || _isTapInstalled) {
    os_unfair_lock_unlock(&_lock);
    return _isTapInstalled;
  }
  
  if (![_player currentItem]) {
    os_unfair_lock_unlock(&_lock);
    return NO;
  }
  
  // The first AUDIO track: a video file lists its picture track first.
  AVAssetTrack *track = nil;
  for (AVPlayerItemTrack *itemTrack in _player.currentItem.tracks) {
    if ([itemTrack.assetTrack.mediaType isEqualToString:AVMediaTypeAudio]) {
      track = itemTrack.assetTrack;
      break;
    }
  }
  if (!track) {
    os_unfair_lock_unlock(&_lock);
    return NO;
  }
  
  AVMutableAudioMix *audioMix = [AVMutableAudioMix audioMix];
  if (!audioMix) {
    os_unfair_lock_unlock(&_lock);
    return NO;
  }
  
  AVMutableAudioMixInputParameters *audioMixInputParameters = [AVMutableAudioMixInputParameters audioMixInputParametersWithTrack:track];
  if (!audioMixInputParameters) {
    os_unfair_lock_unlock(&_lock);
    return NO;
  }
  
  MTAudioProcessingTapCallbacks callbacks;
  callbacks.version = kMTAudioProcessingTapCallbacksVersion_0;
  callbacks.clientInfo = (__bridge void *)self;
  callbacks.init = tapInit;
  callbacks.finalize = tapFinalize;
  callbacks.prepare = tapPrepare;
  callbacks.unprepare = nil;
  callbacks.process = tapProcess;
  
  OSStatus status = MTAudioProcessingTapCreate(kCFAllocatorDefault, &callbacks, kMTAudioProcessingTapCreationFlag_PostEffects, &_audioProcessingTap);
  if (status == noErr) {
    audioMixInputParameters.audioTapProcessor = _audioProcessingTap;
    audioMix.inputParameters = @[audioMixInputParameters];
    [_player.currentItem setAudioMix:audioMix];
    _isTapInstalled = YES;
    os_unfair_lock_unlock(&_lock);
    return YES;
  } else {
    NSLog(@"Failed to create audio processing tap: %d", (int)status);
    os_unfair_lock_unlock(&_lock);
    return NO;
  }
}

- (void)uninstallTap {
  os_unfair_lock_lock(&_lock);
  
  if (_isTapInstalled && !_isInvalidated) {
    [_player.currentItem setAudioMix:nil];
    _isTapInstalled = NO;
    
    if (_audioProcessingTap) {
      AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(_audioProcessingTap);
      if (context) {
        context->isValid = NO;
        context->self = NULL;
      }
    }
    
    _audioProcessingTap = NULL;
  }
  
  os_unfair_lock_unlock(&_lock);
}

- (void)invalidate {
  os_unfair_lock_lock(&_lock);
  
  _isInvalidated = YES;
  
  if (_isTapInstalled) {
    [_player.currentItem setAudioMix:nil];
    _isTapInstalled = NO;
    
    if (_audioProcessingTap) {
      AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(_audioProcessingTap);
      if (context) {
        context->isValid = NO;
        context->self = NULL;
      }
    }
    _audioProcessingTap = NULL;
  }
  
  os_unfair_lock_unlock(&_lock);
}

- (void)dealloc {
  [self invalidate];
}

#pragma mark - Ring buffer

/// Mixes the render callback's buffers down to mono and appends them. Runs on the
/// audio render thread: no allocation, no Objective-C messaging beyond this call.
- (void)appendFrames:(AudioBufferList *)list count:(NSUInteger)frames nonInterleaved:(BOOL)nonInterleaved {
  if (frames == 0) {
    return;
  }
  if (frames > kRingCapacity) {
    frames = kRingCapacity;
  }
  UInt32 bufferCount = list->mNumberBuffers;
  UInt32 interleavedChannels = list->mBuffers[0].mNumberChannels;
  if (interleavedChannels == 0) {
    interleavedChannels = 1;
  }

  os_unfair_lock_lock(&_ringLock);
  NSUInteger write = _ringWriteIndex;
  if (nonInterleaved && bufferCount > 1) {
    float scale = 1.0f / (float)bufferCount;
    for (NSUInteger i = 0; i < frames; i++) {
      float sum = 0;
      for (UInt32 b = 0; b < bufferCount; b++) {
        const float *data = (const float *)list->mBuffers[b].mData;
        if (data && (i + 1) * sizeof(float) <= list->mBuffers[b].mDataByteSize) {
          sum += data[i];
        }
      }
      _ring[write] = sum * scale;
      write = (write + 1) % kRingCapacity;
    }
  } else {
    const float *data = (const float *)list->mBuffers[0].mData;
    NSUInteger available = list->mBuffers[0].mDataByteSize / (sizeof(float) * interleavedChannels);
    if (!data) {
      available = 0;
    }
    if (frames > available) {
      frames = available;
    }
    float scale = 1.0f / (float)interleavedChannels;
    for (NSUInteger i = 0; i < frames; i++) {
      float sum = 0;
      for (UInt32 c = 0; c < interleavedChannels; c++) {
        sum += data[i * interleavedChannels + c];
      }
      _ring[write] = sum * scale;
      write = (write + 1) % kRingCapacity;
    }
  }
  _ringWriteIndex = write;
  _ringFilled = MIN(_ringFilled + frames, (NSUInteger)kRingCapacity);
  if (frames > 0) {
    _ringHasUnreadFrames = YES;
  }
  os_unfair_lock_unlock(&_ringLock);
}

- (NSInteger)readLatestInto:(float *)target capacity:(NSInteger)capacity {
  if (!target || capacity <= 0) {
    return 0;
  }
  os_unfair_lock_lock(&_ringLock);
  if (!_ringHasUnreadFrames) {
    os_unfair_lock_unlock(&_ringLock);
    return 0;
  }
  NSUInteger count = MIN((NSUInteger)capacity, _ringFilled);
  NSUInteger start = (_ringWriteIndex + kRingCapacity - count) % kRingCapacity;
  NSUInteger firstRun = MIN(count, kRingCapacity - start);
  memcpy(target, _ring + start, firstRun * sizeof(float));
  if (count > firstRun) {
    memcpy(target + firstRun, _ring, (count - firstRun) * sizeof(float));
  }
  _ringHasUnreadFrames = NO;
  os_unfair_lock_unlock(&_ringLock);
  return (NSInteger)count;
}

#pragma mark - Audio Sample Buffer Callbacks (MTAudioProcessingTapCallbacks)

static void tapInit(MTAudioProcessingTapRef tap, void *clientInfo, void **tapStorageOut) {
  AVAudioTapProcessorContext *context = calloc(1, sizeof(AVAudioTapProcessorContext));
  if (context) {
    context->isNonInterleaved = false;
    context->self = clientInfo;
    context->isValid = true;
    *tapStorageOut = context;
  } else {
    *tapStorageOut = NULL;
  }
}

static void tapFinalize(MTAudioProcessingTapRef tap) {
  AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);
  if (context) {
    context->isValid = false;
    context->self = NULL;
    free(context);
  }
}

static void tapPrepare(MTAudioProcessingTapRef tap, CMItemCount maxFrames, const AudioStreamBasicDescription *processingFormat) {
  AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);
  context->supportedTapProcessingFormat = true;
  
  if (processingFormat->mFormatID != kAudioFormatLinearPCM) {
    NSLog(@"Audio Format ID for audioProcessingTap: LinearPCM");
  }
  
  if (!(processingFormat->mFormatFlags & kAudioFormatFlagIsFloat)) {
    NSLog(@"Audio Format ID for audioProcessingTap: Float only");
  }
  
  if (processingFormat->mFormatFlags & kAudioFormatFlagIsNonInterleaved) {
    context->isNonInterleaved = true;
  }
}

static void tapProcess(MTAudioProcessingTapRef tap, CMItemCount numberFrames, MTAudioProcessingTapFlags flags, AudioBufferList *bufferListInOut, CMItemCount *numberFramesOut, MTAudioProcessingTapFlags *flagsOut) {
  AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);
  
  OSStatus status = MTAudioProcessingTapGetSourceAudio(tap, numberFrames, bufferListInOut, flagsOut, NULL, numberFramesOut);
  if (status != noErr) {
    return;
  }
  
  if (!context || !context->isValid || !context->self) {
    return;
  }
  
  KnitAudioTapProcessor *processor = (__bridge KnitAudioTapProcessor *)context->self;
  
  if (!context->isValid) {
    return;
  }
  
  if (bufferListInOut && bufferListInOut->mNumberBuffers > 0) {
    [processor appendFrames:bufferListInOut count:(NSUInteger)*numberFramesOut nonInterleaved:context->isNonInterleaved];
  }
}

@end

NS_ASSUME_NONNULL_END
