// The QUAICU architectural kit, modelled on the reference stills: frosted
// glass tiles with line icons, obsidian bases with emerald underglow, glass
// conduits carrying signals, black gates, glass boundary walls, a ledger of
// glass records, and the AI core. Every builder returns a THREE.Object3D with
// an optional `set(...)` for animated state.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { C, rng, clamp } from "./util.js";

export const env = { map: null };

// ---------------------------------------------------------------- materials
const hdr = (hex, k) => new THREE.Color(hex).multiplyScalar(k);

export function glass(o = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color: o.color ?? 0xffffff,
    metalness: 0,
    roughness: o.roughness ?? 0.22,
    transmission: o.transmission ?? 1,
    thickness: o.thickness ?? 0.35,
    ior: o.ior ?? 1.46,
    attenuationColor: new THREE.Color(o.tint ?? 0xeafff3),
    attenuationDistance: o.attenuation ?? 2.5,
    clearcoat: o.clearcoat ?? 0.7,
    clearcoatRoughness: 0.08,
    specularIntensity: 1,
    envMapIntensity: o.env ?? 1.0,
    transparent: false,
    side: o.side ?? THREE.FrontSide,
  });
  // Edge light (fresnel rim) and a bottom-up inner glow in object space, so
  // glass reads against dark backgrounds the way it does in the references.
  const u = {
    rimColor: { value: hdr(o.rimColor ?? 0xdff5ea, o.rim ?? 0.35) },
    rimPow: { value: o.rimPow ?? 3.0 },
    glowColor: { value: hdr(o.glowColor ?? C.emeraldHi, o.glow ?? 0) },
    glowY0: { value: o.glowY0 ?? -0.5 },
    glowY1: { value: o.glowY1 ?? 0.5 },
    glowPow: { value: o.glowPow ?? 3.0 },
    milk: { value: hdr(0xf2f6f4, o.milk ?? 0) },
  };
  m.userData.u = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vLocal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLocal = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vLocal; uniform vec3 rimColor; uniform float rimPow; uniform vec3 glowColor; uniform float glowY0; uniform float glowY1; uniform float glowPow; uniform vec3 milk;"
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float fr = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), rimPow);
        totalEmissiveRadiance += rimColor * fr;
        float gy = clamp((vLocal.y - glowY0) / (glowY1 - glowY0), 0.0, 1.0);
        totalEmissiveRadiance += glowColor * pow(1.0 - gy, glowPow);
        totalEmissiveRadiance += milk * (0.35 + 0.65 * fr);`
      );
  };
  m.customProgramCacheKey = () => "qglass";
  return m;
}

export function obsidian(o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: o.color ?? 0x060606,
    metalness: 0,
    roughness: o.roughness ?? 0.34,
    clearcoat: o.clearcoat ?? 1,
    clearcoatRoughness: o.clearcoatRoughness ?? 0.12,
    envMapIntensity: o.env ?? 1.0,
  });
}

export function emissive(hex = C.emeraldHi, k = 3, o = {}) {
  return new THREE.MeshBasicMaterial({
    color: hdr(hex, k),
    transparent: !!o.transparent,
    opacity: o.opacity ?? 1,
    blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: o.depthWrite ?? !o.additive,
    side: o.side ?? THREE.FrontSide,
    fog: o.fog ?? true,
    toneMapped: false,
  });
}

// --------------------------------------------------------------- textures
function canvas(w, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")];
}
function tex(c, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

// Soft radial falloff, used for light spill on floors and haze.
let _radial;
export function radialTex() {
  if (_radial) return _radial;
  const [c, g] = canvas(256);
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (let i = 0; i <= 10; i++) {
    const x = i / 10;
    grd.addColorStop(x, `rgba(255,255,255,${Math.pow(1 - x, 2.2).toFixed(4)})`);
  }
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  return (_radial = tex(c, false));
}
// Soft rectangle falloff (for strips).
let _rect;
export function rectTex() {
  if (_rect) return _rect;
  const [c, g] = canvas(256);
  const img = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const dx = Math.max(0, Math.abs(x - 127.5) / 128 - 0.0);
      const dy = Math.max(0, Math.abs(y - 127.5) / 128 - 0.0);
      const a = Math.pow(Math.max(0, 1 - dx), 2) * Math.pow(Math.max(0, 1 - dy), 2.2);
      const i = (y * 256 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = a * 255;
    }
  g.putImageData(img, 0, 0);
  return (_rect = tex(c, false));
}

// Line icons on a 24-unit grid (stroke 2, round caps), drawn white.
const P = {
  doc: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "M8.8 12.2l2.3 2.3 4.3-4.6"],
  shieldLock: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "M9.4 11.6h5.2v4.2H9.4z", "M10.4 11.6V10a1.6 1.6 0 0 1 3.2 0v1.6"],
  lock: ["M7 11h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z", "M8 11V7a4 4 0 0 1 8 0v4", "M12 15.2v2.4"],
  pulse: ["M2.5 12h4.2l2.8-7 4.6 14 2.9-7h4.5"],
  gauge: ["M4.2 17.5a9 9 0 1 1 15.6 0", "M12 14.5l3.6-4.6", "M13.3 14.5a1.3 1.3 0 1 1-2.6 0a1.3 1.3 0 1 1 2.6 0"],
  refresh: ["M20.5 12a8.5 8.5 0 0 1-14.6 5.9", "M3.5 12a8.5 8.5 0 0 1 14.6-5.9", "M18.5 2.5v4h-4", "M5.5 21.5v-4h4"],
  code: ["M16 17.5l5.5-5.5L16 6.5", "M8 6.5L2.5 12 8 17.5", "M14 4l-4 16"],
  terminal: ["M4 17l6-6-6-6", "M12 19h8"],
  check: ["M20 6.5L9.2 17.3 4 12.1"],
  checkCircle: ["M22 12a10 10 0 1 1-20 0a10 10 0 1 1 20 0", "M7.6 12.3l3 3 5.8-6.4"],
  database: [
    "M4 5.5c0-1.9 3.6-3.5 8-3.5s8 1.6 8 3.5-3.6 3.5-8 3.5-8-1.6-8-3.5z",
    "M4 5.5v13c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5v-13",
    "M4 12c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5",
  ],
  cpu: ["M6 6h12v12H6z", "M10 10h4v4h-4z", "M9.5 2v4M14.5 2v4M9.5 18v4M14.5 18v4M2 9.5h4M2 14.5h4M18 9.5h4M18 14.5h4"],
  users: ["M15 7a3 3 0 1 1-6 0a3 3 0 1 1 6 0", "M5.5 21v-1.2a4.3 4.3 0 0 1 4.3-4.3h4.4a4.3 4.3 0 0 1 4.3 4.3V21"],
  eye: ["M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z", "M15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0"],
  ledger: ["M5 3h14v18H5z", "M8 7h8", "M8 11h8", "M8 15h5"],
};
const FILLED = {
  chart: ["M4 14h3.6v6H4z", "M10.2 9h3.6v11h-3.6z", "M16.4 4h3.6v16h-3.6z"],
  pause: ["M6.5 4.5h3.8v15H6.5z", "M13.7 4.5h3.8v15h-3.8z"],
};
function gearPath() {
  const teeth = 8,
    ro = 10.2,
    ri = 7.6;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const w = (Math.PI * 2) / teeth;
    const pts = [
      [a0 - w * 0.5, ri],
      [a0 - w * 0.2, ri],
      [a0 - w * 0.13, ro],
      [a0 + w * 0.13, ro],
      [a0 + w * 0.2, ri],
    ];
    for (const [a, r] of pts) d += `${d ? "L" : "M"}${(12 + Math.cos(a) * r).toFixed(3)} ${(12 + Math.sin(a) * r).toFixed(3)}`;
  }
  return [d + "z", "M15.2 12a3.2 3.2 0 1 1-6.4 0a3.2 3.2 0 1 1 6.4 0"];
}
P.gear = gearPath();

const _icons = {};
export function iconTex(name, size = 512) {
  const key = name + size;
  if (_icons[key]) return _icons[key];
  const [c, g] = canvas(size);
  g.scale(size / 24, size / 24);
  g.strokeStyle = "#fff";
  g.fillStyle = "#fff";
  g.lineWidth = 1.9;
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const d of P[name] || []) g.stroke(new Path2D(d));
  for (const d of FILLED[name] || []) {
    const p = new Path2D(d);
    g.fill(p);
  }
  return (_icons[key] = tex(c, false));
}

const _labels = {};
export function labelTex(text, o = {}) {
  const key = text + JSON.stringify(o);
  if (_labels[key]) return _labels[key];
  const h = o.h ?? 128;
  const font = `${o.weight ?? 600} ${Math.round(h * 0.62)}px Inter`;
  const [m, mg] = canvas(8);
  mg.font = font;
  const sp = (o.spacing ?? 0.12) * h * 0.62;
  let w = 0;
  for (const ch of text) w += mg.measureText(ch).width + sp;
  w = Math.ceil(w - sp + h * 0.4);
  const [c, g] = canvas(w, h);
  g.font = font;
  g.fillStyle = "#fff";
  g.textBaseline = "middle";
  let x = h * 0.2;
  for (const ch of text) {
    g.fillText(ch, x, h * 0.53);
    x += g.measureText(ch).width + sp;
  }
  const t = tex(c, false);
  t.userData = { aspect: w / h };
  return (_labels[key] = t);
}

// Procedural circuit artwork for the core's internal layers.
const _circ = {};
export function circuitTex(seed = 7, size = 2048) {
  const key = seed + "_" + size;
  if (_circ[key]) return _circ[key];
  const [c, g] = canvas(size);
  g.fillStyle = "#000";
  g.fillRect(0, 0, size, size);
  const R = rng(seed);
  const N = 96;
  const cell = size / N;
  const dirs = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];
  g.strokeStyle = "#fff";
  g.fillStyle = "#fff";
  g.lineCap = "round";
  g.lineJoin = "round";
  // chips
  for (let i = 0; i < 16; i++) {
    const w = (4 + Math.floor(R() * 9)) * cell,
      h = (4 + Math.floor(R() * 9)) * cell;
    const x = Math.floor(R() * (N - 16) + 6) * cell,
      y = Math.floor(R() * (N - 16) + 6) * cell;
    g.globalAlpha = 0.55;
    g.lineWidth = size / 512;
    g.strokeRect(x, y, w, h);
    g.globalAlpha = 0.18;
    g.fillRect(x + cell * 0.5, y + cell * 0.5, w - cell, h - cell);
  }
  g.globalAlpha = 1;
  // traces
  for (let i = 0; i < 900; i++) {
    let x = Math.floor(R() * N),
      y = Math.floor(R() * N);
    let d = Math.floor(R() * 4);
    const len = 4 + Math.floor(R() * 16);
    g.lineWidth = (size / 2048) * (R() < 0.2 ? 4.2 : 2.4);
    g.globalAlpha = 0.55 + R() * 0.45;
    g.beginPath();
    g.moveTo((x + 0.5) * cell, (y + 0.5) * cell);
    for (let s = 0; s < len; s++) {
      if (R() < 0.22) d = R() < 0.5 ? (d + 4 < 8 ? d + 4 : d) : Math.floor(R() * 4);
      x = clamp(x + dirs[d][0], 0, N - 1);
      y = clamp(y + dirs[d][1], 0, N - 1);
      g.lineTo((x + 0.5) * cell, (y + 0.5) * cell);
    }
    g.stroke();
    g.beginPath();
    g.arc((x + 0.5) * cell, (y + 0.5) * cell, cell * 0.22, 0, Math.PI * 2);
    g.fill();
  }
  // via grid
  g.globalAlpha = 0.35;
  for (let i = 0; i < 1500; i++) {
    const x = Math.floor(R() * N),
      y = Math.floor(R() * N);
    g.fillRect((x + 0.4) * cell, (y + 0.4) * cell, cell * 0.2, cell * 0.2);
  }
  return (_circ[key] = tex(c, false));
}

// ---------------------------------------------------------------- shaders
// Circuit layer: traces light up from the centre outwards, with a pulse ring.
export function circuitMaterial(seed = 7) {
  return new THREE.ShaderMaterial({
    uniforms: {
      tMask: { value: circuitTex(seed) },
      energy: { value: 0 },
      ring: { value: -1 },
      ringK: { value: 3 },
      glow: { value: hdr(C.emeraldHi, 2.2) },
      dim: { value: hdr(0x2a5a44, 0.12) },
      base: { value: new THREE.Color(0.006, 0.008, 0.008) },
      level: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tMask; uniform float energy; uniform float ring; uniform float ringK;
      uniform vec3 glow; uniform vec3 dim; uniform vec3 base; uniform float level;
      varying vec2 vUv;
      void main() {
        float m = texture2D(tMask, vUv).r;
        float d = length(vUv - 0.5) * 2.0;
        float lit = smoothstep(energy + 0.02, energy - 0.22, d);
        float rg = exp(-pow((d - ring) / 0.05, 2.0));
        vec3 c = base + m * (dim + glow * (lit * 0.9 + rg * ringK)) * level;
        gl_FragColor = vec4(c, 1.0);
      }`,
    side: THREE.DoubleSide,
  });
}

