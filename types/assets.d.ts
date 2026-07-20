// TS 6 (TS2882) requires type declarations for side-effect imports of
// non-code assets. Wired in via `files` in tsconfig.base.json so every
// package inherits it — package tsconfigs override `include`, not `files`.
declare module "*.css";
