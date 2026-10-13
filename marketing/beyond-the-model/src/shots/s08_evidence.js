// SCENE 08 - HUMAN CONTROL AND EVIDENCE (00:21-00:24)
// Macro: one luminous transaction rides the track into a review checkpoint
// and stops. A minimal indicator holds (pause), then approves (check). The
// transaction continues into the evidence ledger, where glass records are
// written one by one into a perfectly aligned transparent stack.

import * as THREE from "three";
import { stage, keyLight, rimLight, look } from "./common.js";
import { gate, tile, track, ledger, emissive, obsidian, spill, rbox, reflector } from "../kit.js";
import { C, clamp, lerp, smooth, invLerp, easeInOutCubic, easeOutCubic, easeInOutSine, pulse } from "../util.js";

const ARRIVE = 0.95,
  APPROVE = 1.45,
  LEAVE = 1.55,
  INTO = 2.12,
  WRITE = 2.15,
  STEP = 0.16;

export default function build(ctx) {
  const { scene, camera } = stage(ctx, { bg: 0x050606, fogDensity: 0.05, fov: 30, near: 0.02 });
  scene.environmentIntensity = 1.0;
  const tr = track(10, { w: 0.9, glow: 2.4, chevronGap: 0.9 });
  tr.rotation.y = Math.PI / 2;
  tr.position.set(-2.1, 0, 0);
  scene.add(tr);

  const rv = gate("REVIEW", { glow: 4 });
  rv.scale.setScalar(0.62);
  rv.rotation.y = -Math.PI / 2; // label faces the incoming transaction
  rv.position.set(0, 0, 0);
  scene.add(rv);

  // approval indicator: small glass tile on an obsidian post beside the gate
  const ind = tile("pause", { w: 0.26, h: 0.26, d: 0.06, glow: 2, iconColor: 0xf2f4f3, iconGlow: 1.6, bodyGlow: 0.3 });
  ind.position.set(-0.4, 0.98, 0.61);
  ind.rotation.y = -Math.PI / 2;
  scene.add(ind);
  const okRingMat = emissive(C.emeraldHi, 0, { transparent: true, additive: true });
  const okRing = new THREE.Mesh(new THREE.RingGeometry(0.19, 0.2, 64), okRingMat);
  okRing.position.copy(ind.position).add(new THREE.Vector3(-0.04, 0, 0));
  okRing.rotation.y = -Math.PI / 2;
  scene.add(okRing);

  // the transaction
  const tx = tile("doc", { w: 0.5, h: 0.5, d: 0.12, glow: 5, iconGlow: 3, bodyGlow: 1.2 });
  tx.rotation.y = Math.PI / 2;
  scene.add(tx);
  const txGlow = spill(1.0, 1.0, C.emeraldHi, 0.9, "radial");
  scene.add(txGlow);
  // trailing packets on the rail for motion
  const trail = [];
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.012, 0.02), emissive(C.emeraldHi, 6));
    scene.add(p);
    trail.push(p);
  }

  // evidence ledger at the end of the track
  const lg = ledger({ n: 14, gap: 0.072, w: 0.9, d: 0.66, slideFrom: -1.4 });
  lg.position.set(3.65, 0, 0);
  lg.rotation.y = 0;
  scene.add(lg);
  const PRE = 8; // records already in the ledger

  keyLight(scene, { pos: [0.5, 7, 3.5], target: [1.2, 0, 0], intensity: 900, angle: 0.55, penumbra: 0.95 });
  rimLight(scene, [-5, 3, -4], 2.6, 0xdfe8ff);
  rimLight(scene, [6, 2.5, -2], 1.6, 0xffffff);
  scene.add(reflector(ctx.W, ctx.H, { strength: 0.22, blur: 0.014, fade: 10 }));

  return {
    scene,
    camera,
    update(t) {
      // transaction path
      let x;
      if (t < ARRIVE) x = lerp(-4.2, -0.05, easeOutCubic(t / ARRIVE) * 0.6 + (t / ARRIVE) * 0.4);
      else if (t < LEAVE) x = -0.05;
      else x = lerp(-0.05, 3.05, easeInOutSine(invLerp(LEAVE, INTO, t)));
      const intoLedger = smooth(INTO - 0.05, INTO + 0.12, t);
      tx.position.set(x, 0.16 + 0.3 + 0.012 * Math.sin(t * 5), 0);
      tx.scale.setScalar(1 - 0.95 * intoLedger);
      tx.visible = intoLedger < 0.98;
      txGlow.position.set(x, 0.17, 0);
      txGlow.material.color.copy(new THREE.Color(C.emeraldHi).multiplyScalar(0.9 * (1 - intoLedger)));
      trail.forEach((p, i) => {
        p.position.set(x - 0.35 - i * 0.28, 0.165, 0.3 * (i % 2 ? 1 : -1));
        const moving = t < ARRIVE || (t > LEAVE && t < INTO);
        p.material.color.copy(new THREE.Color(C.emeraldHi).multiplyScalar(moving ? 4 * (1 - i / 6) : 0));
      });

      // checkpoint: hold, then approve
      const held = smooth(ARRIVE - 0.1, ARRIVE + 0.1, t);
      const ok = t >= APPROVE;
      ind.set({ icon: ok ? "checkCircle" : "pause", iconColor: ok ? C.emeraldHi : 0xf2f4f3, iconGlow: ok ? 3.2 + 2 * pulse(t, APPROVE, 0.03, 0.4) : 0.8 + 1.0 * held, glow: ok ? 4 : 1.2 });
      const ring = invLerp(APPROVE, APPROVE + 0.5, t);
      okRing.scale.setScalar(1 + ring * 1.8);
      okRingMat.color.copy(new THREE.Color(C.emeraldHi).multiplyScalar(ok ? 3 * (1 - ring) : 0));
      rv.set({ glow: 2.6 + 1.6 * held * (ok ? 1.6 : 0.6) });

      // ledger writes
      const written = PRE + clamp((t - WRITE) / STEP, 0, 5.999) * (t > WRITE ? 1 : 0);
      lg.set({ written: t < WRITE ? PRE : written, flash: 1, flashFrom: PRE });

      // camera: follow the transaction, hold at the checkpoint, then glide to the ledger
      const follow = new THREE.Vector3(x - 1.25, 0.86, 1.55);
      const hold = new THREE.Vector3(-2.35, 1.0, 1.95);
      const toLedger = new THREE.Vector3(1.75, 1.3, 2.25);
      const h = smooth(0.7, ARRIVE + 0.1, t) * (1 - smooth(LEAVE, LEAVE + 0.3, t));
      const g = easeInOutCubic(invLerp(LEAVE, 2.5, t));
      const p = follow.clone().lerp(hold, h).lerp(toLedger, g);
      camera.position.copy(p);
      const tgt = new THREE.Vector3(x + 0.3, 0.5, 0).lerp(new THREE.Vector3(-0.2, 0.72, 0.25), h).lerp(new THREE.Vector3(3.65, 0.62, 0), g);
      camera.lookAt(tgt);
      // focus pull: transaction -> ledger records
      const fTx = camera.position.distanceTo(tx.position);
      const fLg = camera.position.distanceTo(new THREE.Vector3(3.65, 0.7, 0.25));
      const focus = lerp(fTx, fLg, smooth(1.75, 2.15, t));
      return look({
        exposure: 1.0 * (0.6 + 0.4 * smooth(0, 0.1, t)),
        aperture: 10,
        focus,
        maxCoc: 16,
        bloom: 0.4,
        streak: 0.08,
      });
    },
  };
}
