// Small deterministic helpers. Every animated value in the film is a pure
// function of time, so any frame can be rendered on its own.

import * as THREE from "three";

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
export const smooth = (a, b, x) => {
  const t = invLerp(a, b, x);
  return t * t * (3 - 2 * t);
};
export const smoother = (a, b, x) => {
  const t = invLerp(a, b, x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
// Easing on 0..1
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t) => t * t * t;
export const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
// Mechanical settle: fast approach, tiny damped overshoot, rests exactly at 1.
export const settle = (t, overshoot = 0.035) => {
  t = clamp(t);
  if (t >= 1) return 1;
  const e = 1 - Math.pow(1 - t, 4);
  return e + overshoot * Math.sin(t * Math.PI * 2.2) * (1 - t) * Math.min(1, t * 6);
};

// Window helper: 0 before a, 1 after b, eased in between.
export const win = (a, b, x, ease = easeInOutCubic) => ease(invLerp(a, b, x));
// Pulse: rises over [a, a+up], falls over [a+up, a+up+down].
export const pulse = (x, a, up, down) => {
  if (x < a) return 0;
  if (x < a + up) return smooth(a, a + up, x);
  return 1 - smooth(a + up, a + up + down, x);
};

// Seeded RNG (mulberry32)
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// Camera rig: position and target along Catmull-Rom curves, eased parameter.
export function rig(posPts, tgtPts, opts = {}) {
  const pc = new THREE.CatmullRomCurve3(posPts.map((p) => v3(...p)), false, "centripetal");
  const tc = new THREE.CatmullRomCurve3(tgtPts.map((p) => v3(...p)), false, "centripetal");
  const ease = opts.ease || easeInOutCubic;
  return (camera, u) => {
    const k = clamp(ease(clamp(u)));
    camera.position.copy(pc.getPoint(k));
    camera.lookAt(tc.getPoint(k));
    if (opts.roll) camera.rotateZ(opts.roll(k));
  };
}

// Brand palette (linear values derived in materials)
export const C = {
  obsidian: 0x0a0a0a,
  graphite: 0x14171a,
  emerald: 0x0b8a54,
  emeraldHi: 0x00c853,
  white: 0xf7f7f5,
  amber: 0xff5a1f,
};
