// Night Market: the alley is fixed behind the page. The page itself is ordinary sections. Every
// section is two scrolls away: the first walks the path (the alley, no text), the second arrives at
// the stall. On a desktop a wheel notch, key or swipe moves one stop; on a phone the page snaps stop
// by stop. The scroll position drives the camera walk, dark scrims fade in behind each section, and
// the content rises into place when you arrive.
import * as THREE from 'three';
import { buildScene, STOPS, SHOPS, shopView, COURSES } from './scene.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = (v) => THREE.MathUtils.clamp(v, 0, 1);
const smooth = (v) => { const t = clamp01(v); return t * t * (3 - 2 * t); };
function kfv(p, keys, out) {
  for (let i = 0; i < keys.length - 1; i += 1) {
    const [p0, v0] = keys[i];
    const [p1, v1] = keys[i + 1];
    if (p <= p1) { const t = smooth((p - p0) / Math.max(p1 - p0, 1e-6)); return out.set(v0[0] + (v1[0] - v0[0]) * t, v0[1] + (v1[1] - v0[1]) * t, v0[2] + (v1[2] - v0[2]) * t); }
  }
  const last = keys[keys.length - 1][1];
  return out.set(last[0], last[1], last[2]);
}

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
await Promise.race([
  Promise.all(['700 40px "Barlow Condensed"', '800 40px "Barlow Condensed"'].map((f) => document.fonts.load(f))),
  new Promise((r) => { setTimeout(r, 1800); }),
]).catch(() => {});

/* ---------- motion: headings rise word by word, everything else follows in order ---------- */
$$('.page h2').forEach((h) => {
  const words = h.textContent.trim().split(/\s+/);
  h.setAttribute('aria-label', words.join(' ')); h.textContent = '';
  words.forEach((w, i) => {
    const s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('i'); inner.textContent = w; inner.style.setProperty('--w', i);
    s.appendChild(inner); h.appendChild(s);
    if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
  });
});
$$('.page .inner:not(.proj-inner):not(.contact-inner):not(.skills-inner), .contact-col, .proj-text').forEach((box) => {
  let n = 0;
  [...box.children].forEach((c) => { if (c.tagName === 'H2' || c.classList.contains('booth-col')) return; c.classList.add('rv'); c.style.setProperty('--i', n); n += 1; });
});

/* ---------- renderer, scene ---------- */
const canvas = $('#hall');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06070c);
scene.fog = new THREE.FogExp2(0x070912, 0.05);
const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 80);

function makeEnvironment() {
  const faces = [];
  for (let i = 0; i < 6; i += 1) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, '#1c2038'); g.addColorStop(0.5, '#0d1020'); g.addColorStop(1, '#04050a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    if (i === 0) { ctx.globalAlpha = 0.4; ctx.fillStyle = '#ff3fa8'; ctx.fillRect(20, 40, 80, 40); }
    if (i === 1) { ctx.globalAlpha = 0.4; ctx.fillStyle = '#5fe9ff'; ctx.fillRect(20, 40, 80, 40); }
    if (i === 2) { ctx.globalAlpha = 0.4; ctx.fillStyle = '#ffb060'; ctx.fillRect(30, 30, 68, 68); }
    faces.push(c);
  }
  const cube = new THREE.CubeTexture(faces);
  cube.colorSpace = THREE.SRGBColorSpace;
  cube.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromCubemap(cube).texture;
  pmrem.dispose();
  return env;
}
scene.environment = makeEnvironment();
scene.environmentIntensity = 0.55;

scene.add(new THREE.HemisphereLight(0x2a3050, 0x0a0806, 0.5));
const key = new THREE.DirectionalLight(0x9fb8ff, 0.5);
key.position.set(3, 12, -6);
key.target.position.set(0, 0, -12);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -8; key.shadow.camera.right = 8;
key.shadow.camera.top = 24; key.shadow.camera.bottom = -24;
key.shadow.camera.near = 1; key.shadow.camera.far = 40;
key.shadow.bias = -0.0006;
scene.add(key, key.target);