// Additive volumetric beam (open cone), brightest along the axis.
export function beamMaterial(color = 0xffffff, k = 0.6) {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: hdr(color, k) }, alpha: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        vY = uv.y;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color; uniform float alpha;
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        float f = abs(dot(normalize(vN), normalize(vV)));
        float core = pow(f, 2.5);
        float along = smoothstep(0.0, 0.35, vY) * smoothstep(1.0, 0.85, vY);
        gl_FragColor = vec4(color * core * along * alpha, 1.0);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

// Thin luminous scanning plane: gaussian line plus a soft trailing wash.
export function scanMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: hdr(0xeafff2, 4) }, alpha: { value: 1 }, trail: { value: 0.18 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color; uniform float alpha; uniform float trail; varying vec2 vUv;
      void main() {
        float y = vUv.y - 0.5;
        float line = exp(-pow(y / 0.006, 2.0));
        float wash = y < 0.0 ? exp(y / 0.18) * trail : 0.0;
        float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
        gl_FragColor = vec4(color * (line + wash) * edge * alpha, 1.0);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

// ------------------------------------------------------------------ pieces
const geo = {};
const rbox = (w, h, d, r = 0.04, s = 4) => {
  const k = [w, h, d, r, s].join("_");
  return geo[k] || (geo[k] = new RoundedBoxGeometry(w, h, d, s, r));
};
export { rbox };

// Floor glow decal (additive light spill).
export function spill(w, d, color = C.emeraldHi, k = 0.6, shape = "rect") {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({
      color: hdr(color, k),
      map: shape === "rect" ? rectTex() : radialTex(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  return m;
}

// Soft contact shadow (darkens what is underneath).
export function contact(w, d, k = 0.75, shape = "rect") {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: shape === "rect" ? rectTex() : radialTex(), transparent: true, opacity: k, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.0015;
  m.renderOrder = 1;
  return m;
}

// Glass tile with an icon, as in the references. Returns group with
// .set({ glow, iconGlow, iconColor }).
export function tile(icon, o = {}) {
  const g = new THREE.Group();
  const w = o.w ?? 1,
    h = o.h ?? 1,
    d = o.d ?? 0.2;
  const body = new THREE.Mesh(
    rbox(w, h, d, Math.min(w, h) * 0.09, 5),
    o.material || glass({ roughness: o.roughness ?? 0.3, thickness: d * 1.6, glow: o.bodyGlow ?? 0.9, glowY0: -h / 2, glowY1: h / 2, glowPow: 2.6, milk: o.milk ?? 0.015, rim: 0.3 })
  );
  body.castShadow = true;
  g.add(body);
  const iconMat = new THREE.MeshBasicMaterial({
    map: iconTex(icon),
    color: hdr(o.iconColor ?? C.emeraldHi, o.iconGlow ?? 2.4),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const ic = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.56, w * 0.56), iconMat);
  ic.position.z = d / 2 + 0.003;
  ic.renderOrder = 3;
  g.add(ic);
  // inner bottom glow strip seen through the glass
  const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.02, d * 0.5), emissive(C.emeraldHi, o.glow ?? 4));
  strip.position.y = -h / 2 + 0.03;
  g.add(strip);
  g.userData = { body, icon: ic, strip };
  const bu = body.material.userData.u;
  g.set = (s = {}) => {
    if (s.iconGlow !== undefined) iconMat.color.copy(hdr(s.iconColor ?? o.iconColor ?? C.emeraldHi, s.iconGlow));
    if (s.glow !== undefined) {
      strip.material.color.copy(hdr(s.color ?? C.emeraldHi, s.glow));
      if (bu) bu.glowColor.value.copy(hdr(s.color ?? C.emeraldHi, (o.bodyGlow ?? 0.9) * (s.glow / (o.glow ?? 4))));
    }
    if (s.icon) iconMat.map = iconTex(s.icon);
  };
  return g;
}

// Obsidian pedestal block with emerald underglow, sized for a tile.
export function base(o = {}) {
  const g = new THREE.Group();
  const w = o.w ?? 1.5,
    h = o.h ?? 0.32,
    d = o.d ?? 1.1;
  const b = new THREE.Mesh(rbox(w, h, d, 0.07, 4), o.material || obsidian());
  b.position.y = h / 2;
  b.castShadow = true;
  b.receiveShadow = true;
  g.add(b);
  const glowMat = emissive(o.color ?? C.emeraldHi, o.glow ?? 3);
  // slot glow on top, where the tile stands
  const slot = new THREE.Mesh(new THREE.BoxGeometry(w * 0.74, 0.012, 0.26), glowMat);
  slot.position.y = h + 0.004;
  g.add(slot);
  // thin seam line around the bottom
  const seam = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.012, d * 0.96), emissive(o.color ?? C.emeraldHi, (o.glow ?? 3) * 0.5));
  seam.position.y = 0.02;
  g.add(seam);
  g.add(contact(w * 1.35, d * 1.45, 0.85));
  const sp = spill(w * 2.2, d * 2.2, o.color ?? C.emeraldHi, o.spill ?? 0.35);
  sp.position.y = 0.002;
  g.add(sp);
  g.userData = { top: h, slot, seam, spill: sp };
  g.set = (s = {}) => {
    const k = s.glow ?? o.glow ?? 3;
    const col = s.color ?? o.color ?? C.emeraldHi;
    slot.material.color.copy(hdr(col, k));
    seam.material.color.copy(hdr(col, k * 0.5));
    sp.material.color.copy(hdr(col, (s.spill ?? o.spill ?? 0.35) * (k / (o.glow ?? 3))));
  };
  return g;
}

// Tile standing on its base.
export function module(icon, o = {}) {
  const g = new THREE.Group();
  const b = base(o.base || {});
  g.add(b);
  const t = tile(icon, o.tile || {});
  t.position.y = b.userData.top + (o.tile?.h ?? 1) / 2 + 0.01;
  g.add(t);
  g.userData = { base: b, tile: t };
  g.set = (s = {}) => {
    b.set(s);
    t.set(s);
  };
  return g;
}

// Glass conduit between two points (rectangular channel, as in the refs)
// with an inner filament and travelling signal packets.
export function conduit(a, b, o = {}) {
  const g = new THREE.Group();
  const A = new THREE.Vector3(...a),
    B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const w = o.w ?? 0.22,
    h = o.h ?? 0.14;
  const body = new THREE.Mesh(rbox(w, h, len, Math.min(w, h) * 0.25, 3), o.material || glass({ roughness: 0.18, thickness: 0.2, rim: o.rim ?? 0.08, env: 0.6 }));
  g.add(body);
  const fil = new THREE.Mesh(new THREE.BoxGeometry(w * 0.18, h * 0.18, len * 0.98), emissive(o.color ?? C.emeraldHi, o.glow ?? 1.6));
  g.add(fil);
  const n = o.packets ?? 3;
  const packets = [];
  const pm = emissive(o.color ?? C.emeraldHi, o.packetGlow ?? 6);
  for (let i = 0; i < n; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w * 0.34, h * 0.34, o.packetLen ?? 0.22), pm);
    g.add(p);
    packets.push(p);
  }
  g.position.copy(A).add(B).multiplyScalar(0.5);
  g.lookAt(B);
  g.userData = { len, body, fil, packets, pm };
  g.set = (s = {}) => {
    const col = s.color ?? o.color ?? C.emeraldHi;
    if (s.glow !== undefined) fil.material.color.copy(hdr(col, s.glow));
    if (s.packetGlow !== undefined) pm.color.copy(hdr(col, s.packetGlow));
    if (s.phase !== undefined) {
      packets.forEach((p, i) => {
        const u = (((s.phase + i / n) % 1) + 1) % 1;
        p.position.z = (u - 0.5) * len;
        p.visible = s.packetsVisible ?? true;
      });
    }
  };
  g.set({ phase: 0 });
  return g;
}

