// Shared parts kit for the Stack Tower. Every floor is built from these so the five dioramas
// read as one building: the same steel, the same concrete, the same neon, the same screens.
import * as THREE from 'three';

export const FLOOR = { W: 14, D: 6, H: 3.6 };   // width (x), depth (z, from -D to 0), height (y)
export const COLORS = {
  cyan: 0x6fe8ff, magenta: 0xff3fa8, gold: 0xffd166, green: 0x7cf29a, amber: 0xffb070, white: 0xffffff,
  ink: 0x0b0e15, panel: 0x161b26, panelLight: 0x222938, steel: 0x8a94a6, concrete: 0x1c2029,
};
export const FONT = '"Barlow Condensed", "Arial Narrow", Impact, sans-serif';
export const MONO = '"JetBrains Mono", Consolas, monospace';

/* ---------- materials (shared, never mutate; clone when you need to animate) ---------- */
export const MAT = {
  concrete: new THREE.MeshStandardMaterial({ color: COLORS.concrete, roughness: 0.92, metalness: 0.05 }),
  panel: new THREE.MeshStandardMaterial({ color: COLORS.panel, roughness: 0.75, metalness: 0.15 }),
  panelLight: new THREE.MeshStandardMaterial({ color: COLORS.panelLight, roughness: 0.7, metalness: 0.15 }),
  steel: new THREE.MeshStandardMaterial({ color: COLORS.steel, roughness: 0.35, metalness: 0.85 }),
  darkSteel: new THREE.MeshStandardMaterial({ color: 0x3a414f, roughness: 0.45, metalness: 0.8 }),
  black: new THREE.MeshStandardMaterial({ color: 0x0a0c11, roughness: 0.6, metalness: 0.2 }),
  matte: new THREE.MeshStandardMaterial({ color: 0x2a303c, roughness: 0.9, metalness: 0.0 }),
  white: new THREE.MeshStandardMaterial({ color: 0xd8dce4, roughness: 0.55, metalness: 0.05 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x5a3c26, roughness: 0.6, metalness: 0.05 }),
  wheat: new THREE.MeshStandardMaterial({ color: 0xc8a66a, roughness: 0.7, metalness: 0.0 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x2f7a3c, roughness: 0.7, metalness: 0.0, side: THREE.DoubleSide }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, roughness: 0.08, metalness: 0.0, transparent: true, opacity: 0.16, transmission: 0, side: THREE.DoubleSide, depthWrite: false }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 1.0 }),
};
export const glowMaterial = (color, opacity = 0.35) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
// Soft radial glow for halos and light planes: fades to nothing at the edge, so no visible box.
let softTex = null;
function softGlowTexture() {
  if (softTex) return softTex;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.5)'); g.addColorStop(0.65, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  softTex = new THREE.CanvasTexture(c);
  return softTex;
}
export const softGlowMaterial = (color, opacity = 0.35) => new THREE.MeshBasicMaterial({ color, map: softGlowTexture(), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
export const emissiveMaterial = (color, intensity = 1.6) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity, roughness: 0.4 });

