#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Taps the decoded audio of an `AVPlayer`'s current item and keeps the most recent
/// window of it, mixed down to mono, in a ring buffer.
///
/// Shared by the audio and the video player. Nothing is pushed to JavaScript: a
/// visualizer pulls the latest window when it is about to draw, straight into a
/// typed array, so an idle tap costs one mix-down per render callback and nothing
/// crosses the bridge.
@interface KnitAudioTapProcessor : NSObject

@property (nonatomic, strong, readonly) AVPlayer *player;
@property (nonatomic, readonly) BOOL isTapInstalled;

- (instancetype)initWithPlayer:(AVPlayer *)player;
- (BOOL)installTap;
- (void)uninstallTap;
- (void)invalidate;

/// Copies the newest frames, oldest first, into `target`. Returns the number of
/// frames written, or 0 when no audio has arrived since the previous read.
- (NSInteger)readLatestInto:(float *)target capacity:(NSInteger)capacity;

@end

NS_ASSUME_NONNULL_END
