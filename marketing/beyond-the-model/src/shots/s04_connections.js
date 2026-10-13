// SCENE 04 - THE HIDDEN CONNECTIONS (00:09-00:12)
// Extreme close-up inside a glass data channel. Packets cross engineered
// boundaries; at a junction the channel branches three ways: to a sensitive
// data store, to an execution tool, and to an unmonitored process whose
// channel carries no light. A faint warning flickers on that third path.

import * as THREE from "three";
import { stage, keyLight, rimLight, look } from "./common.js";
import { module, emissive, obsidian, glass, spill, circuitTex, rbox, tile, base, reflector } from "../kit.js";
import { C, clamp, lerp, smooth, invLerp, easeInOutCubic, easeOutCubic, pulse } from "../util.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export default function build(ctx) {
  const { scene, camera } = stage(ctx, { bg: 0x050607, fogColor: 0x050607, fogDensity: 0.06, fov: 30, near: 0.01 });
  scene.environmentIntensity = 1.1;

  scene.add(reflector(ctx.W, ctx.H, { strength: 0.25, blur: 0.012, fade: 14, res: 0.4 }));
  const J = V(0, 0.55, 0);
  const trunk = new THREE.CatmullRomCurve3([V(9, 0.55, 0.0), V(4, 0.55, 0.0), J]);
  const branches = [
    new THREE.CatmullRomCurve3([J, V(-0.9, 0.62, -0.55), V(-2.2, 0.72, -1.6), V(-3.05, 0.8, -2.3)]), // to data store
    new THREE.CatmullRomCurve3([J, V(-1.2, 0.55, 0.05), V(-2.6, 0.58, 0.2), V(-3.7, 0.6, 0.3)]), // to tool
    new THREE.CatmullRomCurve3([J, V(-0.9, 0.42, 0.6), V(-2.0, 0.3, 1.7), V(-2.85, 0.32, 2.5)]), // to unmonitored process
  ];
  const tubeMat = glass({ roughness: 0.035, thickness: 0.08, attenuation: 4, rim: 0.16, rimPow: 3.0, env: 1.1 });
  const addTube = (curve, r, glow) => {
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, r, 32, false), tubeMat);
    scene.add(tube);
    const fm = emissive(C.emeraldHi, glow);
    const fil = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, r * 0.09, 8, false), fm);
    scene.add(fil);
    return fm;
  };
  addTube(trunk, 0.12, 1.4);
  const bf = branches.map((b, i) => addTube(b, 0.085, i === 2 ? 0.0 : 1.2));
  // junction manifold
  const man = new THREE.Mesh(rbox(0.42, 0.34, 0.42, 0.1, 5), glass({ roughness: 0.06, thickness: 0.3, rim: 0.15, glow: 0.25, glowY0: -0.17, glowY1: 0.17 }));
  man.position.copy(J);
  scene.add(man);
  // engineered clamps along the trunk (cool brushed metal)
  const metal = new THREE.MeshPhysicalMaterial({ color: 0x9aa3a8, metalness: 1, roughness: 0.32, envMapIntensity: 1.2 });
  for (let x = 0.9; x < 9; x += 1.15) {
    const cl = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.022, 12, 48), metal);
    cl.rotation.y = Math.PI / 2;
    cl.position.set(x, 0.55, 0);
    scene.add(cl);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.05), obsidian());
    post.position.set(x, 0.2, 0);
    scene.add(post);
  }
  // destinations
  const store = module("database", { tile: { bodyGlow: 0.7 } });
  store.position.set(-3.75, 0, -2.85);
  store.rotation.y = 0.75;
  scene.add(store);
  const tool = module("terminal");
  tool.position.set(-4.4, 0, 0.35);
  tool.rotation.y = Math.PI / 2;
  scene.add(tool);
  const proc = module("cpu", { base: { glow: 0.0, spill: 0 }, tile: { glow: 0.0, iconGlow: 0.25, iconColor: 0x9aa3a8, bodyGlow: 0.0 } });
  proc.position.set(-3.4, 0, 3.0);
  proc.rotation.y = 0.9;
  scene.add(proc);
  proc.set({ glow: 0.0, iconGlow: 0.22, iconColor: 0x9aa3a8 });

  // translucent engineering layers the camera passes through
  const etch = (w, h, seed, k) =>
    new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: circuitTex(seed, 2048), color: new THREE.Color(C.emeraldHi).multiplyScalar(k), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
  const layers = [];
  for (const [x, z, s, k] of [
    [5.5, -0.75, 31, 0.22],
    [2.6, 0.95, 37, 0.18],
    [1.2, -1.2, 41, 0.16],
    [6.8, 1.3, 43, 0.12],
  ]) {
    const l = etch(3.2, 2.0, s, k);
    l.position.set(x, 0.75, z);
    scene.add(l);
    layers.push(l);
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.0, 0.012), glass({ roughness: 0.12, thickness: 0.02, rim: 0.25 }));
    sheet.position.set(x, 0.75, z + 0.01);
    scene.add(sheet);
  }

  // amber warning on the unmonitored path
  const warnMat = emissive(C.amber, 0, { transparent: true, additive: true });
  const warn = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.012, 10, 48), warnMat);
  const wp = branches[2].getPointAt(0.55);
  warn.position.copy(wp);
  warn.lookAt(branches[2].getPointAt(0.6));
  scene.add(warn);
  const warnSpill = spill(1.2, 1.2, C.amber, 0, "radial");
  warnSpill.position.set(wp.x, 0.005, wp.z);
  scene.add(warnSpill);

  // packets
  const pm = emissive(0x9dffc8, 5.5);
  const N = 9;
  const packets = [];
  for (let i = 0; i < N; i++) {
    const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.14, 6, 12), i % 3 === 2 ? emissive(0xcfe9dc, 3) : pm);
    p.rotation.z = Math.PI / 2;
    scene.add(p);
    packets.push(p);
  }
  const Lt = trunk.getLength();
  const Lb = branches.map((b) => b.getLength());
  const up = V(0, 1, 0);
  const place = (p, s, br) => {
    if (s < 0) {
      p.visible = false;
      return;
    }
    p.visible = true;
    let pos, tan;
    if (s < Lt) {
      const u = s / Lt;
      pos = trunk.getPointAt(u);
      tan = trunk.getTangentAt(u);
    } else {
      const u = (s - Lt) / Lb[br];
      if (u > 1) {
        p.visible = false;
        return;
      }
      pos = branches[br].getPointAt(u);
      tan = branches[br].getTangentAt(u);
    }
    p.position.copy(pos);
    p.quaternion.setFromUnitVectors(up, tan);
  };

  keyLight(scene, { pos: [2, 7, 3], target: [0, 0, 0], intensity: 280, angle: 0.6, penumbra: 1, mapSize: 1024 });
  rimLight(scene, [-6, 3, -2], 1.3, 0xdfe8ff);
  rimLight(scene, [5, 2, 4], 0.7, 0xffffff);

  // hero packet is index 0; camera rides alongside it
  const speed = 3.2;
  return {
    scene,
    camera,
    update(t) {
      packets.forEach((p, i) => {
        const s = (t + 1.35) * speed - i * 1.05;
        place(p, s, i % 3);
      });
      const hs = (t + 1.35) * speed; // hero distance along trunk
      const hp = hs < Lt ? trunk.getPointAt(clamp(hs / Lt)) : J.clone();
      // camera: ride alongside, ease off near the junction, rise to reveal branches
      const rv = easeInOutCubic(invLerp(1.0, 3.0, t));
      const ride = V(hp.x + 0.55, 0.66, 0.42);
      const reveal = V(1.55, 1.85, 2.15);
      camera.position.copy(ride.lerp(reveal, rv));
      const tgt = hp.clone().lerp(V(-1.5, 0.55, 0.15), rv);
      camera.lookAt(tgt);
      // warning flicker on the unmonitored process path
      const fl = smooth(2.45, 2.7, t) * (0.55 + 0.45 * Math.sin(t * 47) * Math.sin(t * 13.3)) + pulse(t, 2.62, 0.04, 0.12) * 0.8;
      warnMat.color.copy(new THREE.Color(C.amber).multiplyScalar(4 * fl));
      warnSpill.material.color.copy(new THREE.Color(C.amber).multiplyScalar(0.6 * fl));
      bf[0].color.copy(new THREE.Color(C.emeraldHi).multiplyScalar(1.2));
      const focus = camera.position.distanceTo(tgt);
      return look({
        exposure: 1.0 * (1 - 0.3 * smooth(2.9, 3.0, t)) * (0.6 + 0.4 * smooth(0, 0.15, t)),
        aperture: lerp(5, 22, rv),
        focus,
        maxCoc: 18,
        bloom: 0.26,
        bloomThreshold: 1.6,
        streak: 0.04,
      });
    },
  };
}