/* ---------- primitives ---------- */
export function box(w, h, d, mat = MAT.panel, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
export function cyl(rTop, rBot, h, mat = MAT.steel, x = 0, y = 0, z = 0, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
export function sphere(r, mat = MAT.steel, x = 0, y = 0, z = 0, seg = 18) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
export function plane(w, h, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  m.receiveShadow = true;
  return m;
}
export function pointLight(color, intensity, distance, x, y, z, decay = 2) {
  const l = new THREE.PointLight(color, intensity, distance, decay);
  l.position.set(x, y, z);
  return l;
}
// Invisible pick target for hover / click. Raycast against `targets` in main.js; read userData.id.
export function hoverBox(w, h, d, id, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  m.position.set(x, y, z);
  m.userData.id = id;
  return m;
}

/* ---------- canvases ---------- */
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
export const hex = (c) => '#' + c.toString(16).padStart(6, '0');

// Flat printed label (unlit). width/height in world units; text auto-fits one line.
export function label(text, { w = 1, h = 0.3, color = '#eef2f8', bg = null, size = 0, font = FONT, weight = 700, align = 'center', letter = 0.04, res = 256 } = {}) {
  const pw = Math.round(res * w / h); const ph = res;
  const tex = canvasTexture(pw, ph, (ctx) => {
    if (bg) { ctx.fillStyle = bg; roundRect(ctx, 0, 0, pw, ph, ph * 0.18); ctx.fill(); }
    const px = size ? size * ph : ph * 0.62;
    ctx.font = `${weight} ${px}px ${font}`;
    ctx.textBaseline = 'middle'; ctx.textAlign = align;
    ctx.fillStyle = color;
    ctx.letterSpacing = `${letter * px}px`;
    const x = align === 'left' ? ph * 0.25 : align === 'right' ? pw - ph * 0.25 : pw / 2;
    ctx.fillText(text.toUpperCase(), x, ph * 0.54, pw - ph * 0.3);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
  m.renderOrder = 2;
  return m;
}

// Neon sign: dark backing board, glowing tube letters, soft halo. setPower dims it to off.
export function neon(text, { w = 4, h = 0.7, color = '#6fe8ff', board = true, size = 0.62, font = FONT, weight = 800, letter = 0.06 } = {}) {
  const g = new THREE.Group();
  const ph = 256; const pw = Math.round(ph * w / h);
  const draw = (ctx) => {
    const px = size * ph;
    ctx.font = `${weight} ${px}px ${font}`;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.letterSpacing = `${letter * px}px`;
    ctx.shadowColor = color; ctx.shadowBlur = ph * 0.12;
    ctx.fillStyle = color;
    ctx.fillText(text.toUpperCase(), pw / 2, ph * 0.54, pw - ph * 0.2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.85;
    ctx.fillText(text.toUpperCase(), pw / 2, ph * 0.54, pw - ph * 0.2);
  };
  const tex = canvasTexture(pw, ph, draw);
  const tubes = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
  tubes.renderOrder = 3;
  tubes.position.z = 0.03;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.35, h * 3.0), softGlowMaterial(new THREE.Color(color), 0.5));
  halo.position.z = 0.015;
  halo.renderOrder = 2;
  if (board) {
    const b = box(w * 1.06, h * 1.3, 0.06, MAT.black, 0, 0, -0.02);
    g.add(b);
  }
  g.add(halo, tubes);
  const light = new THREE.PointLight(new THREE.Color(color), 1.4, 5, 2);
  light.position.set(0, 0, 0.5);
  g.add(light);
  let k = 1;
  return {
    group: g, tubes, halo, light,
    setPower(v) {
      k = v;
      tubes.material.opacity = 0.15 + 0.85 * v;
      halo.material.opacity = 0.5 * v;
      light.intensity = 1.4 * v;
    },
    flicker(t) { const f = 0.9 + 0.1 * Math.sin(t * 37) * Math.sin(t * 5.3); tubes.material.opacity = (0.15 + 0.85 * k) * f; },
  };
}

// A lit screen (monitor face, dashboard, billboard). draw(ctx, W, H, t) paints it; call redraw(t)
// to animate (keep it to a few times a second). setPower fades it to black.
export function screen(w, h, draw, { res = 512, glow = null, glowScale = 1.25, intensity = 1.5 } = {}) {
  const pw = Math.round(res * w / h); const ph = res;
  const c = document.createElement('canvas');
  c.width = pw; c.height = ph;
  const ctx = c.getContext('2d');
  draw(ctx, pw, ph, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: intensity, roughness: 0.35, metalness: 0.0 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  const group = new THREE.Group();
  group.add(mesh);
  let halo = null;
  if (glow) {
    halo = new THREE.Mesh(new THREE.PlaneGeometry(w * glowScale * 1.3, h * glowScale * 1.6), softGlowMaterial(new THREE.Color(glow), 0.3));
    halo.position.z = -0.005;
    halo.renderOrder = 1;
    group.add(halo);
  }
  return {
    group, mesh, ctx, tex, w: pw, h: ph,
    redraw(t) { draw(ctx, pw, ph, t); tex.needsUpdate = true; },
    setPower(k) { mat.emissiveIntensity = intensity * k; if (halo) halo.material.opacity = 0.3 * k; },
  };
}

// Small emissive bulb (LED, beacon, lamp).
export function led(color, r = 0.03, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), emissiveMaterial(color, 2.5));
  m.position.set(x, y, z);
  return m;
}
// Soft additive halo, for lamps, beacons and neon.
export function glowPlane(w, h, color, opacity = 0.3, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), softGlowMaterial(new THREE.Color(color), opacity * 1.8));
  m.position.set(x, y, z);
  m.renderOrder = 1;
  return m;
}
// Light strip: a slim emissive bar (ceiling light, edge light, under-desk light).
export function strip(len, color, x = 0, y = 0, z = 0, { thick = 0.05, deep = 0.12, axis = 'x', intensity = 2 } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? len : deep, thick, axis === 'z' ? len : deep), emissiveMaterial(color, intensity));
  m.position.set(x, y, z);
  return m;
}

