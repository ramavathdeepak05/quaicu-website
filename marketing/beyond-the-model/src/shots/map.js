// The deployment environment used by scenes 05, 06 and 07, so the gaps that
// appear, the scan that maps them and the safeguards that fix them all sit
// in exactly the same places.
//
//   data zone (left)     two data modules behind a glass boundary whose
//                        right side is missing; their conduits leave the
//                        zone unchecked                       -> RISK 1
//   action lane (back)   transactions ride a track from the core to an
//                        execution tool; the checkpoint slot is empty -> RISK 2
//   event node (front)   emits events that land nowhere; the ledger
//                        footprint is empty                     -> RISK 3

import * as THREE from "three";
import { core, module, conduit, wall, track, tile, gate, ledger, marker, emissive, obsidian, spill, rbox } from "../kit.js";
import { C, clamp, lerp } from "../util.js";

const hdr = (hex, k) => new THREE.Color(hex).multiplyScalar(k);

// Thin emissive bar between two points on the floor (for outlines / dashes).
function bar(a, b, th, mat, y = 0.012) {
  const A = new THREE.Vector3(a[0], y, a[1]),
    B = new THREE.Vector3(b[0], y, b[1]);
  const m = new THREE.Mesh(new THREE.BoxGeometry(th, th * 0.5, A.distanceTo(B)), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.lookAt(B);
  return m;
}
export function dashedRect(w, d, mat, o = {}) {
  const g = new THREE.Group();
  const dash = o.dash ?? 0.22,
    gap = o.gap ?? 0.14,
    th = o.th ?? 0.03;
  const edge = (x0, z0, x1, z1) => {
    const L = Math.hypot(x1 - x0, z1 - z0);
    for (let s = 0; s < L - 0.01; s += dash + gap) {
      const e = Math.min(L, s + dash);
      g.add(bar([x0 + ((x1 - x0) * s) / L, z0 + ((z1 - z0) * s) / L], [x0 + ((x1 - x0) * e) / L, z0 + ((z1 - z0) * e) / L], th, mat, o.y ?? 0.012));
    }
  };
  edge(-w / 2, -d / 2, w / 2, -d / 2);
  edge(w / 2, -d / 2, w / 2, d / 2);
  edge(w / 2, d / 2, -w / 2, d / 2);
  edge(-w / 2, d / 2, -w / 2, -d / 2);
  return g;
}
// Corner brackets around a footprint (isolation frame).
export function brackets(w, d, mat, L = 0.35, th = 0.035, y = 0.02) {
  const g = new THREE.Group();
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const x = (sx * w) / 2,
      z = (sz * d) / 2;
    g.add(bar([x, z], [x - sx * L, z], th, mat, y));
    g.add(bar([x, z], [x, z - sz * L], th, mat, y));
  }
  return g;
}

