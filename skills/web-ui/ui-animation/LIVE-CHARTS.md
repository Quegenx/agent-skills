# Live chart motion

Live-value motion from Liveline and Family, with the existing nerdy.dev palette disagreement. General interaction patterns stay in [PATTERNS.md](PATTERNS.md); shared motion math is in [MATH.md](MATH.md).

## Live values and charts

[Liveline; Family] Liveline, a real-time line chart for React: "One `<canvas>`, one `requestAnimationFrame` loop. When a new value arrives, nothing jumps."

- **One easing for every part:** the line lerps toward the new state at 8% per frame (`lerpSpeed`), and "The Y-axis range, the badge, the grid labels all use the same lerp", so it "feels like one thing breathing rather than a bunch of parts updating independently". The per-frame form against TIMING's per-second rule is in [MATH.md](MATH.md#exponential-approach-chase-a-target-that-moves).
- **Interpolate between updates:** "Feed it data however you like. WebSocket, polling, random walk. Liveline interpolates between updates so even infrequent data looks smooth."
- **What would be clipped jumps; the rest eases:** "The range snaps outward instantly when data exceeds it, so the line is never clipped."
- **Tiny movements fill the height:** `exaggerate` tightens the Y range for values that move in tiny increments (a heart rate).
- **Direction:** `momentum` adds arrows to the live dot, green up, red down, grey flat, and they fade out fully before the new direction fades in; `valueMomentumColor` tints the number by direction. In Family, scrubbing a price chart flips the arrow alongside the changing numbers.
- **A 60fps number stays out of React:** `showValue` "updates at 60fps through direct DOM manipulation, not React re-renders" ([PERFORMANCE.md](PERFORMANCE.md#react-animate-without-re-rendering)).
- **Loading, empty, paused:** `loading` shows "a breathing line animation"; "When data arrives, the flat line morphs smoothly into the actual chart". If data never arrives it falls back to a quiet empty state, with your own text through `emptyText`. `paused` "freezes the chart in place while data continues arriving in the background. When you resume, it catches up to real time."
- **Same data, another view:** a toggle morphs between line and candlestick, and "The live candle keeps updating in real time, growing its wicks as new ticks arrive."
- **Ambient motion that carries data:** orderbook labels "spawn at the bottom, drift upward, and fade out", bigger orders brighter, and the stream speed reacts to price momentum and orderbook churn: "Calm markets drift slowly, volatile ones rush."
- **Loud motion is opt-in:** `degen` adds burst particles and chart shake on momentum swings, "For when subtlety is not the goal"; everything else "is off by default or has sensible defaults".
- **One colour in, a palette out:** `color` takes any CSS colour, converted to HSL, and every variant (line, fill gradient, glow, badge, grid labels) is derived from it. [nerdy.dev](https://nerdy.dev/lch-luminance-vs-hsl-lightness) (2022-12-02) derives in LCH-type spaces instead: HSL 50% "is almost never 50% as humans see it". Neither wins.
- **Moving beats jumping:** Family holds that price charts that move instead of jumping "could make the app feel faster" (an opinion, no measurement).
- **Test it on hostile data:** "A chart that only looks good on calm data isn't much use." Liveline's demos: wild swings at 100 ms updates; near-flat with `exaggerate` at 150 ms; chaotic huge spikes at 80 ms; frequent sharp reversals at 60 ms ("Sharp reversals are the classic breaking point"); near-flat with massive isolated spikes at 120 ms; rapid zigzag at 50 ms; and irregular arrival, "long quiet stretches of 1-3 seconds between points, then sudden bursts at 40-80ms", because "WebSocket connections drop, batch updates land all at once, mobile networks stall."

```tsx
import { Liveline } from 'liveline'

function Chart({ data, value }) {
  return (
    <div style={{ height: 200 }}>
      <Liveline data={data} value={value} />
    </div>
  )
}
```

`npm install liveline`; it fills its parent, so set a height on the wrapper. Defaults include `lerpSpeed` 0.08, `theme` `'dark'`, `color` `'#3b82f6'` and `window` 30, with `windows={[{ label: '1m', secs: 60 }, { label: '5m', secs: 300 }]}` for switchable ranges.

## Prove it

Use the hostile-data cases above and the [live-data review](SKILL.md#prove-it); the per-frame versus per-second source disagreement stays in [MATH.md](MATH.md#exponential-approach-chase-a-target-that-moves). [Liveline; Family]