// Black gate arch with an emerald-lit opening and an engraved label.
export function gate(label, o = {}) {
  const g = new THREE.Group();
  const W = o.W ?? 2.4,
    H = o.H ?? 2.3,
    w = o.w ?? 1.55,
    h = o.h ?? 1.62,
    r = 0.32,
    depth = o.depth ?? 1.0;
  const s = new THREE.Shape();
  s.moveTo(-W / 2, 0);
  s.lineTo(-W / 2, H - r);
  s.quadraticCurveTo(-W / 2, H, -W / 2 + r, H);
  s.lineTo(W / 2 - r, H);
  s.quadraticCurveTo(W / 2, H, W / 2, H - r);
  s.lineTo(W / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, h - 0.1);
  s.quadraticCurveTo(w / 2, h, w / 2 - 0.1, h);
  s.lineTo(-w / 2 + 0.1, h);
  s.quadraticCurveTo(-w / 2, h, -w / 2, h - 0.1);
  s.lineTo(-w / 2, 0);
  s.closePath();
  const eg = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 3, curveSegments: 10 });
  eg.translate(0, 0, -depth / 2);
  const arch = new THREE.Mesh(eg, obsidian({ roughness: 0.46, clearcoat: 0.22, clearcoatRoughness: 0.3, color: 0x070707 }));
  arch.castShadow = true;
  arch.receiveShadow = true;
  g.add(arch);
  const glowMat = emissive(C.emeraldHi, o.glow ?? 5);
  const side = (x) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, h - 0.12, depth * 0.94), glowMat);
    m.position.set(x, (h - 0.12) / 2, 0);
    return m;
  };
  g.add(side(-w / 2 + 0.012), side(w / 2 - 0.012));
  const top = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, 0.03, depth * 0.94), glowMat);
  top.position.set(0, h - 0.012, 0);
  g.add(top);
  // inner wash
  const wash = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.98, h),
    new THREE.MeshBasicMaterial({ color: hdr(C.emeraldHi, 0.25), map: rectTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })
  );
  wash.position.set(0, h / 2, 0);
  g.add(wash);
  let labelMesh = null;
  if (label) {
    const lt = labelTex(label, { weight: 600, spacing: 0.08 });
    const lh = 0.2;
    labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(lh * lt.userData.aspect, lh),
      new THREE.MeshBasicMaterial({ map: lt, color: hdr(0xf2f2ee, 0.9), transparent: true, depthWrite: false, toneMapped: false })
    );
    labelMesh.position.set(0, h + (H - h) * 0.56, depth / 2 + 0.04);
    g.add(labelMesh);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(lh * lt.userData.aspect * 0.85, 0.022, 0.01), glowMat);
    bar.position.set(0, h + (H - h) * 0.22, depth / 2 + 0.04);
    g.add(bar);
  }
  g.add(contact(W * 1.25, depth * 1.6, 0.8));
  const sp = spill(W * 1.4, depth * 3.2, C.emeraldHi, 0.45);
  sp.position.y = 0.003;
  g.add(sp);
  g.userData = { glowMat, wash, label: labelMesh, spill: sp, W, H, depth };
  g.set = (st = {}) => {
    const col = st.color ?? C.emeraldHi;
    if (st.glow !== undefined) {
      glowMat.color.copy(hdr(col, st.glow));
      wash.material.color.copy(hdr(col, st.glow * 0.05));
      sp.material.color.copy(hdr(col, st.glow * 0.09));
    }
  };
  return g;
}

