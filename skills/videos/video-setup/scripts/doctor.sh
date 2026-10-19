#!/usr/bin/env bash
# doctor.sh: check the toolchain the video skills need and print the fix for anything missing.
# Exits 1 if a required tool is missing. Optional keys are reported, never printed.
set -uo pipefail

fail=0
ok() { printf '  ok    %-14s %s\n' "$1" "$2"; }
bad() { printf '  MISS  %-14s %s\n' "$1" "$2"; fail=1; }
opt() { printf '  --    %-14s %s\n' "$1" "$2"; }

echo "required"
if command -v node >/dev/null; then
  v=$(node -p 'process.versions.node.split(".")[0]')
  [ "$v" -ge 22 ] && ok node "$(node --version)" || bad node "$(node --version) is too old: install Node 22+"
else bad node "install Node 22+ (brew install node)"; fi
if command -v ffmpeg >/dev/null; then
  ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libx264 && ok ffmpeg "$(ffmpeg -version | head -1 | cut -d' ' -f3) with libx264" || bad ffmpeg "built without libx264: brew reinstall ffmpeg"
  ffmpeg -hide_banner -filters 2>/dev/null | grep -q ' tmix ' && ok "ffmpeg tmix" "motion blur available" || bad "ffmpeg tmix" "this ffmpeg lacks tmix (a Remotion-bundled ffmpeg?): use a full build"
else bad ffmpeg "brew install ffmpeg"; fi
if command -v uv >/dev/null; then ok uv "$(uv --version) (runs the Python scripts with their own numpy)"
elif python3 -c 'import numpy' 2>/dev/null; then ok python "python3 with numpy (run scripts with python3 instead of uv run)"
else bad uv "curl -LsSf https://astral.sh/uv/install.sh | sh   (or: pip install numpy)"; fi
pw="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/Library/Caches/ms-playwright}"
[ -d "$HOME/.cache/ms-playwright" ] && pw="$HOME/.cache/ms-playwright"
if ls "$pw" 2>/dev/null | grep -q '^chromium'; then ok chromium "Playwright browser in $pw"
else bad chromium "inside a film folder: npm install && npx playwright install chromium"; fi

echo "optional"
for k in ELEVENLABS_API_KEY FAL_KEY; do
  if [ -n "${!k:-}" ] || grep -qs "^$k=" .env; then opt "$k" "set"; else opt "$k" "not set (only needed by voiceover / asset-prep generation)"; fi
done
exit $fail