/* ---------- tech props ---------- */
// Cable / data conduit with pulses running along it. points: array of Vector3 (world or local).
export function conduit(points, { color = COLORS.cyan, radius = 0.035, speed = 0.6, density = 3, base = 0x2a3140, closed = false } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', 0.2);
  const geo = new THREE.TubeGeometry(curve, Math.max(8, points.length * 12), radius, 8, closed);
  const uniforms = { uT: { value: 0 }, uK: { value: 1 }, uColor: { value: new THREE.Color(color) }, uBase: { value: new THREE.Color(base) }, uSpeed: { value: speed }, uDensity: { value: density } };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uT, uK, uSpeed, uDensity; uniform vec3 uColor, uBase; varying vec2 vUv; varying vec3 vN;
      void main(){ float f = fract(vUv.x * uDensity - uT * uSpeed); float pulse = smoothstep(0.0, 0.12, f) * (1.0 - smoothstep(0.12, 0.3, f));
      float rim = 0.55 + 0.45 * abs(vN.z); vec3 c = uBase * rim + uColor * pulse * uK * 2.2; gl_FragColor = vec4(c, 1.0); }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  return { mesh, curve, update(t) { uniforms.uT.value = t; }, setPower(k) { uniforms.uK.value = k; } };
}

// Server rack: cabinet with `units` blade slots, each with blinking LEDs. w/h/d in metres.
export function rack(units = 8, { w = 0.6, h = 2.0, d = 0.8, accent = COLORS.cyan, x = 0, y = 0, z = 0, seed = 1 } = {}) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.add(box(w, h, d, MAT.darkSteel, 0, h / 2, 0));
  const inner = box(w - 0.06, h - 0.1, 0.04, MAT.black, 0, h / 2, d / 2 - 0.01);
  g.add(inner);
  const slotH = (h - 0.2) / units;
  const ledGeo = new THREE.BoxGeometry(0.02, 0.02, 0.01);
  const ledCount = units * 4;
  const leds = new THREE.InstancedMesh(ledGeo, new THREE.MeshBasicMaterial({ toneMapped: false }), ledCount);
  const m = new THREE.Matrix4();
  const colors = [new THREE.Color(accent), new THREE.Color(0x7cf29a), new THREE.Color(0xffd166), new THREE.Color(0x203040)];
  const state = new Float32Array(ledCount);
  let rng = seed * 9301 + 49297;
  const rand = () => { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; };
  for (let u = 0; u < units; u += 1) {
    const yy = 0.1 + slotH * (u + 0.5);
    g.add(box(w - 0.1, slotH - 0.03, 0.03, MAT.matte, 0, yy, d / 2 + 0.005));
    g.add(box(w - 0.14, 0.012, 0.005, MAT.darkSteel, 0, yy - slotH * 0.28, d / 2 + 0.025));
    for (let i = 0; i < 4; i += 1) {
      const idx = u * 4 + i;
      m.makeTranslation(-w / 2 + 0.08 + i * 0.05, yy + slotH * 0.18, d / 2 + 0.028);
      leds.setMatrixAt(idx, m);
      state[idx] = rand();
      leds.setColorAt(idx, colors[state[idx] < 0.5 ? 0 : state[idx] < 0.8 ? 1 : 3]);
    }
  }
  leds.instanceMatrix.needsUpdate = true;
  if (leds.instanceColor) leds.instanceColor.needsUpdate = true;
  g.add(leds);
  let last = -1;
  let power = 1;
  const off = new THREE.Color(0x101418);
  return {
    group: g, leds,
    update(t) {
      const tick = Math.floor(t * 6);
      if (tick === last) return;
      last = tick;
      for (let i = 0; i < ledCount; i += 1) {
        const r = rand();
        if (r < 0.15) state[i] = rand();
        const c = power < 0.5 ? off : colors[state[i] < 0.5 ? 0 : state[i] < 0.8 ? 1 : 3];
        leds.setColorAt(i, c);
      }
      leds.instanceColor.needsUpdate = true;
    },
    setPower(k) { power = k; last = -1; },
  };
}

