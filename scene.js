// Night Market: a rain-soaked alley of neon food stalls. Buildings rise on both sides, wires
// carry lanterns over the alley, steam comes off the pots, a neon gate at the entrance and a
// phone kiosk at the end. Stalls, lanterns and the kiosk react to the page's hovers.
import * as THREE from 'three';
import * as K from './kit.js';

const PINK = '#ff3fa8'; const CYAN = '#5fe9ff'; const ORANGE = '#ff9a3c'; const GREEN = '#7cf29a';
const ALLEY = { half: 3.4, start: 8, end: -32 };
const WOOD = new THREE.MeshStandardMaterial({ color: 0x4a3222, roughness: 0.7 });
const DARKWOOD = new THREE.MeshStandardMaterial({ color: 0x2c1d14, roughness: 0.7 });
const TIN = new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.45, metalness: 0.7 });
const CONCRETE = new THREE.MeshStandardMaterial({ color: 0x23262c, roughness: 0.95 });
const PLASTIC = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
const PAPER = (c, k = 1.0) => new THREE.MeshStandardMaterial({ color: 0x1a1008, emissive: c, emissiveIntensity: k, roughness: 0.9 });

export const STOPS = {
  hero: { eye: [0, 1.9, 9.2], look: [0, 1.7, -8] },
  about: { eye: [-0.9, 1.65, 0.6], look: [3.4, 1.5, -2.2] },
  skills: { eye: [-1.3, 1.5, -8.75], look: [-4.2, 2.0, -9.3] },
  projects: { eye: [-0.6, 1.62, -12.2], look: [1.05, 2.3, -14.6] },
  contact: { eye: [-0.2, 1.65, -26.4], look: [-1.0, 1.45, -30.4] },
};
export const PROJECTS = [
  { no: '01', name: 'MEDI-O', kind: 'SECURE ONLINE PHARMACY', color: 0xff9a3c },
  { no: '02', name: 'HOUR MARKERS', kind: 'WATCH STORE', color: 0xffd166 },
  { no: '03', name: 'MA CHERI', kind: 'JEWELRY STORE', color: 0xff3fa8 },
  { no: '04', name: 'MUNASINGHE INTL', kind: 'EXPORT BUSINESS', color: 0x7cf29a },
  { no: '05', name: 'SERANDI', kind: 'JEWELRY STORE', color: 0x5fe9ff },
];
export const LANTERNS = [[1.25, -14.6], [1.55, -17.2], [1.2, -19.8], [1.5, -22.4], [1.3, -25.0]];   // x, z along the right side
const MENU = [
  { title: 'MAINS', color: PINK, items: [['PHP', 'back end'], ['HTML', 'structure'], ['CSS', 'style'], ['JAVASCRIPT', 'interaction'], ['NODE.JS', 'services'], ['REACT', 'interfaces'], ['PYTHON', 'scripts & data']] },
  { title: 'SIDES', color: CYAN, items: [['MYSQL', 'data'], ['WORDPRESS', 'sites'], ['GIT', 'versions']] },
  { title: 'DESIGN', color: GREEN, items: [['FIGMA', 'layouts'], ['CANVA', 'visuals']] },
  { title: 'AI SPECIALS', color: ORANGE, items: [['CLAUDE CODE', 'builds with me'], ['CHATGPT', 'drafts & reviews']] },
];

