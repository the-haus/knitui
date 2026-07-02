/**
 * Detox configuration for the Expo (managed) example app.
 *
 * This app uses Expo's Continuous Native Generation (CNG): the native `ios/` and
 * `android/` projects do NOT live in git — you generate them on demand with
 *     pnpm --filter @knitui/example prebuild        # = npx expo prebuild
 * before building with Detox. The `@config-plugins/detox` plugin (wired in
 * app.json) applies the Android-side Detox patches automatically during prebuild,
 * so there's nothing to hand-edit under android/.
 *
 * NAME NOTE: `expo prebuild` derives the Xcode project / scheme / .app product
 * name from the sanitized `expo.name` in app.json ("Knit UI Example" ->
 * "KnitUIExample"). If you rename the app, run a prebuild and check
 * `ios/*.xcworkspace`, then update APP_NAME below to match.
 *
 * Docs: https://wix.github.io/Detox/docs/introduction/project-setup
 *       https://docs.expo.dev/build-reference/e2e-tests
 *
 * @type {Detox.DetoxConfig}
 */
const APP_NAME = "KnitUIExample";

module.exports = {
  testRunner: {
    args: {
      $0: "jest",
      config: "e2e/jest.config.js",
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      binaryPath: `ios/build/Build/Products/Debug-iphonesimulator/${APP_NAME}.app`,
      build: `xcodebuild -workspace ios/${APP_NAME}.xcworkspace -scheme ${APP_NAME} -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build -quiet`,
    },
    "ios.release": {
      type: "ios.app",
      binaryPath: `ios/build/Build/Products/Release-iphonesimulator/${APP_NAME}.app`,
      build: `xcodebuild -workspace ios/${APP_NAME}.xcworkspace -scheme ${APP_NAME} -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet`,
    },
    "android.debug": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/debug/app-debug.apk",
      build:
        "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..",
      reversePorts: [8081],
    },
    "android.release": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/release/app-release.apk",
      build:
        "cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd ..",
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        type: "iPhone 15",
      },
    },
    attached: {
      type: "android.attached",
      device: {
        adbName: ".*",
      },
    },
    emulator: {
      type: "android.emulator",
      device: {
        avdName: "Resizable_Experimental",
      },
    },
  },
  configurations: {
    "ios.sim.debug": {
      device: "simulator",
      app: "ios.debug",
    },
    "ios.sim.release": {
      device: "simulator",
      app: "ios.release",
    },
    "android.att.debug": {
      device: "attached",
      app: "android.debug",
    },
    "android.att.release": {
      device: "attached",
      app: "android.release",
    },
    "android.emu.debug": {
      device: "emulator",
      app: "android.debug",
    },
    "android.emu.release": {
      device: "emulator",
      app: "android.release",
    },
  },
};
