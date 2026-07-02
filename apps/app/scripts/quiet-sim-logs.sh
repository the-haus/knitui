#!/usr/bin/env bash
#
# Silences two noisy iOS Simulator system logs that fire on every keystroke
# because the Simulator ships no Taptic Engine / haptic pattern library:
#
#   [CoreHaptics] CHHapticPattern.mm ... hapticpatternlibrary.plist (no such file)
#   [UIKitCore]   <_UIKBFeedbackGenerator>: Error creating CHHapticPattern
#
# `simctl log config` can only target a *booted* device, and the setting does
# not survive `simctl erase` or a freshly created sim — so this re-applies it
# idempotently. By default it waits up to ~45s for a sim to boot (so it also
# covers `expo run:ios` booting a fresh one); pass --no-wait to apply only to
# whatever is already booted and exit immediately.

set -euo pipefail

UUID_RE='[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}'

booted_udids() {
  xcrun simctl list devices booted 2>/dev/null | grep -Eo "$UUID_RE" || true
}

apply() {
  local udid="$1"
  xcrun simctl spawn "$udid" log config --subsystem com.apple.CoreHaptics --mode "level:off" 2>/dev/null
  xcrun simctl spawn "$udid" log config --subsystem com.apple.UIKit --category UIKBFeedbackGenerator --mode "level:off" 2>/dev/null
}

wait=true
[ "${1:-}" = "--no-wait" ] && wait=false

udids="$(booted_udids)"

if [ -z "$udids" ] && [ "$wait" = true ]; then
  for _ in $(seq 1 23); do   # ~45s at 2s intervals
    sleep 2
    udids="$(booted_udids)"
    [ -n "$udids" ] && break
  done
fi

if [ -z "$udids" ]; then
  echo "quiet-sim-logs: no booted simulator; nothing to do."
  exit 0
fi

for udid in $udids; do
  apply "$udid"
  echo "quiet-sim-logs: silenced haptic log noise on $udid"
done
