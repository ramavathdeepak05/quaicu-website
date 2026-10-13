// SCENE 10 - THE QUAICU REVEAL (00:27-00:30)
// Monumental hero frame: the completed architecture (core, closed ring,
// four safeguards) alone in black. Floating interfaces dissolve, one last
// restrained emerald pulse runs the ring, the object settles into stillness
// and fades to black, and the end card (official logo) takes over.

import * as THREE from "three";
import { stage, keyLight, rimLight, look } from "./common.js";
import { core, module, panel, emissive, obsidian, spill, beamMaterial, reflector } from "../kit.js";
import { C, clamp, lerp, smooth, invLerp, easeInOutCubic, easeOutCubic, pulse } from "../util.js";

export default function build(ctx) {
  const { scene, camera } = stage(ctx, { bg: 0x000000, fogDensity: 0.03, fov: 28 });
  scene.environmentIntensity = 0.5;

  const c = core({ size: 1.25 });
  scene.add(c);
  const refl = reflector(ctx.W, ctx.H, { strength: 0.3, blur: 0.01, fade: 11 });
  scene.add(refl);

  // closed ring around the core (as in the references), lit by a running pulse
  const r0 = 2.35,
    r1 = 2.95,
    h = 0.24;
  const prof = [new THREE.Vector2(r0, 0), new THREE.Vector2(r1, 0), new THREE.Vector2(r1, h - 0.03), new THREE.Vector2(r1 - 0.03, h), new THREE.Vector2(r0 + 0.03, h), new THREE.Vector2(r0, h - 0.03)];
  const ring = new THREE.Mesh(new THREE.LatheGeometry(prof, 160), obsidian({ roughness: 0.3 }));
  ring.castShadow = ring.receiveShadow = true;
  scene.add(ring);
  const chase = new THREE.ShaderMaterial({
    uniforms: { head: { value: 0 }, k: { value: 0 }, base: { value: 0.6 }, col: { value: new THREE.Color(C.emeraldHi) } },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} `,
    fragmentShader: `uniform float head; uniform float k; uniform float base; uniform vec3 col; varying vec3 vP;
      void main(){ float a = atan(vP.z, vP.x) / 6.2831853 + 0.5; float d = fract(head - a); float tail = exp(-d * 9.0) * k;
        gl_FragColor = vec4(col * (base + tail * 9.0), 1.0); }`,
  });
  const line = new THREE.Mesh(new THREE.TorusGeometry((r0 + r1) / 2, 0.016, 8, 256), chase);
  line.rotation.x = Math.PI / 2;
  line.position.y = h + 0.008;
  scene.add(line);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(r0 + 0.02, 0.008, 8, 256), chase);
  inner.rotation.x = Math.PI / 2;
  inner.position.y = 0.05;
  scene.add(inner);
  const ringSpill = spill(8, 8, C.emeraldHi, 0.12, "radial");
  scene.add(ringSpill);

  // four safeguards standing on the ring
  const mods = [];
  ["shield", "users", "lock", "ledger"].forEach((icon, i) => {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const m = module(icon, { base: { w: 0.9, h: 0.22, d: 0.7 }, tile: { w: 0.62, h: 0.62, d: 0.14, glow: 3 } });
    m.position.set(Math.cos(a) * (r0 + r1) * 0.5, h, Math.sin(a) * (r0 + r1) * 0.5);
    m.rotation.y = -a + Math.PI / 2;
    scene.add(m);
    mods.push(m);
  });
  // the last floating interfaces, about to dissolve
  const panels = [];
  for (const [x, y, z, ry, s] of [
    [-2.1, 2.3, 0.6, 0.6, 5],
    [2.2, 2.55, 0.2, -0.6, 12],
  ]) {
    const p = panel({ seed: s, w: 0.72, h: 0.44, glow: 0.6 });
    p.position.set(x, y, z);
    p.rotation.y = ry;
    scene.add(p);
    panels.push(p);
  }

  const spot = keyLight(scene, { pos: [0.3, 10, 1.8], target: [0, 0.6, 0], intensity: 2400, angle: 0.36, penumbra: 0.75 });
  const rimL = rimLight(scene, [-6, 4, -5], 2.8, 0xdfe8ff);
  const rimR = rimLight(scene, [6, 3, -4], 2.0, 0xffffff);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 3.4, 9.6, 64, 1, true), beamMaterial(0xf4f8f6, 0.012));
  beam.position.set(0.15, 4.8, 0.9);
  beam.rotation.x = -0.17;
  scene.add(beam);

  const P0 = new THREE.Vector3(0, 2.35, 7.6),
    P1 = new THREE.Vector3(0, 2.7, 9.4);
  return {
    scene,
    camera,
    update(t) {
      // final pulse at 27.25 runs once round the ring
      const head = invLerp(0.25, 1.05, t);
      const fadeObj = easeInOutCubic(invLerp(0.85, 1.45, t));
      chase.uniforms.head.value = head;
      chase.uniforms.k.value = (t > 0.25 && t < 1.15 ? 1 : 0) * (1 - fadeObj);
      chase.uniforms.base.value = 0.55 * (1 - fadeObj);
      const pr = pulse(t, 0.25, 0.06, 0.6);
      c.set({ energy: 1 - fadeObj * 0.999, ring: t > 0.25 ? lerp(0, 1.7, invLerp(0.25, 0.85, t)) : -1, dieK: 1 + pr * 1.5, pedGlow: (4 + pr * 4) * (1 - fadeObj), spill: 1 - fadeObj });
      mods.forEach((m, i) => {
        const pi = pulse(t, 0.25 + 0.2 * i, 0.05, 0.4);
        m.set({ glow: (3 + pi * 3) * (1 - fadeObj), iconGlow: (2.4 + pi * 2) * (1 - fadeObj), spill: 0.35 * (1 - fadeObj) });
      });
      ringSpill.material.color.copy(new THREE.Color(C.emeraldHi).multiplyScalar((0.12 + 0.3 * pr) * (1 - fadeObj)));
      panels.forEach((p, i) => {
        const d = smooth(0.05 + i * 0.1, 0.55 + i * 0.1, t);
        p.visible = d < 0.99;
        p.scale.setScalar(1 - 0.08 * d);
        p.set({ glow: 0.6 * (1 - d), opacity: 1 - d });
        p.userData.sheet.visible = d < 0.5;
      });
      spot.intensity = 2400 * (1 - fadeObj);
      rimL.intensity = 2.8 * (1 - fadeObj);
      rimR.intensity = 2.0 * (1 - fadeObj);
      beam.material.uniforms.alpha.value = 1 - fadeObj;
      scene.environmentIntensity = 0.5 * (1 - fadeObj);

      const k = easeOutCubic(clamp(t / 2.2));
      camera.position.copy(P0).lerp(P1, k);
      camera.lookAt(0, lerp(0.95, 1.05, k), 0);
      return look({
        exposure: 1.0 * (1 - 0.92 * fadeObj),
        aperture: 16,
        focus: camera.position.distanceTo(new THREE.Vector3(0, 1.0, 0)),
        maxCoc: 12,
        bloom: 0.42,
        streak: 0.08,
        vignette: 0.65,
        grain: 0.02,
      });
    },
  };
}