const market = buildScene();
scene.add(market.group);

/* ---------- the page drives the camera ---------- */
const pages = $$('.page');
const stopNames = ['about', 'skills', 'projects', 'contact'];
const scrim = $('#scrim');
const scrimBottom = $('#scrim-bottom');
const scrimLeft = $('#scrim-left');
const scrimRight = $('#scrim-right');
const projEls = $$('.proj');
const projDots = $$('#proj-dots li');
const nShops = SHOPS.length;
const narrow = () => window.innerWidth < 900;
let projU = 0; let projW = 0; let projIdx = -1; let lastShop = 0;
let textRight = 0;   // eases to 1 when the project text sits on the right (the shop is on the left)
let camKeys = [];    // [[p, [x,y,z]]...] for the eye and the look
let lookKeys = [];
const stops = [];    // scroll positions: the gate, then a path stop and a stall stop for every section and every shop
const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
function layoutKeys() {
  const ms = maxScroll(); const vh = window.innerHeight; const nr = narrow();
  const hero = nr ? STOPS.heroNarrow : STOPS.hero;
  camKeys = [[0, hero.eye]]; lookKeys = [[0, hero.look]];
  stops.length = 0; stops.push(0);
  let prev = { y: 0, z: hero.eye[2] };   // the last stall stop, for the path stop after it
  const path = (y, z) => {
    // half way along the walk: stand in the middle of the alley and look down it
    const py = (prev.y + y) / 2; const pz = (prev.z + z) / 2; const pm = clamp01(py / ms);
    camKeys.push([pm, [0, 1.62, pz]]); lookKeys.push([pm, [0, 1.7, pz - 6]]);
    stops.push(Math.round(py));
  };
  pages.forEach((el, i) => {
    const top = el.offsetTop; const h = el.offsetHeight;
    const centre = clamp01((top + h / 2 - vh / 2) / ms);
    const hold = Math.max(0.01, (h / 2 - vh * (i === 2 ? 0.5 : 0.15)) / ms);
    const s = (nr && STOPS[`${stopNames[i]}Narrow`]) || STOPS[stopNames[i]];
    if (i === 2) {
      const span = Math.max(0, h - vh);
      path(top, shopView(SHOPS[0], nr).eye[2]);
      camKeys.push([clamp01(centre - hold), s.eye], [clamp01(centre + hold), s.eye]);
      lookKeys.push([clamp01(centre - hold), s.look], [clamp01(centre + hold), s.look]);
      for (let k = 0; k < nShops; k += 1) {
        if (k) stops.push(Math.round(top + (span * (k - 0.5)) / (nShops - 1)));   // the path between two shops
        stops.push(Math.round(top + (span * k) / (nShops - 1)));
      }
      prev = { y: top + span, z: shopView(SHOPS[nShops - 1], nr).eye[2] };
    } else {
      const y = THREE.MathUtils.clamp(top + h / 2 - vh / 2, 0, ms);
      path(y, s.eye[2]);
      camKeys.push([clamp01(centre - hold), s.eye], [clamp01(centre + hold), s.eye]);
      lookKeys.push([clamp01(centre - hold), s.look], [clamp01(centre + hold), s.look]);
      stops.push(Math.round(y));
      prev = { y, z: s.eye[2] };
    }
  });
  camKeys.push([1, STOPS.contact.eye]); lookKeys.push([1, STOPS.contact.look]);
}
let pRaw = 0;
let p = 0;
let lockP = false;   // the debug hook pins p while it slides the page with a transform
const readScroll = () => { if (!lockP) pRaw = clamp01(window.scrollY / maxScroll()); };

