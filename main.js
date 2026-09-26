// Night Market: the alley is fixed behind the page. The page itself is ordinary sections that
// scroll; their position on the page drives the camera walk, and a dark scrim fades in behind
// each section so the text stays readable over the neon.
import * as THREE from 'three';
import { buildScene, STOPS, LANTERNS } from './scene.js';

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

await Promise.race([
  Promise.all(['700 40px "Barlow Condensed"', '800 40px "Barlow Condensed"'].map((f) => document.fonts.load(f))),
  new Promise((r) => { setTimeout(r, 1800); }),
]).catch(() => {});

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
const railBtns = $$('.rail a');
const scrim = $('#scrim');
const scrimTop = $('#scrim-top');
const scrimBottom = $('#scrim-bottom');
const scrimSide = $('#scrim-side');
const projEls = $$('.proj');
const projDots = $$('#proj-dots li');
const projCount = $('#proj-count');
let projU = 0; let projW = 0; let projIdx = -1;
let camKeys = [];   // [[p, [x,y,z]]...] for the eye and the look
let lookKeys = [];
let stopP = [0, 0, 0, 0];
let holdP = [0, 0, 0, 0];
const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
function layoutKeys() {
  const ms = maxScroll(); const vh = window.innerHeight;
  camKeys = [[0, STOPS.hero.eye]];
  lookKeys = [[0, STOPS.hero.look]];
  pages.forEach((el, i) => {
    const top = el.offsetTop; const h = el.offsetHeight;
    const centre = clamp01((top + h / 2 - vh / 2) / ms);
    const hold = Math.max(0.01, (h / 2 - vh * (i === 2 ? 0.5 : 0.15)) / ms);
    stopP[i] = centre; holdP[i] = hold;
    const s = STOPS[stopNames[i]];
    camKeys.push([clamp01(centre - hold), s.eye], [clamp01(centre + hold), s.eye]);
    lookKeys.push([clamp01(centre - hold), s.look], [clamp01(centre + hold), s.look]);
  });
  camKeys.push([1, STOPS.contact.eye]); lookKeys.push([1, STOPS.contact.look]);
}
let pRaw = 0;
let p = 0;
let lockP = false;   // the debug hook pins p while it slides the page with a transform
const readScroll = () => { if (!lockP) pRaw = clamp01(window.scrollY / maxScroll()); };
window.addEventListener('scroll', readScroll, { passive: true });

/* ---------- hovers from the page into the alley ---------- */
const courses = $$('.course[data-course]');
courses.forEach((c) => { c.addEventListener('pointerenter', () => market.setHover(`course:${c.dataset.course}`)); c.addEventListener('pointerleave', () => market.setHover(null)); });
{
  const phone = $('#phone-link');
  phone.addEventListener('pointerenter', () => market.ring(true));
  phone.addEventListener('pointerleave', () => market.ring(false));
  [$('#email-link'), $('#email-btn')].forEach((el) => { el.addEventListener('pointerenter', () => market.ring(true)); el.addEventListener('pointerleave', () => market.ring(false)); });
}

/* ---------- pointer look-around ---------- */
const mouse = new THREE.Vector2(0, 0);
const mouseSmooth = new THREE.Vector2(0, 0);
window.addEventListener('pointermove', (e) => { mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1); });

/* ---------- camera ---------- */
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const camPosNow = new THREE.Vector3().fromArray(STOPS.hero.eye);
const camLookNow = new THREE.Vector3().fromArray(STOPS.hero.look);
const fwd = new THREE.Vector3(); const right = new THREE.Vector3();
const walkEye = new THREE.Vector3(); const walkLook = new THREE.Vector3();
let nowT = 0;
function updateCamera(dt) {
  kfv(p, camKeys, camPos);
  kfv(p, lookKeys, camLook);
  let fov = 50;
  const aspect = camera.aspect;
  const narrow = window.innerWidth < 900;
  if (aspect < 1.2) fov = THREE.MathUtils.clamp(50 * (1.2 / aspect), 50, 78);
  if (projW > 0.001) {
    // the walk under the lanterns: hold at each one, move between them
    const tt = projU * 4; const i0 = Math.min(3, Math.floor(tt)); const f = smooth((tt - i0 - 0.28) / 0.44);
    const [x0, z0] = LANTERNS[i0]; const [x1, z1] = LANTERNS[Math.min(4, i0 + 1)];
    const lx = x0 + (x1 - x0) * f; const lz = z0 + (z1 - z0) * f;
    walkEye.set(-0.6, 1.62, lz + 2.4); walkLook.set(lx - 0.2, narrow ? 1.5 : 2.3, lz);
    if (narrow) { walkEye.z += 0.8; }
    camPos.lerp(walkEye, projW); camLook.lerp(walkLook, projW);
  }
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
  readScroll();
}
window.addEventListener('resize', resize);
resize();
p = pRaw;

