// Procedural studio environments, baked to PMREM once at startup. They only
// drive reflections and refraction; visible lighting comes from scene lights.

import * as THREE from "three";

function softbox(w, h, intensity, color = 0xffffff) {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

function studio({ room, panels }) {
  const s = new THREE.Scene();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(30, 14, 30),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(room), side: THREE.BackSide })
  );
  box.position.y = 5;
  s.add(box);
  for (const p of panels) {
    const b = softbox(p.w, p.h, p.i, p.c);
    b.position.set(...p.pos);
    b.lookAt(0, 1, 0);
    if (p.rot) b.rotateZ(p.rot);
    s.add(b);
  }
  return s;
}

export function makeEnvs(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const out = {};
  // Dark studio: black room, long overhead strip, two tall side strips,
  // faint emerald bounce low on one side.
  out.dark = pm.fromScene(
    studio({
      room: 0x030303,
      panels: [
        { w: 12, h: 5, i: 3.2, pos: [0, 11.6, 0] },
        { w: 2.4, h: 8, i: 2.4, pos: [-14, 4, -5] },
        { w: 2.4, h: 8, i: 1.8, pos: [14, 4, 4] },
        { w: 9, h: 2.2, i: 1.2, pos: [2, 3.2, -14.5] },
        { w: 7, h: 1.6, i: 0.8, pos: [-4, 2.6, 14.5] },
        { w: 3.2, h: 6, i: 1.0, pos: [10, 4, -12] },
        { w: 10, h: 0.8, i: 0.7, c: 0x10ff80, pos: [-8, 0.6, 12] },
      ],
    }),
    0.03
  ).texture;
  // Bright white studio (the reference look): white cyclorama, broad top light.
  out.light = pm.fromScene(
    studio({
      room: 0x9a9a98,
      panels: [
        { w: 16, h: 10, i: 3.2, pos: [0, 11.8, 0] },
        { w: 10, h: 6, i: 2.0, pos: [-13, 5, 4] },
        { w: 10, h: 6, i: 1.6, pos: [12, 5, -5] },
      ],
    }),
    0.03
  ).texture;
  pm.dispose();
  return out;
}