/* ---------- one scroll, one stop (wide screens; phones snap in CSS) ---------- */
const stepMode = () => !narrow();
let cur = 0; let animating = false; let animId = 0; let coolUntil = 0; let wheelAcc = 0;
function nearestStop() {
  const y = window.scrollY; let b = 0;
  for (let i = 1; i < stops.length; i += 1) if (Math.abs(stops[i] - y) < Math.abs(stops[b] - y)) b = i;
  return b;
}
function goTo(i) {
  layoutKeys();   // the page may have reflowed since the last measure
  i = THREE.MathUtils.clamp(i, 0, stops.length - 1);
  const from = window.scrollY; const to = stops[i];
  cur = i; cancelAnimationFrame(animId);
  if (reduced) { window.scrollTo({ top: to, behavior: 'instant' }); return; }
  const dist = Math.abs(to - from); const vh = window.innerHeight;
  const dur = THREE.MathUtils.clamp(500 + (dist / vh) * 300, 650, 1300);
  const t0 = performance.now(); animating = true;
  const tick = (now) => {
    const t = clamp01((now - t0) / dur);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    window.scrollTo({ top: from + (to - from) * e, behavior: 'instant' });
    if (t < 1) animId = requestAnimationFrame(tick);
    else { animating = false; coolUntil = performance.now() + 350; wheelAcc = 0; }
  };
  animId = requestAnimationFrame(tick);
}
window.addEventListener('scroll', () => { readScroll(); if (!animating && !lockP) cur = nearestStop(); }, { passive: true });
// one wheel notch (one click of a mouse wheel, or the same distance on a trackpad) moves one stop
const NOTCH = 60;
let notchDir = 0; let lastWheel = 0;
window.addEventListener('wheel', (e) => {
  if (!stepMode()) return;
  e.preventDefault();
  const now = performance.now();
  if (animating || now < coolUntil) { wheelAcc = 0; return; }
  const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
  if (!dy) return;
  const dir = dy > 0 ? 1 : -1;
  if (dir !== notchDir || now - lastWheel > 1500) { wheelAcc = 0; notchDir = dir; }
  lastWheel = now;
  wheelAcc += dy;
  if (Math.abs(wheelAcc) >= NOTCH) { wheelAcc = 0; goTo(cur + dir); }
}, { passive: false });
window.addEventListener('keydown', (e) => {
  if (!stepMode() || e.altKey || e.ctrlKey || e.metaKey) return;
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  let d = 0;
  if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) d = 1;
  else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) d = -1;
  else if (e.key === 'Home') { e.preventDefault(); goTo(0); return; }
  else if (e.key === 'End') { e.preventDefault(); goTo(stops.length - 1); return; }
  if (!d) return;
  e.preventDefault();
  if (!animating) goTo(cur + d);
});
let touchY = null;
window.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
window.addEventListener('touchmove', (e) => { if (stepMode() && e.cancelable) e.preventDefault(); }, { passive: false });
window.addEventListener('touchend', (e) => {
  if (!stepMode() || touchY === null) return;
  const dy = touchY - e.changedTouches[0].clientY; touchY = null;
  if (Math.abs(dy) > 40 && !animating) goTo(cur + (dy > 0 ? 1 : -1));
});
const sectionStop = [2, 4, 6, 6 + 2 * nShops];   // about, skills, the first shop, contact: for a #hash in the address
{
  // snap points for phones: one per shop and one on the path between each pair
  const sec = pages[2]; const n = 2 * (nShops - 1);
  for (let k = 0; k <= n; k += 1) { const d = document.createElement('div'); d.className = 'proj-snap'; d.style.top = `calc((100% - 100vh) * ${k / n})`; sec.appendChild(d); }
}