// Thin glass boundary wall with a lit top edge.
export function wall(len, o = {}) {
  const g = new THREE.Group();
  const H = o.H ?? 1.4,
    t = o.t ?? 0.06;
  const p = new THREE.Mesh(rbox(len, H, t, 0.02, 2), o.material || glass({ roughness: 0.08, thickness: 0.08, tint: 0xd8ffe8, attenuation: 1.2 }));
  p.position.y = H / 2;
  g.add(p);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(len, 0.018, t * 1.2), emissive(o.color ?? C.emeraldHi, o.glow ?? 4));
  edge.position.y = H + 0.004;
  g.add(edge);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, t * 2.2), obsidian());
  foot.position.y = 0.025;
  g.add(foot);
  g.userData = { panel: p, edge };
  g.set = (s = {}) => {
    if (s.glow !== undefined) edge.material.color.copy(hdr(s.color ?? o.color ?? C.emeraldHi, s.glow));
  };
  return g;
}

// Amber-red risk marker: floor ring + vertical hairline + beacon.
export function marker(o = {}) {
  const g = new THREE.Group();
  const col = o.color ?? C.amber;
  const ringMat = emissive(col, 3, { transparent: true, additive: true });
  const ring = new THREE.Mesh(new THREE.RingGeometry(o.r ?? 0.42, (o.r ?? 0.42) + 0.025, 64), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  g.add(ring);
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(1, 1.012, 96), emissive(col, 2, { transparent: true, additive: true }));
  ring2.rotation.x = -Math.PI / 2;
  ring2.position.y = 0.012;
  g.add(ring2);
  const sp = spill(1.8, 1.8, col, 0.5, "radial");
  sp.position.y = 0.005;
  g.add(sp);
  const lineMat = emissive(col, 2.5, { transparent: true, additive: true });
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.008, 1, 0.008), lineMat);
  g.add(line);
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), emissive(col, 8));
  g.add(bead);
  const lh = o.lineH ?? 1.2;
  g.set = (s = {}) => {
    const a = s.a ?? 1;
    const p = s.pulse ?? 0;
    ringMat.color.copy(hdr(col, 3.5 * a));
    ring2.scale.setScalar(0.45 + p * 0.9);
    ring2.material.color.copy(hdr(col, 2.2 * a * (1 - p)));
    sp.material.color.copy(hdr(col, 0.55 * a));
    line.scale.y = lh * (s.grow ?? 1);
    line.position.y = (lh * (s.grow ?? 1)) / 2;
    line.material.color.copy(hdr(col, 2.2 * a));
    bead.position.y = lh * (s.grow ?? 1);
    bead.material.color.copy(hdr(col, 9 * a));
    g.visible = a > 0.001;
  };
  g.set({ a: 1 });
  return g;
}

