# Measured annotations and product relationships

Stageshow's annotation studies choose a line for a specific relationship and attach it to the geometry actually drawn. Use this with [PRODUCT-ILLUSTRATIONS.md](PRODUCT-ILLUSTRATIONS.md), preserving the real product's anatomy and readable result. Its component APIs are not bundled. [stageshow, references/annotations.md]

## Give a connection a meaning

[stageshow, references/annotations.md, Choose a line for a relationship]

| Relationship | What the line explains |
|---|---|
| Leader | One selected object or value belongs to one short note. Usually no arrow or continuing motion; clear it with the selection. |
| Record link | Two views show the same record. Keep its treatment distinct from a leader explaining a value. |
| Collection | Several inputs gather at one meaningful junction before producing one result. Start delivery after every required input arrives. |
| Transfer | A request, acknowledgement or result has an origin and destination. The return begins at the recipient, and completion follows visible arrival. |
| Ongoing flow | A fixed route remains while a phase moves along it. Stop the phase when the connection closes; a completed one-off transfer needs no continuing dots. |

Leave out a line when layout already makes the relationship clear. Give related surfaces different roles and weights; overlap only where it preserves record text, the trigger and payoff. Annotation text is an explanation, not another product node.

## Separate route, pattern, reveal and phase

[stageshow, references/annotations.md, Choose a line for a relationship; Show the cause, then hold the explanation]

Keep route geometry, stroke pattern, progressive reveal and continuing phase independent. A reveal mask can expose a dotted route without stretching its dots. A moving phase changes neither the route nor attached content.

Draw a shared trunk once so overlapping segments do not darken into a knot. Start each branch when the reveal reaches its junction. Markers and inline labels wait for the route to arrive; a sender's confirmed status waits for the acknowledgement. Use a consistent treatment within one relationship rather than assigning a different color to every input.

## Attach to visible geometry throughout motion

[stageshow, references/annotations.md, Attach to what is drawn; Frame the whole relationship]

- Measure named targets and choose the edge facing the relationship. Check the final segment's approach as well as its endpoint: a line reaching the correct border can still run along it or cross the label.
- Keep the leader clear of content, rounded borders and other connections. A quiet gap or endpoint can make attachment legible without cutting through the object.
- A rectangle refreshed after state commits or transition completion does not track continuous movement. Update geometry each frame, or place the object, annotation and selection ring in one moving coordinate space.
- Do not give an attached label an independent spring that can separate from its object. A displayed dimension reads from the same changing box that owns the guide.
- Keep a camera's focus in the expected layout coordinates; feeding an already transformed rectangle back through the same transform applies it twice.
- Leave room for labels and arrowheads outside the target's clip. Recompose narrow hosts by stacking surfaces and rerouting connections while retaining readable type.

Pause ongoing phase with the host and offscreen, and provide a static directional result for reduced motion. Hold the explanation long enough to read, then clear it through a visible action. [stageshow, references/annotations.md, Choose a line for a relationship; Show the cause, then hold the explanation]

## Prove it

[stageshow, references/annotations.md, Check attachment in motion]

Watch entry, held result, exit and return at the real wide and narrow hosts. During resize and follow motion, compare guide ends with visible target edges throughout the transition. Check branch arrival, acknowledgement timing and stopped-flow state. A clean start and end or gapped contact sheet leaves intermediate attachment unchecked.
