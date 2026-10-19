# JavaScript on the main thread

In most cases the speed of the code is not the problem: the code is holding the main thread, and that alone is enough to cause trouble. Ask of every piece of work: does it have to happen, now, here, at all? Measure first ([performance-and-caching MEASURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md)); which properties animate on the compositor is in the `ui-animation` skill's PERFORMANCE.md.

## What the main thread does

- **It runs all JavaScript in queue order:** your code, event handlers, timers, network response callbacks, framework internals, unrelated to the refresh cycle. It also runs the front of the rendering pipeline: `requestAnimationFrame` callbacks, style calculation, layout (reflow) and paint. Only compositing goes to the compositor thread. Steps are skipped when nothing changed.
- **One task at a time, and nothing else happens while it runs.** "If one JavaScript function runs for 200 milliseconds, then for those 200 milliseconds the browser can't repaint the screen or receive a click from the user." Rendering can only run between tasks.
- **A frame is about 16.6 ms at 60 Hz,** and once the browser's own processing cost is subtracted the practical budget is around 10 ms; on a 120 Hz device the budget itself is cut in half. Against that, a 200 ms task is fatal.
- **A long task holds the main thread; anything over 50 milliseconds is generally considered a problem.** INP and TBT (total main-thread blocked time during load) are essentially ways of expressing how long the main thread was blocked. INP is the Core Web Vital; TBT is its lab proxy, with bands per form factor in [LIGHTHOUSE-CI.md](LIGHTHOUSE-CI.md#reading-a-lighthouse-result).
- **The other threads:** the compositor composites layers and handles scrolling and certain animations; raster turns paint commands into pixels; workers are created explicitly and have no DOM access. You can't give work to the compositor or raster threads directly, so "not using" the main thread means reshaping work into a form another thread can take.
- **Four moves while staying on the thread:** splitting and batching shape task size; prioritizing and deferring decide timing. Splitting comes first, because tasks need boundaries before you can decide what to slot in between them and what to push back.

## Split long tasks

- **Cut a burst into pieces and hand the thread back between them.** Hundreds of chat messages arriving as one clump and rendered in one task run DOM creation, style, layout and paint hundreds of times back to back; input stutters and animations hitch. The messages themselves appear more slowly too, because the callback that receives them is also a task waiting in the main thread's line.

```js
// A batch of chat messages arrives at once
socket.on('messages', (chats) => {
  renderChats(chats);
});

// Draw the messages, yielding the main thread after every 20
async function renderChats(chats) {
  let count = 0;
  for (const chat of chats) {
    appendChatNode(chat); // draw one message

    if (++count % 20 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0)); // yield here
    }
  }
}
```

- **Yielding does not make the work faster.** The total work is unchanged and each yield adds overhead, so wall-clock time gets longer; responsiveness improves because input and frames get the gaps. Splitting too finely backfires: the cost of yielding and resuming can exceed the work.
- **Split by time, not count, while an animation runs or the user scrolls:** work until 5 ms after the frame started, then resume on the next frame. Anchor to the frame's start timestamp, so callbacks earlier in the frame shrink your share.

```js
async function processDuringAnimation(items) {
  let i = 0;
  let frameStart = performance.now();
  while (i < items.length) {
    // Work only until 5ms have passed since the frame started
    while (i < items.length && performance.now() - frameStart < 5) {
      doWork(items[i++]);
    }
    frameStart = await new Promise(requestAnimationFrame); // resume with the next frame's start time
  }
}
```

  "Why 5 milliseconds? There's nothing special about the number." It gives roughly half of the practical budget of about 10 ms to background work and leaves the rest for animation callbacks, style, layout and paint; shrink it if the animations are heavy. A demo: 4,000 particles with pairwise repulsion are about 16 million distance calculations per pass; recomputing all of it every frame blows through the frame budget on its own; at 5 ms per frame the work and the animation run smoothly side by side.
- **`setTimeout(..., 0)` waits at least 4 ms per piece in a yield loop:** the HTML spec mandates a 4 ms minimum once `setTimeout` calls nest more than 5 levels deep, and a yield loop trips this almost immediately. Usually this doesn't matter, but where very high responsiveness is demanded the delay can become a problem.
- **The yield tools resume at different times.** That's why some code posts a message through `MessageChannel` instead (React's scheduler uses this method). `scheduler.yield()` resumes the original work ahead of other queued tasks instead of at the back, but browser support is still uneven. `setTimeout` and `scheduler.yield()` ignore the rendering cycle; `requestAnimationFrame` resumes just before a frame, so it fits work that must keep rhythm with screen updates. For finer priority control, build your own queue on `MessageChannel`.
- **Some work can't be split:** `JSON.parse` of a multi-megabyte response is one atomic synchronous call. That work has to leave the main thread ([Workers](#workers)).

## Batch frequent work

