// SCENE 07 - ENGINEERING THE SAFEGUARDS (00:18-00:21)
// Exploded engineering view. Four layers float above the environment, each
// aimed at a gap: policy enforcement gates on the data paths, the access
// and data boundary, a human review checkpoint on the action lane, and an
// evidence ledger for the event stream. They descend in sequence and lock
// into place; the amber gaps turn emerald as paths reroute through them.

import * as THREE from "three";
import { stage, keyLight, rimLight, look } from "./common.js";
import { gate, wall, ledger, conduit, emissive, spill } from "../kit.js";
import { buildMap, RISK } from "./map.js";
import { C, clamp, lerp, smooth, invLerp, easeInOutCubic, easeOutCubic, easeInCubic, settle, pulse } from "../util.js";

const LAND = [0.5, 1.0, 1.5, 2.0]; // lock cues 18.5 / 19.0 / 19.5 / 20.0 (on the beat)
const LIFT = [2.6, 3.6, 4.6, 5.6];

export default function build(ctx) {
  const { scene, camera } = stage(ctx, { bg: 0x040505, fogDensity: 0.012, fov: 32, floor: false });
  scene.environmentIntensity = 0.95;
  const M = buildMap(scene, { grid: 0.12 });
  keyLight(scene, { pos: [2, 18, 8], target: [0, 0, 0], intensity: 3600, angle: 0.6, penumbra: 0.9 });
  rimLight(scene, [-8, 7, -8], 2.6, 0xdfe8ff);
  rimLight(scene, [10, 4, 2], 1.2, 0xffffff);

  const layers = [new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group()];
  layers.forEach((l) => scene.add(l));
  const flashes = [];
  const addFlash = (i, x, z, w, d) => {
    const s = spill(w, d, C.emeraldHi, 0, "rect");
    s.position.set(x, 0.006, z);
    scene.add(s);
    flashes.push({ i, s });
  };
  const guides = [];
  const guideMat = emissive(0xf2f6f4, 0.0, { transparent: true, additive: true });
  const addGuide = (i, x, z) => {
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.01, 1, 0.01), guideMat);
    g.position.set(x, 0, z);
    scene.add(g);
    guides.push({ i, g });
  };

  // L1 policy gates where the data paths cross the boundary
  const crossings = [
    [-2.25, -0.917, 1.335],
    [-2.25, 0.978, 1.82],
  ];
  for (const [x, z, ry] of crossings) {
    const g = gate("POLICY", { glow: 2.6 });
    g.scale.setScalar(0.42);
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    layers[0].add(g);
    addFlash(0, x, z, 1.6, 1.6);
    addGuide(0, x, z);
  }
  // L2 boundary wall closing the zone, with openings at the gates
  for (const [z0, z1] of [
    [-3.2, -1.48],
    [-0.36, 0.42],
    [1.54, 3.2],
  ]) {
    const w = wall(z1 - z0, { H: 1.0, glow: 3.4 });
    w.position.set(-2.25, 0, (z0 + z1) / 2);
    w.rotation.y = Math.PI / 2;
    layers[1].add(w);
  }
  addFlash(1, -2.25, 0, 0.9, 6.8);
  addGuide(1, -2.25, -2.4);
  addGuide(1, -2.25, 2.4);
  // L3 human review checkpoint on the action lane
  const rv = gate("REVIEW", { glow: 2.6 });
  rv.scale.setScalar(0.68);
  rv.position.set(RISK[1][0], 0, RISK[1][1]);
  rv.rotation.y = Math.PI / 2;
  layers[2].add(rv);
  addFlash(2, RISK[1][0], RISK[1][1], 2.2, 2.2);
  addGuide(2, RISK[1][0], RISK[1][1] - 0.9);
  // L4 evidence ledger beside the event node
  const lg = ledger({ n: 10, gap: 0.075, w: 0.95, d: 0.7 });
  lg.position.set(6.55, 0, 2.5);
  lg.set({ written: 10, flash: 0 });
  layers[3].add(lg);
  const evToLedger = conduit([RISK[2][0] + 0.55, 0.16, RISK[2][1]], [6.0, 0.16, 2.5], { packets: 2, w: 0.14, h: 0.09, spec: 0.25, roughness: 0.32 });
  layers[3].add(evToLedger);
  addFlash(3, 6.0, 2.5, 2.4, 1.8);
  addGuide(3, 6.55, 2.5);

  return {
    scene,
    camera,
    update(t) {
      const fixed = smooth(2.3, 2.7, t); // reroute at 20.5
      M.animate(t + 18, { leak: fixed < 0.5, ringColor: fixed > 0.5 ? C.emeraldHi : 0xd8ffe9 });
      evToLedger.set({ phase: t * 0.8, glow: 1.4 * fixed, packetGlow: 8 * fixed });
      // risk state: lit until its safeguard lands, then resolved
      const res = [Math.max(smooth(LAND[0], LAND[0] + 0.3, t), smooth(LAND[1], LAND[1] + 0.3, t)), smooth(LAND[2], LAND[2] + 0.3, t), smooth(LAND[3], LAND[3] + 0.3, t)];
      RISK.forEach((_, i) => M.setRisk(i, (1 - res[i]) * (0.9 + 0.1 * Math.sin(t * 6 + i)), (t * 0.9 + i * 0.3) % 1, 1));
      M.ghostMat.color.copy(new THREE.Color(C.amber).multiplyScalar(2.4 * (1 - smooth(LAND[1] - 0.05, LAND[1] + 0.15, t))));
      M.slotMat.color.copy(new THREE.Color(C.amber).multiplyScalar(2.6 * (1 - smooth(LAND[2] - 0.05, LAND[2] + 0.15, t))));
      M.ledgerMat.color.copy(new THREE.Color(C.amber).multiplyScalar(2.6 * (1 - smooth(LAND[3] - 0.05, LAND[3] + 0.15, t))));
      M.hiddenMat.color.copy(new THREE.Color(0xf2f6f4).multiplyScalar(1.4 * (1 - smooth(LAND[0], LAND[1], t))));

      // layers descend in sequence and lock
      layers.forEach((l, i) => {
        const d0 = LAND[i] - 0.42;
        const fall = easeInCubic(invLerp(d0, LAND[i], t));
        const hover = 0.05 * Math.sin(t * 2.1 + i) * (1 - invLerp(d0 - 0.2, d0, t));
        const bounce = t > LAND[i] ? 0.035 * Math.exp(-(t - LAND[i]) * 18) * Math.sin((t - LAND[i]) * 48) : 0;
        l.position.y = LIFT[i] * (1 - fall) + hover + Math.abs(bounce);
      });
      flashes.forEach(({ i, s }) => {
        const f = pulse(t, LAND[i], 0.03, 0.55);
        s.material.color.copy(new THREE.Color(C.emeraldHi).multiplyScalar(1.6 * f));
      });
      guides.forEach(({ i, g }) => {
        const top = layers[i].position.y;
        g.scale.y = Math.max(0.001, top);
        g.position.y = top / 2;
      });
      guideMat.color.copy(new THREE.Color(0xf2f6f4).multiplyScalar(1.1 * (1 - smooth(LAND[3], LAND[3] + 0.4, t))));

      // camera: three-quarter engineering view, slow pull back
      const k = easeInOutCubic(clamp(t / 3));
      camera.position.set(lerp(7.2, 9.6, k), lerp(8.6, 10.6, k), lerp(10.4, 13.8, k));
      camera.lookAt(lerp(0.6, 0.7, k), lerp(2.3, 0.7, k), lerp(-0.2, 0.1, k));
      return look({
        exposure: 0.95 * (0.55 + 0.45 * smooth(0, 0.12, t)),
        aperture: 8,
        focus: camera.position.distanceTo(new THREE.Vector3(0.6, 1.2, 0)),
        maxCoc: 9,
        bloom: 0.4,
        streak: 0.07,
        saturation: lerp(0.88, 1.0, fixed),
      });
    },
  };
}
