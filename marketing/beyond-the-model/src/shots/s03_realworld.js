// SCENE 03 - THE REAL WORLD (00:06-00:09)
// The clean demo expands into operational infrastructure: a long corridor of
// obsidian server towers and modules, glass conduits crossing overhead at
// several heights, signals moving everywhere. Fast, smooth forward track
// that ends by following one signal down into a floor conduit.

import * as THREE from "three";
import { stage, keyLight, rimLight, look } from "./common.js";
import { module, conduit, emissive, obsidian, glass, spill, rbox, reflector } from "../kit.js";
import { C, rng, clamp, lerp, smooth, invLerp, easeInOutSine, easeInOutCubic } from "../util.js";

function tower(R) {
  const g = new THREE.Group();
  const h = 3.2 + R() * 0.8;
  const body = new THREE.Mesh(rbox(1.1, h, 1.1, 0.05, 3), obsidian({ roughness: 0.3 }));
  body.position.y = h / 2;
  g.add(body);
  // smoked glass face toward the corridor (+x local)
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.03, h - 0.3, 0.86), obsidian({ color: 0x0e1112, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02 }));
  face.position.set(0.56, h / 2, 0);
  g.add(face);
  const n = 2 + Math.floor(R() * 3);
  const bars = [];
  for (let i = 0; i < n; i++) {
    const k = R() < 0.18 ? 0xf4f6f5 : C.emeraldHi;
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.5 + R() * 0.3), emissive(k, k === C.emeraldHi ? 2.2 : 1.6));
    b.position.set(0.58, 0.5 + R() * (h - 1.0), (R() - 0.5) * 0.2);
    g.add(b);
    bars.push(b);
  }
  const slit = new THREE.Mesh(new THREE.BoxGeometry(0.012, h - 0.5, 0.012), emissive(C.emeraldHi, 2.4));
  slit.position.set(0.575, h / 2, 0.36);
  g.add(slit);
  // white architectural edge light on the corridor-side corners
  for (const z of [-0.555, 0.555]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.01, h - 0.1, 0.01), emissive(0xf2f6f8, 0.7));
    e.position.set(0.555, h / 2, z);
    g.add(e);
  }
  g.userData = { h, bars };
  return g;
}

