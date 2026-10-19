// Split from lathe.mjs; original algorithms and public entrypoint contracts are preserved.
import { cameraOf } from "./iso-kit.mjs";


export const TAU = Math.PI * 2;

const LIGHT_UP = 1.2;

export const BANDS = [0, 0.2, 0.42, 0.62];


export const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

export const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

export const len3 = (a) => Math.hypot(a[0], a[1], a[2]);

export const unit3 = (a) => {
  const length = len3(a) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
};

export const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];


export function viewOf(P) {
  const { sinA, cosA, sinE, cosE } = cameraOf(P);
  return [cosA * cosE, sinA * cosE, sinE];
}


export function lightOf(P) {
  const { sinA, cosA } = cameraOf(P);
  return unit3([-sinA, cosA, LIGHT_UP]);
}


export const scaleOf = (P) => cameraOf(P).k;


export function bandOf(score) {
  let tone = 0;
  while (tone < BANDS.length && score >= BANDS[tone]) tone++;
  return tone;
}


export const toneOf = (normal, P) => bandOf(dot3(unit3(normal), lightOf(P)));


export function frameAlong(o, a) {
  const axis = unit3(a);
  const helper = Math.abs(axis[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
  const u = unit3(cross3(helper, axis));
  const v = cross3(axis, u);
  return { o, a: axis, u, v };
}


export const frameOf = (o, a, u, v) => ({ o, a, u, v });


export function pointOf(F, s, r, angle) {
  const c = Math.cos(angle);
  const n = Math.sin(angle);
  return [
    F.o[0] + F.a[0] * s + r * (c * F.u[0] + n * F.v[0]),
    F.o[1] + F.a[1] * s + r * (c * F.u[1] + n * F.v[1]),
    F.o[2] + F.a[2] * s + r * (c * F.u[2] + n * F.v[2]),
  ];
}


export const radialOf = (F, angle) => {
  const c = Math.cos(angle);
  const n = Math.sin(angle);
  return [c * F.u[0] + n * F.v[0], c * F.u[1] + n * F.v[1], c * F.u[2] + n * F.v[2]];
};


export const tangentOf = (F, angle) => {
  const c = Math.cos(angle);
  const n = Math.sin(angle);
  return [-n * F.u[0] + c * F.v[0], -n * F.u[1] + c * F.v[1], -n * F.u[2] + c * F.v[2]];
};


export const angleToward = (F, direction) => Math.atan2(dot3(direction, F.v), dot3(direction, F.u));


const signedArea = (points) => points.reduce((sum, [x, y], index) => {
  const [nx, ny] = points[(index + 1) % points.length];
  return sum + x * ny - nx * y;
}, 0);


export const oriented = (points) => (signedArea(points) < 0 ? [...points].reverse() : points);


export function arcPoints(F, s, r, a0, a1, steps = 24) {
  return Array.from({ length: steps + 1 }, (_, index) => pointOf(F, s, r, a0 + ((a1 - a0) * index) / steps));
}
