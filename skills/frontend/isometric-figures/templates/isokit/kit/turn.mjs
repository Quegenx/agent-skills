// SVG runtime; painter remains ignored.
import { createTurnRuntime } from "./turn-runtime.mjs";
const { TURN, TURN_CSS } = createTurnRuntime(false);
export { TURN, TURN_CSS };
