// SCENE 09 - REAL-WORLD READINESS (00:24-00:27)
// Grand pullback from inside the infrastructure to an architectural wide:
// the whole environment organised into controlled lanes, every lane passing
// policy and review, every boundary closed, ledgers recording. The light
// changes from tension to confidence (the white studio of the references),
// then powers down toward black, leaving the central core lit.

import * as THREE from "three";
import { stage, keyLight, rimLight, look } from "./common.js";
import { core, module, gate, wall, ledger, track, tile, conduit, emissive, obsidian, spill, glass } from "../kit.js";
import { C, rng, clamp, lerp, smooth, invLerp, easeInOutCubic, easeOutCubic } from "../util.js";

export default function build(ctx) {
  const { scene, camera, floor } = stage(ctx, { bg: 0xf1f1ef, env: "light", fogColor: 0xf1f1ef, fogDensity: 0.0065, fov: 32, floorOpts: { color: 0xdededa, roughness: 0.34, clearcoat: 0.5, clearcoatRoughness: 0.25, env: 0.85 } });
  const bgLight = new THREE.Color(0xf1f1ef),
    bgDark = new THREE.Color(0x000000);
  const floorLight = new THREE.Color(0xdededa),
    floorDark = new THREE.Color(0x050505);

  const c = core({ size: 1.3 });
  scene.add(c);

  // four lanes radiating from the core: track -> POLICY -> REVIEW -> module, ledger at the end
  const lanes = [];
  const icons = ["doc", "database", "code", "chart"];
  const R = rng(909);
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group();
    g.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;
    scene.add(g);
    const tr = track(9.5, { w: 1.0, glow: 2.6, chevronGap: 1.4 });
    tr.position.set(0, 0, 6.6);
    g.add(tr);
    const pg = gate("POLICY", { glow: 4.5 });
    pg.scale.setScalar(0.62);
    pg.position.set(0, 0, 4.4);
    g.add(pg);
    const rg = gate("REVIEW", { glow: 4.5 });
    rg.scale.setScalar(0.62);
    rg.position.set(0, 0, 7.4);
    g.add(rg);
    const m = module(icons[i]);
    m.position.set(0, 0, 11.9);
    g.add(m);
    const lg = ledger({ n: 9, gap: 0.08, w: 0.9, d: 0.66 });
    lg.position.set(2.0, 0, 10.6);
    lg.set({ written: 9, flash: 0 });
    g.add(lg);
    const lk = conduit([0.6, 0.16, 9.6], [1.55, 0.16, 10.4], { packets: 1, w: 0.14, h: 0.09 });
    g.add(lk);
    const txs = [];
    for (let k = 0; k < 3; k++) {
      const t = tile(["doc", "gear", "shield"][k], { w: 0.42, h: 0.42, d: 0.11, glow: 3.5, bodyGlow: 0.7 });
      g.add(t);
      txs.push(t);
    }
    lanes.push({ g, txs, lk, ph: R() });
  }
  // closed boundary: glass walls on a large square; lanes leave through the corners
  const S = 9.2;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const w = wall(2 * S * 0.8, { H: 1.1, glow: 3.2 });
    w.position.set(Math.cos(a) * S, 0, Math.sin(a) * S);
    w.rotation.y = Math.PI / 2 - a;
    scene.add(w);
  }
  // satellite clusters toward the horizon
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.11;
    const r = 19 + (i % 3) * 3.5;
    const m = module(["shield", "lock", "chart", "gear", "users", "doc", "pulse"][i % 7]);
    m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    m.rotation.y = -a - Math.PI / 2;
    scene.add(m);
  }

  const key = keyLight(scene, { pos: [4, 26, 10], target: [0, 0, 0], intensity: 3600, angle: 0.62, penumbra: 1, mapSize: 2048 });
  const rim1 = rimLight(scene, [-12, 9, -10], 1.6, 0xffffff);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d8d8, 0.55);
  scene.add(hemi);
  const coreSpot = keyLight(scene, { pos: [0.2, 9, 0.5], target: [0, 0.8, 0], intensity: 0, angle: 0.2, penumbra: 0.6, shadow: false });

  // start low on lane 0 (the +x+z diagonal), looking up the lane through REVIEW and POLICY at the core
  const L = (d, side, y) => new THREE.Vector3(0.7071 * d + 0.7071 * side, y, 0.7071 * d - 0.7071 * side);
  const P = new THREE.CatmullRomCurve3([L(10.6, 0.3, 1.15), L(13.4, 0.9, 2.6), L(19.5, 3.2, 9.0), new THREE.Vector3(17.5, 15.5, 26.5)], false, "centripetal");

  return {
    scene,
    camera,
    update(t) {
      const tt = t + 24;
      c.set({ energy: 1, ring: (tt * 0.9) % 1.4 });
      lanes.forEach(({ txs, lk, ph }) => {
        txs.forEach((tx, k) => {
          const u = (((tt * 0.22 + k / 3 + ph * 0.1) % 1) + 1) % 1;
          tx.position.set(0, 0.16 + 0.27, lerp(2.2, 11.0, u));
          tx.visible = u > 0.02 && u < 0.97;
        });
        lk.set({ phase: tt * 0.7 });
      });

      // grand pullback
      const k = easeInOutCubic(clamp(t / 2.75));
      camera.position.copy(P.getPoint(k));
      camera.lookAt(lerp(1.2, 0, k), lerp(0.95, 0.2, k), lerp(1.2, 0.6, k));

      // power down toward black, leaving the core lit
      // light level falls so the picture dims at an even rate on screen
      // (display-linear), from full at 26.2 s to black at the cut
      const u = invLerp(2.2, 3.0, t);
      const L = 0.94 * Math.pow(1 - u, 1.1) + 0.06 * (1 - smooth(0.75, 1.0, u));
      const pd = 1 - L;
      scene.background.copy(bgLight).multiplyScalar(L);
      scene.fog.color.copy(scene.background);
      floor.material.color.copy(floorLight).lerp(floorDark, invLerp(0.15, 1.0, u));
      scene.environmentIntensity = Math.max(0.15, L);
      key.intensity = 3600 * L;
      rim1.intensity = 1.6 * L;
      hemi.intensity = 0.55 * L;
      coreSpot.intensity = 2400 * smooth(0.25, 0.9, u);
      return look({
        exposure: 1.0,
        aperture: lerp(14, 6, k),
        focus: camera.position.distanceTo(new THREE.Vector3(lerp(5.0, 0, k), 0.8, lerp(5.0, 0, k))),
        maxCoc: 12,
        bloom: 0.3,
        bloomThreshold: 1.6,
        streak: 0.03,
        contrast: 1.08,
        vignette: lerp(0.25, 0.6, pd),
      });
    },
  };
}