/* ---------- the noodle bar's controls: a hotspot pinned to the wok, and the order pad ---------- */
const ticket = $('#ticket');
const spots = [{ el: $('#spot-order'), anchor: market.anchors.order }];
const openTicket = (o) => ticket.classList.toggle('open', o);
spots[0].el.addEventListener('click', () => openTicket(!ticket.classList.contains('open')));
$('#ticket-close').addEventListener('click', () => openTicket(false));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') openTicket(false); });
const spotV = new THREE.Vector3();
function placeSpots() {
  const at = pages[1].classList.contains('live');
  document.body.classList.toggle('at-stall', at);
  if (!at) return;
  const W = window.innerWidth; const H = window.innerHeight;
  spots.forEach(({ el, anchor }) => {
    let x; let y; let vis = true;
    if (narrow()) { x = W / 2; y = H - 72; }   // a phone shows only part of the stall: the button sits along the bottom
    else {
      spotV.copy(anchor).project(camera); vis = spotV.z < 1;
      x = THREE.MathUtils.clamp(((spotV.x + 1) / 2) * W, 70, W - 70); y = THREE.MathUtils.clamp(((1 - spotV.y) / 2) * H, 90, H - 110);
    }
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    el.classList.toggle('vis', vis);
  });
}
// the order pad: four dishes, the ingredients are the skills; pick one and the cook gets to work
const dishesEl = $('#dishes'); const fill = $('#ticket-fill'); const ticketText = $('#ticket-text'); const again = $('#ticket-again');
const TICKET_IDLE = 'Pick a dish. The ingredients are the skills.';
let cookingNow = false;
const resetTicket = () => { ticket.classList.remove('cooking', 'done'); document.body.classList.remove('cooking'); $$('.dish').forEach((x) => x.classList.remove('on')); fill.style.transition = 'none'; fill.style.width = '0%'; ticketText.textContent = TICKET_IDLE; };
COURSES.forEach((d, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'dish'; b.style.setProperty('--c', d.css);
  const name = document.createElement('b'); name.textContent = d.name;
  const ings = document.createElement('span'); ings.className = 'ings'; d.items.forEach((it) => { const em = document.createElement('em'); em.textContent = it; ings.appendChild(em); });
  const note = document.createElement('span'); note.className = 'note'; note.textContent = d.note;
  b.append(name, ings, note);
  b.addEventListener('click', () => {
    if (cookingNow) return; cookingNow = true;
    $$('.dish').forEach((x, j) => x.classList.toggle('on', j === i));
    ticket.classList.add('cooking'); ticket.classList.remove('done'); document.body.classList.add('cooking');
    ticketText.textContent = `Order in: ${d.name}. Getting the ingredients out\u2026`;
    const total = market.cook(i, {
      narrow: narrow(),
      onStep: (text) => { ticketText.textContent = text; },
      onDone: () => { cookingNow = false; ticket.classList.remove('cooking'); ticket.classList.add('done'); document.body.classList.remove('cooking'); ticketText.textContent = `Order up! ${d.name}: ${d.items.join(', ')}.`; },
    });
    fill.style.transition = 'none'; fill.style.width = '0%'; void fill.offsetWidth; fill.style.transition = `width ${total.toFixed(1)}s linear`; fill.style.width = '100%';
  });
  dishesEl.appendChild(b);
});
again.addEventListener('click', resetTicket);
const leaveStall = () => { openTicket(false); if (cookingNow) { market.abortCook(); cookingNow = false; } resetTicket(); };

/* ---------- hovers from the page into the alley ---------- */
{
  const phone = $('#phone-link');
  phone.addEventListener('pointerenter', () => market.ring(true));
  phone.addEventListener('pointerleave', () => market.ring(false));
  [$('#email-link'), $('#email-btn')].forEach((el) => { el.addEventListener('pointerenter', () => market.ring(true)); el.addEventListener('pointerleave', () => market.ring(false)); });
}

/* ---------- pointer look-around; the content drifts the other way ---------- */
const mouse = new THREE.Vector2(0, 0);
const mouseSmooth = new THREE.Vector2(0, 0);
window.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  document.body.style.setProperty('--mx', mouse.x.toFixed(3)); document.body.style.setProperty('--my', mouse.y.toFixed(3));
});

