// Hero material recipes from hero3d.js, Apache-2.0; see ../LICENSE-motionmaxxing.txt.
import * as THREE from "three";

// ---------------------------------------------------------------------------------------------
// Material recipes. MeshPhysicalMaterial everywhere: MeshStandardMaterial with default values
// is the "plastic CG" look. Every recipe assumes an environment map is present.
// ---------------------------------------------------------------------------------------------
export const MATERIALS = {
  // Polished metal. Colour tints it: '#ffffff' chrome, '#f1c16b' gold, '#c9a18a' rose gold.
  chrome: { color: "#ffffff", metalness: 1, roughness: 0.07 },
  // Real refraction. attenuationColor tints the body by thickness, dispersion splits edges.
  glass: {
    color: "#ffffff",
    metalness: 0,
    roughness: 0.03,
    transmission: 1,
    thickness: 0.8,
    ior: 1.5,
    attenuationDistance: 3,
    dispersion: 0.25,
    specularIntensity: 1,
    clearcoat: 0.3,
  },
  // Soft anodised / powder-coat look: broad highlight, sheen on grazing edges.
  satin: {
    color: "#d9d5cf",
    metalness: 0.25,
    roughness: 0.38,
    sheen: 0.5,
    sheenRoughness: 0.4,
    sheenColor: "#ffffff",
    clearcoat: 0.25,
    clearcoatRoughness: 0.35,
  },
  // Thin-film metal (holo coin, oil-slick). Needs a contrasty env or it reads as grey.
  iridescent: {
    // Base must NOT be a perfect mirror: over F0=1 (white metal) thin-film interference cancels
    // out and the result is plain chrome. A mid-grey metal base leaves room for the colours.
    color: "#cfcfcf",
    metalness: 1,
    roughness: 0.12,
    iridescence: 1,
    iridescenceIOR: 1.8,
    iridescenceThicknessRange: [180, 400], // thin + narrow = pastel holo foil; wide (250-900) = oil slick
  },
  // Glossy injection-moulded plastic in the brand colour, with a lacquer coat.
  brandPlastic: {
    color: "#3355ff",
    metalness: 0,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    specularIntensity: 0.7,
  },
};

export function makeMaterial(name = "chrome", color, extra = {}) {
  const recipe = { ...(MATERIALS[name] || MATERIALS.chrome), ...extra };
  if (color) recipe[name === "glass" ? "attenuationColor" : "color"] = color;
  const { color: c, attenuationColor: ac, sheenColor: sc, warp, ...rest } = recipe;
  const m = new THREE.MeshPhysicalMaterial(rest);
  if (c) m.color.set(c);
  if (ac) m.attenuationColor.set(ac);
  if (sc) m.sheenColor.set(sc);
  if (warp) addWarp(m, warp === true ? {} : warp);
  // Without a thickness map three uses the MAX thickness everywhere: one flat hue (reads as copper).
  if (m.iridescence > 0 && !m.iridescenceThicknessMap) m.iridescenceThicknessMap = filmThicknessMap();
  return m;
}

let filmMap = null;
/** Smooth deterministic 256x256 pattern (sum of sines, no randomness) used as thin-film thickness. */
function filmThicknessMap() {
  if (filmMap) return filmMap;
  const n = 256,
    d = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const u = (x / n) * Math.PI * 2,
        v = (y / n) * Math.PI * 2;
      const f = 0.5 + 0.3 * Math.sin(u + Math.sin(v) * 1.2) + 0.2 * Math.sin(v + Math.cos(u) * 0.8); // one soft cycle, tileable
      const i = (y * n + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = Math.round(f * 255);
      d[i + 3] = 255;
    }
  filmMap = new THREE.DataTexture(d, n, n); // thickness is read from the G channel
  filmMap.wrapS = filmMap.wrapT = THREE.RepeatWrapping;
  filmMap.needsUpdate = true;
  return filmMap;
}

/** Liquid-surface normal warp. Flat extruded faces reflect ONE direction of the environment, so
 *  a whole letter face is either all-lit or all-dark ("mirror tile" look). Bending the shading
 *  normal with smooth object-space waves makes each face show a band of the environment, which
 *  is what real polished type and liquid chrome look like. Pure function of (position, uWarpTime);
 *  renderAt() sets uWarpTime from state.warpTime (default: frozen at 0, i.e. no flow).
 *  { amount: 0.18 (0.08 subtle polish .. 0.4 liquid), scale: 1.4 (waves per unit), flow: 1 } */
function addWarp(m, { amount = 0.18, scale = 1.4 } = {}) {
  m.userData.warp = {
    uWarpTime: { value: 0 },
    uWarpAmount: { value: amount },
    uWarpScale: { value: scale },
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.warp);
    sh.vertexShader = sh.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vWarpP; varying vec3 vWX; varying vec3 vWY; varying vec3 vWZ;",
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vWarpP = position; vWX = normalMatrix * vec3(1.,0.,0.); vWY = normalMatrix * vec3(0.,1.,0.); vWZ = normalMatrix * vec3(0.,0.,1.);`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWarpP; varying vec3 vWX; varying vec3 vWY; varying vec3 vWZ;
        uniform float uWarpTime, uWarpAmount, uWarpScale;`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        {
          vec3 q = vWarpP * uWarpScale; float T = uWarpTime;
          vec3 w = vec3(
            sin(q.y * 1.7 + 1.5 * sin(q.x * 1.3 + T) + q.z * 0.8),
            sin(q.x * 1.9 + 1.5 * sin(q.y * 1.1 - T * 0.8) + 0.6),
            sin((q.x + q.y) * 1.2 + T * 0.6));
          vec3 wv = vWX * w.x + vWY * w.y + vWZ * w.z;
          wv -= dot(wv, normal) * normal;              // keep the bend tangential
          normal = normalize(normal + wv * uWarpAmount);
        }`,
      );
  };
  m.customProgramCacheKey = () => "hero3d-warp";
}