// The AI core: frosted glass cube holding three stacked circuit layers,
// a bright die and light pillars, on an obsidian ring pedestal.
export function core(o = {}) {
  const g = new THREE.Group();
  const S = o.size ?? 1.2;
  const ped = new THREE.Group();
  const pedH = o.pedH ?? 0.42;
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(S * 0.95, S * 1.0, pedH, 96, 1), obsidian({ roughness: 0.28 }));
  cyl.position.y = pedH / 2;
  cyl.castShadow = true;
  cyl.receiveShadow = true;
  ped.add(cyl);
  const ringMat = emissive(C.emeraldHi, 4);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(S * 0.82, 0.018, 12, 128), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = pedH + 0.004;
  ped.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(S * 0.975, 0.008, 8, 128), emissive(C.emeraldHi, 1.5));
  ring2.rotation.x = Math.PI / 2;
  ring2.position.y = pedH * 0.12;
  ped.add(ring2);
  ped.add(contact(S * 2.9, S * 2.9, 0.9, "radial"));
  const pedSpill = spill(S * 4.2, S * 4.2, C.emeraldHi, 0.28, "radial");
  pedSpill.position.y = 0.003;
  ped.add(pedSpill);
  g.add(ped);

  const cube = new THREE.Group();
  cube.position.y = pedH + S / 2 + (o.float ?? 0.12);
  const shell = new THREE.Mesh(rbox(S, S, S, S * 0.07, 6), glass({ roughness: o.roughness ?? 0.1, thickness: S * 0.5, attenuation: 3.5, tint: 0xf0fff6, env: 1.2 }));
  shell.castShadow = true;
  cube.add(shell);
  const layers = [];
  for (let i = 0; i < 3; i++) {
    const m = circuitMaterial(11 + i * 7);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(S * 0.72, S * 0.72), m);
    pl.rotation.x = -Math.PI / 2;
    pl.position.y = (i - 1) * S * 0.24;
    cube.add(pl);
    layers.push(pl);
  }
  // vertical light pillars between layers
  const pillarMat = emissive(C.emeraldHi, 2.5);
  const pillars = [];
  for (const [x, z] of [
    [-0.24, -0.24],
    [0.24, -0.24],
    [-0.24, 0.24],
    [0.24, 0.24],
  ]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.012, S * 0.48, 0.012), pillarMat);
    p.position.set(x * S, 0, z * S);
    cube.add(p);
    pillars.push(p);
  }
  const dieMat = emissive(0xd8ffe9, 6);
  const die = new THREE.Mesh(rbox(S * 0.16, S * 0.05, S * 0.16, 0.01, 2), dieMat);
  cube.add(die);
  g.add(cube);
  g.userData = { cube, shell, layers, pillars, die, ring, ringMat, ped, pedSpill, pedH, S };
  g.set = (s = {}) => {
    const e = s.energy ?? 1;
    for (const [i, l] of layers.entries()) {
      l.material.uniforms.energy.value = e * 1.6 - i * 0.08;
      l.material.uniforms.ring.value = s.ring ?? -1;
      l.material.uniforms.level.value = s.level ?? 1;
    }
    pillarMat.color.copy(hdr(C.emeraldHi, 2.5 * clamp(e * 1.4 - 0.2)));
    dieMat.color.copy(hdr(0xd8ffe9, 6 * Math.pow(clamp(e), 3) * (s.dieK ?? 1)));
    ringMat.color.copy(hdr(C.emeraldHi, (s.pedGlow ?? 4) * clamp(e * 1.5)));
    ring2.material.color.copy(hdr(C.emeraldHi, 1.5 * clamp(e * 1.5)));
    pedSpill.material.color.copy(hdr(C.emeraldHi, 0.28 * clamp(e * 1.5) * (s.spill ?? 1)));
  };
  g.set({ energy: 1 });
  return g;
}