/* ---------- camera ---------- */
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const camPosNow = new THREE.Vector3().fromArray(STOPS.hero.eye);
const camLookNow = new THREE.Vector3().fromArray(STOPS.hero.look);
const fwd = new THREE.Vector3(); const right = new THREE.Vector3();
const walkEye = new THREE.Vector3(); const walkLook = new THREE.Vector3();
const eyeB = new THREE.Vector3(); const lookB = new THREE.Vector3();
let nowT = 0;
function updateCamera(dt) {
  kfv(p, camKeys, camPos);
  kfv(p, lookKeys, camLook);
  let fov = 50;
  const aspect = camera.aspect;
  const nr = narrow();
  if (aspect < 1.2) fov = THREE.MathUtils.clamp(50 * (1.2 / aspect), 50, 78);
  if (projW > 0.001) {
    // the walk from shop to shop: stand across from each one; half way, back in the middle of the alley looking down it
    const n = nShops - 1; const tt = projU * n; const i0 = Math.min(n - 1, Math.floor(tt)); const f = smooth((tt - i0 - 0.18) / 0.64);
    const a = shopView(SHOPS[i0], nr); const b = shopView(SHOPS[Math.min(n, i0 + 1)], nr);
    walkEye.fromArray(a.eye).lerp(eyeB.fromArray(b.eye), f); walkLook.fromArray(a.look).lerp(lookB.fromArray(b.look), f);
    const pathW = 4 * f * (1 - f);
    walkEye.x *= 1 - pathW; walkLook.x *= 1 - pathW;
    walkLook.y += (1.7 - walkLook.y) * pathW; walkLook.z += (walkEye.z - 6 - walkLook.z) * pathW;
    camPos.lerp(walkEye, projW); camLook.lerp(walkLook, projW);
  }
  if (market.cam.w > 0.001) { camPos.lerp(market.cam.eye, market.cam.w); camLook.lerp(market.cam.look, market.cam.w); }   // an order cooking: close over the bench
  camPos.y += Math.sin(nowT * 0.6) * 0.02;
  mouseSmooth.lerp(mouse, 1 - Math.pow(0.001, dt));
  camPos.x += mouseSmooth.x * 0.2;
  camPos.y += mouseSmooth.y * 0.1;
  fwd.copy(camLook).sub(camPos).normalize();
  right.crossVectors(fwd, camera.up).normalize();
  camLook.addScaledVector(right, mouseSmooth.x * 1.2);
  camLook.y += mouseSmooth.y * 0.6;
  camPosNow.lerp(camPos, 1 - Math.pow(reduced ? 0.000001 : 0.0008, dt));
  camLookNow.lerp(camLook, 1 - Math.pow(reduced ? 0.000001 : 0.0008, dt));
  camera.position.copy(camPosNow);
  camera.lookAt(camLookNow);
  if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
}

/* ---------- loop ---------- */
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  layoutKeys();
  if (stepMode() && !animating && !lockP) window.scrollTo({ top: stops[cur], behavior: 'instant' });
  readScroll();
}
window.addEventListener('resize', resize);
{
  // start at the gate, or at the section named in the address
  const hi = stopNames.indexOf(location.hash.slice(1));
  cur = hi >= 0 ? sectionStop[hi] : 0;
  layoutKeys();
  window.scrollTo({ top: stops[cur], behavior: 'instant' });
}
resize();
p = pRaw;

const clock = new THREE.Clock();
let frames = 0;
let lastError = null;
let lastHeight = 0;