let _grid;
function gridTex() {
  if (_grid) return _grid;
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = 2;
  g.strokeRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(255,255,255,0.18)";
  g.lineWidth = 1.2;
  for (let i = 1; i < 4; i++) {
    g.beginPath();
    g.moveTo(i * 128, 0);
    g.lineTo(i * 128, 512);
    g.moveTo(0, i * 128);
    g.lineTo(512, i * 128);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 16;
  return (_grid = t);
}

export const RISK = [
  [-2.25, -0.95], // risk 1: data leaves the boundary unchecked
  [3.9, -2.75], // risk 2: empty checkpoint on the action lane
  [4.4, 2.5], // risk 3: events with no evidence record
];

export function buildMap(scene, o = {}) {
  const M = { risks: [], markers: [], outlines: [], hidden: [], tiles: [], walls: [], links: [] };
  // platform with an engineering grid
  const plat = new THREE.Mesh(rbox(17.5, 0.16, 11, 0.05, 3), new THREE.MeshLambertMaterial({ color: 0x101112 }));
  plat.position.y = -0.08;
  plat.receiveShadow = true;
  scene.add(plat);
  const gridM = new THREE.MeshBasicMaterial({ map: gridTex(), color: hdr(0xbfe8d2, o.grid ?? 0.14), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  gridM.map.repeat.set(17.5 / 2, 11 / 2);
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(17.5, 11), gridM);
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = 0.003;
  scene.add(grid);
  M.grid = gridM;

  // core
  const c = core({ size: 0.95, pedH: 0.36 });
  c.position.set(0.6, 0, 0);
  scene.add(c);
  c.set({ energy: 1 });
  M.core = c;

  // data zone: three walls present, right side missing
  const zone = { x0: -7.0, x1: -2.25, z0: -3.2, z1: 3.2 };
  const addWall = (len, x, z, ry) => {
    const w = wall(len, { H: 1.0, glow: 3 });
    w.position.set(x, 0, z);
    w.rotation.y = ry;
    scene.add(w);
    M.walls.push(w);
    return w;
  };
  addWall(zone.z1 - zone.z0, zone.x0, 0, Math.PI / 2);
  addWall(zone.x1 - zone.x0, (zone.x0 + zone.x1) / 2, zone.z0, 0);
  addWall(zone.x1 - zone.x0, (zone.x0 + zone.x1) / 2, zone.z1, 0);
  // where the missing wall should be
  const ghostMat = emissive(C.amber, 0, { transparent: true, additive: true });
  M.ghostWall = dashedRect(0.001, zone.z1 - zone.z0, ghostMat, { dash: 0.3, gap: 0.2, th: 0.03 });
  M.ghostWall.position.set(zone.x1, 0, 0);
  M.ghostMat = ghostMat;
  scene.add(M.ghostWall);

  const dataMods = [
    ["database", -5.3, -1.5],
    ["lock", -5.3, 1.6],
  ];
  M.dataLinks = [];
  for (const [icon, x, z] of dataMods) {
    const m = module(icon, { tile: { bodyGlow: 0.8 } });
    m.position.set(x, 0, z);
    m.rotation.y = Math.PI / 2;
    m.scale.setScalar(0.85);
    scene.add(m);
    M.tiles.push(m);
    const k = conduit([x + 0.75, 0.16, z * 0.98], [0.0, 0.16, z * 0.25], { packets: 3, w: 0.18, h: 0.11, spec: 0.25, roughness: 0.32 });
    scene.add(k);
    M.dataLinks.push(k);
    M.links.push(k);
  }

  // action lane
  const lane = track(5.6, { w: 1.0, glow: 2.2, chevronGap: 1.2 });
  lane.rotation.y = Math.PI / 2;
  lane.position.set(4.3, 0, -2.75);
  scene.add(lane);
  M.lane = lane;
  const feed = conduit([1.1, 0.16, -0.5], [1.55, 0.16, -2.75], { packets: 1, w: 0.16, h: 0.1, spec: 0.25, roughness: 0.32 });
  scene.add(feed);
  M.links.push(feed);
  const tool = module("terminal");
  tool.position.set(7.95, 0, -2.75);
  tool.rotation.y = -Math.PI / 2;
  tool.scale.setScalar(0.9);
  scene.add(tool);
  M.tiles.push(tool);
  M.tool = tool;
  // transactions riding the lane
  M.tx = [];
  for (let i = 0; i < 4; i++) {
    const t = tile("gear", { w: 0.46, h: 0.46, d: 0.12, glow: 3 });
    t.rotation.y = Math.PI / 2;
    scene.add(t);
    M.tx.push(t);
  }
  const slotMat = emissive(C.amber, 0, { transparent: true, additive: true });
  M.slot = dashedRect(1.25, 1.35, slotMat, { y: 0.17, dash: 0.16, gap: 0.1, th: 0.028 });
  M.slot.position.set(RISK[1][0], 0, RISK[1][1]);
  M.slotMat = slotMat;
  scene.add(M.slot);

  // event node
  const ev = module("pulse");
  ev.position.set(RISK[2][0], 0, RISK[2][1]);
  ev.rotation.y = -0.3;
  ev.scale.setScalar(0.9);
  scene.add(ev);
  M.tiles.push(ev);
  M.event = ev;
  const evLink = conduit([1.0, 0.16, 0.5], [RISK[2][0] - 0.6, 0.16, RISK[2][1] - 0.2], { packets: 2, w: 0.16, h: 0.1, spec: 0.25, roughness: 0.32 });
  scene.add(evLink);
  M.links.push(evLink);
  // event rings that go nowhere
  M.rings = [];
  for (let i = 0; i < 3; i++) {
    const rm = emissive(0xd8ffe9, 0, { transparent: true, additive: true });
    const r = new THREE.Mesh(new THREE.RingGeometry(1, 1.03, 96), rm);
    r.rotation.x = -Math.PI / 2;
    r.position.set(RISK[2][0], 0.02, RISK[2][1]);
    scene.add(r);
    M.rings.push(r);
  }
  const ledgerMat = emissive(C.amber, 0, { transparent: true, additive: true });
  M.ledgerSlot = dashedRect(1.2, 0.95, ledgerMat, { dash: 0.16, gap: 0.1, th: 0.028 });
  M.ledgerSlot.position.set(6.55, 0, 2.5);
  M.ledgerMat = ledgerMat;
  scene.add(M.ledgerSlot);

  // risk markers
  for (const [x, z] of RISK) {
    const mk = marker({ r: 0.55, lineH: 1.6 });
    mk.position.set(x, 0, z);
    scene.add(mk);
    mk.set({ a: 0 });
    M.markers.push(mk);
  }

  // hidden connection revealed by the scan: tool reaches back into the data zone
  const hidMat = emissive(0xf2f6f4, 0, { transparent: true, additive: true });
  const hp = [
    [7.4, -2.2],
    [6.2, -1.2],
    [2.0, -1.2],
    [-1.2, -0.4],
    [-4.6, -1.3],
  ];
  const hid = new THREE.Group();
  for (let i = 0; i < hp.length - 1; i++) {
    const a = hp[i],
      b = hp[i + 1];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = 0; s < L; s += 0.36) {
      const e = Math.min(L, s + 0.2);
      hid.add(bar([a[0] + ((b[0] - a[0]) * s) / L, a[1] + ((b[1] - a[1]) * s) / L], [a[0] + ((b[0] - a[0]) * e) / L, a[1] + ((b[1] - a[1]) * e) / L], 0.035, hidMat, 0.06));
    }
  }
  scene.add(hid);
  M.hiddenMat = hidMat;

  // isolation brackets around each risk
  M.brackets = RISK.map(([x, z], i) => {
    const bm = emissive(0xf7f7f5, 0, { transparent: true, additive: true });
    const b = brackets(i === 0 ? 1.5 : 1.6, i === 0 ? 2.6 : 1.6, bm);
    b.position.set(x, 0, z);
    scene.add(b);
    return { b, bm };
  });

  // state setters
  M.setRisk = (i, a, pulse = 0, grow = 1) => {
    M.markers[i].set({ a, pulse, grow });
  };
  M.animate = (t, o2 = {}) => {
    M.links.forEach((k, i) => k.set({ phase: t * 0.55 + i * 0.21 }));
    M.dataLinks.forEach((k) => k.set({ color: o2.leak ? C.amber : C.emeraldHi, glow: 1.4, packetGlow: 8 }));
    // transactions loop along the lane, straight through the empty slot
    M.tx.forEach((tx, i) => {
      const u = (((t * 0.32 + i / M.tx.length) % 1) + 1) % 1;
      tx.position.set(lerp(1.75, 7.2, u), 0.16 + 0.25, -2.75);
      tx.visible = u < 0.985;
    });
    M.rings.forEach((r, i) => {
      const u = (((t * 0.7 + i / 3) % 1) + 1) % 1;
      r.scale.setScalar(0.4 + u * 1.8);
      r.material.color.copy(hdr(o2.ringColor ?? 0xd8ffe9, (o2.ringK ?? 1.6) * (1 - u)));
    });
    c.set({ energy: 1, ring: ((t * 0.9) % 1) * 1.4 });
  };
  return M;
}