const awningTexture = (a, b) => {
  const tex = K.canvasTexture(256, 64, (ctx, w, h) => { for (let i = 0; i < 8; i += 1) { ctx.fillStyle = i % 2 ? a : b; ctx.fillRect(i * 32, 0, 32, h); } ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, h - 8, w, 8); });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 1);
  return tex;
};
const windowTexture = () => {
  const tex = K.canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#0c0e14'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#15181f'; for (let y = 0; y < h; y += 64) ctx.fillRect(0, y + 56, w, 8);
    for (let y = 10; y < h; y += 64) for (let x = 10; x < w; x += 44) {
      const r = Math.random();
      if (r < 0.45) { ctx.fillStyle = r < 0.12 ? '#ffb070' : r < 0.25 ? '#5fe9ff' : '#ffe6c8'; ctx.globalAlpha = 0.25 + Math.random() * 0.6; ctx.fillRect(x, y, 26, 34); ctx.globalAlpha = 1; }
      else { ctx.fillStyle = '#05060a'; ctx.fillRect(x, y, 26, 34); }
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
};

export function buildScene() {
  const group = new THREE.Group();
  const lanterns = [];       // { mesh, mat, base, k, swing }
  const projectLanterns = [];
  const neons = [];
  const steams = [];
  const stallLights = [];

  /* ---------- ground: wet asphalt with puddles ---------- */
  const asphalt = K.canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#15171c'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i += 1) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`; ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3; for (let i = 0; i <= 4; i += 1) { ctx.beginPath(); ctx.moveTo(0, i * 128); ctx.lineTo(w, i * 128); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i * 128, 0); ctx.lineTo(i * 128, h); ctx.stroke(); }
  });
  asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping; asphalt.repeat.set(4, 22);
  const ground = K.plane(9, 46, new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.28, metalness: 0.45 }), 0, 0, -12);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; group.add(ground);
  const puddleMat = new THREE.MeshStandardMaterial({ color: 0x0b0d12, roughness: 0.03, metalness: 0.9, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 22; i += 1) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(1, 20), puddleMat);
    p.rotation.x = -Math.PI / 2; p.position.set((Math.random() - 0.5) * 5.5, 0.006, 6 - i * 1.8 - Math.random()); p.scale.set(0.5 + Math.random() * 0.9, 0.3 + Math.random() * 0.5, 1);
    group.add(p);
  }
  // kerbs and drains
  [-1, 1].forEach((s) => { group.add(K.box(0.3, 0.12, 46, CONCRETE, s * 3.55, 0.06, -12)); for (let z = 6; z > -32; z -= 4) group.add(K.box(0.5, 0.02, 0.7, TIN, s * 2.9, 0.005, z)); });

  /* ---------- buildings on both sides ---------- */
  const winTex = windowTexture();
  [-1, 1].forEach((s) => {
    const wallX = s * 4.7;
    group.add(K.box(1.4, 11, 46, CONCRETE, wallX + s * 0.7, 5.5, -12));
    const wm = new THREE.MeshStandardMaterial({ color: 0x0c0e14, roughness: 0.85, emissive: 0xffffff, emissiveMap: winTex.clone(), emissiveIntensity: 0.9 });
    wm.emissiveMap.repeat.set(9, 3); wm.emissiveMap.needsUpdate = true;
    const face = K.plane(46, 8, wm, wallX - s * 0.01, 6.9, -12); face.rotation.y = -s * Math.PI / 2; group.add(face);
    // balconies, AC units, pipes
    for (let i = 0; i < 9; i += 1) {
      const z = 5 - i * 4.2;
      if (i % 2 === 0) { group.add(K.box(0.7, 0.08, 1.6, CONCRETE, wallX - s * 0.35, 3.3 + (i % 3) * 2.4, z)); for (let r = 0; r < 5; r += 1) group.add(K.box(0.02, 0.6, 0.02, TIN, wallX - s * 0.7, 3.62 + (i % 3) * 2.4, z - 0.7 + r * 0.35)); group.add(K.box(0.02, 0.02, 1.5, TIN, wallX - s * 0.7, 3.92 + (i % 3) * 2.4, z)); }
      const ac = K.box(0.5, 0.42, 0.5, TIN, wallX - s * 0.3, 2.9 + (i * 1.3) % 4, z + 1.2); group.add(ac);
      group.add(K.cyl(0.19, 0.19, 0.02, K.MAT.black, wallX - s * 0.56, 2.9 + (i * 1.3) % 4, z + 1.2, 16).rotateZ(Math.PI / 2));
      group.add(K.cyl(0.04, 0.04, 9, TIN, wallX - s * 0.15, 4.5, z - 1.5));
    }
  });
  // wires across the alley with lanterns and cables
  const lanternMats = [PAPER(0xff4a2a, 1.4), PAPER(0xffa030, 1.3), PAPER(0xff3fa8, 1.2), PAPER(0xffd166, 1.3)];
  const lanternGeo = new THREE.SphereGeometry(0.16, 16, 12); lanternGeo.scale(1, 1.25, 1);
  for (let z = 5; z > -30; z -= 3) {
    group.add(K.cyl(0.008, 0.008, 7.4, K.MAT.black, 0, 3.5, z).rotateZ(Math.PI / 2));
    group.add(K.cyl(0.006, 0.006, 7.4, K.MAT.black, 0, 3.9, z + 0.4).rotateZ(Math.PI / 2));
    const n = 4;
    for (let i = 0; i < n; i += 1) {
      if (z <= -13 && z >= -22 && i >= 2) continue;     // the project lanterns hang on the right side here
      const x = -2.4 + i * 1.6 + (Math.random() - 0.5) * 0.4;
      const m = new THREE.Mesh(lanternGeo, lanternMats[(i + Math.abs(z)) % 4]);
      m.position.set(x, 3.15, z); group.add(m);
      group.add(K.cyl(0.004, 0.004, 0.16, K.MAT.black, x, 3.42, z));
      group.add(K.cyl(0.03, 0.03, 0.03, K.MAT.black, x, 2.94, z, 8));
      lanterns.push({ mesh: m, k: 0, seed: Math.random() * 10 });
    }
  }
  // the five project lanterns: bigger, numbered, along the right side of the alley, each with a poster hanging under it
  const bigGeo = new THREE.SphereGeometry(0.34, 24, 16); bigGeo.scale(1, 1.2, 1);
  const posterPainter = (pr) => (ctx, w, h) => {
    const c = '#' + pr.color.toString(16).padStart(6, '0');
    ctx.fillStyle = '#f0e6c8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 400; i += 1) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    ctx.fillStyle = c; ctx.fillRect(0, 0, w, h * 0.09);
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillStyle = '#1a1206'; ctx.font = `800 ${h * 0.2}px ${K.FONT}`; ctx.letterSpacing = '2px'; ctx.fillText(pr.no, w * 0.08, h * 0.24);
    ctx.font = `800 ${h * 0.085}px ${K.FONT}`; ctx.fillText(pr.name, w * 0.08, h * 0.4, w * 0.84);
    ctx.fillStyle = c; ctx.font = `700 ${h * 0.05}px ${K.FONT}`; ctx.letterSpacing = '3px'; ctx.fillText(pr.kind, w * 0.08, h * 0.49, w * 0.84);
    // a little mock of the site
    ctx.fillStyle = '#1a1206'; ctx.fillRect(w * 0.08, h * 0.57, w * 0.84, h * 0.34);
    ctx.fillStyle = c; ctx.fillRect(w * 0.1, h * 0.59, w * 0.8, h * 0.05);
    ctx.fillStyle = '#f0e6c8'; ctx.globalAlpha = 0.85; ctx.fillRect(w * 0.1, h * 0.67, w * 0.42, h * 0.1); ctx.globalAlpha = 0.35; ctx.fillRect(w * 0.1, h * 0.8, w * 0.8, h * 0.03); ctx.fillRect(w * 0.1, h * 0.85, w * 0.6, h * 0.03); ctx.globalAlpha = 1;
    [0.55, 0.68, 0.81].forEach((x) => { ctx.fillStyle = c; ctx.globalAlpha = 0.7; ctx.fillRect(w * x, h * 0.67, w * 0.1, h * 0.1); ctx.globalAlpha = 1; });
    ctx.fillStyle = '#1a1206'; ctx.font = `700 ${h * 0.04}px ${K.FONT}`; ctx.letterSpacing = '3px'; ctx.textAlign = 'center'; ctx.fillText('LIVE \u00b7 OPEN THE SITE', w / 2, h * 0.955);
  };
  LANTERNS.forEach(([x, z], i) => {
    const pr = PROJECTS[i];
    group.add(K.cyl(0.008, 0.008, 7.4, K.MAT.black, 0, 3.55, z).rotateZ(Math.PI / 2));
    const hang = new THREE.Group(); hang.position.set(x, 3.55, z); group.add(hang);
    const mat = PAPER(pr.color, 1.1);
    const m = new THREE.Mesh(bigGeo, mat); m.position.set(0, -0.6, 0); hang.add(m);
    hang.add(K.cyl(0.005, 0.005, 0.2, K.MAT.black, 0, -0.1, 0));
    hang.add(K.cyl(0.05, 0.06, 0.04, K.MAT.black, 0, -0.19, 0, 10)); hang.add(K.cyl(0.05, 0.06, 0.04, K.MAT.black, 0, -1.01, 0, 10));
    const tag = K.label(pr.no, { w: 0.22, h: 0.14, color: '#1a1206', bg: '#f0e6c8', size: 0.7 }); tag.position.set(0, -1.14, 0.02); hang.add(tag);
    [-0.25, 0.25].forEach((dx) => hang.add(K.cyl(0.003, 0.003, 0.34, K.MAT.black, dx, -1.4, 0)));
    const poster = K.screen(0.8, 1.0, posterPainter(pr), { res: 512, glow: '#' + pr.color.toString(16).padStart(6, '0'), glowScale: 1.08, intensity: 0.35 });
    poster.group.position.set(0, -2.08, 0); hang.add(poster.group);
    hang.add(K.box(0.84, 1.04, 0.02, DARKWOOD, 0, -2.08, -0.015));
    hang.add(K.cyl(0.01, 0.01, 0.86, WOOD, 0, -1.57, 0.005).rotateZ(Math.PI / 2));
    hang.add(K.cyl(0.01, 0.01, 0.86, WOOD, 0, -2.59, 0.005).rotateZ(Math.PI / 2));
    projectLanterns.push({ hang, mesh: m, mat, poster, k: 0, x, z });
  });
  const lanternLight = K.pointLight(0xffb060, 0, 5, 0, 2.6, -17.4); group.add(lanternLight);
  const projectsSign = K.neon('TONIGHT \u00b7 FIVE LANTERNS', { w: 3.4, h: 0.4, color: ORANGE, size: 0.62 });
  projectsSign.group.position.set(0, 4.3, -12.9); group.add(projectsSign.group); neons.push(projectsSign);

  const steamTex = K.canvasTexture(64, 64, (ctx, w, h) => { const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
  /* ---------- a stall ---------- */
  const stall = ({ x, z, side, name, color, menu = null, banner = null, id = null, bigMenu = null }) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    const stripe = awningTexture(color, '#f0e6c8');
    g.add(K.box(3.0, 0.9, 0.7, DARKWOOD, 0, 0.45, 0.4));
    g.add(K.box(3.1, 0.06, 0.8, WOOD, 0, 0.93, 0.4));
    g.add(K.box(3.0, 0.5, 0.05, PLASTIC(color), 0, 0.42, 0.76));
    g.add(K.box(3.2, 2.7, 0.15, WOOD, 0, 1.35, -0.7));
    if (!bigMenu) for (let s = 0; s < 3; s += 1) { g.add(K.box(2.8, 0.03, 0.3, WOOD, 0, 1.1 + s * 0.45, -0.5)); for (let b = 0; b < 7; b += 1) g.add(K.cyl(0.04, 0.04, 0.2 + (b % 3) * 0.05, PLASTIC([0x8a2a1a, 0x2a6a3a, 0xd4a040, 0x3a4a8a][(b + s) % 4]), -1.2 + b * 0.4, 1.22 + s * 0.45, -0.5, 10)); }
    const awning = K.box(3.5, 0.04, 1.8, new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.9, side: THREE.DoubleSide }), 0, 2.4, 0.35); awning.rotation.x = 0.22; g.add(awning);
    g.add(K.box(3.5, 0.18, 0.03, PLASTIC(color), 0, 2.1, 1.22));
    [-1.65, 1.65].forEach((px) => g.add(K.cyl(0.03, 0.03, 2.2, TIN, px, 1.1, 1.15)));
    const sign = K.neon(name, { w: 2.2, h: 0.42, color, size: 0.64 }); sign.group.position.set(0, bigMenu ? 2.42 : 1.85, 1.24); g.add(sign.group); neons.push(sign);
    for (let l = 0; l < 6; l += 1) g.add(K.led(0xffd9a0, 0.018, -1.4 + l * 0.56, 2.0, 0.9));
    const potX = bigMenu ? 1.28 : 0.7; const potR = bigMenu ? 0.17 : 0.24;
    g.add(K.cyl(potR, potR * 0.85, 0.3, TIN, potX, 1.1, 0.35, 20)); g.add(K.cyl(potR - 0.02, potR - 0.02, 0.02, K.MAT.black, potX, 1.26, 0.35, 20));
    g.add(K.box(potR * 2.4, 0.1, 0.5, K.MAT.darkSteel, potX, 0.98, 0.35));
    for (let b = 0; b < 4; b += 1) g.add(K.cyl(0.08, 0.05, 0.06, PLASTIC(0xe8e0d0), -1.1 + b * 0.28, 0.99, 0.55, 12));
    g.add(K.box(0.4, 0.3, 0.3, PLASTIC(0xb3121b), -1.2, 1.1, 0.2));
    g.add(K.cyl(0.14, 0.14, 0.04, DARKWOOD, 0.9, 0.45, 1.5, 12)); g.add(K.cyl(0.02, 0.02, 0.43, TIN, 0.9, 0.22, 1.5));
    g.add(K.box(0.5, 0.4, 0.5, WOOD, -1.9, 0.2, 1.1)); g.add(K.box(0.5, 0.4, 0.5, WOOD, -1.9, 0.6, 1.1).rotateY(0.2));
    const lamp = K.pointLight(0xffc890, 3.5, 5.5, 0, 2.0, 0.8); g.add(lamp); stallLights.push(lamp);
    const hang = new THREE.Mesh(lanternGeo, PAPER(0xff4a2a, 1.3)); hang.position.set(1.5, 1.95, 1.2); g.add(hang); lanterns.push({ mesh: hang, k: 0, seed: Math.random() * 10 });
    if (bigMenu) {
      // the menu: a lit board hung on two chains from the awning bar, big enough to read from the alley
      const board = K.screen(2.7, 1.3, bigMenu, { res: 760, glow: color, glowScale: 1.04, intensity: 1.45 });
      board.group.position.set(0, 1.85, -0.55); g.add(board.group); g.userData.board = board;
      g.add(K.box(2.8, 1.4, 0.06, DARKWOOD, 0, 1.85, -0.59));
      g.add(K.box(2.8, 0.05, 0.08, WOOD, 0, 2.53, -0.58)); g.add(K.box(2.8, 0.05, 0.08, WOOD, 0, 1.17, -0.58));
      [-1.25, 1.25].forEach((cx) => { g.add(K.cyl(0.008, 0.008, 0.32, TIN, cx, 2.68, -0.56)); g.add(K.cyl(0.02, 0.02, 0.02, TIN, cx, 2.84, -0.56)); });
      g.add(K.box(3.2, 0.06, 0.1, TIN, 0, 2.86, -0.56));
      [-0.9, 0.9].forEach((lx) => { g.add(K.cyl(0.08, 0.14, 0.12, TIN, lx, 2.72, 0.1, 16)); g.add(K.led(0xffe0b0, 0.03, lx, 2.66, 0.1)); g.add(K.pointLight(0xffe0b0, 2.2, 2.6, lx, 2.55, 0.0)); });
    } else if (menu) { const board = K.screen(1.3, 0.9, menu, { res: 256, glow: color, glowScale: 1.1, intensity: 1.3 }); board.group.position.set(-0.6, 1.75, -0.6); g.add(board.group); g.userData.board = board; }
    else { const board = K.screen(1.0, 0.7, (ctx, w, h) => { ctx.fillStyle = '#120c08'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = color; ctx.font = `700 ${h * 0.14}px ${K.FONT}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.letterSpacing = '3px'; ctx.fillText(name, w * 0.06, h * 0.14); ctx.fillStyle = '#f0e6c8'; ctx.font = `600 ${h * 0.11}px ${K.FONT}`; ['SMALL  ·  350', 'LARGE  ·  550', 'EXTRA  ·  120', 'TEA  ·  150'].forEach((l, i) => ctx.fillText(l, w * 0.06, h * (0.36 + i * 0.16))); }, { res: 128, glow: color, glowScale: 1.1 }); board.group.position.set(-0.6, 1.75, -0.6); g.add(board.group); }
    if (banner) { const b = K.label(banner, { w: 2.6, h: 0.22, color: '#f0e6c8', bg: '#1a0e08', size: 0.6 }); b.position.set(0, 2.62, 0.95); b.rotation.x = -0.2; g.add(b); }
    // steam over the pot
    const n = 40; const spread = bigMenu ? 0.12 : 0.25; const arr = new Float32Array(n * 3); for (let i = 0; i < n; i += 1) { arr[i * 3] = potX + (Math.random() - 0.5) * spread; arr[i * 3 + 1] = 1.3 + Math.random() * 0.9; arr[i * 3 + 2] = 0.35 + (Math.random() - 0.5) * 0.25; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: bigMenu ? 0.07 : 0.11, map: steamTex, transparent: true, opacity: bigMenu ? 0.1 : 0.2, depthWrite: false })); g.add(pts); steams.push({ pts, arr, n, x0: potX, spread });
    g.userData.id = id;
    group.add(g);
    return g;
  };
  const menuPainter = (ctx, w, h) => {
    ctx.fillStyle = '#120d08'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; for (let i = 0; i < 900; i += 1) ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    ctx.strokeStyle = '#d4a040'; ctx.lineWidth = 6; ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.strokeStyle = 'rgba(212,160,64,0.35)'; ctx.lineWidth = 2; ctx.strokeRect(26, 26, w - 52, h - 52);
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.fillStyle = '#d4a040'; ctx.font = `800 ${h * 0.085}px ${K.FONT}`; ctx.letterSpacing = '8px';
    ctx.fillText("NOODLE BAR \u00b7 TONIGHT'S MENU", w / 2, h * 0.1);
    ctx.fillStyle = '#8a94a8'; ctx.font = `600 ${h * 0.036}px ${K.FONT}`; ctx.letterSpacing = '4px';
    ctx.fillText('SAMATHRI ABHAYAPALA \u00b7 EVERYTHING COOKED TO ORDER', w / 2, h * 0.17);
    ctx.textAlign = 'left';
    const colX = [w * 0.05, w * 0.4, w * 0.72];
    const layout = [[0], [1, 2], [3]];   // MAINS | SIDES + DESIGN | AI SPECIALS
    layout.forEach((secs, c) => {
      let y = h * 0.27;
      secs.forEach((si) => {
        const sec = MENU[si];
        ctx.fillStyle = sec.color; ctx.font = `800 ${h * 0.055}px ${K.FONT}`; ctx.letterSpacing = '5px';
        ctx.fillText(sec.title, colX[c], y);
        ctx.fillRect(colX[c], y + h * 0.035, w * 0.06, 3);
        y += h * 0.085;
        sec.items.forEach(([name, note]) => {
          ctx.fillStyle = '#f4ecd8'; ctx.font = `700 ${h * 0.056}px ${K.FONT}`; ctx.letterSpacing = '2px';
          ctx.fillText(name, colX[c], y);
          const nw = ctx.measureText(name).width;
          ctx.font = `500 ${h * 0.036}px ${K.FONT}`; ctx.letterSpacing = '1px';
          const noteW = ctx.measureText(note.toUpperCase()).width;
          const colW = c === 0 ? w * 0.3 : w * 0.24;
          if (nw + noteW + 40 <= colW) {
            ctx.fillStyle = 'rgba(212,160,64,0.45)';
            for (let dx = colX[c] + nw + 14; dx < colX[c] + colW - noteW - 14; dx += 12) ctx.fillRect(dx, y + 4, 4, 4);
            ctx.fillStyle = '#b8c0cc'; ctx.textAlign = 'right'; ctx.fillText(note.toUpperCase(), colX[c] + colW, y + 3); ctx.textAlign = 'left';
            y += h * 0.078;
          } else {
            ctx.fillStyle = '#b8c0cc'; ctx.fillText(note.toUpperCase(), colX[c], y + h * 0.045);
            y += h * 0.1;
          }
        });
        y += h * 0.05;
      });
      if (c === 2) {
        ctx.fillStyle = '#d4a040'; ctx.font = `800 ${h * 0.045}px ${K.FONT}`; ctx.letterSpacing = '4px'; ctx.fillText("CHEF'S NOTE", colX[2], y + h * 0.02);
        ctx.fillStyle = '#b8c0cc'; ctx.font = `500 ${h * 0.032}px ${K.FONT}`; ctx.letterSpacing = '0.5px';
        ['EVERY DISH IS REVIEWED', 'BEFORE IT LEAVES THE KITCHEN', 'BRIEFED \u00b7 BUILT \u00b7 CHECKED', 'AND ONLY THEN SHIPPED.'].forEach((l, i) => ctx.fillText(l, colX[2], y + h * (0.09 + i * 0.055)));
      }
    });
  };
  const noodles = stall({ x: -3.5, z: -9.2, side: -1, name: 'NOODLES', color: CYAN, bigMenu: menuPainter, id: 'skills' });
  const menuBoard = noodles.userData.board;
  stall({ x: 3.5, z: -8.0, side: 1, name: 'DUMPLINGS', color: ORANGE });
  stall({ x: -3.5, z: 2.6, side: -1, name: 'TEA HOUSE', color: GREEN });
  stall({ x: 3.5, z: -14.5, side: 1, name: 'RAMEN', color: '#ff4a2a' });
  stall({ x: -3.5, z: -15.5, side: -1, name: 'SKEWERS', color: '#ffd166' });
  stall({ x: 3.5, z: -21.5, side: 1, name: 'REPAIR', color: CYAN });
  stall({ x: -3.5, z: -22.5, side: -1, name: 'BAR', color: PINK });

  /* ---------- wall neon ---------- */
  const wallNeon = (text, color, x, y, z, vertical = false) => {
    const n = K.neon(text, { w: vertical ? 0.5 : 2.0, h: vertical ? 2.0 : 0.5, color, size: vertical ? 0.14 : 0.62 });
    if (vertical) { n.tubes.material.map = K.canvasTexture(128, 512, (ctx, w, h) => { ctx.font = `800 ${w * 0.62}px ${K.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = color; ctx.shadowBlur = 18; ctx.fillStyle = color; [...text].forEach((ch, i) => ctx.fillText(ch, w / 2, h * (0.12 + i * (0.76 / Math.max(1, text.length - 1))))); ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.8; [...text].forEach((ch, i) => ctx.fillText(ch, w / 2, h * (0.12 + i * (0.76 / Math.max(1, text.length - 1))))); }); }
    n.group.position.set(x, y, z); n.group.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(n.group); neons.push(n);
    group.add(K.box(0.06, 0.06, vertical ? 0.4 : 0.06, TIN, x + (x < 0 ? 0.3 : -0.3), y + (vertical ? 1.1 : 0.4), z));
  };
  wallNeon('24H', ORANGE, -4.1, 3.6, 0.5);
  wallNeon('OPEN', GREEN, 4.1, 4.8, -4.5);
  wallNeon('KARAOKE', PINK, -4.1, 5.5, -12, true);
  wallNeon('LIVE', CYAN, 4.1, 3.4, -11);
  wallNeon('HOTEL', ORANGE, 4.1, 6.2, -19, true);
  wallNeon('TEA', GREEN, -4.1, 4.6, -6);
  wallNeon('NOODLE', PINK, -4.1, 6.4, -25, true);
  wallNeon('BAR', CYAN, 4.1, 3.8, -25.5);

  /* ---------- the gate ---------- */
  [-3.1, 3.1].forEach((x) => { group.add(K.cyl(0.14, 0.16, 4.6, PLASTIC(0x8a1c1c), x, 2.3, 4.6)); group.add(K.box(0.5, 0.1, 0.5, TIN, x, 0.05, 4.6)); });
  group.add(K.box(6.8, 0.35, 0.35, PLASTIC(0x8a1c1c), 0, 4.65, 4.6));
  group.add(K.box(7.2, 0.12, 0.6, TIN, 0, 4.95, 4.6));
  const gateSign = K.neon('NIGHT MARKET', { w: 4.6, h: 0.75, color: PINK, size: 0.68 }); gateSign.group.position.set(0, 3.85, 4.65); group.add(gateSign.group); neons.push(gateSign);
  const gateSub = K.neon('COLOMBO · OPEN ALL NIGHT', { w: 3.2, h: 0.36, color: CYAN, size: 0.62 }); gateSub.group.position.set(0, 3.2, 4.68);
  [-2.3, 2.3].forEach((x) => group.add(K.cyl(0.02, 0.02, 0.5, TIN, x, 4.3, 4.65))); group.add(gateSub.group); neons.push(gateSub);
  group.add(K.pointLight(0xff3fa8, 4, 8, 0, 5.2, 5.2));

  /* ---------- the end of the alley: wall, vending machine, the phone kiosk ---------- */
  group.add(K.box(9, 11, 0.6, CONCRETE, 0, 5.5, -32.3));
  const endSign = K.neon('OPEN 24H', { w: 3.2, h: 0.7, color: ORANGE, size: 0.66 }); endSign.group.position.set(-1.2, 4.2, -31.9); group.add(endSign.group); neons.push(endSign);
  const endSign2 = K.neon('CALL ME', { w: 1.8, h: 0.42, color: GREEN, size: 0.66 }); endSign2.group.position.set(1.9, 3.3, -31.9); group.add(endSign2.group); neons.push(endSign2);
  // vending machine
  group.add(K.box(0.95, 1.9, 0.75, PLASTIC(0x1a2a4a), -2.2, 0.95, -31.5));
  const vend = K.screen(0.7, 1.2, (ctx, w, h) => { ctx.fillStyle = '#0a1830'; ctx.fillRect(0, 0, w, h); for (let r = 0; r < 4; r += 1) for (let c = 0; c < 3; c += 1) { ctx.fillStyle = ['#ff4a2a', '#5fe9ff', '#ffd166', '#7cf29a', '#ff3fa8', '#f0e6c8'][(r * 3 + c) % 6]; ctx.fillRect(w * (0.1 + c * 0.3), h * (0.08 + r * 0.22), w * 0.2, h * 0.16); } ctx.fillStyle = '#f0e6c8'; ctx.font = `700 ${h * 0.05}px ${K.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('COLD DRINKS · 150', w / 2, h * 0.95); }, { res: 128, glow: CYAN, glowScale: 1.1 });
  vend.group.position.set(-2.2, 1.15, -31.11); group.add(vend.group);
  group.add(K.box(0.6, 0.2, 0.05, K.MAT.black, -2.2, 0.35, -31.11));
  // kiosk
  const kiosk = new THREE.Group(); kiosk.position.set(1.2, 0, -30.4); group.add(kiosk);
  kiosk.add(K.box(1.0, 0.1, 1.0, TIN, 0, 0.05, 0));
  [[-0.46, -0.46], [0.46, -0.46], [-0.46, 0.46], [0.46, 0.46]].forEach(([x, z]) => kiosk.add(K.box(0.08, 2.4, 0.08, PLASTIC(0x1a5a6a), x, 1.25, z)));
  kiosk.add(K.box(1.05, 0.14, 1.05, PLASTIC(0x1a5a6a), 0, 2.5, 0));
  const kg = new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, roughness: 0.05, transparent: true, opacity: 0.16, side: THREE.DoubleSide });
  kiosk.add(K.plane(0.9, 2.2, kg, 0, 1.25, -0.46)); kiosk.add(K.plane(0.9, 2.2, kg, -0.46, 1.25, 0).rotateY(Math.PI / 2)); kiosk.add(K.plane(0.9, 2.2, kg, 0.46, 1.25, 0).rotateY(-Math.PI / 2));
  kiosk.add(K.box(0.28, 0.38, 0.1, PLASTIC(0x0e2a3a), 0, 1.45, -0.4));
  kiosk.add(K.box(0.06, 0.24, 0.05, K.MAT.black, -0.08, 1.5, -0.33));
  kiosk.add(K.box(0.14, 0.14, 0.02, PLASTIC(0x9fd8ff), 0.06, 1.5, -0.34));
  kiosk.add(K.cyl(0.004, 0.004, 0.3, K.MAT.black, -0.1, 1.25, -0.33).rotateX(0.3));
  const kioskLed = K.led(0xff4d4d, 0.014, 0.1, 1.72, -0.34); kiosk.add(kioskLed);
  const kioskLight = K.pointLight(0x9fd8ff, 3, 3.5, 0, 2.2, 0); kiosk.add(kioskLight);
  const kioskSign = K.neon('PHONE', { w: 1.0, h: 0.34, color: CYAN, size: 0.66 }); kioskSign.group.position.set(0, 2.78, 0.2); kiosk.add(kioskSign.group); neons.push(kioskSign);
  const kioskTag = K.label('+94 76 717 0438', { w: 0.7, h: 0.09, color: '#f0e6c8', bg: '#0e2a3a', size: 0.6 }); kioskTag.position.set(0, 1.05, -0.33); kiosk.add(kioskTag);
  group.add(K.box(1.4, 0.06, 0.4, WOOD, -0.6, 0.45, -29.6)); [[-1.2, -29.5], [0, -29.5]].forEach(([x, z]) => group.add(K.box(0.05, 0.45, 0.4, TIN, x, 0.22, z)));
  group.add(K.plant(0.9, { x: 2.6, z: -29.6 }));

  /* ---------- rain and sky ---------- */
  const rain = (() => {
    const n = 1400; const pos = new Float32Array(n * 6); const spd = new Float32Array(n * 2);
    for (let i = 0; i < n; i += 1) { const x = (Math.random() - 0.5) * 8; const z = (Math.random() - 0.5) * 24; const y = Math.random() * 12; const len = 0.25 + Math.random() * 0.35; const s = 7 + Math.random() * 5; pos.set([x, y, z, x, y - len, z], i * 6); spd[i * 2] = s; spd[i * 2 + 1] = s; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSpeed', new THREE.BufferAttribute(spd, 1));
    const uniforms = { uT: { value: 0 }, uCamZ: { value: 0 } };
    const mat = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'uniform float uT, uCamZ; attribute float aSpeed; varying float vA; void main(){ vec3 p = position; p.y = mod(p.y - uT * aSpeed, 12.0); p.z += uCamZ - 6.0; vA = 0.5 + 0.5 * fract(p.x * 7.3); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
      fragmentShader: 'varying float vA; void main(){ gl_FragColor = vec4(0.65, 0.78, 0.95, 0.16 * vA); }' });
    const lines = new THREE.LineSegments(g, mat); lines.frustumCulled = false; group.add(lines);
    return uniforms;
  })();
  group.add(new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshBasicMaterial({ color: 0x090b14 })).translateY(12).translateZ(-45));

  /* ---------- behaviour ---------- */
  let hover = null; let ringK = 0; let ringing = false; let activeProject = -1;
  return {
    group, menuBoard,
    update(t, dt) {
      const e = 1 - Math.exp(-6 * dt);
      for (let i = 0; i < neons.length; i += 1) neons[i].flicker(t * (0.7 + (i % 5) * 0.13) + i);
      for (let i = 0; i < lanterns.length; i += 1) { const l = lanterns[i]; l.mesh.rotation.z = Math.sin(t * 0.9 + l.seed) * 0.06; l.mesh.rotation.x = Math.sin(t * 0.7 + l.seed * 2) * 0.05; }
      for (let i = 0; i < projectLanterns.length; i += 1) {
        const l = projectLanterns[i]; const want = activeProject === i ? 1 : 0; l.k += (want - l.k) * e;
        l.mat.emissiveIntensity = 0.8 + 2.0 * l.k; l.mesh.scale.setScalar(1 + 0.1 * l.k);
        l.poster.setPower(0.35 + 1.1 * l.k);
        l.hang.rotation.z = Math.sin(t * 1.1 + i) * (0.03 + 0.05 * l.k); l.hang.rotation.x = Math.sin(t * 0.8 + i * 2) * 0.03;
        if (activeProject === i) { lanternLight.position.set(l.x - 0.3, 2.4, l.z + 0.4); }
      }
      lanternLight.intensity = activeProject >= 0 ? 5 * projectLanterns[activeProject].k : 0;
      for (let i = 0; i < steams.length; i += 1) { const s = steams[i]; for (let j = 0; j < s.n; j += 1) { s.arr[j * 3 + 1] += dt * 0.35; s.arr[j * 3] += Math.sin(t * 2 + j) * dt * 0.05; if (s.arr[j * 3 + 1] > 2.3) { s.arr[j * 3 + 1] = 1.3; s.arr[j * 3] = s.x0 + (Math.random() - 0.5) * s.spread; } } s.pts.geometry.attributes.position.needsUpdate = true; }
      rain.uT.value = t;
      ringK += ((ringing ? 1 : 0) - ringK) * e;
      kioskLed.material.emissiveIntensity = 0.3 + ringK * (Math.sin(t * 14) > 0 ? 3 : 0.3);
      kioskLight.intensity = 3 + 4 * ringK * (0.6 + 0.4 * Math.sin(t * 9));
    },
    setHover(id) { hover = id; },
    setActiveProject(i) { activeProject = i; },
    setCameraZ(z) { rain.uCamZ.value = z; },
    ring(on) { ringing = !!on; },
  };
}
