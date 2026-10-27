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
renderer.compile(scene, camera);   // build every shader now, so the first scroll does not stall on a compile

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
window.addEventListener('scroll', () => {
  if (labOpen && Math.abs(window.scrollY - labScrollY) > 1) { window.scrollTo({ top: labScrollY, behavior: 'instant' }); return; }
  if (ticket.classList.contains('open') && Math.abs(window.scrollY - kitchenScrollY) > 1) { window.scrollTo({ top: kitchenScrollY, behavior: 'instant' }); return; }
  readScroll(); if (!animating && !lockP) cur = nearestStop();
}, { passive: true });
// one wheel notch (one click of a mouse wheel, or the same distance on a trackpad) moves one stop
const NOTCH = 60;
let notchDir = 0; let lastWheel = 0;
window.addEventListener('wheel', (e) => {
  if (labOpen) {
    const note = e.target.closest('.lab-note');
    if (!note || (e.deltaY < 0 && note.scrollTop <= 0) || (e.deltaY > 0 && note.scrollTop + note.clientHeight >= note.scrollHeight - 1)) e.preventDefault();
    return;
  }
  if (ticket.classList.contains('open')) { if (!e.target.closest('.ticket')) e.preventDefault(); return; }
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
  if (labOpen) {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault(); const note = $('.lab-note');
      if (e.key === 'Home') note.scrollTop = 0;
      else if (e.key === 'End') note.scrollTop = note.scrollHeight;
      else note.scrollTop += (e.key.endsWith('Down') ? 1 : -1) * (e.key.startsWith('Page') ? note.clientHeight * 0.8 : 40);
    }
    return;
  }
  if (e.target.closest('.ticket.open')) return;
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
window.addEventListener('touchmove', (e) => { if (e.target.closest('.lab-note, .ticket.open')) return; if ((stepMode() || labOpen || ticket.classList.contains('open')) && e.cancelable) e.preventDefault(); }, { passive: false });
window.addEventListener('touchend', (e) => {
  if (!stepMode() || labOpen || ticket.classList.contains('open') || touchY === null || e.target.closest('.ticket.open')) return;
  const dy = touchY - e.changedTouches[0].clientY; touchY = null;
  if (Math.abs(dy) > 40 && !animating) goTo(cur + (dy > 0 ? 1 : -1));
});
const sectionStop = [2, 4, 6, 6 + 2 * nShops];   // about, skills, the first shop, contact: for a #hash in the address
{
  // snap points for phones: one per shop and one on the path between each pair
  const sec = pages[2]; const n = 2 * (nShops - 1);
  for (let k = 0; k <= n; k += 1) { const d = document.createElement('div'); d.className = 'proj-snap'; d.style.top = `calc((100% - 100vh) * ${k / n})`; sec.appendChild(d); }
}

/* ---------- the photo lab's contact sheet: how Image Converter Pro works, one frame at a time ---------- */
const LAB_FRAMES = [
  { img: 'img/icp/01-load.jpg', thumb: 'img/icp/t-01-load.jpg', step: 'Step 01', title: 'Load the film', alt: 'The converter with five photos loaded: a drop zone, a box for image URLs, and the export settings panel',
    text: 'Drop JPG, PNG, WEBP or AVIF files, browse for them, or paste image URLs one per line. Every file lands on the stack as a print.' },
  { img: 'img/icp/02-contact-sheet.jpg', thumb: 'img/icp/t-02-contact-sheet.jpg', step: 'Step 02', title: 'The contact sheet', alt: 'Five uploaded photos shown as tilted prints, each with its file name and size',
    text: 'Each upload becomes a print with its name and size. Take one off the sheet, or clear the roll and start again.' },
  { img: 'img/icp/03-develop.jpg', thumb: 'img/icp/t-03-develop.jpg', step: 'Step 03', title: 'Set the export, then develop', alt: 'The export settings after processing: formats, target size, and a notice that the zip is downloading',
    text: 'Pick the output formats and a target size per image; the equation shows sources times formats. Files go straight to storage, the server converts them with Sharp and searches the quality setting until each one fits, and a single file or a zip downloads. Here, ten files came back as one zip.' },
  { img: 'img/icp/04-free-roll.jpg', thumb: 'img/icp/t-04-free-roll.jpg', step: 'Free tier', title: 'Three free rolls', alt: 'A contact sheet with seven prints: the last two are locked as Pro frames and a banner says a free roll holds five',
    text: 'Free users get three rolls of five images, counted per browser, per account and per IP address, so clearing cookies or opening a new account does not reset it. Extra prints lock as Pro frames.' },
  { img: 'img/icp/05-pro.jpg', thumb: 'img/icp/t-05-pro.jpg', step: 'Pro', title: 'The Pro darkroom', alt: 'The paywall: a film strip of the user’s photos over a card listing the monthly plan',
    text: 'Unlimited conversions and batches of up to fifty. The paywall says exactly what will not fit on a free roll, and offers to develop the first five anyway.' },
  { img: 'img/icp/06-pro-pass.jpg', thumb: 'img/icp/t-06-pro-pass.jpg', step: 'Payments', title: 'The studio pass', alt: 'The billing dialog: one to twelve month plans, a promo code field, and a choice of payment method',
    text: 'One to twelve months, with longer-plan discounts, sale campaigns and promo codes on top. Pay by card, PayPal, or a bank transfer with a receipt that an admin approves.' },
  { img: 'img/icp/07-accounts.jpg', thumb: 'img/icp/t-07-accounts.jpg', step: 'Accounts', title: 'Join the darkroom', alt: 'The create-account dialog with name, email and password fields',
    text: 'Sign up with an email address and a six-digit code, or with Google. Reset a password by emailed code. Pro users get an invite link: every five friends who join take five percent off the next payment.' },
  { img: 'img/icp/08-admin-overview.jpg', thumb: 'img/icp/t-08-admin-overview.jpg', step: 'Admin', title: 'The studio console', alt: 'The admin overview: payments to review, active Pro users, registered users, approved revenue, and the queue waiting for review',
    text: 'The studio’s control room brings membership activity, revenue and payment reviews into one view.',
    details: [
      ['At a glance', 'See registered users, active Pro members, payments awaiting review and revenue approved this month. The review queue highlights payments that still need attention.'],
      ['Payment review', 'Bank-transfer customers submit a receipt for an administrator to check and approve. This gives the studio a manual review step for payments made outside card or PayPal checkout.'],
      ['Upcoming renewals', 'Track memberships ending within the next seven days. A setup reminder also flags missing bank details so the transfer instructions can be completed.'],
    ] },
  { img: 'img/icp/09-admin-promotions.jpg', thumb: 'img/icp/t-09-admin-promotions.jpg', step: 'Admin', title: 'Promotions', alt: 'The promotions page: longer-plan discounts for three, six and twelve months, and a form to create a sale campaign',
    text: 'Manage studio offers in four ways, from ongoing membership savings to scheduled campaigns.',
    details: [
      ['Longer-plan savings', 'Set separate percentage discounts for 3-, 6- and 12-month memberships. These stay active until changed; enter 0 to remove a discount. Sales, promo codes and referral savings apply on top.'],
      ['Scheduled campaigns', 'Give a sale a name and percentage discount, add optional banner text, and choose optional start and end dates. While active, it discounts every plan and displays a banner across the app.'],
      ['Promo codes', 'Create a percentage or fixed-amount discount with an expiry and usage limit. A 100% discount code can give away Pro access.'],
      ['Referral rewards', 'Configure the reward for member invitations here too. This keeps ongoing plan savings, public campaigns, individual codes and referral offers together in the studio console.'],
    ] },
  { img: 'img/icp/10-admin-users.jpg', thumb: 'img/icp/t-10-admin-users.jpg', step: 'Admin', title: 'Users', alt: 'The users table: plan, expiry, pay reference, free uses, payments, join date, and a control to grant Pro access',
    text: 'Manage the people using the studio, with account activity and membership controls in one table.',
    details: [
      ['Member records', 'Review each account’s plan, expiry date, payment reference, free rolls used, payments and join date. These details help explain a member’s current access.'],
      ['Access controls', 'Grant Pro for a chosen number of months or revoke it when needed. Administrators can also assign admin access or delete an account; the owner account is protected from demotion.'],
    ] },
  { img: 'img/icp/11-admin-settings.jpg', thumb: 'img/icp/t-11-admin-settings.jpg', step: 'Admin', title: 'Pricing & payment setup', alt: 'The settings page: the monthly price and currency, and bank, branch, account name and account number fields for bank transfers',
    text: 'Set the studio’s base pricing and configure how members pay for their Pro pass.',
    details: [
      ['Base pricing', 'Set the monthly Pro price and currency code. Plan discounts and promotional offers are managed separately in Promotions.'],
      ['Bank transfers', 'Enter the bank, branch, account name and account number. These details appear when a member selects bank transfer during an upgrade. The member pays using those instructions and submits a receipt for admin approval.'],
      ['Card & PayPal', 'These methods become ready when their provider credentials are configured in the server environment. This setup is separate from the bank-detail fields: saving bank details does not activate card or PayPal checkout.'],
      ['Studio housekeeping', 'A daily background job removes temporary files and sends membership-expiry reminder emails.'],
    ] },
];
// Develop each main roll once, then browse its frames directly on the studio lightbox.
const lab = $('#lab'); const labStep = $('#lab-step'); const labTitle = $('#lab-title'); const labBody = $('#lab-body');
const labCount = $('#lab-count');
const LAB_ROLLS = [
  { name: 'From pixels to prints', note: 'Import, set export options, download.', frames: [0, 1, 2], stock: 'Everyday / 03 exposures', color: '#e4a33d' },
  { name: 'The after-hours pass', note: 'Free rolls, Pro perks & joining the club.', frames: [3, 4, 5, 6], stock: 'After dark / 04 exposures', color: '#d95a85' },
  { name: 'Studio control room', note: 'Accounts, licensing & studio administration.', frames: [7, 8, 9, 10], stock: 'Backstage / 04 exposures', color: '#638f7b' },
];
let labOpen = false; let labIdx = 0; let labRoll = null; let labBusy = false; let labRequest = 0; let labReturnFocus = null; let labScrollY = 0;
let labFrameRequest = 0; let labLoading = false; let rollReady = false;
const pad2 = (n) => String(n).padStart(2, '0');
LAB_ROLLS.forEach((roll, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-roll'; b.style.setProperty('--stock', roll.color);
  const can = document.createElement('span'); can.className = 'film-can'; can.textContent = pad2(i + 1); can.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  const small = document.createElement('small'); small.textContent = roll.stock;
  const title = document.createElement('b'); title.textContent = roll.name;
  const note = document.createElement('span'); note.textContent = roll.note;
  label.append(small, title, note); b.append(can, label);
  b.addEventListener('click', () => {
    labRoll = roll; rollReady = false; $('#lab-menu').hidden = true; $('#lab-session').hidden = false;
    roll.frames.forEach((frame) => labFrameImage(LAB_FRAMES[frame]));
    captureRoll(roll.frames[0]); $('#lab-change').focus({ preventScroll: true });
  });
  $('#lab-rolls').appendChild(b);
});
// the full-size frames, loaded once and kept; the lightbox repaints when the one on show arrives
const labFrameImage = (f) => {
  if (!f.el) { f.el = new Image(); f.el.decoding = 'async'; f.el.src = f.img; }
  return f.el;
};
function updateLabArrows() {
  const at = labRoll ? labRoll.frames.indexOf(labIdx) : 0;
  $('#lab-prev').setAttribute('aria-disabled', String(!rollReady || labBusy || labLoading || at === 0));
  $('#lab-next').setAttribute('aria-disabled', String(!rollReady || labBusy || labLoading || !labRoll || at === labRoll.frames.length - 1));
}
function frameDetails(i) {
  labIdx = i; const f = LAB_FRAMES[i];
  labStep.textContent = labRoll.name + ' · ' + f.step;
  labTitle.textContent = f.title; labBody.replaceChildren();
  const summary = document.createElement('p'); summary.textContent = f.text; labBody.appendChild(summary);
  (f.details || []).forEach(([heading, text]) => {
    const paragraph = document.createElement('p'); paragraph.className = 'lab-detail';
    const label = document.createElement('strong'); label.textContent = heading;
    paragraph.append(label, document.createTextNode(text)); labBody.appendChild(paragraph);
  });
  labCount.textContent = pad2(labRoll.frames.indexOf(i) + 1) + ' / ' + pad2(labRoll.frames.length);
  updateLabArrows();
}
async function showFrame(i) {
  if (labBusy || !labRoll.frames.includes(i)) return;
  const request = ++labFrameRequest; labLoading = true; frameDetails(i);
  $('#lab-retry').hidden = true; $('#lab-status').textContent = 'Loading lightbox preview…';
  try {
    const im = labFrameImage(LAB_FRAMES[i]); await im.decode();
    if (!labOpen || request !== labFrameRequest) return;
    market.labFrame(im, { no: pad2(labRoll.frames.indexOf(i) + 1), title: LAB_FRAMES[i].title.toUpperCase(), total: pad2(labRoll.frames.length), instant: true });
    market.labCamera('print', narrow());
    $('#lab-status').textContent = 'Contact sheet ready · browse the frames';
  } catch {
    if (!labOpen || request !== labFrameRequest) return;
    LAB_FRAMES[i].el = null; $('#lab-status').textContent = 'Preview unavailable. Reload this frame to try again.'; $('#lab-retry').hidden = false;
  } finally {
    if (request === labFrameRequest) { labLoading = false; updateLabArrows(); }
  }
}
function moveFrame(direction) {
  if (labBusy || labLoading || !rollReady) return;
  const i = labRoll.frames[labRoll.frames.indexOf(labIdx) + direction];
  if (i !== undefined) showFrame(i);
}
function setLabStage(stage, text) {
  lab.dataset.captureStage = String(stage);
  labStep.textContent = labRoll.name + ' · Photo session';
  labTitle.textContent = ['Finding the focus', 'Taking the shot', 'Your contact sheet'][stage];
  $$('#lab-process span').forEach((el, i) => { el.classList.toggle('done', i < stage); el.classList.toggle('active', i === stage); });
  $('#lab-status').textContent = text;
}
async function captureRoll(i) {
  if (labBusy) return;
  const request = ++labRequest; labBusy = true; lab.classList.add('capturing');
  $('#lab-retry').hidden = true; frameDetails(i); setLabStage(0, 'Setting up the shot…');
  try {
    const im = labFrameImage(LAB_FRAMES[i]);
    await im.decode();
    if (!labOpen || request !== labRequest) return;
    market.capturePhoto({ narrow: narrow(), reduced,
      onStep: setLabStage,
      onDone: () => {
        if (!labOpen || request !== labRequest) return;
        rollReady = true; labBusy = false; lab.classList.remove('capturing'); showFrame(i);
      },
    });
  } catch {
    if (!labOpen || request !== labRequest) return;
    LAB_FRAMES[i].el = null; labBusy = false; lab.classList.remove('capturing');
    $('#lab-status').textContent = 'This film roll could not load. Reload the preview to try again.';
    $('#lab-retry').hidden = false; updateLabArrows();
  }
}
function chooseRoll() {
  ++labRequest; ++labFrameRequest; labBusy = false; labLoading = false; market.abortCapture(); lab.classList.remove('capturing');
  $('#lab-next').removeAttribute('aria-disabled'); $('#lab-menu').hidden = false; $('#lab-session').hidden = true;
  market.labTotal(pad2(LAB_FRAMES.length)); market.labMode(true, { narrow: narrow() });
}
function openLab() {
  if (labOpen) return;
  labReturnFocus = document.activeElement;
  cancelAnimationFrame(animId); animating = false; cur = sectionStop[2] + 4;
  labScrollY = stops[cur]; window.scrollTo({ top: labScrollY, behavior: 'instant' }); readScroll();
  labOpen = true; lab.hidden = false; document.documentElement.classList.add('lab-open'); document.body.classList.add('lab-open');
  $('.proj-inner').inert = true; chooseRoll(); $('.lab-roll').focus({ preventScroll: true });
}
function closeLab() {
  if (!labOpen) return;
  ++labRequest; ++labFrameRequest; labBusy = false; labLoading = false; market.abortCapture();
  labOpen = false; lab.hidden = true; document.documentElement.classList.remove('lab-open'); document.body.classList.remove('lab-open');
  market.labMode(false); $('.proj-inner').inert = false;
  (labReturnFocus || $('#lab-open')).focus({ preventScroll: true });
}
window.addEventListener('resize', () => {
  if (!labOpen) return;
  layoutKeys(); labScrollY = stops[sectionStop[2] + 4]; window.scrollTo({ top: labScrollY, behavior: 'instant' });
  market.labCamera(labBusy || !$('#lab-menu').hidden ? 'bench' : 'print', narrow());
});
$('#lab-open').addEventListener('click', openLab);
$('#spot-lab').addEventListener('click', openLab);
$('#lab-close').addEventListener('click', closeLab);
$('#lab-change').addEventListener('click', () => { chooseRoll(); $('.lab-roll').focus({ preventScroll: true }); });
$('#lab-prev').addEventListener('click', () => moveFrame(-1));
$('#lab-next').addEventListener('click', () => moveFrame(1));
$('#lab-retry').addEventListener('click', () => { if (rollReady) showFrame(labIdx); else captureRoll(labIdx); });
window.addEventListener('keydown', (e) => {
  if (!labOpen) return;
  if (e.key === 'Escape') { e.preventDefault(); closeLab(); return; }
  if (!$('#lab-session').hidden && ['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); moveFrame(e.key === 'ArrowRight' ? 1 : -1); }
  if (e.key === 'Tab') {
    const controls = [...lab.querySelectorAll('button:not(:disabled), a[href]')].filter((el) => el.getClientRects().length);
    const first = controls[0]; const last = controls.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- the hotspots pinned into the alley, and the noodle bar's order pad ---------- */
const ticket = $('#ticket');
const spots = [
  { el: $('#spot-order'), anchor: market.anchors.order, when: () => pages[1].classList.contains('live'), onNarrow: true },
  { el: $('#spot-lab'), anchor: market.anchors.lab, when: () => projIdx === 2, onNarrow: false },   // a phone has the button in the project text instead
];
let kitchenReturnFocus = null; let kitchenScrollY = 0;
const openTicket = (o) => {
  ticket.classList.toggle('open', o); document.body.classList.toggle('kitchen-open', o);
  if (o) {
    kitchenReturnFocus = document.activeElement; cancelAnimationFrame(animId); animating = false;
    layoutKeys(); cur = sectionStop[1]; kitchenScrollY = stops[cur]; window.scrollTo({ top: kitchenScrollY, behavior: 'instant' }); readScroll();
    $('.dish.on')?.focus({ preventScroll: true });
  }
  else { resetTicket(); kitchenReturnFocus?.focus({ preventScroll: true }); }
};
$('#spot-order').addEventListener('click', () => openTicket(!ticket.classList.contains('open')));
$('#ticket-close').addEventListener('click', () => openTicket(false));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !labOpen) openTicket(false); });
const spotV = new THREE.Vector3();
function placeSpots() {
  const W = window.innerWidth; const H = window.innerHeight; const nr = narrow();
  let any = false;
  spots.forEach(({ el, anchor, when, onNarrow }) => {
    if (!when() || (nr && !onNarrow) || labOpen) { el.classList.remove('vis'); return; }
    any = true;
    let x; let y; let vis = true;
    if (nr) { x = W / 2; y = H - 72; }   // a phone shows only part of the stall: the button sits along the bottom
    else {
      spotV.copy(anchor).project(camera); vis = spotV.z < 1;
      x = THREE.MathUtils.clamp(((spotV.x + 1) / 2) * W, 70, W - 70); y = THREE.MathUtils.clamp(((1 - spotV.y) / 2) * H, 90, H - 110);
    }
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    el.classList.toggle('vis', vis);
  });
  document.body.classList.toggle('at-stall', any);
}
// the order pad: four dishes, the ingredients are the skills; pick one and the cook gets to work
const dishesEl = $('#dishes'); const fill = $('#ticket-fill'); const ticketText = $('#ticket-text'); const again = $('#ticket-again');
const TICKET_IDLE = 'Choose your flavour. Every ingredient is a skill.';
let cookingNow = false; let selectedDish = null; let previewDish = 0; let orderNumber = 0;
const resetTicket = () => {
  market.abortCook(); cookingNow = false; selectedDish = null;
  ticket.classList.remove('cooking', 'done'); document.body.classList.remove('cooking');
  $('#cook-session').hidden = true; showDish(previewDish);
  fill.style.transition = 'none'; fill.style.width = '0%'; ticketText.textContent = TICKET_IDLE;
};
const cookCue = ({ phase, index = 0 }) => {
  const d = selectedDish; if (!d) return;
  const progress = phase === 'served' ? 100 : phase === 'plating' ? 92 : phase === 'sizzle' ? 70 : phase === 'prep' ? 4 : 10 + ((index + 1) / d.items.length) * 45;
  fill.style.transition = 'width .5s ease'; fill.style.width = progress + '%';
  const status = phase === 'served' ? 'Ready for pickup!' : phase === 'plating' ? '3 / 3 · Plating up…' : phase === 'sizzle' ? '2 / 3 · Cooking your noodles…' : '1 / 3 · Preparing your order…';
  ticketText.textContent = status;
  $('#order-progress').setAttribute('aria-valuenow', Math.round(progress));
  $('#order-progress').setAttribute('aria-valuetext', status);
};
const FOOD_ART = ['pad-thai', 'shoyu-ramen', 'miso-udon', 'yakisoba'];
function showDish(index) {
  previewDish = index;
  $$('.dish').forEach((el, i) => el.classList.toggle('on', i === index));
}
COURSES.forEach((d, i) => {
  const row = document.createElement('button'); row.type = 'button'; row.className = 'dish';
  row.setAttribute('aria-label', 'Cook ' + d.name + '. Ingredients: ' + d.items.join(', '));
  const photo = document.createElement('img'); photo.className = 'dish-photo'; photo.src = 'img/menu/' + FOOD_ART[i] + '-cartoon.jpg'; photo.alt = d.name; photo.width = 480; photo.height = 480; photo.decoding = 'async';
  const info = document.createElement('span'); info.className = 'dish-info';
  const name = document.createElement('b'); name.className = 'menu-dish-name'; name.textContent = d.name;
  const ingredients = document.createElement('span'); ingredients.className = 'menu-ingredients'; ingredients.textContent = d.items.join(' · ');
  info.append(name, ingredients);
  const arrow = document.createElement('span'); arrow.className = 'menu-order'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
  row.append(photo, info, arrow); row.addEventListener('click', () => { showDish(i); startDish(i); }); dishesEl.appendChild(row);
});
function startDish(i) {
    const d = COURSES[i];
    if (cookingNow) return; cookingNow = true; selectedDish = d;
    ticket.style.setProperty('--dish-accent', d.css);
    ticket.classList.add('cooking'); ticket.classList.remove('done'); document.body.classList.add('cooking');
    $('#cook-session').hidden = false; $('#cook-number').textContent = 'Order ' + pad2(++orderNumber); $('#cook-dish').textContent = d.name;
    ticketText.textContent = 'Getting the kitchen ready…'; fill.style.width = '0%';
    ticket.scrollTop = 0; cookCue({ phase: 'prep' });
    market.cook(i, { narrow: narrow() && window.innerHeight > 560, reduced, onCue: cookCue,
      onDone: () => { cookingNow = false; ticket.classList.remove('cooking'); ticket.classList.add('done'); cookCue({ phase: 'served' }); again.focus({ preventScroll: true }); },
    });
    $('#ticket-close').focus({ preventScroll: true });
}
showDish(0);
again.addEventListener('click', () => { resetTicket(); $('.dish.on').focus({ preventScroll: true }); });
const leaveStall = () => openTicket(false);
window.addEventListener('resize', () => { if (ticket.classList.contains('open') && selectedDish) market.cookCamera(narrow() && window.innerHeight > 560); });

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
  const pointerMotion = labOpen || cookingNow || ticket.classList.contains('done') ? 0.12 : 1;
  camPos.x += mouseSmooth.x * 0.2 * pointerMotion;
  camPos.y += mouseSmooth.y * 0.1 * pointerMotion;
  fwd.copy(camLook).sub(camPos).normalize();
  right.crossVectors(fwd, camera.up).normalize();
  camLook.addScaledVector(right, mouseSmooth.x * 1.2 * pointerMotion);
  camLook.y += mouseSmooth.y * 0.6 * pointerMotion;
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
  if (ticket.classList.contains('open')) { cur = sectionStop[1]; kitchenScrollY = stops[cur]; window.scrollTo({ top: kitchenScrollY, behavior: 'instant' }); readScroll(); return; }
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

/* ---------- the weather: it rains in the alley when it rains where the visitor is (device location, Open-Meteo, no key), checked every 2 minutes and whenever the tab comes back ---------- */
const COLOMBO = { lat: 6.9271, lon: 79.8612 };   // where the market is: the fallback when the device will not say where it is
let here = null;
// where the device is, without a permission prompt: the precise position if the browser already allows it,
// otherwise the network's idea of the city; Colombo only if neither answers
async function locate() {
  if (here) return here;
  try {
    const perm = navigator.permissions ? await navigator.permissions.query({ name: 'geolocation' }) : null;
    if (perm && perm.state === 'granted') {
      here = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition((pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, how: 'device position' }), reject, { timeout: 5000, maximumAge: 10 * 60 * 1000 }));
      return here;
    }
  } catch (err) { /* no precise position: fall through */ }
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json', { cache: 'no-store' }); const g = await res.json();
    if (Number.isFinite(Number(g.latitude))) { here = { lat: Number(g.latitude), lon: Number(g.longitude), how: `network location, ${g.city || g.country || 'unknown city'}` }; return here; }
  } catch (err) { /* no network location either */ }
  return { ...COLOMBO, how: 'Colombo, location unknown' };
}
const weatherUrl = ({ lat, lon }) => `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=precipitation,rain,showers,weather_code&timezone=auto`;
// start from the last weather this browser saw, so the alley opens in the right state while the fresh reading loads
let lastRain = null;
try { const v = localStorage.getItem('nm-rain'); if (v !== null) lastRain = Number(v); } catch (err) { /* private mode */ }
const forcedRain = new URLSearchParams(location.search).get('rain');   // ?rain=1 or ?rain=0 to see either sky
market.setRain(forcedRain !== null ? Number(forcedRain) : (lastRain ?? 0), true);
async function syncWeather() {
  if (forcedRain !== null) { document.body.dataset.weather = Number(forcedRain) > 0 ? 'rain' : 'dry'; return; }
  try {
    const at = await locate();
    const res = await fetch(weatherUrl(at), { cache: 'no-store' }); const data = await res.json(); const c = data.current;
    const mm = (c.precipitation || 0) + (c.rain || 0) + (c.showers || 0);
    const code = c.weather_code;
    // real rain only: at least 2 mm in the current 15-minute reading (proper rain, not a modelled passing shower); the weather code alone does not count
    const rainy = mm >= 2;
    const k = rainy ? THREE.MathUtils.clamp(0.5 + mm * 0.15, 0.5, 1) : 0;
    market.setRain(k); lastRain = k;
    try { localStorage.setItem('nm-rain', String(k)); } catch (err) { /* private mode */ }
    document.body.dataset.weather = rainy ? 'rain' : 'dry';
    console.info(`Weather (${at.how}, ${at.lat.toFixed(2)}, ${at.lon.toFixed(2)}): code ${code}, ${mm} mm in the last 15 minutes: ${rainy ? 'rain' : 'dry'}`);
  } catch (err) { console.warn('Weather unavailable.', err); if (lastRain === null) market.setRain(1); }
}
let lastSync = 0;
const syncWeatherNow = () => { const now = Date.now(); if (now - lastSync < 30 * 1000) return; lastSync = now; syncWeather(); };
syncWeatherNow();
setInterval(syncWeatherNow, 2 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncWeatherNow(); });
window.addEventListener('focus', syncWeatherNow);
window.addEventListener('online', syncWeatherNow);

// Debug hooks; nothing on the page depends on these.
window.__nm = {
  get p() { return p; },
  get frames() { return frames; },
  get lastError() { return lastError; },
  get time() { return clock.elapsedTime; },
  get stops() { return stops.slice(); },
  get cur() { return cur; },
  market, camera, scene, goTo, syncWeather,
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