// Spinning fan in a round housing (HVAC, GPU cooler). Faces +z.
export function fan(r = 0.4, { blades = 5, mat = MAT.darkSteel, x = 0, y = 0, z = 0, speed = 6 } = {}) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const housing = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.12, 8, 32), mat);
  g.add(housing);
  const hub = cyl(r * 0.2, r * 0.2, r * 0.18, MAT.steel, 0, 0, 0);
  hub.rotation.x = Math.PI / 2;
  const rotor = new THREE.Group();
  rotor.add(hub);
  for (let i = 0; i < blades; i += 1) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(r * 0.28, r * 0.78, 0.015), MAT.steel);
    b.position.set(0, r * 0.55, 0);
    b.rotation.z = 0;
    const pivot = new THREE.Group();
    pivot.rotation.z = (i / blades) * Math.PI * 2;
    b.rotation.y = 0.55;
    pivot.add(b);
    rotor.add(pivot);
  }
  g.add(rotor);
  // guard
  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * (0.3 + i * 0.3), 0.006, 6, 32), MAT.steel);
    ring.position.z = r * 0.14;
    g.add(ring);
  }
  return { group: g, rotor, update(dt, k = 1) { rotor.rotation.z += dt * speed * k; } };
}

// Monitor on a stand. draw(ctx,W,H,t) paints the screen. Faces +z.
export function monitor(w = 0.9, h = 0.52, draw, { x = 0, y = 0, z = 0, glow = null, stand = true, bezel = 0.03 } = {}) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const body = box(w + bezel * 2, h + bezel * 2, 0.04, MAT.black, 0, h / 2 + (stand ? 0.22 : 0), 0);
  g.add(body);
  const s = screen(w, h, draw, { glow });
  s.group.position.set(0, h / 2 + (stand ? 0.22 : 0), 0.021);
  g.add(s.group);
  if (stand) {
    g.add(cyl(0.03, 0.03, 0.2, MAT.darkSteel, 0, 0.1, -0.02));
    const foot = cyl(0.16, 0.18, 0.02, MAT.darkSteel, 0, 0.01, -0.02);
    g.add(foot);
  }
  return { group: g, screen: s, body };
}