// Evidence ledger: a transparent rack of glass record plates.
export function ledger(o = {}) {
  const g = new THREE.Group();
  const n = o.n ?? 12;
  const gap = o.gap ?? 0.09;
  const w = o.w ?? 1.1,
    d = o.d ?? 0.8;
  const H = n * gap + 0.12;
  const postMat = obsidian({ roughness: 0.3 });
  for (const [x, z] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.035, H, 0.035), postMat);
    p.position.set((x * (w + 0.08)) / 2, H / 2, (z * (d + 0.08)) / 2);
    g.add(p);
  }
  g.add(contact(w + 0.9, d + 0.9, 0.8));
  const plinth = new THREE.Mesh(rbox(w + 0.3, 0.12, d + 0.3, 0.03, 3), obsidian());
  plinth.position.y = 0.06;
  plinth.receiveShadow = true;
  g.add(plinth);
  const plates = [];
  const plateGeo = rbox(w, 0.028, d, 0.012, 2);
  for (let i = 0; i < n; i++) {
    const pg = new THREE.Group();
    const m = new THREE.Mesh(plateGeo, glass({ roughness: 0.18, thickness: 0.05 }));
    pg.add(m);
    const em = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 0.006, 0.014), emissive(C.emeraldHi, 0));
    em.position.set(0, 0, d / 2 - 0.02);
    pg.add(em);
    const em2 = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.006, d * 0.9), em.material);
    em2.position.set(-w / 2 + 0.02, 0, 0);
    pg.add(em2);
    pg.position.y = 0.16 + i * gap;
    g.add(pg);
    plates.push({ g: pg, em });
  }
  g.userData = { plates, H, gap, w, d };
  // s.written: number of plates written (fractional = the one sliding in)
  g.set = (s = {}) => {
    const wr = s.written ?? n;
    plates.forEach((p, i) => {
      const k = clamp(wr - i);
      p.g.visible = k > 0;
      p.g.position.x = (1 - k) * (o.slideFrom ?? 1.6);
      const flash = i < (s.flashFrom ?? 0) ? 0 : k > 0 && k < 1 ? 1 : Math.max(0, 1 - (wr - i - 1) * 1.6);
      p.em.material.color.copy(hdr(C.emeraldHi, 1.2 + (s.flash ?? 1) * 5 * flash));
    });
  };
  return g;
}

