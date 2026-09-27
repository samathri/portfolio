// Night Market: a rain-soaked alley of neon food stalls. Buildings rise on both sides, wires
// carry lanterns over the alley, steam comes off the pots, a neon gate with her name at the entrance,
// five project shops down the alley and a phone kiosk at the end.
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
// the noodle bar's kitchen
const BOWL = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.35 });
const BOWLRIM = new THREE.MeshStandardMaterial({ color: 0x2a4a8a, roughness: 0.4 });
const BROTH = new THREE.MeshStandardMaterial({ color: 0x8a4a12, roughness: 0.2, metalness: 0.1, emissive: 0x3a1a04, emissiveIntensity: 0.5 });
const NOODLE = new THREE.MeshStandardMaterial({ color: 0xf1dc9c, roughness: 0.6 });
const NOODLE_RAW = new THREE.MeshStandardMaterial({ color: 0xe9d493, roughness: 0.7 });
const BAMBOO = new THREE.MeshStandardMaterial({ color: 0xc9a465, roughness: 0.8 });
const BAMBOO_D = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.8 });
const DUMPLING = new THREE.MeshStandardMaterial({ color: 0xf6efe2, roughness: 0.5 });
const WOKMAT = new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.35, metalness: 0.8, side: THREE.DoubleSide });
const FLAME = new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.85, toneMapped: false });
const GLASS = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.25 });