// Simple office desk, top at y = 0.75. Faces +z.
export function desk(w = 1.8, d = 0.8, { x = 0, y = 0, z = 0, top = MAT.wood } = {}) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.add(box(w, 0.05, d, top, 0, 0.725, 0));
  const legMat = MAT.darkSteel;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(box(0.05, 0.7, 0.05, legMat, sx * (w / 2 - 0.08), 0.35, sz * (d / 2 - 0.08))));
  g.add(box(w - 0.3, 0.04, 0.04, legMat, 0, 0.12, -d / 2 + 0.1));
  return g;
}
export function chair({ x = 0, y = 0, z = 0, rotY = 0, seat = MAT.black } = {}) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  g.add(box(0.48, 0.07, 0.48, seat, 0, 0.47, 0));
  g.add(box(0.46, 0.55, 0.07, seat, 0, 0.78, -0.22));
  g.add(cyl(0.03, 0.03, 0.42, MAT.darkSteel, 0, 0.23, 0));
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    const leg = box(0.28, 0.03, 0.04, MAT.darkSteel, Math.cos(a) * 0.14, 0.03, Math.sin(a) * 0.14);
    leg.rotation.y = -a;
    g.add(leg);
  }
  return g;
}
export function plant(h = 1.0, { x = 0, y = 0, z = 0, pot = MAT.matte } = {}) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.add(cyl(0.16, 0.12, 0.3, pot, 0, 0.15, 0));
  for (let i = 0; i < 9; i += 1) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.07, h * 0.6, 6), MAT.leaf);
    const a = (i / 9) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.06, 0.3 + h * 0.3, Math.sin(a) * 0.06);
    leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}

/* ---------- the room every floor sits in ---------- */
// Slab top at y = 0, ceiling strips just under y = H, back wall at z = -D, open front at z = 0.
// Returns the shell and its lights; setPower(k) brings the floor up from dark.
export function roomShell({ accent = COLORS.cyan, W = FLOOR.W, D = FLOOR.D, H = FLOOR.H, strips = 3, floorTex = null } = {}) {
  const g = new THREE.Group();
  const floorMat = MAT.concrete.clone();
  if (floorTex !== false) {
    floorMat.map = canvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#1e222b'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2;
      for (let i = 0; i <= 8; i += 1) { ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(w, i * 64); ctx.stroke(); }
      for (let i = 0; i < 400; i += 1) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    });
    floorMat.map.wrapS = floorMat.map.wrapT = THREE.RepeatWrapping;
    floorMat.map.repeat.set(W / 2, D / 2);
  }
  const slab = box(W, 0.3, D, floorMat, 0, -0.15, -D / 2);
  slab.receiveShadow = true;
  g.add(slab);
  g.add(box(W, H, 0.2, MAT.panel, 0, H / 2, -D - 0.1));                 // back wall
  g.add(box(0.2, H, D, MAT.panel, -W / 2 - 0.1, H / 2, -D / 2));         // left wall
  g.add(box(0.2, H, D, MAT.panel, W / 2 + 0.1, H / 2, -D / 2));          // right wall
  // back wall panel lines
  for (let i = 1; i < 7; i += 1) g.add(box(0.02, H - 0.4, 0.03, MAT.darkSteel, -W / 2 + i * (W / 7), H / 2, -D + 0.015));
  // baseboard accent line and ceiling strips
  const base = strip(W - 0.2, accent, 0, 0.06, -D + 0.05, { thick: 0.02, deep: 0.02, intensity: 1.2 });
  g.add(base);
  const stripsArr = [];
  const lights = [];
  for (let i = 0; i < strips; i += 1) {
    const x = -W / 2 + (W / strips) * (i + 0.5);
    const s = strip(2.2, 0xfff6e6, x, H - 0.04, -D / 2, { thick: 0.04, deep: 0.16, intensity: 1.6 });
    stripsArr.push(s); g.add(s);
    const l = pointLight(0xfff1dc, 12, 10, x, H - 0.3, -D / 2 + 0.6, 2);
    lights.push(l); g.add(l);
  }
  const accentLight = pointLight(accent, 3, 8, 0, 0.5, -D + 0.6, 2);
  g.add(accentLight);
  const setPower = (k) => {
    stripsArr.forEach((s) => { s.material.emissiveIntensity = 1.6 * k; });
    lights.forEach((l) => { l.intensity = 12 * k; });
    accentLight.intensity = 3 * k;
    base.material.emissiveIntensity = 1.2 * k;
  };
  return { group: g, lights, strips: stripsArr, setPower, floorMat };
}

/* ---------- small helpers ---------- */
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const smooth = (v) => { const t = clamp01(v); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
