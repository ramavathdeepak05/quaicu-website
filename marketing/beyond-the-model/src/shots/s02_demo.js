// SCENE 02 - THE PERFECT DEMO (00:03-00:06)
// The core runs flawlessly in a clean lab: four modules wired to it by glass
// conduits, signals in lockstep, glass interface panels moving on a precise
// beat. Lateral tracking move with foreground parallax.

import * as THREE from "three";
import { stage, keyLight, rimLight, greenFill, look } from "./common.js";
import { core, module, conduit, panel, emissive, spill, obsidian, reflector } from "../kit.js";
import { C, rig, win, smooth, clamp, easeInOutSine, easeOutCubic } from "../util.js";

export default function build(ctx) {
  const { scene, camera } = stage(ctx, { bg: 0x040505, fogDensity: 0.03, fov: 30 });
  const key = keyLight(scene, { pos: [-1.5, 9, 4], intensity: 1600, angle: 0.55 });
  keyLight(scene, { pos: [4, 7, -5], intensity: 500, angle: 0.5, shadow: false, color: 0xe8f0ff });
  rimLight(scene, [-6, 4, -6], 3.0);
  rimLight(scene, [7, 3, -2], 1.8, 0xffffff);
  greenFill(scene, [0, 0.6, 0], 2.5, 4);

  const c = core();
  scene.add(c);
  scene.add(reflector(ctx.W, ctx.H, { strength: 0.28, blur: 0.012, fade: 12 }));

  const icons = ["doc", "chart", "shield", "gauge"];
  const pos = [
    [-2.7, -2.4],
    [2.7, -2.4],
    [-2.7, 2.4],
    [2.7, 2.4],
  ];
  const mods = [];
  const links = [];
  pos.forEach(([x, z], i) => {
    const m = module(icons[i]);
    m.position.set(x, 0, z);
    m.rotation.y = Math.atan2(-x, -z) + Math.PI; // face away from the core, like the refs
    m.rotation.y = x < 0 ? Math.PI / 5 : -Math.PI / 5;
    scene.add(m);
    mods.push(m);
    const k = conduit([x * 0.36, 0.2, z * 0.36], [x * 0.78, 0.2, z * 0.78], { packets: 2, w: 0.2, h: 0.12 });
    scene.add(k);
    links.push(k);
  });

  // Floating interface panels around the core
  const panels = [];
  const pdef = [
    { p: [-2.05, 2.25, 0.2], ry: 0.6, s: 4 },
    { p: [2.15, 2.4, -0.3], ry: -0.55, s: 9 },
  ];
  for (const d of pdef) {
    const p = panel({ seed: d.s, w: 0.78, h: 0.48, glow: 0.7 });
    p.position.set(...d.p);
    p.rotation.y = d.ry;
    scene.add(p);
    panels.push({ p, d });
  }

  // Architecture: a dark back wall with one low emerald line
  const wallMat = obsidian({ color: 0x0d0e10, roughness: 0.55, clearcoat: 0.3 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(60, 14), wallMat);
  back.position.set(0, 7, -12);
  scene.add(back);
  const lineM = emissive(C.emeraldHi, 1.2);
  const ln = new THREE.Mesh(new THREE.BoxGeometry(40, 0.03, 0.03), lineM);
  ln.position.set(0, 0.35, -11.9);
  scene.add(ln);
  // Foreground parallax element: a glass interface rail close to the lens
  const fg = panel({ seed: 21, w: 1.2, h: 0.7, glow: 0.5 });
  fg.position.set(-1.9, 1.15, 3.1);
  fg.rotation.y = 0.35;
  scene.add(fg);

  const move = rig(
    [
      [-3.7, 2.05, 4.6],
      [-2.2, 2.15, 5.0],
      [-0.55, 2.25, 5.3],
    ],
    [
      [-0.85, 0.82, 0],
      [-0.3, 0.86, 0],
      [0.25, 0.9, 0],
    ],
    { ease: (u) => u }
  );

  return {
    scene,
    camera,
    update(t) {
      move(camera, t / 3);
      const e = 1;
      // synchronized pulse every 0.5s (the score's beat at 120 BPM)
      const beat = t / 0.5;
      const ring = beat > 0 ? (beat % 1) * 1.4 : -1;
      c.set({ energy: e, ring, pedGlow: 4 + 1.2 * Math.max(0, Math.cos((beat % 1) * Math.PI * 2)) });
      links.forEach((k, i) => k.set({ phase: t * 0.62 + i * 0.25, glow: 1.4 }));
      mods.forEach((m, i) => {
        const p = Math.max(0, Math.cos(((beat + i * 0.25) % 1) * Math.PI * 2));
        m.set({ glow: 3 + p * 1.4, iconGlow: 2.2 + p * 0.8 });
      });
      panels.forEach(({ p, d }, i) => {
        // each panel steps on the beat: a precise short slide, then rests
        const step = Math.floor(clamp(beat) + Math.max(0, beat));
        const f = beat - Math.floor(beat);
        const k = Math.floor(Math.max(0, beat)) + easeOutCubic(clamp(f * 3));
        p.position.y = d.p[1] + Math.sin(k * 0.6 + i) * 0.04;
        p.rotation.y = d.ry + k * 0.025 * (i % 2 ? -1 : 1);
        p.set({ glow: 0.6 + 0.3 * Math.max(0, Math.cos(f * Math.PI)) });
      });
      return look({
        exposure: 1.0 - 0.6 * smooth(2.88, 3.0, t),
        aperture: 38,
        focus: camera.position.distanceTo(new THREE.Vector3(0, 1.2, 0)),
        maxCoc: 16,
        bloom: 0.36,
        streak: 0.06,
      });
    },
  };
}
