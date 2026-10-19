// Fixed runtime with SVG/canvas, numeric arenas, selective layers and mutable items.
import { createTurnRuntime } from "./turn-runtime.mjs";
const { TURN, TURN_CSS } = createTurnRuntime(true);
export { TURN, TURN_CSS };
