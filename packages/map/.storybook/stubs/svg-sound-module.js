/**
 * Stub for react-native-svg's `fabric/NativeSvgSoundModule` in the @knitui/map
 * Storybook.
 *
 * `SvgXml` reaches `SvgTouchableMixin`, which lazily `require`s this module in a
 * native-only touch-sound branch. The real module imports `TurboModuleRegistry`
 * from `react-native`, which react-native-web doesn't export, so rolldown fails
 * the build with MISSING_EXPORT. The branch never runs on web, but it still has
 * to resolve.
 */
export default { playTouchSound() {} };