// Floor plane: matte (diffuse only) so low rim lights never smear a sheen
// across it; gloss comes from the planar reflector in the hero shots.
export function floor(o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(o.size ?? 200, o.size ?? 200), new THREE.MeshLambertMaterial({ color: o.color ?? 0x0b0c0d }));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

// Track segment (conveyor rail) like the references, with chevrons.
export function track(len, o = {}) {
  const g = new THREE.Group();
  const w = o.w ?? 1.3;
  const rail = new THREE.Mesh(rbox(w, 0.16, len, 0.03, 3), o.white ? obsidian({ color: 0xd9d9d6, roughness: 0.3 }) : obsidian({ roughness: 0.3 }));
  rail.position.y = 0.08;
  rail.receiveShadow = true;
  rail.castShadow = true;
  g.add(rail);
  const em = emissive(C.emeraldHi, o.glow ?? 3);
  for (const x of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, len), em);
    e.position.set((x * w) / 2, 0.06, 0);
    g.add(e);
  }
  const chev = [];
  if (o.chevrons !== false) {
    const ct = labelTex(">", { weight: 600, h: 128, spacing: 0 });
    const cm = new THREE.MeshBasicMaterial({ map: ct, color: hdr(C.emeraldHi, 3), transparent: true, depthWrite: false, toneMapped: false });
    for (let z = -len / 2 + 0.8; z < len / 2; z += o.chevronGap ?? 1.6) {
      const c = new THREE.Mesh(new THREE.PlaneGeometry(0.22 * ct.userData.aspect, 0.22), cm);
      c.rotation.x = -Math.PI / 2;
      c.rotation.z = -Math.PI / 2;
      c.position.set(w * 0.32, 0.162, z);
      g.add(c);
      chev.push(c);
    }
  }
  const sp = spill(w * 2, len * 1.05, C.emeraldHi, 0.18);
  sp.position.y = 0.003;
  g.add(sp);
  g.userData = { em, chev };
  return g;
}

