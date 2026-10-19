# React and lifecycle: useGSAP, gsap.context(), contextSafe, cleanup, SSR

In any component framework the same three principles hold: create tweens and ScrollTriggers **after** the component's DOM exists, **kill or revert** them in the unmount cleanup, and **scope selectors** to the component root [GreenSock, gsap-frameworks]. In React the tool for all three is the `useGSAP()` hook; without it, `gsap.context()` in an effect does the same [GreenSock, gsap-react]. Plugin instances (SplitText and the rest) follow the same cleanup; their APIs are in [PLUGINS.md](PLUGINS.md).

**Contents:** [Install and register](#install-and-register) · [The lifecycle in any framework](#the-lifecycle-in-any-framework) · [Prefer useGSAP()](#prefer-usegsap) · [Dependencies, scope and revertOnUpdate](#dependencies-scope-and-revertonupdate) · [gsap.context() in useEffect](#gsapcontext-in-useeffect) · [Context-safe callbacks](#context-safe-callbacks) · [Scope every selector](#scope-every-selector) · [Kill or revert](#kill-or-revert) · [ScrollTriggers in a context](#scrolltriggers-in-a-context) · [Server-side rendering](#server-side-rendering) · [Prove it](#prove-it)

## Install and register

[GreenSock, gsap-react]

```bash
# Install the GSAP library
npm install gsap
# Install the GSAP React package
npm install @gsap/react
```

- **useGSAP is itself a plugin:** `gsap.registerPlugin(useGSAP)` before running useGSAP or any GSAP code; the React docs give the reason, "to avoid React version discrepancies" (https://gsap.com/resources/React).
- Register it and every other plugin once at module level, not in a component body that re-renders; registration, licensing and lazy-loading rarely used plugins are in [PLUGINS.md](PLUGINS.md#registering-plugins).

## The lifecycle in any framework

[GreenSock, gsap-frameworks]

| Lifecycle | Action |
|---|---|
| **Mounted** | Create tweens and ScrollTriggers inside **gsap.context(scope)**. |
| **Unmount / Destroy** | Call **ctx.revert()** so all animations and ScrollTriggers in that context are killed and inline styles reverted. |

- Do not create GSAP animations in the component's setup or in a synchronous top-level script that runs before the root element exists: the DOM nodes may not exist yet. Wait for the mounted hook (or equivalent) so the container ref is in the DOM.
- Skipping cleanup leaves animations running on detached nodes and leaks; "Kill or revert" them in the unmount cleanup.
- The skill's Vue, Nuxt and Svelte code is not copied here (outside this stack); each is the table above with that framework's mounted and destroyed hooks.

## Prefer useGSAP()

[GreenSock, gsap-react]

When **@gsap/react** is available, use **useGSAP()** instead of `useEffect()` or `useLayoutEffect()` for GSAP setup. It runs on an isomorphic layout effect, reverts everything created inside it (animations and ScrollTriggers) on unmount, and gives a scope and **contextSafe** for callbacks (behaviour checked against https://gsap.com/resources/React).

```javascript
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP); // register before running useGSAP or any GSAP code

const containerRef = useRef(null);

useGSAP(() => {
  gsap.to(".box", { x: 100 });
  gsap.from(".item", { opacity: 0, stagger: 0.1 });
}, { scope: containerRef });
```

## Dependencies, scope and revertOnUpdate

[GreenSock, gsap-react]

By default useGSAP passes an **empty dependency array** to its internal effect, so it doesn't run on every render. The second argument is either a dependency array (like useEffect) or a config object:

```javascript
useGSAP(() => {
  // gsap code here, just like in a useEffect()
},{
  dependencies: [endX], // dependency array (optional)
  scope: container,     // scope selector text (optional, recommended)
  revertOnUpdate: true  // causes the context to be reverted and the cleanup function to run every time the hook re-synchronizes (when any dependency changes)
});
```

## gsap.context() in useEffect

[GreenSock, gsap-react]

`gsap.context()` inside a regular `useEffect()` is fine when @gsap/react is not used or when the effect's dependency behaviour is needed. Then **always** return a cleanup that calls **ctx.revert()**, so animations and ScrollTriggers are killed and inline styles reverted; otherwise you get leaks and updates on detached nodes. The context docs: everything created inside it is "reverted and killed" (https://gsap.com/docs/v3/GSAP/gsap.context()).

```javascript
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to(".box", { x: 100 });
    gsap.from(".item", { opacity: 0, stagger: 0.1 });
  }, containerRef);
  return () => ctx.revert();
}, []);
```

## Context-safe callbacks

[GreenSock, gsap-react]

GSAP objects created in functions that run **after** useGSAP executes (pointer handlers, onComplete) are not in the context, so they are not reverted on unmount or re-render; the React docs say such animations "will not be context-safe". Wrap those functions in **contextSafe**, and remove the listeners in the cleanup:

```javascript
const container = useRef();
const badRef = useRef();
const goodRef = useRef();

useGSAP((context, contextSafe) => {
	// ✅ safe, created during execution
	gsap.to(goodRef.current, { x: 100 });

	// ❌ DANGER! This animation is created in an event handler that executes AFTER useGSAP() executes. It's not added to the context so it won't get cleaned up (reverted). The event listener isn't removed in cleanup function below either, so it persists between component renders (bad).
	badRef.current.addEventListener('click', () => {
		gsap.to(badRef.current, { y: 100 });
	});

	// ✅ safe, wrapped in contextSafe() function
	const onClickGood = contextSafe(() => {
		gsap.to(goodRef.current, { rotation: 180 });
	});

	goodRef.current.addEventListener('click', onClickGood);

	// 👍 we remove the event listener in the cleanup function below.
	return () => {
		// <-- cleanup
		goodRef.current.removeEventListener('click', onClickGood);
	};
},{ scope: container });
```

landing-page-ui's title letters run `gsap.to(event.currentTarget, ...)` from plain pointer-enter and pointer-leave handlers, outside any context ([animated-title-text.tsx](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/reference/website/shared/motion/animated-title-text.tsx); "Hover in (pointer enter on each letter ...) | ... .22s `back.out(2.8)`", [landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#the-hero-assembles-once)). By the rule above those tweens are not reverted on unmount; contextSafe is the GreenSock form. The two tweens also share properties under the default `overwrite: false` ([CORE.md](CORE.md#common-vars)).

## Scope every selector

[GreenSock, gsap-react], [GreenSock, gsap-frameworks]

- Pass a **scope** (ref or element) to useGSAP, or as the second argument to `gsap.context(callback, scope)`, so `.box` is searched only inside that subtree. A bare `gsap.to(".box", ...)` in a component can affect other instances or the rest of the page.
- Use **refs** so GSAP targets the actual DOM nodes after render. For many elements, a ref to the container and a query of its children, or an array of refs. `gsap.utils.selector(scope)` also scopes selectors to an element or ref ([UTILS.md](UTILS.md#selectorscope)).

landing-page-ui scopes with refs and `querySelectorAll` on the ref (`contentRef.current?.querySelectorAll(":scope > *")`, `visualTextRef.current?.querySelectorAll(...)`) rather than a gsap.context scope; that meets the rule.

## Kill or revert

[GreenSock, gsap-frameworks], [GreenSock, gsap-react]

The framework-neutral principle is "**Kill or revert** them in the unmount cleanup". The React rule is narrower: "prefer useGSAP() ... use gsap.context() + ctx.revert() in useEffect when useGSAP is not an option" and "**Always** return a cleanup that calls ctx.revert()". The difference that matters: `ctx.revert()` also reverts inline styles; `kill()` stops the animation and, per its docs, says nothing about styles (https://gsap.com/docs/v3/GSAP/Timeline/kill()).

landing-page-ui sets up GSAP in plain `useLayoutEffect` and `useEffect` (`@gsap/react` is not in its package table) and now cleans up through `gsap.context()` and `context.revert()`: the menu builds its timelines inside one context, so the inline `height` and `overflow` its `gsap.set(nav, ...)` wrote are reverted, and the title letters run their entrances in a context and kill the pointer-started hover tweens by target ([site-header-menu-motion.ts](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/reference/website/widgets/header/bar/site-header-menu-motion.ts), [animated-title-text.tsx](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/reference/website/shared/motion/animated-title-text.tsx)).

## ScrollTriggers in a context

[GreenSock, gsap-frameworks]

ScrollTriggers made with a `scrollTrigger` config or `ScrollTrigger.create()` are **included** in gsap.context() and reverted with `ctx.revert()`. So create them inside the same context callback as the tweens, and call `ScrollTrigger.refresh()` after layout changes that move trigger positions: after data loads, or after the framework's next DOM update. The rest of refresh is in [SCROLLTRIGGER.md](SCROLLTRIGGER.md).

## Server-side rendering

[GreenSock, gsap-react]

GSAP runs in the browser. Do not call gsap or ScrollTrigger during SSR (Next.js and the like):

- Use **useGSAP** (or useEffect) so all GSAP code runs only on the client.
- If GSAP is imported at the top level, make sure nothing runs `gsap.*` or `ScrollTrigger.*` during the server render. A dynamic import inside useEffect is an option when tree-shaking or bundle size matters.

landing-page-ui keeps every GSAP call inside an effect or an event handler (gsap-a findings).

## Prove it

- Mount and unmount the component ten times (a route change back and forth): no tween or ScrollTrigger survives, and inspected elements carry no leftover inline styles where the code reverts.
- Render two instances side by side: animating one never moves the other.
- Every handler that creates a tween is wrapped in contextSafe, or its tweens are killed in the cleanup, and its listener is removed there.
- Server render the page: no `gsap.*` or `ScrollTrigger.*` runs on the server.
- `gsap.registerPlugin` runs at module level, once, for useGSAP and for every plugin in use.
