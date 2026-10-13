// SCENE 01 - THE AWAKENING (00:00-00:03)
// Near-total darkness. An emerald pulse wakes inside the core; one overhead
// white beam reveals the glass structure on its obsidian pedestal. Macro
// push-in on the internal circuitry, then a slow, subtle reveal.

import * as THREE from "three";
import { stage, keyLight, rimLight, look } from "./common.js";
import { core, beamMaterial, spill, reflector } from "../kit.js";
import { C, clamp, smooth, easeInOutCubic, easeOutCubic, invLerp, pulse, lerp } from "../util.js";

export default function build(ctx) {
  const { scene, camera } = stage(ctx, { bg: 0x000000, fogDensity: 0.05, fov: 24, near: 0.02 });
  scene.environmentIntensity = 0.0;

  const c = core({ roughness: 0.06 });
  scene.add(c);
  const refl = reflector(ctx.W, ctx.H, { strength: 0.3, blur: 0.01, fade: 9 });
  scene.add(refl);
  const center = new THREE.Vector3(0, c.userData.cube.position.y, 0);

  // overhead spotlight + visible beam
  const spot = keyLight(scene, { pos: [0.15, 9, 0.35], target: [0, 0.8, 0], intensity: 0, angle: 0.17, penumbra: 0.55, mapSize: 2048 });
  const rimL = rimLight(scene, [-5, 3, -4], 0, 0xdfe8ff);
  const rimR = rimLight(scene, [6, 2, -3], 0, 0xffffff);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 1.35, 8.6, 64, 1, true), beamMaterial(0xf4f8f6, 0.022));
  beam.position.set(0.075, 4.3, 0.17);
  scene.add(beam);
  const pool = spill(4.2, 4.2, 0xffffff, 0.0, "radial");
  pool.position.y = 0.004;
  scene.add(pool);

  return {
    scene,
    camera,
    update(t) {
      // energy: faint pulse, then the activation wave
      const wake = smooth(0.3, 1.35, t);
      const faint = 0.1 + 0.12 * pulse(t, 0.0, 0.3, 0.55);
      const energy = Math.max(faint, wake);
      const ring = t < 0.35 ? -1 : lerp(0, 1.6, invLerp(0.35, 1.25, t));
      const ring2 = t > 2.45 ? lerp(0, 1.8, invLerp(2.45, 3.0, t)) : ring;
      c.set({ energy, ring: t > 2.45 ? ring2 : ring, dieK: 1 + 2.5 * smooth(2.6, 3.0, t), pedGlow: 4 * smooth(0.8, 1.6, t) + 3 * smooth(2.55, 3.0, t), spill: smooth(0.9, 1.8, t) });

      // light comes on at 1.05s with a crisp ramp
      const L = easeOutCubic(invLerp(1.0, 1.32, t));
      spot.intensity = 1500 * L;
      rimL.intensity = 2.2 * smooth(1.2, 2.2, t);
      rimR.intensity = 1.4 * smooth(1.3, 2.4, t);
      beam.material.uniforms.alpha.value = L * (0.95 + 0.05 * Math.sin(t * 9));
      pool.material.color.setScalar(0.32 * L);
      scene.environmentIntensity = 0.85 * smooth(1.05, 2.0, t);

      // camera: slow macro push across the top circuit layer, then a subtle widening reveal
      const a = easeInOutCubic(invLerp(0, 1.35, t)),
        b = easeInOutCubic(invLerp(1.35, 3.0, t));
      const P0 = [0.34, 0.4, 0.8],
        P1 = [0.27, 0.36, 0.7],
        P2 = [1.25, 0.85, 3.55];
      const T0 = [0.02, 0.27, 0.12],
        T1 = [0.0, 0.25, 0.05],
        T2 = [0.0, -0.18, 0.0];
      const mix3 = (A, B, k) => A.map((x, i) => lerp(x, B[i], k));
      const P = t < 1.35 ? mix3(P0, P1, a) : mix3(P1, P2, b);
      const T = t < 1.35 ? mix3(T0, T1, a) : mix3(T1, T2, b);
      camera.position.set(center.x + P[0], center.y + P[1], center.z + P[2]);
      camera.lookAt(center.x + T[0], center.y + T[1], center.z + T[2]);
      const focus = camera.position.distanceTo(new THREE.Vector3(center.x + T[0], center.y + T[1], center.z + T[2]));

      return look({
        exposure: 1.0 + 0.35 * smooth(2.7, 3.0, t),
        aperture: lerp(7, 40, b),
        focus,
        maxCoc: 18,
        bloom: 0.42,
        bloomThreshold: 0.9,
        streak: 0.06,
        vignette: 0.6,
        grain: 0.024,
      });
    },
  };
}