// Abstract interface artwork for floating glass panels: no words, only
// structure (rules, bars, a trace and node dots), so nothing reads as gibberish.
const _ui = {};
export function uiTex(seed = 3, w = 768, h = 512) {
  const key = seed + "_" + w;
  if (_ui[key]) return _ui[key];
  const [c, g] = canvas(w, h);
  const R = rng(seed);
  g.clearRect(0, 0, w, h);
  g.strokeStyle = "#fff";
  g.fillStyle = "#fff";
  g.lineCap = "round";
  // frame corners
  g.globalAlpha = 0.9;
  g.lineWidth = 3;
  const m = 18,
    L = 46;
  for (const [x, y, sx, sy] of [
    [m, m, 1, 1],
    [w - m, m, -1, 1],
    [m, h - m, 1, -1],
    [w - m, h - m, -1, -1],
  ]) {
    g.beginPath();
    g.moveTo(x, y + sy * L);
    g.lineTo(x, y);
    g.lineTo(x + sx * L, y);
    g.stroke();
  }
  // header rules
  g.globalAlpha = 0.55;
  g.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const y = 70 + i * 22;
    g.beginPath();
    g.moveTo(60, y);
    g.lineTo(60 + (0.25 + R() * 0.35) * w, y);
    g.stroke();
  }
  // trace
  g.globalAlpha = 1;
  g.lineWidth = 4;
  g.beginPath();
  let y = h * 0.62;
  for (let x = 60; x <= w - 60; x += 24) {
    y = Math.max(h * 0.42, Math.min(h * 0.78, y + (R() - 0.5) * 46));
    x === 60 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.stroke();
  // bars
  g.globalAlpha = 0.75;
  for (let i = 0; i < 9; i++) {
    const bh = 20 + R() * 70;
    g.fillRect(w * 0.58 + i * 26, h * 0.32 - bh, 12, bh);
  }
  // node dots
  g.globalAlpha = 0.9;
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.arc(70 + i * 34, h - 60, i === 2 ? 9 : 6, 0, Math.PI * 2);
    i === 2 ? g.fill() : g.stroke();
  }
  return (_ui[key] = tex(c, false));
}

// Floating glass interface panel.
export function panel(o = {}) {
  const g = new THREE.Group();
  const w = o.w ?? 1.1,
    h = o.h ?? 0.72;
  const sheet = new THREE.Mesh(rbox(w, h, 0.025, 0.012, 2), o.material || glass({ roughness: 0.03, thickness: 0.03, attenuation: 6, clearcoat: 1, rim: 0.1, env: 0.7 }));
  g.add(sheet);
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.96, h * 0.96),
    new THREE.MeshBasicMaterial({ map: uiTex(o.seed ?? 3), color: hdr(o.color ?? C.emeraldHi, o.glow ?? 1.4), transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })
  );
  art.position.z = 0.016;
  art.renderOrder = 4;
  g.add(art);
  g.userData = { art, sheet };
  g.set = (s = {}) => {
    if (s.glow !== undefined) art.material.color.copy(hdr(s.color ?? o.color ?? C.emeraldHi, s.glow));
    if (s.opacity !== undefined) art.material.opacity = s.opacity;
  };
  return g;
}

// Blurred planar reflection laid over the floor (additive), for hero shots:
// the glowing core, modules and gates reflect in the black studio floor.
const ReflectShader = {
  name: "QReflect",
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    strength: { value: 0.35 },
    blur: { value: 0.012 },
    fadeDist: { value: 14 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv; varying vec3 vW;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vec4 w = modelMatrix * vec4(position, 1.0);
      vW = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float strength; uniform float blur; uniform float fadeDist;
    varying vec4 vUv; varying vec3 vW;
    void main() {
      vec2 uv = vUv.xy / vUv.w;
      vec3 c = vec3(0.0); float tw = 0.0;
      for (int i = 0; i < 16; i++) {
        float a = float(i) * 2.39996;
        float r = sqrt((float(i) + 0.5) / 16.0);
        float w = 1.0 - r * 0.6;
        c += texture2D(tDiffuse, uv + vec2(cos(a), sin(a)) * r * blur).rgb * w;
        tw += w;
      }
      c /= tw;
      vec3 V = normalize(cameraPosition - vW);
      float fres = 0.35 + 0.65 * pow(1.0 - abs(V.y), 3.0);
      float fade = 1.0 - smoothstep(fadeDist * 0.5, fadeDist, length(vW.xz));
      gl_FragColor = vec4(min(c, vec3(20.0)) * strength * fres * fade, 1.0);
    }`,
};
export function reflector(W, H, o = {}) {
  const r = new Reflector(new THREE.PlaneGeometry(o.size ?? 40, o.size ?? 40), {
    textureWidth: Math.round(W * (o.res ?? 0.5)),
    textureHeight: Math.round(H * (o.res ?? 0.5)),
    clipBias: 0.002,
    shader: ReflectShader,
    multisample: 0,
  });
  r.material.transparent = true;
  r.material.blending = THREE.AdditiveBlending;
  r.material.depthWrite = false;
  r.material.uniforms.strength.value = o.strength ?? 0.35;
  r.material.uniforms.blur.value = o.blur ?? 0.012;
  r.material.uniforms.fadeDist.value = o.fade ?? 14;
  r.rotation.x = -Math.PI / 2;
  r.position.y = 0.0008;
  r.renderOrder = 0;
  return r;
}
