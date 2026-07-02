// react-native-web's StyleSheet emits a benign "Could not parse CSS stylesheet"
// note in some environments when its driver initializes. Config construction is
// unaffected, so filter that one message to keep test output clean.
const originalError = console.error.bind(console);
console.error = (...args: unknown[]): void => {
  const first = args[0];
  const text = first instanceof Error ? first.message : String(first ?? "");
  if (text.includes("Could not parse CSS stylesheet")) return;
  originalError(...args);
};