function step(dt, t, render = true) {
  nowT = t;
  const sh = document.documentElement.scrollHeight;
  if (sh !== lastHeight) { lastHeight = sh; layoutKeys(); readScroll(); }   // fonts and reflows move the stops
  p += (pRaw - p) * (1 - Math.pow(reduced ? 0.000001 : 0.003, dt));
  // where each section sits on screen: this drives the scrims, the reveals and the shop walk
  const vh = window.innerHeight;
  const wide = !narrow();
  let radial = 0; let bottom = 0; let left = 0; let right = 0; let edge = 60; let projVis = 0;
  pages.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const overlap = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    const vis = clamp01(overlap / Math.min(vh, r.height) / 0.55);
    if (i !== 2) { const was = el.classList.contains('live'); const now = vis > 0.6 && overlap > vh * 0.3; el.classList.toggle('live', now); if (i === 1 && was && !now) leaveStall(); }
    if (i === 1) { /* the stall itself is the content: no scrim */ }
    else if (i === 2) {
      projW = vis; projVis = vis;
      projU = clamp01(-r.top / Math.max(1, r.height - vh));
      if (!wide) bottom = Math.max(bottom, vis);
    } else if (i === 3) { if (wide) { left = Math.max(left, vis); if (vis > 0.5) edge = 74; } else radial = Math.max(radial, vis); }
    else radial = Math.max(radial, vis);
  });
  // which shop we stand at: the text only shows near a shop, not on the path between two
  const tt = projU * (nShops - 1); const nearest = THREE.MathUtils.clamp(Math.round(tt), 0, nShops - 1);
  const idx = projW > 0.001 && Math.abs(tt - nearest) < 0.3 ? nearest : -1;
  if (projW > 0.001) lastShop = nearest;
  if (idx !== projIdx) {
    projIdx = idx;
    projEls.forEach((el) => el.classList.toggle('on', Number(el.dataset.index) === idx));
    projDots.forEach((d, i) => { d.classList.toggle('on', i === lastShop); d.classList.toggle('done', i < lastShop); });
    market.setActiveProject(idx);
  }
  const wantRight = SHOPS[lastShop].side < 0 ? 1 : 0;   // the shop is on the left, so the text goes right
  textRight += (wantRight - textRight) * (1 - Math.exp(-7 * dt));
  const textVis = idx >= 0 ? projVis : 0;
  if (wide && textVis > 0) { left = Math.max(left, textVis * (1 - textRight)); right = Math.max(right, textVis * textRight); if (textVis > 0.5) edge = 56; }
  if (!wide && idx < 0) bottom = 0;
  updateCamera(dt);
  placeSpots();
  market.setCameraZ(camera.position.z);
  market.update(t, dt);
  scrim.style.setProperty('--s', radial.toFixed(3));
  scrimBottom.style.setProperty('--s', bottom.toFixed(3));
  scrimLeft.style.setProperty('--s', left.toFixed(3));
  scrimRight.style.setProperty('--s', right.toFixed(3));
  scrimLeft.style.setProperty('--edge', `${edge}%`);
  scrimRight.style.setProperty('--edge', `${edge}%`);
  if (!render) return;
  renderer.render(scene, camera);
  frames += 1;
  if (frames === 2) document.body.classList.add('in');
}
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  try { step(dt, clock.elapsedTime); } catch (err) { lastError = err; console.error(err); }
}
renderer.setAnimationLoop(loop);

// Debug hooks; nothing on the page depends on these.
window.__nm = {
  get p() { return p; },
  get frames() { return frames; },
  get lastError() { return lastError; },
  get time() { return clock.elapsedTime; },
  get stops() { return stops.slice(); },
  get cur() { return cur; },
  market, camera, scene, goTo,
  setP(v) {
    lockP = true; window.scrollTo({ top: 0, behavior: 'instant' }); pRaw = v; p = v;
    const vs = v * maxScroll(); $('#main').style.transform = `translateY(${-vs}px)`;
    // sticky does not work under a transform: emulate it for the projects frame
    const sec = pages[2]; const st = sec.querySelector('.sticky');
    st.style.position = 'relative'; st.style.top = `${THREE.MathUtils.clamp(vs - sec.offsetTop, 0, sec.offsetHeight - window.innerHeight)}px`; camPosNow.copy(kfv(v, camKeys, camPos)); camLookNow.copy(kfv(v, lookKeys, camLook)); },
  setStop(i) { this.setP(stops[THREE.MathUtils.clamp(i, 0, stops.length - 1)] / maxScroll()); },
  step(dt, t) { step(dt, t, false); },
  render(t) { step(0.0001, t, true); },
};
