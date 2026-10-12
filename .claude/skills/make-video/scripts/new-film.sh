#!/usr/bin/env bash
# new-film.sh <slug> [films-dir]: scaffold one film's studio folder. Run from the project root.
# Creates films/<slug>/ with the studio rules (AGENTS.md, read by Claude Code through CLAUDE.md and by Codex
# directly), the review log, the asset folders and a package.json with Playwright.
# Each skill copies its own scripts in when its step runs; this only lays out the room.
set -euo pipefail

slug="${1:?usage: new-film.sh <slug> [films-dir]}"
dir="${2:-films}/$slug"
if [ -e "$dir" ]; then echo "new-film: $dir already exists, refusing to overwrite" >&2; exit 1; fi

mkdir -p "$dir"/{assets/fonts,assets/screens,assets/refs,audio,scripts,reviews,out}
cat > "$dir/package.json" <<EOF
{
  "name": "$slug",
  "private": true,
  "type": "module",
  "devDependencies": { "playwright": "^1.64.0" }
}
EOF
cat > "$dir/.gitignore" <<'EOF'
node_modules/
.frames/
out/
audio/sfx/
.env
EOF
cat > "$dir/review-log.md" <<'EOF'
# Review log

The spine of this film: every round's scores, the three worst problems, what changed, and which rule a
repeated problem turned into. Newest round at the bottom. The next session starts here.
EOF
cat > "$dir/AGENTS.md" <<'EOF'
# Studio rules for this film

Every agent working in this folder reads this first. When the same problem shows up twice, add a rule here.

## Render contract
- Every frame is a pure function of time: `window.seek(t)` paints frame t, in any order.
- No CSS transitions or animations, no timers, no requestAnimationFrame in render mode, no Date.now, no
  Math.random (seeded `rng` only), no state carried between frames.
- Fonts are local (assets/fonts). Readable text lives in the DOM.
- Times are written in beats from audio/beats.json (or word times from audio/vo.json), never typed seconds.

## Look
- Banned: centred title on a gradient, everything fading in, text or labels in corners, frame borders, glow on
  UI chrome, gradients on UI chrome, generic particle bursts, bouncy or elastic easing, crossfades through
  black, dead time, anything that looks like a template. Plus the brief's own banned list.
- One display face, one UI face, one accent that means one thing. Colour has a job.
- Real product and real data only: every label traces to a source in brief.md. No invented screens or numbers.
- Something visibly changes every 2-4 seconds at the slowest; frame 0 is composed; the last frame is a poster.

## Sound
- Every sound is caused by something on screen and placed by its measured peak. Master -14 LUFS.

## Loop before showing anything
1. `node scripts/smoke.mjs`: every counter reads 0.
2. Contact sheet and beat sheet; look at them. Score hook, phone readability, motion, variety, composition,
   brand accuracy, sound sync 1-10.
3. Fix the 3 worst problems (numbers, not structure). Log the round in review-log.md. Repeat until all 8+.
EOF
printf '@AGENTS.md\n' > "$dir/CLAUDE.md"
echo "scaffolded $dir"
echo "next: cd $dir && npm install   (Chromium: npx playwright install chromium, once per machine)"
