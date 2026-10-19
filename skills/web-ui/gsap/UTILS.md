# gsap.utils: clamp, mapRange, random, snap, distribute, wrap and the rest

**gsap.utils** are helpers, with no registration, used in tween vars (function-based values), in ScrollTrigger or Observer callbacks, or in any JS that drives GSAP; all live on `gsap.utils` [GreenSock, gsap-utils]. Hand-written per-frame math (lerp, sawtooth loops, controlled randomness) is in [ui-animation MATH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/MATH.md). Full list: https://gsap.com/docs/v3/HelperFunctions

**Contents:** [The function form](#the-function-form) · [clamp](#clampmin-max-value) · [mapRange](#maprangeinmin-inmax-outmin-outmax-value) · [normalize](#normalizemin-max-value) · [interpolate](#interpolatestart-end-progress) · [random](#randomminimum-maximum-snapincrement-returnfunction--randomarray-returnfunction) · [snap](#snapsnapto-value) · [shuffle](#shufflearray) · [distribute](#distributeconfig) · [getUnit](#getunitvalue) · [unitize](#unitizefunction-unit) · [splitColor](#splitcolorcolor-returnhsl) · [selector](#selectorscope) · [toArray](#toarrayvalue-scope) · [pipe](#pipefunctions) · [wrap](#wrapmin-max-value) · [wrapYoyo](#wrapyoyomin-max-value) · [Prove it](#prove-it)

## The function form

[GreenSock, gsap-utils]

Many utils take the value to transform as the **last** argument. Leave it out and the util returns a **function** that takes the value later: use that form when the same config clamps, maps, normalizes or snaps many values (a mousemove handler, a tween callback). **Exception: random()**: pass **true** as the last argument for a reusable function; do not leave the value out (https://gsap.com/docs/v3/GSAP/UtilityMethods/random()).

```javascript
// With value: returns the result
gsap.utils.clamp(0, 100, 150); // 100

// Without value: returns a function you call with the value later
let c = gsap.utils.clamp(0, 100);
c(150);  // 100
c(-10);  // 0
```

## clamp(min, max, value?)

[GreenSock, gsap-utils] Constrains a value between min and max.

```javascript
gsap.utils.clamp(0, 100, 150); // 100
gsap.utils.clamp(0, 100, -10); // 0

let clampFn = gsap.utils.clamp(0, 100);
clampFn(150); // 100
```

## mapRange(inMin, inMax, outMin, outMax, value?)

[GreenSock, gsap-utils] Maps a value from one range to another: scroll position, progress (0 to 1) or an input range onto an animation range.

```javascript
gsap.utils.mapRange(0, 100, 0, 500, 50);  // 250
gsap.utils.mapRange(0, 1, 0, 360, 0.5);   // 180 (progress to degrees)

let mapFn = gsap.utils.mapRange(0, 100, 0, 500);
mapFn(50);  // 250
```

## normalize(min, max, value?)

[GreenSock, gsap-utils] Returns the value normalized to 0 to 1 for the range; the inverse of mapping when the target range is 0 to 1.

```javascript
gsap.utils.normalize(0, 100, 50);   // 0.5
gsap.utils.normalize(100, 300, 200); // 0.5

let normFn = gsap.utils.normalize(0, 100);
normFn(50); // 0.5
```

**mapRange and normalize work on numbers only;** use getUnit and unitize when units matter.

## interpolate(start, end, progress?)

[GreenSock, gsap-utils] Interpolates between two values at a progress (0 to 1): numbers, colors, and objects with matching keys. ui-animation's hand-written `lerp(a, b, t)` is in [ui-animation MATH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/MATH.md).

```javascript
gsap.utils.interpolate(0, 100, 0.5);       // 50
gsap.utils.interpolate("#ff0000", "#0000ff", 0.5); // mid color
gsap.utils.interpolate({ x: 0, y: 0 }, { x: 100, y: 50 }, 0.5); // { x: 50, y: 25 }

let lerp = gsap.utils.interpolate(0, 100);
lerp(0.5); // 50
```

## random(minimum, maximum[, snapIncrement, returnFunction]) / random(array[, returnFunction])

[GreenSock, gsap-utils]

A random number in the range, or a random element of an array. **snapIncrement** snaps the result to the nearest multiple (`5` gives multiples of 5). **true** as the last argument returns a function that takes no arguments and gives a new value each call.

```javascript
// immediate value: number in range
gsap.utils.random(-100, 100);        // e.g. 42.7
gsap.utils.random(0, 500, 5);        // 0 to 500, snapped to nearest 5

// reusable function: pass true as last argument
let randomFn = gsap.utils.random(-200, 500, 10, true);
randomFn();  // random value in range, snapped to 10
randomFn();  // another random value

// array: pick one value at random
gsap.utils.random(["red", "blue", "green"]);  // "red", "blue", or "green"
let randomFromArray = gsap.utils.random([0, 100, 200], true);
randomFromArray();  // 0, 100, or 200
```

**String form in tween vars**, evaluated per target: `"random(-100, 100)"`, `"random(-100, 100, 5)"`, `"random([0, 100, 200])"`.

```javascript
gsap.to(".box", { x: "random(-100, 100, 5)", duration: 1 });
gsap.to(".item", { backgroundColor: "random([red, blue, green])" });
```

landing-page-ui gives each title letter its own tilt with `rotate: () => gsap.utils.random(-8, 8)` ("a random tilt per letter in -8 to 8 degrees", [landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#the-hero-assembles-once)).

## snap(snapTo, value?)

[GreenSock, gsap-utils] Snaps to the nearest multiple of **snapTo**, or to the nearest value in an array.

```javascript
gsap.utils.snap(10, 23);     // 20
gsap.utils.snap(0.25, 0.7);  // 0.75
gsap.utils.snap([0, 100, 200], 150); // 100 or 200 (nearest in array)

let snapFn = gsap.utils.snap(10);
snapFn(23); // 20
```

In a tween, for grid or step-based motion, the `snap` special property (SnapPlugin, in core, no registration; also `snap: "x,y"`, https://gsap.com/docs/v3/GSAP/CorePlugins/Snap):

```javascript
gsap.to(".x", { x: 200, snap: { x: 20 } });
```

## shuffle(array)

Shuffles the supplied array in place and returns that same array. The [official shuffle reference](https://gsap.com/docs/v3/GSAP/UtilityMethods/shuffle()) explicitly says it does not create a new array.

The supplied gsap-utils source and old line said it returned a new array with the same elements in random order, and the old intro called these helpers pure. [GreenSock, gsap-utils]

```javascript
gsap.utils.shuffle([1, 2, 3, 4]); // e.g. [3, 1, 4, 2]
```

## distribute(config)

[GreenSock, gsap-utils]

**Returns a function** that assigns each target a value from its position in the array or grid. GSAP uses it internally for advanced staggers; use it for any value spread across many elements (scale, opacity, x, delay). The function gets `(index, target, targets)`: call it yourself or pass it straight into a tween. ui-animation's "stagger by distance from a focal point" is in [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#staggers-and-sequencing).

| Property | Type | Description |
|---|---|---|
| `base` | Number | Starting value. Default `0`. |
| `amount` | Number | Total to distribute across all targets (added to base). `amount: 1` with 100 targets gives 0.01 between each. Use **each** for a fixed step. |
| `each` | Number | Amount between each target (added to base). `each: 1` with 4 targets gives 0, 1, 2, 3. Use **amount** to split a total. |
| `from` | Number \| String \| Array | Where distribution starts: an index, `"start"`, `"center"`, `"edges"`, `"random"`, `"end"`, or ratios like `[0.25, 0.75]`. Default `0`. |
| `grid` | String \| Array | Grid position instead of flat index: `[rows, columns]` (`[5, 10]`) or `"auto"` to detect. Omit for a flat array. |
| `axis` | String | For a grid: limit to one axis (`"x"` or `"y"`). |
| `ease` | Ease | Distribute values along an ease curve (`"power1.inOut"`). Default `"none"`. |

```javascript
// Scale: middle elements 0.5, outer edges 3 (amount 2.5 distributed from center)
gsap.to(".class", {
  scale: gsap.utils.distribute({
    base: 0.5,
    amount: 2.5,
    from: "center"
  })
});

// Manual use
const distributor = gsap.utils.distribute({
  base: 50,
  amount: 100,
  from: "center",
  ease: "power1.inOut"
});
const targets = gsap.utils.toArray(".box");
const valueForIndex2 = distributor(2, targets[2], targets);
```

See https://gsap.com/docs/v3/GSAP/UtilityMethods/distribute/

## getUnit(value)

[GreenSock, gsap-utils]

```javascript
gsap.utils.getUnit("100px");   // "px"
gsap.utils.getUnit("50%");     // "%"
gsap.utils.getUnit(42);        // "" (unitless)
```

## unitize(function, unit?)

The skill documents `unitize(value, unit)` with `gsap.utils.unitize(100, "px"); // "100px"`; that signature is wrong. Per https://gsap.com/docs/v3/GSAP/UtilityMethods/unitize() it is `gsap.utils.unitize(function, unit?)` and **returns a Function**: it wraps another util so that util's result gets a unit, and "strips off any units from the input (using parseFloat()) before passing it along to the function". Corrected block: the skill's example replaced with the docs' own (same URL):

```javascript
// get a function that always applies "px" to the result (and strips off any units from the input)
var clamp = gsap.utils.unitize(gsap.utils.clamp(0, 100), "px");

// now the result always gets "px" added:
clamp(132); // "100px"
clamp("-20%"); // "0px" (notice the unit change)
clamp(50); // "50px"
```

## splitColor(color, returnHSL?)

[GreenSock, gsap-utils]

A color string to **[red, green, blue]** (0 to 255), or **[red, green, blue, alpha]** when alpha is present. **true** as the second argument returns **[hue, saturation, lightness]** (plus alpha). Takes `rgb()`, `rgba()`, `hsl()`, `hsla()`, hex and named colors. See https://gsap.com/docs/v3/GSAP/UtilityMethods/splitColor/

```javascript
gsap.utils.splitColor("red");                    // [255, 0, 0]
gsap.utils.splitColor("#6fb936");                // [111, 185, 54]
gsap.utils.splitColor("rgba(204, 153, 51, 0.5)"); // [204, 153, 51, 0.5] (4 elements)
gsap.utils.splitColor("#6fb936", true);          // [94, 55, 47] (HSL: hue, saturation, lightness)
```

## selector(scope)

[GreenSock, gsap-utils] A selector function that finds elements only inside the given element or ref (it handles `.current`), so `".box"` matches only that component's descendants.

```javascript
const q = gsap.utils.selector(containerRef);
q(".box");        // array of .box elements inside container
gsap.to(q(".circle"), { x: 100 });
```

## toArray(value, scope?)

[GreenSock, gsap-utils] A selector string (scoped to an element), NodeList, HTMLCollection, single element or array, as a real array.

```javascript
gsap.utils.toArray(".item");           // array of elements
gsap.utils.toArray(".item", container); // scoped to container
gsap.utils.toArray(nodeList);          // [ ... ] from NodeList
```

## pipe(...functions)

[GreenSock, gsap-utils] `pipe(f1, f2, f3)(value)` returns `f3(f2(f1(value)))`, for a chain like normalize, then mapRange, then snap.

```javascript
const fn = gsap.utils.pipe(
  (v) => gsap.utils.normalize(0, 100, v),
  (v) => gsap.utils.snap(0.1, v)
);
fn(50); // normalized then snapped
```

## wrap(min, max, value?)

[GreenSock, gsap-utils] Wraps a value into min to max (min inclusive, max exclusive), for infinite scroll or cyclic values.

```javascript
gsap.utils.wrap(0, 360, 370);  // 10
gsap.utils.wrap(0, 360, -10);   // 350

let wrapFn = gsap.utils.wrap(0, 360);
wrapFn(370); // 10
```

## wrapYoyo(min, max, value?)

[GreenSock, gsap-utils] Wraps with a yoyo, bouncing back at the ends.

```javascript
gsap.utils.wrapYoyo(0, 100, 150); // 50 (bounces back)

let wrapY = gsap.utils.wrapYoyo(0, 100);
wrapY(150); // 50
```

## Prove it

- Any util called many times with one config (in a handler or callback) is built once in function form, outside the handler.
- No `unitize(number, unit)` call exists; every unitize wraps a function.
- mapRange and normalize never receive strings with units.
- Component code uses `selector(scope)` or `toArray(value, scope)`, not a document-wide selector.
- Rely only on documented behaviour: "Override or rely on undocumented behavior" is a GreenSock Do Not.
