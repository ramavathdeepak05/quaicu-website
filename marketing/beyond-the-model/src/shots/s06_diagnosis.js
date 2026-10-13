// SCENE 06 - THE DIAGNOSIS (00:15-00:18)
// Top-down architectural view. An ultra-thin scanning plane travels through
// the environment; behind it the hidden connection and the control failures
// become visible, each risk is isolated in a bracket, and the glass
// components lift apart. The camera then moves into a diagonal orbit.

import * as THREE from "three";
import { stage, keyLight, rimLight, look } from "./common.js";
import { scanMaterial } from "../kit.js";
import { buildMap, RISK } from "./map.js";
import { C, clamp, lerp, smooth, invLerp, easeInOutCubic, easeOutCubic, settle } from "../util.js";

export default function build(ctx) {
  const { scene, camera } = stage(ctx, { bg: 0x050606, fogDensity: 0.01, fov: 32, floor: false });
  scene.environmentIntensity = 0.9;
  const M = buildMap(scene, { grid: 0.16 });
  keyLight(scene, { pos: [1, 16, 6], target: [0, 0, 0], intensity: 3000, angle: 0.62, penumbra: 0.9 });
  rimLight(scene, [-8, 6, -8], 2.0, 0xdfe8ff);
  rimLight(scene, [9, 5, 6], 1.0, 0xffffff);

  const scan = new THREE.Mesh(new THREE.PlaneGeometry(22, 1.4), scanMaterial());
  scan.material.uniforms.trail.value = 0.08;
  scan.material.uniforms.color.value.multiplyScalar(0.7);
  scan.rotation.x = -Math.PI / 2;
  scene.add(scan);
  // the scanning plane also stands vertically, slicing through the architecture
  const blade = new THREE.Mesh(new THREE.PlaneGeometry(22, 3.2), scanMaterial());
  blade.material.uniforms.trail.value = 0.0;
  blade.material.uniforms.color.value.multiplyScalar(0.35);
  scene.add(blade);

  const tileRest = M.tiles.map((m) => m.userData.tile.position.y);
  const ISO = [2.25, 2.55, 2.85]; // isolate cues (17.25 / 17.55 / 17.85)

  return {
    scene,
    camera,
    update(t) {
      M.animate(t + 15, { leak: true });
      const sz = lerp(-5.8, 6.2, invLerp(0.15, 1.95, t));
      scan.position.set(0.6, 0.4, sz);
      blade.position.set(0.6, 1.6, sz);
      const sa = smooth(0.1, 0.25, t) * (1 - smooth(1.9, 2.15, t));
      scan.material.uniforms.alpha.value = sa;
      blade.material.uniforms.alpha.value = sa;
      const passed = (z) => smooth(z - 0.2, z + 0.6, sz);

      // risks stay lit; scan reveals the hidden path and the missing wall
      RISK.forEach(([x, z], i) => M.setRisk(i, 0.9 + 0.1 * Math.sin(t * 6 + i), ((t * 0.9 + i * 0.3) % 1), 1));
      M.ghostMat.color.copy(new THREE.Color(C.amber).multiplyScalar(2.4));
      M.slotMat.color.copy(new THREE.Color(C.amber).multiplyScalar(2.6));
      M.ledgerMat.color.copy(new THREE.Color(C.amber).multiplyScalar(2.6));
      M.hiddenMat.color.copy(new THREE.Color(0xf2f6f4).multiplyScalar(2.2 * passed(-1.2) * (0.8 + 0.2 * Math.sin(t * 9))));
      M.brackets.forEach(({ bm, b }, i) => {
        const k = easeOutCubic(invLerp(ISO[i], ISO[i] + 0.22, t));
        bm.color.copy(new THREE.Color(0xf7f7f5).multiplyScalar(3.2 * k));
        b.scale.setScalar(lerp(1.6, 1.0, k));
      });
      // components lift apart as the scan passes them
      M.tiles.forEach((m, i) => {
        const lift = settle(invLerp(0, 0.6, Math.max(0, sz - m.position.z) / 3)) * 0.38 + 0.25 * smooth(2.2, 3.0, t);
        m.userData.tile.position.y = tileRest[i] + lift;
      });
      M.walls.forEach((w) => (w.position.y = 0.2 * smooth(1.0, 2.0, t) + 0.25 * smooth(2.2, 3.0, t)));
      M.core.userData.cube.position.y = M.core.userData.pedH + 0.95 / 2 + 0.12 + 0.3 * smooth(2.2, 3.0, t);

      // camera: top-down, then diagonal orbit
      const o = easeInOutCubic(invLerp(1.45, 3.0, t));
      const el = lerp(1.5, 0.78, o);
      const az = lerp(0.0, 0.62, o);
      const r = lerp(16.5, 15.5, o);
      const c = new THREE.Vector3(0.7, 0, 0.1);
      camera.position.set(c.x + Math.sin(az) * Math.cos(el) * r, c.y + Math.sin(el) * r, c.z + Math.cos(az) * Math.cos(el) * r);
      camera.up.set(0, 1, 0);
      camera.lookAt(c);
      return look({
        exposure: 0.95,
        aperture: lerp(0, 10, o),
        focus: camera.position.distanceTo(c),
        maxCoc: 10,
        bloom: 0.34,
        streak: 0.0,
        saturation: 0.86,
      });
    },
  };
}