// the five project shops line the alley, left and right in turn
export const SHOPS = [
  { x: -3.5, z: -14.2, side: -1 }, { x: 3.5, z: -16.9, side: 1 }, { x: -3.5, z: -19.6, side: -1 }, { x: 3.5, z: -22.3, side: 1 }, { x: -3.5, z: -25.0, side: -1 },
];
// where to stand to look at a shop: across the alley from it, level with the counter, the shop filling its own half of the frame
export function shopView(s, narrow = false) {
  if (narrow) return { eye: [0, 1.55, s.z + 3.4], look: [s.side * 2.2, 1.85, s.z - 0.4] };
  return { eye: [-s.side * 1.0, 1.55, s.z + 3.2], look: [s.side * 1.6, 1.7, s.z - 1.6] };
}
export const STOPS = {
  hero: { eye: [0, 1.75, 10.4], look: [0, 3.0, -1] },
  heroNarrow: { eye: [0, 1.75, 13.6], look: [0, 3.0, -1] },   // a phone is tall and narrow: stand further back so the name fits
  about: { eye: [-0.9, 1.65, 0.6], look: [3.4, 1.5, -2.2] },
  skills: { eye: [0.6, 1.45, -8.2], look: [-3.4, 1.5, -9.5] },   // the whole stall, awning to counter
  skillsNarrow: { eye: [0.9, 1.45, -9.1], look: [-3.5, 1.5, -9.3] },   // a phone: straight on, further back
  projects: shopView(SHOPS[0]),
  contact: { eye: [-0.2, 1.65, -26.4], look: [-1.0, 1.45, -30.4] },
};
export const PROJECTS = [
  { no: '01', name: 'MEDI-O', kind: 'SECURE ONLINE PHARMACY', color: 0xff9a3c, stack: ['PHP', 'MYSQL', 'AJAX', 'JQUERY'] },
  { no: '02', name: 'HOUR MARKERS', kind: 'WATCH STORE', color: 0xffd166, stack: ['PHP', 'JAVASCRIPT'] },
  { no: '03', name: 'MA CHERI', kind: 'JEWELRY STORE', color: 0xff3fa8, stack: ['PHP', 'JAVASCRIPT'] },
  { no: '04', name: 'MUNASINGHE INTL', kind: 'EXPORT BUSINESS', color: 0x7cf29a, stack: ['WORDPRESS', 'SEO'] },
  { no: '05', name: 'SERANDI', kind: 'JEWELRY STORE', color: 0x5fe9ff, stack: ['PHP', 'MYSQL'] },
];
// what the noodle bar cooks to order: the four courses of the stack, and the skills are the ingredients
export const COURSES = [
  { name: 'Front end', note: 'crisp and quick, straight to the plate', color: 0x5fe9ff, css: '#5fe9ff', cook: 'wok', noodle: 0xf1dc9c, broth: null, items: ['HTML', 'CSS', 'JavaScript', 'React'] },
  { name: 'Back end', note: 'slow-simmered logic, a deep broth', color: 0xff3fa8, css: '#ff3fa8', cook: 'pot', noodle: 0xf1dc9c, broth: 0x8a4a12, items: ['PHP', 'Node.js', 'Python'] },
  { name: 'Database', note: 'the stock everything else is built on', color: 0x7cf29a, css: '#7cf29a', cook: 'pot', noodle: 0xf6efe0, broth: 0xb8862a, items: ['MySQL'] },
  { name: 'Tools', note: 'the kitchen kit, sharpened daily', color: 0xff9a3c, css: '#ff9a3c', cook: 'wok', noodle: 0xe8b86a, broth: null, items: ['Git', 'WordPress', 'Figma', 'Canva', 'Claude Code', 'ChatGPT'] },
];
export const INGREDIENTS = COURSES.flatMap((c) => c.items.map((name) => ({ name, color: c.color })));
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
  const projectStalls = [];   // { g, sign, lamp, board, k, s }
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
  for (let z = 2; z > -30; z -= 3) {   // the first wire hangs behind the gate so nothing crosses the name
    group.add(K.cyl(0.008, 0.008, 7.4, K.MAT.black, 0, 3.5, z).rotateZ(Math.PI / 2));
    group.add(K.cyl(0.006, 0.006, 7.4, K.MAT.black, 0, 3.9, z + 0.4).rotateZ(Math.PI / 2));
    const n = 4;
    for (let i = 0; i < n; i += 1) {
      const x = -2.4 + i * 1.6 + (Math.random() - 0.5) * 0.4;
      const m = new THREE.Mesh(lanternGeo, lanternMats[(i + Math.abs(z)) % 4]);
      m.position.set(x, 3.15, z); group.add(m);
      group.add(K.cyl(0.004, 0.004, 0.16, K.MAT.black, x, 3.42, z));
      group.add(K.cyl(0.03, 0.03, 0.03, K.MAT.black, x, 2.94, z, 8));
      lanterns.push({ mesh: m, k: 0, seed: Math.random() * 10 });
    }
  }
  // the board on a project shop's wall: the name, what it is, what it is made with, a little mock of the site
  const shopBoardPainter = (pr) => (ctx, w, h) => {
    const c = K.hex(pr.color);
    ctx.fillStyle = '#120d08'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; for (let i = 0; i < 500; i += 1) ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillStyle = c; ctx.font = `800 ${h * 0.2}px ${K.FONT}`; ctx.letterSpacing = '2px'; ctx.fillText(pr.no, w * 0.06, h * 0.17);
    ctx.fillStyle = '#f4ecd8'; ctx.font = `800 ${h * 0.12}px ${K.FONT}`; ctx.letterSpacing = '3px'; ctx.fillText(pr.name, w * 0.2, h * 0.135, w * 0.74);
    ctx.fillStyle = '#b8c0cc'; ctx.font = `600 ${h * 0.055}px ${K.FONT}`; ctx.letterSpacing = '4px'; ctx.fillText(pr.kind, w * 0.2, h * 0.245, w * 0.74);
    ctx.fillStyle = c; ctx.fillRect(w * 0.06, h * 0.32, w * 0.88, 3);
    ctx.fillStyle = c; ctx.font = `800 ${h * 0.06}px ${K.FONT}`; ctx.letterSpacing = '4px'; ctx.fillText('MADE WITH', w * 0.06, h * 0.41);
    pr.stack.forEach((item, i) => {
      const y = h * (0.52 + i * 0.115);
      ctx.fillStyle = '#f4ecd8'; ctx.font = `700 ${h * 0.08}px ${K.FONT}`; ctx.letterSpacing = '2px'; ctx.fillText(item, w * 0.06, y);
      const nw = ctx.measureText(item).width;
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; for (let dx = w * 0.06 + nw + 12; dx < w * 0.5 - 10; dx += 12) ctx.fillRect(dx, y + 3, 4, 4);
    });
    const mx = w * 0.56; const my = h * 0.4; const mw = w * 0.38; const mh = h * 0.48;
    ctx.fillStyle = '#f0e6c8'; ctx.fillRect(mx, my, mw, mh);
    ctx.fillStyle = c; ctx.fillRect(mx, my, mw, mh * 0.14);
    ctx.fillStyle = '#1a1206'; ctx.globalAlpha = 0.8; ctx.fillRect(mx + mw * 0.06, my + mh * 0.24, mw * 0.5, mh * 0.14); ctx.globalAlpha = 0.3; ctx.fillRect(mx + mw * 0.06, my + mh * 0.46, mw * 0.88, mh * 0.06); ctx.fillRect(mx + mw * 0.06, my + mh * 0.58, mw * 0.7, mh * 0.06); ctx.globalAlpha = 1;
    [0.06, 0.37, 0.68].forEach((f) => { ctx.fillStyle = c; ctx.globalAlpha = 0.75; ctx.fillRect(mx + mw * f, my + mh * 0.72, mw * 0.26, mh * 0.2); ctx.globalAlpha = 1; });
    ctx.fillStyle = '#b8c0cc'; ctx.font = `600 ${h * 0.045}px ${K.FONT}`; ctx.letterSpacing = '3px'; ctx.textAlign = 'center'; ctx.fillText('LIVE \u00b7 OPEN THE SITE', mx + mw / 2, h * 0.95);
  };

  const steamTex = K.canvasTexture(64, 64, (ctx, w, h) => { const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
  const fires = [];
  const makeSteam = (g, x, y0, z, spread, n, rise, size = 0.09, opacity = 0.16) => {
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) { arr[i * 3] = x + (Math.random() - 0.5) * spread; arr[i * 3 + 1] = y0 + Math.random() * rise; arr[i * 3 + 2] = z + (Math.random() - 0.5) * spread; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size, map: steamTex, transparent: true, opacity, depthWrite: false })); g.add(pts);
    const entry = { pts, arr, n, x0: x, z0: z, spread, y0, y1: y0 + rise, base: opacity, size0: size }; steams.push(entry); return entry;
  };

  /* ---------- the noodle bar's kitchen: bowls of noodles, a steamer, a wok on the fire, noodles hung to dry ---------- */
  const knotGeo = new THREE.TorusKnotGeometry(0.075, 0.014, 90, 8, 2, 5);
  const nestGeo = new THREE.TorusKnotGeometry(0.045, 0.011, 60, 6, 3, 4);
  const strandGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.78, 5);
  const EGGW = PLASTIC(0xfaf6ee); const YOLK = PLASTIC(0xf2b632); const GREEN = PLASTIC(0x4caf50); const CHILI = PLASTIC(0xd0261b); const PORK = PLASTIC(0xd9a08a);
  const noodleBowl = (g, x, z, rot = 0) => {
    const b = new THREE.Group(); b.position.set(x, 0.96, z); b.rotation.y = rot; g.add(b);
    b.add(K.cyl(0.15, 0.09, 0.1, BOWL, 0, 0.05, 0, 20)); b.add(K.cyl(0.155, 0.155, 0.016, BOWLRIM, 0, 0.1, 0, 20));
    b.add(K.cyl(0.135, 0.135, 0.01, BROTH, 0, 0.095, 0, 20));
    const nd = new THREE.Mesh(knotGeo, NOODLE); nd.position.y = 0.11; nd.scale.set(1, 0.35, 1); nd.rotation.y = rot * 3; b.add(nd);
    const egg = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), EGGW); egg.position.set(0.05, 0.1, -0.03); egg.scale.set(1, 0.7, 1.3); b.add(egg);
    b.add(K.sphere(0.02, YOLK, 0.05, 0.115, -0.03, 10));
    for (let i = 0; i < 6; i += 1) b.add(K.cyl(0.009, 0.009, 0.014, GREEN, (Math.random() - 0.5) * 0.18, 0.125, (Math.random() - 0.5) * 0.18, 6));
    b.add(K.cyl(0.05, 0.05, 0.008, PORK, -0.05, 0.12, 0.04, 12));
    const chili = K.cyl(0.008, 0.005, 0.05, CHILI, -0.02, 0.125, -0.06, 6); chili.rotation.z = 1.2; b.add(chili);
    [0, 0.018].forEach((dz) => { const st = K.cyl(0.004, 0.003, 0.3, DARKWOOD, 0.02, 0.15, 0.02 + dz, 6); st.rotation.z = -1.25; st.rotation.y = 0.5; b.add(st); });
  };
  const steamer = (g, x, z) => {
    for (let i = 0; i < 3; i += 1) { const y = 0.96 + i * 0.075; g.add(K.cyl(0.17, 0.17, 0.07, BAMBOO, x, y + 0.035, z, 24)); g.add(K.cyl(0.176, 0.176, 0.012, BAMBOO_D, x, y + 0.066, z, 24)); }
    const top = 0.96 + 3 * 0.075;
    g.add(K.cyl(0.16, 0.16, 0.01, BAMBOO_D, x, top - 0.02, z, 24));
    for (let i = 0; i < 5; i += 1) { const a = (i / 5) * Math.PI * 2; const d = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), DUMPLING); d.position.set(x + Math.cos(a) * 0.085, top + 0.008, z + Math.sin(a) * 0.085); d.scale.set(1, 0.75, 1); g.add(d); d.add(K.sphere(0.012, DUMPLING, 0, 0.03, 0, 8)); }
    makeSteam(g, x, top + 0.05, z, 0.2, 24, 0.55, 0.08, 0.14);
  };
  const wok = (g, x, z) => {
    g.add(K.cyl(0.17, 0.17, 0.05, TIN, x, 0.985, z, 20)); g.add(K.cyl(0.13, 0.13, 0.02, K.MAT.black, x, 1.02, z, 20));
    const flames = [];
    for (let i = 0; i < 7; i += 1) { const a = (i / 7) * Math.PI * 2; const f = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.06, 6), FLAME); f.position.set(x + Math.cos(a) * 0.075, 1.05, z + Math.sin(a) * 0.075); g.add(f); flames.push(f); }
    const prof = []; for (let i = 0; i <= 8; i += 1) { const t = i / 8; prof.push(new THREE.Vector2(0.03 + t * 0.19, t * t * 0.13)); }
    const w = new THREE.Mesh(new THREE.LatheGeometry(prof, 24), WOKMAT); w.position.set(x, 1.05, z); g.add(w);
    const handle = K.cyl(0.012, 0.014, 0.26, DARKWOOD, x + 0.3, 1.16, z, 8); handle.rotation.z = Math.PI / 2 - 0.35; g.add(handle);
    const fry = new THREE.Mesh(knotGeo, PLASTIC(0xd08a3a)); fry.position.set(x, 1.12, z); fry.scale.set(1.1, 0.35, 1.1); g.add(fry);
    for (let i = 0; i < 8; i += 1) g.add(K.cyl(0.009, 0.009, 0.014, GREEN, x + (Math.random() - 0.5) * 0.2, 1.135, z + (Math.random() - 0.5) * 0.2, 6));
    const fire = K.pointLight(0xff7a20, 1.6, 1.4, x, 1.03, z); g.add(fire); fires.push(fire);
    const steam = makeSteam(g, x, 1.16, z, 0.16, 20, 0.4, 0.08, 0.12);
    return { flames, mesh: w, fry, fire, steam, x, z };
  };
  // the bowl an order is served in: its noodles and broth take the dish's colours
  const servedBowl = (g, x, z) => {
    const b = new THREE.Group(); b.position.set(x, 0.96, z); b.scale.setScalar(0.001); b.visible = false; g.add(b);
    b.add(K.cyl(0.15, 0.09, 0.1, BOWL, 0, 0.05, 0, 20)); b.add(K.cyl(0.155, 0.155, 0.016, PLASTIC(0xb3121b), 0, 0.1, 0, 20));
    const broth = K.cyl(0.135, 0.135, 0.01, BROTH.clone(), 0, 0.095, 0, 20); b.add(broth);
    const noodle = new THREE.Mesh(knotGeo, NOODLE.clone()); noodle.position.y = 0.11; noodle.scale.set(1, 0.35, 1); b.add(noodle);
    const egg = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), EGGW); egg.position.set(0.05, 0.1, -0.03); egg.scale.set(1, 0.7, 1.3); b.add(egg);
    b.add(K.sphere(0.02, YOLK, 0.05, 0.115, -0.03, 10));
    for (let i = 0; i < 6; i += 1) b.add(K.cyl(0.009, 0.009, 0.014, GREEN, (Math.random() - 0.5) * 0.18, 0.125, (Math.random() - 0.5) * 0.18, 6));
    const chili = K.cyl(0.008, 0.005, 0.05, CHILI, -0.02, 0.125, -0.06, 6); chili.rotation.z = 1.2; b.add(chili);
    return { group: b, broth, noodle };
  };
  const hangingNoodles = (g, x0, x1, y, z) => {
    g.add(K.cyl(0.012, 0.012, x1 - x0 + 0.1, DARKWOOD, (x0 + x1) / 2, y, z, 8).rotateZ(Math.PI / 2));
    [x0, x1].forEach((hx) => g.add(K.cyl(0.006, 0.006, 0.22, TIN, hx, y + 0.1, z, 6)));
    const n = Math.round((x1 - x0) / 0.05);
    for (let i = 0; i <= n; i += 1) {
      const x = x0 + (i / n) * (x1 - x0);
      [-1, 1].forEach((sd) => { const m = new THREE.Mesh(strandGeo, NOODLE_RAW); m.position.set(x, y - 0.39, z + sd * 0.012); m.rotation.x = sd * (0.06 + Math.random() * 0.05); m.rotation.z = (Math.random() - 0.5) * 0.06; g.add(m); });
    }
  };
  const bitGeo = new THREE.BoxGeometry(0.018, 0.012, 0.018);
  // every skill in its own little bowl, labelled, lined up on the bench beside the wok
  const ingredientBowl = (g, x, z, name, color, y = 0.965) => {
    const b = new THREE.Group(); b.position.set(x, y, z); g.add(b);
    const fill = PLASTIC(color);
    b.add(K.cyl(0.075, 0.05, 0.06, BOWL, 0, 0.03, 0, 16)); b.add(K.cyl(0.078, 0.078, 0.012, fill, 0, 0.062, 0, 16));
    b.add(K.cyl(0.066, 0.066, 0.02, fill, 0, 0.065, 0, 16));
    for (let i = 0; i < 5; i += 1) { const m = new THREE.Mesh(bitGeo, fill); m.position.set((Math.random() - 0.5) * 0.08, 0.085, (Math.random() - 0.5) * 0.08); m.rotation.set(Math.random(), Math.random(), 0); b.add(m); }
    const tag = K.label(name, { w: 0.18, h: 0.055, color: '#2b1d12', bg: '#efe3c6', size: 0.55 }); tag.position.set(0, 0.045, 0.1); tag.rotation.x = -0.75; b.add(tag);
    return { group: b, home: b.position.clone(), color };
  };
  const dressNoodleBar = (g, potSteam, potX) => {
    // the back bench the wok and the ingredients sit on
    g.add(K.box(3.1, 0.96, 0.62, DARKWOOD, 0, 0.48, -0.3)); g.add(K.box(3.1, 0.02, 0.64, TIN, 0, 0.955, -0.3));
    noodleBowl(g, -0.7, 0.5, 0.2); noodleBowl(g, -0.25, 0.4, -0.4); noodleBowl(g, 0.15, 0.55, 0.9);
    steamer(g, 0.9, 0.38);
    const wk = wok(g, -0.55, -0.3);
    hangingNoodles(g, 0.95, 1.42, 2.12, 0.78);
    // a tray of raw noodle nests, a basket of eggs, a cup of chopsticks, spice jars, a stack of bowls, a ladle, the little price card
    g.add(K.box(0.5, 0.03, 0.3, BAMBOO, -1.25, 0.975, 0.3));
    for (let i = 0; i < 6; i += 1) { const m = new THREE.Mesh(nestGeo, NOODLE_RAW); m.position.set(-1.43 + (i % 3) * 0.17, 1.01, 0.23 + Math.floor(i / 3) * 0.14); m.scale.set(1, 0.4, 1); g.add(m); }
    g.add(K.cyl(0.1, 0.08, 0.07, BAMBOO_D, -1.0, 1.0, -0.4, 14));
    for (let i = 0; i < 6; i += 1) { const e = K.sphere(0.028, PLASTIC(0xf0dcc0), -1.0 + Math.cos(i) * 0.045, 1.05, -0.4 + Math.sin(i * 1.7) * 0.045, 10); e.scale.set(1, 1.25, 1); g.add(e); }
    g.add(K.cyl(0.05, 0.04, 0.12, PLASTIC(0xb3121b), 1.42, 1.02, 0.66, 12));
    for (let i = 0; i < 9; i += 1) { const st = K.cyl(0.004, 0.004, 0.24, DARKWOOD, 1.42 + (Math.random() - 0.5) * 0.05, 1.14, 0.66 + (Math.random() - 0.5) * 0.05, 5); st.rotation.x = (Math.random() - 0.5) * 0.2; st.rotation.z = (Math.random() - 0.5) * 0.2; g.add(st); }
    [[1.25, 0xd0261b], [1.36, 0xf2b632], [1.47, 0x3a2410]].forEach(([x, c]) => { g.add(K.cyl(0.032, 0.032, 0.08, PLASTIC(c), x, 1.0, -0.45, 12)); g.add(K.cyl(0.036, 0.036, 0.11, GLASS, x, 1.015, -0.45, 12)); g.add(K.cyl(0.03, 0.03, 0.02, K.MAT.black, x, 1.08, -0.45, 12)); });
    for (let i = 0; i < 5; i += 1) g.add(K.cyl(0.13, 0.08, 0.05, BOWL, -1.3, 0.985 + i * 0.038, -0.35, 16));
    const ladle = K.cyl(0.006, 0.006, 0.34, TIN, 1.4, 1.4, 0.3, 6); ladle.rotation.z = 0.5; g.add(ladle); g.add(K.sphere(0.03, TIN, 1.31, 1.26, 0.3, 10));
    const card = K.label('RAMEN 550 \u00b7 DUMPLINGS 350 \u00b7 TEA 150', { w: 0.34, h: 0.1, color: '#2b1d12', bg: '#efe3c6', size: 0.5 }); card.position.set(-1.4, 1.05, 0.62); card.rotation.x = -0.35; g.add(card);
    // the mise en place: two rows of ingredient bowls, one per skill, coloured by course
    const bowls = {};
    g.add(K.box(1.45, 0.07, 0.25, DARKWOOD, 0.42, 0.99, -0.46));   // a riser, so the back row reads over the front one
    INGREDIENTS.forEach((ing, i) => { bowls[ing.name] = ingredientBowl(g, -0.15 + (i % 7) * 0.19, i < 7 ? -0.46 : -0.2, ing.name, ing.color, i < 7 ? 1.03 : 0.965); });
    // what an order needs: the bowl it is served in, the nest of noodles that drops into the pan, the bits that fall from each ingredient bowl
    const served = servedBowl(g, 0.55, 0.58);
    const drop = new THREE.Mesh(nestGeo, NOODLE_RAW); drop.scale.set(1.4, 0.5, 1.4); drop.visible = false; g.add(drop);
    const bits = []; for (let i = 0; i < 12; i += 1) { const m = new THREE.Mesh(bitGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })); m.visible = false; g.add(m); bits.push(m); }
    return { g, wok: wk, pot: { ladle, steam: potSteam, x: potX, z: 0.35 }, served, drop, tag: null, bowls, bits };
  };

  /* ---------- a stall ---------- */
  const stall = ({ x, z, side, name, color, menu = null, banner = null, id = null, bigMenu = null, poster = null }) => {
    const big = bigMenu || poster;   // a lit board on the back wall instead of shelves
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    const stripe = awningTexture(color, '#f0e6c8');
    g.add(K.box(3.0, 0.9, 0.7, DARKWOOD, 0, 0.45, 0.4));
    g.add(K.box(3.1, 0.06, 0.8, WOOD, 0, 0.93, 0.4));
    g.add(K.box(3.0, 0.5, 0.05, PLASTIC(color), 0, 0.42, 0.76));
    g.add(K.box(3.2, 2.7, 0.15, WOOD, 0, 1.35, -0.7));
    if (!big) for (let s = 0; s < 3; s += 1) { g.add(K.box(2.8, 0.03, 0.3, WOOD, 0, 1.1 + s * 0.45, -0.5)); for (let b = 0; b < 7; b += 1) g.add(K.cyl(0.04, 0.04, 0.2 + (b % 3) * 0.05, PLASTIC([0x8a2a1a, 0x2a6a3a, 0xd4a040, 0x3a4a8a][(b + s) % 4]), -1.2 + b * 0.4, 1.22 + s * 0.45, -0.5, 10)); }
    const awning = K.box(3.5, 0.04, 1.8, new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.9, side: THREE.DoubleSide }), 0, 2.4, 0.35); awning.rotation.x = 0.22; g.add(awning);
    g.add(K.box(3.5, 0.18, 0.03, PLASTIC(color), 0, 2.1, 1.22));
    [-1.65, 1.65].forEach((px) => g.add(K.cyl(0.03, 0.03, 2.2, TIN, px, 1.1, 1.15)));
    const sign = K.neon(name, { w: 2.2, h: 0.42, color, size: 0.64 }); sign.group.position.set(0, big ? 2.42 : 1.85, 1.24); g.add(sign.group); neons.push(sign); g.userData.sign = sign;
    for (let l = 0; l < 6; l += 1) g.add(K.led(0xffd9a0, 0.018, -1.4 + l * 0.56, 2.0, 0.9));
    const potX = big ? 1.28 : 0.7; const potR = big ? 0.17 : 0.24;
    g.add(K.cyl(potR, potR * 0.85, 0.3, TIN, potX, 1.1, 0.35, 20)); g.add(K.cyl(potR - 0.02, potR - 0.02, 0.02, K.MAT.black, potX, 1.26, 0.35, 20));
    g.add(K.box(potR * 2.4, 0.1, 0.5, K.MAT.darkSteel, potX, 0.98, 0.35));
    if (!bigMenu) { for (let b = 0; b < 4; b += 1) g.add(K.cyl(0.08, 0.05, 0.06, PLASTIC(0xe8e0d0), -1.1 + b * 0.28, 0.99, 0.55, 12)); g.add(K.box(0.4, 0.3, 0.3, PLASTIC(0xb3121b), -1.2, 1.1, 0.2)); }
    g.add(K.cyl(0.14, 0.14, 0.04, DARKWOOD, 0.9, 0.45, 1.5, 12)); g.add(K.cyl(0.02, 0.02, 0.43, TIN, 0.9, 0.22, 1.5));
    g.add(K.box(0.5, 0.4, 0.5, WOOD, -1.9, 0.2, 1.1)); g.add(K.box(0.5, 0.4, 0.5, WOOD, -1.9, 0.6, 1.1).rotateY(0.2));
    const lamp = K.pointLight(0xffc890, 3.5, 5.5, 0, 2.0, 0.8); g.add(lamp); stallLights.push(lamp); g.userData.lamp = lamp;
    const hang = new THREE.Mesh(lanternGeo, PAPER(0xff4a2a, 1.3)); hang.position.set(1.5, 1.95, 1.2); g.add(hang); lanterns.push({ mesh: hang, k: 0, seed: Math.random() * 10 });
    if (big) {
      // a lit board hung on two chains from the awning bar, big enough to read from the alley: the menu, or a project's board
      const bw = bigMenu ? 2.7 : 1.7; const bh = bigMenu ? 1.3 : 1.05; const topY = 1.85 + bh / 2;
      const board = K.screen(bw, bh, big, { res: bigMenu ? 760 : 512, glow: color, glowScale: 1.04, intensity: 1.45 });
      board.group.position.set(0, 1.85, -0.55); g.add(board.group); g.userData.board = board;
      g.add(K.box(bw + 0.1, bh + 0.1, 0.06, DARKWOOD, 0, 1.85, -0.59));
      g.add(K.box(bw + 0.1, 0.05, 0.08, WOOD, 0, topY + 0.03, -0.58)); g.add(K.box(bw + 0.1, 0.05, 0.08, WOOD, 0, 1.85 - bh / 2 - 0.03, -0.58));
      const cx0 = bw / 2 - 0.1; const chain = 2.86 - topY - 0.05;
      [-cx0, cx0].forEach((cx) => { g.add(K.cyl(0.008, 0.008, chain, TIN, cx, topY + 0.05 + chain / 2, -0.56)); g.add(K.cyl(0.02, 0.02, 0.02, TIN, cx, topY + 0.04, -0.56)); });
      g.add(K.box(3.2, 0.06, 0.1, TIN, 0, 2.86, -0.56));
      const lx0 = bigMenu ? 0.9 : 0.6;
      [-lx0, lx0].forEach((lx) => { g.add(K.cyl(0.08, 0.14, 0.12, TIN, lx, 2.72, 0.1, 16)); g.add(K.led(0xffe0b0, 0.03, lx, 2.66, 0.1)); g.add(K.pointLight(0xffe0b0, 2.2, 2.6, lx, 2.55, 0.0)); });
    } else if (menu) { const board = K.screen(1.3, 0.9, menu, { res: 256, glow: color, glowScale: 1.1, intensity: 1.3 }); board.group.position.set(-0.6, 1.75, -0.6); g.add(board.group); g.userData.board = board; }
    else { const board = K.screen(1.0, 0.7, (ctx, w, h) => { ctx.fillStyle = '#120c08'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = color; ctx.font = `700 ${h * 0.14}px ${K.FONT}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.letterSpacing = '3px'; ctx.fillText(name, w * 0.06, h * 0.14); ctx.fillStyle = '#f0e6c8'; ctx.font = `600 ${h * 0.11}px ${K.FONT}`; ['SMALL  ·  350', 'LARGE  ·  550', 'EXTRA  ·  120', 'TEA  ·  150'].forEach((l, i) => ctx.fillText(l, w * 0.06, h * (0.36 + i * 0.16))); }, { res: 128, glow: color, glowScale: 1.1 }); board.group.position.set(-0.6, 1.75, -0.6); g.add(board.group); }
    if (banner) { const b = K.label(banner, { w: 2.6, h: 0.22, color: '#f0e6c8', bg: '#1a0e08', size: 0.6 }); b.position.set(0, 2.62, 0.95); b.rotation.x = -0.2; g.add(b); }
    // steam over the pot
    const potSteam = makeSteam(g, potX, 1.3, 0.35, big ? 0.12 : 0.25, 40, 1.0, big ? 0.07 : 0.11, big ? 0.1 : 0.2);
    if (bigMenu) g.userData.kitchen = dressNoodleBar(g, potSteam, potX);
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
    ctx.fillText('MY SKILLS', w / 2, h * 0.1);
    ctx.fillStyle = '#8a94a8'; ctx.font = `600 ${h * 0.036}px ${K.FONT}`; ctx.letterSpacing = '4px';
    ctx.fillText('SAMATHRI ABHAYAPALA \u00b7 AI FULL-STACK DEVELOPER \u00b7 EVERYTHING COOKED TO ORDER', w / 2, h * 0.17);
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
  const kitchen = noodles.userData.kitchen;
  noodles.updateMatrixWorld(true);
  // where the page pins its hotspots: over the little menu card on the counter, and over the wok
  const anchors = { order: noodles.localToWorld(new THREE.Vector3(-0.55, 1.2, 0.0)) };
  stall({ x: 3.5, z: -8.0, side: 1, name: 'DUMPLINGS', color: ORANGE });
  stall({ x: -3.5, z: 2.6, side: -1, name: 'TEA HOUSE', color: GREEN });
  SHOPS.forEach((sh, i) => {
    const pr = PROJECTS[i];
    const g = stall({ x: sh.x, z: sh.z, side: sh.side, name: pr.name, color: K.hex(pr.color), poster: shopBoardPainter(pr), id: `project:${i}` });
    projectStalls.push({ g, sign: g.userData.sign, lamp: g.userData.lamp, board: g.userData.board, k: 0, s: sh });
  });
  const focusLight = K.pointLight(0xffb060, 0, 6, 0, 2.5, -17); group.add(focusLight);   // over the shop we stand at

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
  const gateSign = K.neon('SAMATHRI ABHAYAPALA', { w: 5.2, h: 0.78, color: PINK, size: 0.7 }); gateSign.group.position.set(0, 3.95, 4.65); group.add(gateSign.group); neons.push(gateSign);
  const gateSub = K.neon('AI FULL-STACK DEVELOPER \u00b7 PROMPT CODE ENGINEER', { w: 4.4, h: 0.38, color: CYAN, size: 0.6 }); gateSub.group.position.set(0, 3.15, 4.68);
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
  const kiosk = new THREE.Group(); kiosk.position.set(1.2, 0, -30.4); kiosk.scale.setScalar(0.78); group.add(kiosk);
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
  let cooking = null; let lastT = 0;   // an order on the go: { dish, t0, ings, total, onStep, onDone }
  const cam = { w: 0, eye: new THREE.Vector3(), look: new THREE.Vector3() };   // the close-up over the bench while an order cooks
  const vTarget = new THREE.Vector3();
  const pour = (k, color, at) => {
    for (let i = 0; i < k.bits.length; i += 1) { const m = k.bits[i]; m.visible = true; m.material.color.set(color); m.position.set(at.x + (Math.random() - 0.5) * 0.08, 1.42, at.z + (Math.random() - 0.5) * 0.08); m.userData.vy = 0.2 + Math.random() * 0.3; m.userData.vx = (Math.random() - 0.5) * 0.3; m.userData.vz = (Math.random() - 0.5) * 0.3; m.userData.floor = 1.12 + Math.random() * 0.04; }
  };
  const resetKitchen = () => {
    const k = kitchen; if (!k) return;
    Object.values(k.bowls).forEach((b) => { b.group.position.copy(b.home); b.group.rotation.z = 0; });
    k.bits.forEach((m) => { m.visible = false; }); k.drop.visible = false;
    k.wok.flames.forEach((f) => f.scale.setScalar(1)); k.wok.fire.userData.boost = 1; k.wok.mesh.rotation.z = 0;
    [k.wok.steam, k.pot.steam].forEach((st) => { st.pts.material.opacity = st.base; st.pts.material.size = st.size0; });
  };
  return {
    group, menuBoard, anchors, cam,
    update(t, dt) {
      const e = 1 - Math.exp(-6 * dt); lastT = t;
      for (let i = 0; i < neons.length; i += 1) neons[i].flicker(t * (0.7 + (i % 5) * 0.13) + i);
      for (let i = 0; i < lanterns.length; i += 1) { const l = lanterns[i]; l.mesh.rotation.z = Math.sin(t * 0.9 + l.seed) * 0.06; l.mesh.rotation.x = Math.sin(t * 0.7 + l.seed * 2) * 0.05; }
      for (let i = 0; i < projectStalls.length; i += 1) {
        const l = projectStalls[i]; const want = activeProject === i ? 1 : 0; l.k += (want - l.k) * e;
        l.lamp.intensity = 3.5 + 4.5 * l.k; l.sign.setPower(0.8 + 0.45 * l.k); l.board.setPower(0.9 + 0.7 * l.k);
        if (activeProject === i) { focusLight.position.set(l.s.x * 0.5, 2.5, l.s.z); focusLight.color.set(PROJECTS[i].color); }
      }
      focusLight.intensity = activeProject >= 0 ? 6 * projectStalls[activeProject].k : 0;
      for (let i = 0; i < steams.length; i += 1) { const s = steams[i]; for (let j = 0; j < s.n; j += 1) { s.arr[j * 3 + 1] += dt * 0.35; s.arr[j * 3] += Math.sin(t * 2 + j) * dt * 0.05; if (s.arr[j * 3 + 1] > s.y1) { s.arr[j * 3 + 1] = s.y0; s.arr[j * 3] = s.x0 + (Math.random() - 0.5) * s.spread; s.arr[j * 3 + 2] = s.z0 + (Math.random() - 0.5) * s.spread; } } s.pts.geometry.attributes.position.needsUpdate = true; }
      for (let i = 0; i < fires.length; i += 1) fires[i].intensity = (1.2 + 0.9 * (0.5 + 0.5 * Math.sin(t * 21 + i * 3)) * (0.6 + 0.4 * Math.sin(t * 6.1 + i))) * (fires[i].userData.boost || 1);
      if (cooking) {
        // an order: the camera comes in over the bench, each ingredient bowl is picked up and tipped into the pan,
        // the noodles go in, the fire flares, a stir, a burst of steam, then the bowl pops up on the counter
        const k = kitchen; const c = cooking; const u = t - c.t0; const onWok = c.dish.cook === 'wok'; const at = onWok ? k.wok : k.pot;
        const bump = (a, b) => (u < a || u > b ? 0 : Math.sin((Math.PI * (u - a)) / (b - a)));
        cam.w = Math.min(K.smooth(u / 0.8), 1 - K.smooth((u - (c.total - 0.9)) / 0.9));
        const T0 = 0.9; const STEP = 0.8;
        c.ings.forEach((ing, i) => {
          const sN = (u - (T0 + i * STEP)) / STEP; const bowl = k.bowls[ing.name]; const b = bowl.group;
          if (sN <= 0 || sN >= 1) { b.position.copy(bowl.home); b.rotation.z = 0; return; }
          vTarget.set(at.x + 0.08, 1.4, at.z + 0.02);
          if (sN < 0.45) { const f = K.smooth(sN / 0.45); b.position.lerpVectors(bowl.home, vTarget, f); b.position.y += Math.sin(f * Math.PI) * 0.22; b.rotation.z = 0; }
          else if (sN < 0.7) { b.position.copy(vTarget); b.rotation.z = -1.3 * Math.sin(((sN - 0.45) / 0.25) * Math.PI); if (!ing.poured && sN > 0.5) { ing.poured = true; pour(k, ing.color, at); if (c.onStep) c.onStep(`Adding ${ing.name}\u2026`); } }
          else { const f = K.smooth((sN - 0.7) / 0.3); b.position.lerpVectors(vTarget, bowl.home, f); b.position.y += Math.sin(f * Math.PI) * 0.15; b.rotation.z = 0; }
        });
        for (let i = 0; i < k.bits.length; i += 1) { const m = k.bits[i]; if (!m.visible) continue; m.userData.vy -= dt * 4; m.position.y += m.userData.vy * dt; m.position.x += m.userData.vx * dt; m.position.z += m.userData.vz * dt; m.rotation.x += dt * 6; if (m.position.y < m.userData.floor) m.visible = false; }
        const tn = T0 + c.ings.length * STEP;   // the noodles go in
        if (!c.noodlesSaid && u >= tn) { c.noodlesSaid = true; if (c.onStep) c.onStep(onWok ? 'Noodles into the wok, high heat\u2026' : 'Noodles into the pot, let it simmer\u2026'); }
        const heat = bump(tn - 0.2, tn + 2.6);
        k.wok.flames.forEach((f, i) => f.scale.setScalar(1 + (onWok ? 2.2 : 0.5) * heat * (0.8 + 0.2 * Math.sin(t * 30 + i))));
        k.wok.fire.userData.boost = 1 + (onWok ? 3 : 0.6) * heat;
        if (u >= tn && u < tn + 0.6) { const f = (u - tn) / 0.6; k.drop.visible = true; k.drop.position.set(at.x, 1.9 - 0.75 * f * f, at.z); k.drop.rotation.y = f * 3; } else k.drop.visible = false;
        if (u >= tn + 0.6 && u < tn + 2.2) { k.wok.fry.rotation.y += dt * (onWok ? 9 : 2); k.wok.mesh.rotation.z = onWok ? Math.sin(t * 18) * 0.07 : 0; k.pot.ladle.rotation.z = 0.5 + (onWok ? 0 : Math.sin(t * 10) * 0.2); }
        else { k.wok.mesh.rotation.z *= 0.9; k.pot.ladle.rotation.z += (0.5 - k.pot.ladle.rotation.z) * e; }
        const puff = bump(tn + 0.5, tn + 2.6);
        at.steam.pts.material.opacity = at.steam.base + 0.3 * puff; at.steam.pts.material.size = at.steam.size0 * (1 + 0.9 * puff);
        if (u >= tn + 2.2) {
          if (!c.servedSaid) { c.servedSaid = true; if (c.onStep) c.onStep('Plating up\u2026'); }
          const f = Math.min(1, (u - (tn + 2.2)) / 0.5); const sc = f < 0.6 ? (f / 0.6) * 1.15 : 1.15 - 0.15 * ((f - 0.6) / 0.4);
          k.served.group.visible = true; k.served.group.scale.setScalar(Math.max(0.001, sc)); if (k.tag) k.tag.visible = true;
        }
        if (u >= c.total) { const done = c.onDone; cooking = null; resetKitchen(); cam.w = 0; if (done) done(); }
      } else if (cam.w > 0) cam.w = Math.max(0, cam.w - dt * 1.5);
      rain.uT.value = t;
      ringK += ((ringing ? 1 : 0) - ringK) * e;
      kioskLed.material.emissiveIntensity = 0.3 + ringK * (Math.sin(t * 14) > 0 ? 3 : 0.3);
      kioskLight.intensity = 3 + 4 * ringK * (0.6 + 0.4 * Math.sin(t * 9));
    },
    setHover(id) { hover = id; },
    setActiveProject(i) { activeProject = i; },
    setCameraZ(z) { rain.uCamZ.value = z; },
    ring(on) { ringing = !!on; },
    cook(i, { narrow = false, onStep = null, onDone = null } = {}) {
      const dish = COURSES[i]; const k = kitchen;
      resetKitchen();
      k.served.group.visible = false; k.served.group.scale.setScalar(0.001);
      k.served.broth.visible = !!dish.broth; if (dish.broth) k.served.broth.material.color.set(dish.broth);
      k.served.noodle.material.color.set(dish.noodle);
      if (k.tag) { k.g.remove(k.tag); k.tag.material.map.dispose(); k.tag.material.dispose(); }
      k.tag = K.label('ORDER UP \u00b7 ' + dish.name.toUpperCase(), { w: 0.44, h: 0.1, color: '#2b1d12', bg: '#efe3c6', size: 0.5 });
      k.tag.position.set(k.served.group.position.x, 1.33, k.served.group.position.z); k.tag.visible = false; k.g.add(k.tag);
      const ings = dish.items.map((name) => ({ name, color: dish.color, poured: false }));
      const total = 0.9 + ings.length * 0.8 + 3.7;
      k.g.updateMatrixWorld(true);
      k.g.localToWorld(narrow ? cam.eye.set(0.3, 2.0, 2.0) : cam.eye.set(0.35, 1.85, 1.35)); k.g.localToWorld(cam.look.set(0.3, 0.98, -0.2));
      cooking = { dish, t0: lastT, ings, total, onStep, onDone, noodlesSaid: false, servedSaid: false };
      return total;
    },
    abortCook() { if (!cooking) return; cooking = null; resetKitchen(); },
  };
}
