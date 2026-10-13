// SCENE 05 - GOVERNANCE GAPS (00:12-00:15)
// Overhead reveal of the deployment environment. Amber-red markers appear,
// one after another: data leaving its boundary unchecked, an automated
// action path with no checkpoint, events that leave no record. Then a
// controlled push toward the first junction.

import * as THREE from "three";
import { stage, keyLight, rimLight, look } from "./common.js";
import { scanMaterial } from "../kit.js";
import { buildMap, RISK } from "./map.js";
import { C, clamp, lerp, smooth, invLerp, easeInOutCubic, easeOutCubic, pulse } from "../util.js";

export const RISK_T = [0.45, 1.2, 1.85];

export default function build(ctx) {
  const { scene, camera } = stage(ctx, { bg: 0x050606, fogDensity: 0.012, fov: 34, floor: false });
  scene.environmentIntensity = 0.9;
  const M = buildMap(scene);
  keyLight(scene, { pos: [1, 16, 6], target: [0, 0, 0], intensity: 3400, angle: 0.62, penumbra: 0.9 });
  rimLight(scene, [-8, 6, -8], 2.0, 0xdfe8ff);
  rimLight(scene, [9, 5, 6], 1.0, 0xffffff);

  const scan = new THREE.Mesh(new THREE.PlaneGeometry(22, 1.6), scanMaterial());
  scan.rotation.x = -Math.PI / 2;
  scene.add(scan);

  const r1 = new THREE.Vector3(RISK[0][0], 0.3, RISK[0][1]);
  return {
    scene,
    camera,
    update(t) {
      M.animate(t + 12, { leak: t > RISK_T[0] + 0.3 });
      // markers
      RISK_T.forEach((t0, i) => {
        const a = i === 0 ? 0.25 * smooth(t0, t0 + 0.15, t) + 0.75 * smooth(t0 + 0.35, t0 + 0.8, t) : smooth(t0, t0 + 0.25, t);
        const p = t > t0 ? ((t - t0) * 0.9) % 1 : 0;
        M.setRisk(i, a * (0.85 + 0.15 * Math.sin(t * 7 + i)), p, easeOutCubic(invLerp(t0, t0 + 0.5, t)));
      });
      M.ghostMat.color.copy(new THREE.Color(C.amber).multiplyScalar(2.2 * smooth(RISK_T[0] + 0.3, RISK_T[0] + 0.8, t)));
      M.slotMat.color.copy(new THREE.Color(C.amber).multiplyScalar(2.6 * smooth(RISK_T[1], RISK_T[1] + 0.35, t)));
      M.ledgerMat.color.copy(new THREE.Color(C.amber).multiplyScalar(2.6 * smooth(RISK_T[2], RISK_T[2] + 0.35, t)));

      // camera: overhead reveal drifting round, then push toward risk 1
      const a = easeInOutCubic(invLerp(0, 2.0, t));
      const b = easeInOutCubic(invLerp(1.9, 3.0, t));
      const az = lerp(-0.35, 0.05, a);
      const h = lerp(17.5, 15.5, a);
      const over = new THREE.Vector3(1.0 + Math.sin(az) * 5.5, h, 0.4 + Math.cos(az) * 5.5);
      const push = new THREE.Vector3(r1.x + 1.6, 4.4, r1.z + 4.2);
      camera.position.copy(over.lerp(push, b));
      const tgt = new THREE.Vector3(0.6, 0, 0).lerp(r1, b);
      camera.up.set(0, 1, 0);
      camera.lookAt(tgt);

      // the scanning beam enters as the shot ends
      const sz = lerp(-9, -3.5, invLerp(2.7, 3.0, t));
      scan.position.set(0.6, 0.35, sz);
      scan.material.uniforms.alpha.value = smooth(2.7, 2.8, t);

      return look({
        exposure: 0.95 * (0.5 + 0.5 * smooth(0, 0.15, t)),
        aperture: lerp(0, 14, b),
        focus: camera.position.distanceTo(tgt),
        maxCoc: 12,
        bloom: 0.36,
        streak: 0.05,
        saturation: lerp(1.0, 0.82, smooth(0.3, 1.0, t)),
      });
    },
  };
}