export default function build(ctx) {
  const { scene, camera } = stage(ctx, { bg: 0x070809, fogColor: 0x070809, fogDensity: 0.05, fov: 34 });
  scene.environmentIntensity = 0.8;
  const R = rng(303);
  scene.add(reflector(ctx.W, ctx.H, { strength: 0.32, blur: 0.008, fade: 40, res: 0.4, size: 120 }));

  // corridor towers both sides
  for (let z = -26; z <= 20; z += 2.5) {
    for (const side of [-1, 1]) {
      const t = tower(R);
      t.position.set(side * 3.3, 0, z + (side > 0 ? 0.9 : 0));
      t.rotation.y = side > 0 ? Math.PI : 0;
      scene.add(t);
    }
  }
  // second row: modules visible between towers
  const icons = ["doc", "gear", "database", "chart", "lock", "code", "cpu", "pulse"];
  for (let z = -24; z <= 18; z += 3.6) {
    for (const side of [-1, 1]) {
      const m = module(icons[Math.floor(R() * icons.length)], { tile: { bodyGlow: 0.6 } });
      m.position.set(side * 6.2, 0, z + R() * 1.2);
      m.rotation.y = side * (Math.PI / 2) + (R() - 0.5) * 0.3;
      m.scale.setScalar(1.15);
      scene.add(m);
    }
  }
  // overhead conduits crossing the corridor at several heights and angles
  const links = [];
  for (let i = 0; i < 9; i++) {
    const z = 16 - i * 4.7 + R() * 1.2;
    const y = 2.4 + (i % 3) * 0.55 + R() * 0.2;
    const skew = (R() - 0.5) * 2.4;
    const k = conduit([-5.5, y, z - skew], [5.5, y, z + skew], { packets: 3, w: 0.2, h: 0.13, packetGlow: 7 });
    scene.add(k);
    links.push({ k, sp: 0.35 + R() * 0.4, ph: R(), dir: R() < 0.5 ? 1 : -1 });
  }
  // two recessed floor channels along the corridor: obsidian rails, a lit
  // filament and fast packets (opaque, so overhead lights never streak them)
  const floorLinks = [];
  const railMat = obsidian({ color: 0x0b0d0d, roughness: 0.5, clearcoat: 0.1 });
  const filMat = emissive(C.emeraldHi, 0.9);
  const pkMat = emissive(0x9dffc8, 4.5);
  for (const x of [-1.15, 1.15]) {
    for (const dx of [-0.13, 0.13]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 54), railMat);
      r.position.set(x + dx, 0.035, -3);
      scene.add(r);
    }
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, 54), filMat);
    f.position.set(x, 0.012, -3);
    scene.add(f);
    const pk = [];
    for (let i = 0; i < 14; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.4), pkMat);
      scene.add(p);
      pk.push(p);
    }
    floorLinks.push({ x, pk });
  }
  // hero signal that the camera follows at the end
  const hero = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.5), emissive(0xb8ffd6, 7));
  scene.add(hero);
  const heroGlow = spill(0.8, 2.2, C.emeraldHi, 0.5, "radial");
  scene.add(heroGlow);

  // light: overhead pools down the corridor + cold back rims for edge light
  for (const z of [12, 4, -4, -12]) keyLight(scene, { pos: [0, 8, z], target: [0, 0, z - 1], intensity: 260, angle: 0.5, penumbra: 1, shadow: z === 4, mapSize: 1024 });
  rimLight(scene, [0, 3, -20], 3.2, 0xe6eeff);
  rimLight(scene, [-4, 6, 10], 0.6, 0xffffff);
  // far end glow (the system keeps going)
  const far = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), emissive(0xdff2e8, 0.3));
  far.position.set(0, 3, -34);
  scene.add(far);

  const P = new THREE.CatmullRomCurve3([new THREE.Vector3(0.25, 1.75, 17.5), new THREE.Vector3(-0.15, 1.55, 10), new THREE.Vector3(0.35, 1.2, 4.2), new THREE.Vector3(0.95, 0.62, 0.6)], false, "centripetal");

  return {
    scene,
    camera,
    update(t) {
      const u = easeInOutSine(clamp(t / 3)) * 0.82 + clamp(t / 3) * 0.18;
      camera.position.copy(P.getPoint(u));
      // hero signal travels ahead along the right floor conduit
      const hz = lerp(9.5, -3.6, easeInOutCubic(clamp(t / 3)));
      hero.position.set(1.15, 0.1, hz);
      heroGlow.position.set(1.15, 0.004, hz);
      const lookFar = new THREE.Vector3(0, 1.35, camera.position.z - 12);
      const lookHero = hero.position.clone();
      const k = smooth(1.2, 2.9, t);
      camera.lookAt(lookFar.lerp(lookHero, k));
      camera.rotateZ(0.012 * Math.sin(t * 1.1));
      links.forEach(({ k: l, sp, ph, dir }) => l.set({ phase: ph + dir * t * sp }));
      floorLinks.forEach(({ x, pk }, j) =>
        pk.forEach((p, i) => {
          const u = (((-t * 0.075 - j * 0.03 + i / pk.length) % 1) + 1) % 1;
          p.position.set(x, 0.03, 24 - u * 54);
        })
      );
      const focus = lerp(10, camera.position.distanceTo(hero.position), k);
      return look({
        exposure: 1.05 * (0.35 + 0.65 * smooth(0, 0.12, t)) * (1 - 0.35 * smooth(2.9, 3.0, t)),
        aperture: lerp(24, 18, k),
        focus,
        maxCoc: 14,
        bloom: 0.34,
        streak: 0.07,
        contrast: 1.06,
      });
    },
  };
}
