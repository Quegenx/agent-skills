import { createTurnPrimitives } from "./turn-primitives.mjs";
import { createTurnProjection } from "./turn-projection.mjs";
import { createTurnOutlines } from "./turn-outlines.mjs";
import { createTurnGeometry } from "./turn-geometry.mjs";
import { createTurnEmission } from "./turn-emission.mjs";
import { createTurnFrame } from "./turn-emission.mjs";
import { createTurnMount } from "./turn-mount.mjs";

// Preserve independent mutable state for the SVG and fixed/canvas entrypoints.
export function createTurnRuntime(fixed) {
  const dependencies = {};
  Object.assign(dependencies, createTurnPrimitives(dependencies, fixed));
  Object.assign(dependencies, createTurnProjection(dependencies, fixed));
  Object.assign(dependencies, createTurnOutlines(dependencies, fixed));
  Object.assign(dependencies, createTurnGeometry(dependencies, fixed));
  Object.assign(dependencies, createTurnEmission(dependencies, fixed));
  Object.assign(dependencies, createTurnFrame(dependencies, fixed));
  Object.assign(dependencies, createTurnMount(dependencies, fixed));
  const { T3_LEVELS, T3_MATERIALS, T3_Q, t3Anchor, t3Camera, t3Cams, t3Compose, t3Cover, t3Css, t3Disjoint, t3Emit, t3FloorOf, t3Frame, t3Gjk, t3MaterialCss, t3Mount, t3Order, t3PoseUniforms, t3PosesMap, t3Prepare, t3Quat, t3Rot, t3State } = dependencies;


const TURN = { materials: Object.keys(T3_MATERIALS), materialCss: t3MaterialCss, rotation: (axis, degrees) => Array.from(t3Rot(axis, degrees)), quat: (q) => Array.from(t3Quat(q)), compose: t3Compose, floorOf: t3FloorOf, anchor: t3Anchor, camera: t3Camera, poses: t3PosesMap, prepare: t3Prepare, emit: t3Emit, order: t3Order, mount: t3Mount, cover: t3Cover, poseUniforms: t3PoseUniforms, css: t3Css, frame: t3Frame, cams: t3Cams, gjk: t3Gjk, hintsOf: (ri, ci, rj, cj, world) => Object.assign([...ri.axes.map((axis) => [axis, ci]), ...rj.axes.map((axis) => [axis, cj]), [[0, 0, 1], world]], { centroids: [ri.centroid, rj.centroid] }), disjoint: t3Disjoint, levels: T3_LEVELS, q: T3_Q, exact: (on) => { t3State.exact = Boolean(on); } };

const TURN_CSS = t3Css();
  return { TURN, TURN_CSS };
}