const clock = new THREE.Clock();
let frames = 0;
let lastError = null;
let loaderGone = false;

function step(dt, t, render = true) {
  nowT = t;
  p += (pRaw - p) * (1 - Math.pow(reduced ? 0.000001 : 0.003, dt));
  // where each section sits on screen: this drives the scrims, the rail and the lantern walk
  const vh = window.innerHeight;
  const wide = window.innerWidth >= 900;
  let radial = 0; let top = 0; let bottom = 0; let side = 0; let edge = 60;
  pages.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const overlap = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    const vis = clamp01(overlap / Math.min(vh, r.height) / 0.55);
    railBtns[i].classList.toggle('on', vis > 0.6 && overlap > vh * 0.3);
    if (i === 1) { if (wide) top = Math.max(top, vis); else radial = Math.max(radial, vis); }
    else if (i === 2) {
      projW = vis;
      projU = clamp01(-r.top / Math.max(1, r.height - vh));
      if (wide) { side = Math.max(side, vis); edge = 58; } else bottom = Math.max(bottom, vis);
    } else if (i === 3) { if (wide) { side = Math.max(side, vis); if (vis > 0.5) edge = 74; } else radial = Math.max(radial, vis); }
    else radial = Math.max(radial, vis);
  });
  // which lantern we are under
  const tt = projU * 4; const idx = projW > 0.001 ? Math.min(4, Math.max(0, Math.round(tt))) : -1;
  if (idx !== projIdx) {
    projIdx = idx;
    projEls.forEach((el) => el.classList.toggle('on', Number(el.dataset.index) === idx));
    projDots.forEach((d, i) => { d.classList.toggle('on', i === idx); d.classList.toggle('done', idx >= 0 && i < idx); });
    if (idx >= 0) projCount.textContent = `${idx + 1} of 5`;
    market.setActiveProject(idx);
  }
  updateCamera(dt);
  market.setCameraZ(camera.position.z);
  market.update(t, dt);
  scrim.style.setProperty('--s', radial.toFixed(3));
  scrimTop.style.setProperty('--s', top.toFixed(3));
  scrimBottom.style.setProperty('--s', bottom.toFixed(3));
  scrimSide.style.setProperty('--s', side.toFixed(3));
  scrimSide.style.setProperty('--edge', `${edge}%`);
  if (!render) return;
  renderer.render(scene, camera);
  frames += 1;
  if (frames === 2) ready();
}
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  try { step(dt, clock.elapsedTime); } catch (err) { lastError = err; console.error(err); }
}
renderer.setAnimationLoop(loop);

/* ---------- loader ---------- */
const loader = $('#loader');
const enter = $('#enter');
$('#loader-fill').style.width = '40%';
function ready() {
  $('#loader-fill').style.width = '100%';
  enter.disabled = false;
  enter.textContent = 'Walk in';
}
setTimeout(ready, 2500);
function enterView() {
  loader.classList.add('hidden');
  loaderGone = true;
}
enter.addEventListener('click', enterView);
window.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !enter.disabled && !loaderGone) enterView(); });

// Debug hooks; nothing on the page depends on these.
window.__nm = {
  get p() { return p; },
  get frames() { return frames; },
  get lastError() { return lastError; },
  get time() { return clock.elapsedTime; },
  get stops() { return stopP.slice(); },
  market, camera, scene,
  setP(v) {
    lockP = true; window.scrollTo({ top: 0, behavior: 'instant' }); pRaw = v; p = v;
    const vs = v * maxScroll(); $('#main').style.transform = `translateY(${-vs}px)`;
    // sticky does not work under a transform: emulate it for the projects frame
    const sec = pages[2]; const st = sec.querySelector('.sticky');
    st.style.position = 'relative'; st.style.top = `${THREE.MathUtils.clamp(vs - sec.offsetTop, 0, sec.offsetHeight - window.innerHeight)}px`; camPosNow.copy(kfv(v, camKeys, camPos)); camLookNow.copy(kfv(v, lookKeys, camLook)); },
  step(dt, t) { step(dt, t, false); },
  render(t) { step(0.0001, t, true); },
  enter: enterView,
};
