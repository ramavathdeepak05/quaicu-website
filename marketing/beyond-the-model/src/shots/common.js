// Shared stage setup for the shots: scene, camera, environment, floor, fog
// and the standard light rig (overhead key with soft shadows, cool rims).

import * as THREE from "three";
import { floor } from "../kit.js";

export function stage(ctx, o = {}) {
  const scene = new THREE.Scene();
  const bg = new THREE.Color(o.bg ?? 0x050606);
  scene.background = bg;
  scene.environment = o.env === "light" ? ctx.envs.light : ctx.envs.dark;
  scene.environmentIntensity = o.envIntensity ?? 1;
  if (o.fog !== false) scene.fog = new THREE.FogExp2(o.fogColor ?? bg.getHex(), o.fogDensity ?? 0.035);
  const camera = new THREE.PerspectiveCamera(o.fov ?? 32, ctx.aspect, o.near ?? 0.05, o.far ?? 160);
  let fl = null;
  if (o.floor !== false) {
    fl = floor(o.floorOpts || {});
    scene.add(fl);
  }
  return { scene, camera, floor: fl };
}

export function keyLight(scene, o = {}) {
  const s = new THREE.SpotLight(o.color ?? 0xffffff, o.intensity ?? 260, o.distance ?? 0, o.angle ?? 0.42, o.penumbra ?? 0.85, o.decay ?? 2);
  s.position.set(...(o.pos ?? [1.5, 9, 3]));
  s.target.position.set(...(o.target ?? [0, 0, 0]));
  s.castShadow = o.shadow ?? true;
  s.shadow.mapSize.set(o.mapSize ?? 2048, o.mapSize ?? 2048);
  s.shadow.bias = -0.0002;
  s.shadow.normalBias = 0.02;
  s.shadow.radius = 4;
  s.shadow.camera.near = 1;
  s.shadow.camera.far = 40;
  scene.add(s, s.target);
  return s;
}

export function rimLight(scene, pos, intensity = 1.2, color = 0xdfe8ff) {
  const d = new THREE.DirectionalLight(color, intensity);
  d.position.set(...pos);
  scene.add(d);
  return d;
}

export function greenFill(scene, pos, intensity = 3, distance = 5) {
  const p = new THREE.PointLight(0x00c853, intensity, distance, 2);
  p.position.set(...pos);
  scene.add(p);
  return p;
}

// Default look per shot; shots override fields.
export const LOOK = {
  exposure: 1.0,
  bloom: 0.32,
  bloomThreshold: 1.1,
  bloomScatter: 0.82,
  streak: 0.05,
  streakThreshold: 2.0,
  aperture: 0,
  focus: 6,
  maxCoc: 14,
  ca: 0.0012,
  vignette: 0.45,
  grain: 0.02,
  contrast: 1.04,
  saturation: 1.0,
  lift: [0.0, 0.0, 0.0],
  fade: 0,
};
export const look = (o) => ({ ...LOOK, ...o });