- **Backpressure:** yielding lowers throughput, so when arrivals outpace processing the backlog grows and what reaches the screen gets older. Batching raises throughput by paying the fixed cost per item once per batch. Splitting fixes tasks too long for rendering to squeeze in; batching fixes tasks so frequent that the pipeline's fixed cost repeats.
- **Debounce and throttle scroll, resize and input handlers:** debounce runs once after things quiet down; throttle runs at most once per interval. A demo: a markdown preview of about 2,000 lines rebuilt on every keystroke lags the input; debounced at 300 ms it renders once after typing stops and typing is smooth.
- **Keep each keystroke cheap:** "Prefer uncontrolled inputs; controlled inputs must be cheap per keystroke" [Vercel, web-design-guidelines]. [react.dev: `<input>`](https://react.dev/reference/react-dom/components/input#optimizing-re-rendering-on-every-keystroke): "When you use a controlled input, you set the state on every keystroke. If the component containing your state re-renders a large tree, this can get slow." Move the state into the input's own component, so "only `SignupForm` re-renders on every keystroke":

```js
function App() {
  return (
    <>
      <SignupForm />
      <PageContent />
    </>
  );
}

function SignupForm() {
  const [firstName, setFirstName] = useState('');
  return (
    <form>
      <input value={firstName} onChange={e => setFirstName(e.target.value)} />
    </form>
  );
}
```

  "If there is no way to avoid re-rendering (for example, if `PageContent` depends on the search input's value), `useDeferredValue` lets you keep the controlled input responsive even in the middle of a large re-render."
- **Draw once per frame and keep every data point.** Calling a chart library's `update()` on every message is a common mistake. A demo: 60 tickers, over 1,000 messages per second.

```js
let scheduled = false;

socket.on('tick', (tick) => {
  chart.push(tick); // keep every data point: nothing is thrown away
  if (scheduled) return; // this frame's draw is already booked
  scheduled = true;
  requestAnimationFrame(() => {
    renderBoard(); // draw once per frame
    scheduled = false;
  });
});
```

- **Batch DOM writes:** append many nodes in one operation, toggle one class instead of several style properties, or build an HTML string and assign `innerHTML` once. React's virtual DOM, merged state updates in one handler, and analytics events queued into one request are the same idea.
- **No layout reads between style writes** [Vercel, react-best-practices]: "When you read a layout property (like `offsetWidth`, `getBoundingClientRect()`, or `getComputedStyle()`) between style changes, the browser is forced to trigger a synchronous reflow." Group the writes, then read once (or read everything first, then write):

Incorrect (interleaved reads and writes force reflows):

```typescript
function layoutThrashing(element: HTMLElement) {
  element.style.width = '100px'
  const width = element.offsetWidth  // Forces reflow
  element.style.height = '200px'
  const height = element.offsetHeight  // Forces another reflow
}
```

Correct (batch writes, then read once):

```typescript
function updateElementStyles(element: HTMLElement) {
  // Batch all writes together
  element.style.width = '100px'
  element.style.height = '200px'
  element.style.backgroundColor = 'blue'
  element.style.border = '1px solid black'
  
  // Read after all writes are done (single reflow)
  const { width, height } = element.getBoundingClientRect()
}
```

  "Prefer CSS classes over inline styles when possible." The list of layout-forcing operations: [Paul Irish's gist](https://gist.github.com/paulirish/5d52fb081b3570c81e3a) and [CSS Triggers](https://csstriggers.com/). In React the same rule reaches render: "No layout reads in render (`getBoundingClientRect`, `offsetHeight`, `offsetWidth`, `scrollTop`)" [Vercel, web-design-guidelines].

## Let scrolling start at once

- **Passive touch and wheel listeners** [Vercel, react-best-practices]: "Add `{ passive: true }` to touch and wheel event listeners to enable immediate scrolling. Browsers normally wait for listeners to finish to check if `preventDefault()` is called, causing scroll delay." "Use passive when: tracking/analytics, logging, any listener that doesn't call `preventDefault()`." "Don't use passive when: implementing custom swipe gestures, custom zoom controls, or any listener that needs `preventDefault()`."
- **On the document it is already the default.** [MDN: addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#using_passive_listeners): `passive` "defaults to `true` for `wheel`, `mousewheel`, `touchstart`, and `touchmove` events on `Window`, `Document`, `Document.documentElement`, and `Document.body`. For other events and targets, the default is `false`." The source's example adds `{ passive: true }` to `document` listeners, where it changes nothing; the option matters on elements. To call `preventDefault()` from one of those default-passive listeners, "you must explicitly set the option to `false`", and "You don't need to worry about the value of `passive` for the basic `scroll` event." The owner's caret already sets it on an element: `element.addEventListener("wheel", followFieldScroll, { passive: true });` (landing-page-ui `smooth-caret-lifecycle.ts`).

## Prioritize and defer

- **A job queue on `MessageChannel`,** one message per task: jobs run FIFO, and urgent jobs cut to the front. On a main thread nothing can interrupt, order is the responsiveness the user feels:

```js
const queue = [];
const channel = new MessageChannel();

// One message = one task. Process a piece, then book the next one
channel.port1.onmessage = () => {
  const job = queue.shift(); // take whatever is at the front right now
  if (!job) return; // guard against duplicate bookings
  job();
  if (queue.length > 0) channel.port2.postMessage(null);
};

function postJob(job, urgent = false) {
  if (urgent) queue.unshift(job); // urgent jobs cut to the front
  else queue.push(job);
  if (queue.length === 1) channel.port2.postMessage(null);
}
```

- **Idle until urgent** ([Philip Walton](https://philipwalton.com/articles/idle-until-urgent/)): do the work in order while idle, and bump a job to the front when the user needs it. Resizing attached photos before upload: clicking a photo that isn't ready pulls its preview job to the front. A demo with 60 photos and per-pixel filtering: the same total work, only the order changed.

```js
// Build previews for the attached photos, in order
files.forEach((file, i) => {
  const job = () => createPreview(file, i);
  job.photoId = i; // tag it so we can find it in the queue later
  postJob(job);
});

// Clicking a photo that isn't ready pulls its job to the front → priority bump
onClickPhoto((i) => {
  const idx = queue.findIndex((job) => job.photoId === i);
  if (idx > 0) queue.unshift(queue.splice(idx, 1)[0]);
});
```

- **In React, `startTransition` and `useDeferredValue`** engage a scheduler that yields through `MessageChannel` and orders work with its own priority queue (plus starvation protection, batching and continuations). The Scheduler API and `TaskController` are standards, but support is still incomplete, so in practice people pair them with polyfills or build their own queues.
- **`requestIdleCallback` for work nobody waits on, with a timeout and a fallback** [Vercel, react-best-practices]: "Use `requestIdleCallback()` to schedule non-critical work during browser idle periods." When to use: "Analytics and telemetry", "Saving state to localStorage/IndexedDB", "Prefetching resources for likely next actions", "Processing non-urgent data transformations", "Lazy initialization of non-critical features". Not for "User-initiated actions that need immediate feedback", "Rendering updates the user is waiting for" or "Time-sensitive operations". [MDN: requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback): "This feature is not Baseline because it does not work in some of the most widely-used browsers", and "A `timeout` option is strongly recommended for required work, as otherwise it's possible multiple seconds will elapse before the callback is fired." The source names the fallback but not the missing support (three of its blocks, joined):

```typescript
// Ensure analytics fires within 2 seconds even if browser stays busy
requestIdleCallback(
  () => analytics.track('page_view', { path: location.pathname }),
  { timeout: 2000 }
)

const scheduleIdleWork = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1))

scheduleIdleWork(() => {
  // Non-critical work
})

function processLargeDataset(items: Item[]) {
  let index = 0

  function processChunk(deadline: IdleDeadline) {
    // Process items while we have idle time (aim for <50ms chunks)
    while (index < items.length && deadline.timeRemaining() > 0) {
      processItem(items[index])
      index++
    }

    // Schedule next chunk if more items remain
    if (index < items.length) {
      requestIdleCallback(processChunk)
    }
  }

  requestIdleCallback(processChunk)
}
```
- **Defer what isn't on screen:** off-screen lists in [BROWSER.md](BROWSER.md#long-lists), off-screen video and widgets in [BROWSER.md](BROWSER.md#images-and-video), heavy routes with a dynamic `import()` ([BROWSER.md](BROWSER.md#bundle)).

## Workers

- **Pure, DOM-free heavy work goes to a Web Worker:** parsing a large payload, image processing, complex computation. The result comes back by `postMessage`.

```js
// Main thread
const worker = new Worker('parser.js');
worker.postMessage(hugeRawData);
worker.onmessage = (e) => {
  render(e.data); // receive only the result and put it on screen
};
```

- **Workers aren't free:** no DOM access, and `postMessage` copies (serializes) the data, which is costly when it is large; a short, light job sent to a worker loses to the communication cost. Use one when the computation outweighs the communication and has nothing to do with the DOM. A demo: seam carving about 250 seams (hundreds of millions of operations) freezes the page for 1 to 2 s on the main thread with no intermediate frames; in a worker the image narrows live.
- **Transfer instead of copy:** Transferable objects like `ArrayBuffer` move by reference, at a cost close to zero regardless of size; the sender can no longer use the buffer.

```js
// Hand the pixel buffer to the worker without copying
// After the transfer, this side can no longer use it
worker.postMessage({ buf: pixels.buffer, width, height }, [pixels.buffer]);
```

## Remove work the screen can't use

The biggest gains usually come from removing work. Once the inflow exceeds the maximum throughput, the backlog grows without limit however well you batch, and the browser has no good way to tell the server to slow down. Three ways out:

- **Drop:** live logs discard the oldest entries when behind; keeping up with the present matters more than showing everything.
- **Merge:** a ranking applies only the latest value, so the work is pinned to what the screen can digest.
- **Skip:** a computation that gives the same result for the same input needn't run twice; memoize it. Debouncing and rendering only visible items are skipping too.

## Prove it

Flood the screen the way the article's demos do (a burst of incoming data, typing while it arrives, an animation running) and check: no task over 50 ms, no forced reflow from a layout read between style writes, typing re-renders only the input's own component, typing and animation stay smooth during the burst, and under sustained inflow the backlog stays bounded and what reaches the screen doesn't keep getting older.
