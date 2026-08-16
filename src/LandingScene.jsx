import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { destinations } from './content.js';

const TAU = Math.PI * 2;
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// The parked ship the astronaut climbed out of.
function landedRocket(accent) {
  const root = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({ color: '#dce9ef', metalness: 0.68, roughness: 0.24 });
  const dark = new THREE.MeshStandardMaterial({ color: '#111a25', metalness: 0.5, roughness: 0.32 });
  const glass = new THREE.MeshPhysicalMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.8, metalness: 0.35, roughness: 0.1 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.7, 12, 28), hull); body.position.y = 1.55; root.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.7, 28), hull); nose.position.y = 2.62; root.add(nose);
  const win = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), glass); win.scale.set(1, 0.8, 0.4); win.position.set(0, 1.95, -0.42); root.add(win);
  [-1, 1].forEach((side) => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.9), dark); fin.position.set(side * 0.55, 0.55, 0.12); fin.rotation.z = side * 0.5; root.add(fin);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.85, 10), dark); leg.position.set(side * 0.6, 0.2, 0.1); leg.rotation.z = side * 0.32; root.add(leg);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12), dark); foot.position.set(side * 0.78, -0.18, 0.14); root.add(foot);
  });
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 1.1), dark); ramp.position.set(0.62, -0.16, 0.7); ramp.rotation.z = -0.18; root.add(ramp);
  return root;
}

// A more realistic astronaut in a full EVA suit (gold visor, PLSS pack,
// chest panel, jointed limbs, boots + gloves).
function astronaut(accent) {
  const g = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color: '#eef3f7', roughness: 0.6, metalness: 0.04 });
  const soft = new THREE.MeshStandardMaterial({ color: '#cfd8e0', roughness: 0.72 });
  const dark = new THREE.MeshStandardMaterial({ color: '#1a2430', roughness: 0.5, metalness: 0.3 });
  const visorMat = new THREE.MeshPhysicalMaterial({ color: '#241706', metalness: 1, roughness: 0.08, emissive: '#c9962e', emissiveIntensity: 0.35, clearcoat: 1, clearcoatRoughness: 0.1 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.5, roughness: 0.4 });

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 24), suit); helmet.position.y = 1.62; g.add(helmet);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 24, Math.PI * 0.16, Math.PI * 0.68, Math.PI * 0.26, Math.PI * 0.46), visorMat);
  visor.position.set(0, 1.6, 0.02); g.add(visor);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.2, 0.1, 20), dark); neck.position.y = 1.35; g.add(neck);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.5, 12, 24), suit); torso.position.y = 1.0; g.add(torso);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.06), dark); panel.position.set(0, 1.05, 0.29); g.add(panel);
  ['#5dffc2', '#ffcf4b', '#ff6b6b'].forEach((c, i) => {
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshBasicMaterial({ color: c }));
    led.position.set(-0.07 + i * 0.07, 1.1, 0.33); g.add(led);
  });
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.28), soft); pack.position.set(0, 1.06, -0.32); g.add(pack);
  const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.24, 0.16, 20), dark); waist.position.y = 0.67; g.add(waist);

  // Limbs hang from pivot groups at the shoulders and hips so they can swing
  // in a run cycle when the visitor scrolls.
  const limbs = { arms: [], legs: [] };
  [-1, 1].forEach((side) => {
    const arm = new THREE.Group(); arm.position.set(side * 0.4, 1.22, 0);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), suit); arm.add(shoulder);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.28, 8, 16), suit); upper.position.set(side * 0.05, -0.22, 0); arm.add(upper);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 20), accentMat); band.position.set(side * 0.06, -0.34, 0); band.rotation.y = Math.PI / 2; arm.add(band);
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.28, 8, 16), suit); fore.position.set(side * 0.07, -0.5, 0.05); arm.add(fore);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12), dark); glove.position.set(side * 0.08, -0.66, 0.09); arm.add(glove);
    g.add(arm); limbs.arms.push(arm);

    const leg = new THREE.Group(); leg.position.set(side * 0.15, 0.6, 0);
    const hip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), suit); leg.add(hip);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.34, 8, 16), suit); thigh.position.set(side * 0.01, -0.26, 0); leg.add(thigh);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.34, 8, 16), suit); shin.position.set(side * 0.01, -0.58, 0.02); leg.add(shin);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.15, 0.3), dark); boot.position.set(side * 0.01, -0.78, 0.07); leg.add(boot);
    g.add(leg); limbs.legs.push(leg);
  });

  g.userData = { helmet, torso, limbs };
  return g;
}

/**
 * "Landed on the planet" scene for a project detail page. The ship is parked
 * on the left, the astronaut stands beside it, and scrolling tilts your gaze
 * up into the sky where the other planets drift by.
 */
export default function LandingScene({ color, accent, quality = 'medium', reducedMotion = false, scrollRef }) {
  const mountRef = useRef(null);
  const dataRef = useRef({ scroll: 0, reducedMotion });
  useEffect(() => { dataRef.current.reducedMotion = reducedMotion; }, [reducedMotion]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const accentColor = new THREE.Color(accent);
    const planetColor = new THREE.Color(color);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#03040c', 0.018);
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 400);

    const renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, quality === 'high' ? 1.7 : quality === 'low' ? 1 : 1.4));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#a9c6ff', planetColor.clone().multiplyScalar(0.4), 1.05));
    const key = new THREE.DirectionalLight('#fff2e0', 2.4); key.position.set(-5, 6, 4); scene.add(key);
    const rim = new THREE.PointLight(accentColor, 16, 30, 1.8); rim.position.set(1.5, 2.4, 2); scene.add(rim);

    const glow = glowTexture();
    const disposables = [glow];

    // Sky: stars + spiral galaxy + nebula.
    const starCount = quality === 'low' ? 1400 : quality === 'high' ? 4000 : 2600;
    const makeStars = (n, spread, sizePx, opacity, tint) => {
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i += 1) {
        const r = spread * (0.4 + Math.random() * 0.6);
        const a = Math.random() * TAU; const b = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(b) * Math.cos(a);
        pos[i * 3 + 1] = Math.abs(r * Math.cos(b)) * 0.9 + 5;
        pos[i * 3 + 2] = r * Math.sin(b) * Math.sin(a) - 14;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color: tint, size: sizePx, transparent: true, opacity, depthWrite: false });
      disposables.push(geo, mat);
      const pts = new THREE.Points(geo, mat); scene.add(pts); return pts;
    };
    const starsA = makeStars(starCount, 100, quality === 'high' ? 0.11 : 0.15, 0.85, '#dff0ff');
    const starsB = makeStars(Math.floor(starCount * 0.4), 66, 0.22, 0.55, accent);

    const spiralCount = quality === 'low' ? 900 : 2200;
    const sPos = new Float32Array(spiralCount * 3);
    const sCol = new Float32Array(spiralCount * 3);
    for (let i = 0; i < spiralCount; i += 1) {
      const arm = i % 3;
      const dist = Math.pow(Math.random(), 0.6) * 46 + 6;
      const angle = dist * 0.22 + (arm / 3) * TAU + (Math.random() - 0.5) * 0.5;
      sPos[i * 3] = Math.cos(angle) * dist * 0.7;
      sPos[i * 3 + 1] = 30 + (Math.random() - 0.5) * 6;
      sPos[i * 3 + 2] = Math.sin(angle) * dist - 46;
      const mix = accentColor.clone().lerp(new THREE.Color('#ffffff'), Math.random() * 0.55);
      sCol[i * 3] = mix.r; sCol[i * 3 + 1] = mix.g; sCol[i * 3 + 2] = mix.b;
    }
    const spiralGeo = new THREE.BufferGeometry();
    spiralGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    spiralGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
    const spiralMat = new THREE.PointsMaterial({ size: 0.32, vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
    disposables.push(spiralGeo, spiralMat);
    const spiral = new THREE.Points(spiralGeo, spiralMat);
    spiral.rotation.z = 0.5; scene.add(spiral);

    const nebula = new THREE.Group();
    [['#ffffff', 0.05], [accent, 0.1], [color, 0.08]].forEach(([tint, op], i) => {
      const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: new THREE.Color(tint), transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
      cloud.scale.setScalar(46 + i * 16);
      cloud.position.set((i - 1) * 30, 22 + i * 4, -60 - i * 8);
      nebula.add(cloud);
    });
    scene.add(nebula);

    // Other planets in the sky.
    const others = destinations.filter((d) => d.id !== 'projects');
    const skyPlanets = [];
    const spots = [[-16, 12, -46], [14, 16, -58], [-9, 22, -70], [20, 9, -52], [-22, 8, -40]];
    others.forEach((d, i) => {
      const spot = spots[i % spots.length];
      const grp = new THREE.Group(); grp.position.set(...spot);
      const r = 1.1 + (i % 3) * 0.7;
      const surface = new THREE.Mesh(
        new THREE.SphereGeometry(r, quality === 'low' ? 20 : 36, quality === 'low' ? 14 : 24),
        new THREE.MeshStandardMaterial({ color: d.color, roughness: 0.82, metalness: 0.1, emissive: new THREE.Color(d.color), emissiveIntensity: 0.18 }),
      );
      grp.add(surface);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: new THREE.Color(d.accent), transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.setScalar(r * 5); grp.add(halo);
      grp.userData = { surface, base: spot.slice(), drift: 0.5 + i * 0.2, phase: i * 1.5, spin: 0.05 + (i % 3) * 0.03 };
      scene.add(grp); skyPlanets.push(grp);
    });

    // Planet surface.
    const groundGeo = new THREE.PlaneGeometry(300, 300, 48, 48);
    const gp = groundGeo.attributes.position;
    for (let i = 0; i < gp.count; i += 1) {
      const x = gp.getX(i); const y = gp.getY(i);
      gp.setZ(i, Math.sin(x * 0.12) * Math.cos(y * 0.1) * 0.9 + Math.sin((x + y) * 0.05) * 0.6 + (Math.random() - 0.5) * 0.25);
    }
    gp.needsUpdate = true; groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: planetColor.clone().multiplyScalar(0.5), roughness: 0.97, metalness: 0.03, emissive: planetColor, emissiveIntensity: 0.05 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.15, -34); scene.add(ground);

    const horizon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: accentColor, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
    horizon.scale.set(180, 36, 1); horizon.position.set(-3, 1.4, -64); scene.add(horizon);

    // Ship parked left, astronaut standing to its right.
    const rocket = landedRocket(accentColor); rocket.position.set(-3.4, 0, -4); rocket.rotation.y = 0.42; scene.add(rocket);
    const person = astronaut(accentColor); person.position.set(-0.7, 0.18, -1.2); person.rotation.y = 0.55; person.scale.setScalar(1.02); scene.add(person);

    let compact = false;
    const resize = () => {
      const w = mount.clientWidth; const h = mount.clientHeight || 1;
      compact = w <= 768;
      camera.aspect = w / h;
      camera.fov = compact ? 70 : 58;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      rocket.position.x = compact ? -2.9 : -3.4;
      person.position.x = compact ? -0.4 : -0.7;
    };
    const observer = new ResizeObserver(resize); observer.observe(mount); resize();

    const lookStart = new THREE.Vector3(-1.1, 1.1, -9);
    const lookEnd = new THREE.Vector3(2.6, 7.5, -26);
    const lookNow = new THREE.Vector3().copy(lookStart);

    let frame; let lastTime = performance.now(); let smooth = 0; let runAmt = 0; let runDir = 1;
    const animate = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); lastTime = now;
      const d = dataRef.current;
      smooth += (d.scroll - smooth) * 0.07;
      const t = now * 0.001;

      if (!d.reducedMotion) {
        spiral.rotation.y += dt * 0.01;
        starsA.rotation.y += dt * 0.003;
        starsB.rotation.y -= dt * 0.004;
        person.userData.torso.scale.set(1, 1 + Math.sin(t * 1.2) * 0.01, 1);
      }

      // Run cycle — scrolling sends the astronaut sprinting across the
      // surface (and back up when you scroll up). Limb pivots swing, the body
      // bounces with each stride, and they face the direction of travel.
      const burn = d.scroll - smooth;
      if (burn > 0.0004) runDir = 1; else if (burn < -0.0004) runDir = -1;
      const runTarget = d.reducedMotion ? 0 : clampN(Math.abs(burn) * 26, 0, 1);
      runAmt += (runTarget - runAmt) * 0.08;
      const baseAX = compact ? -0.4 : -0.7;
      person.position.x = lerp(baseAX, baseAX + 8, smooth);
      person.position.z = -1.2 - smooth * 2.2;
      const stride = Math.sin(now * 0.013) * runAmt;
      const { arms, legs } = person.userData.limbs;
      arms[0].rotation.x = stride * 1.05; arms[1].rotation.x = -stride * 1.05;
      legs[0].rotation.x = -stride * 1.15; legs[1].rotation.x = stride * 1.15;
      person.position.y = 0.18 + Math.abs(Math.sin(now * 0.013)) * 0.1 * runAmt;
      const idleYaw = 0.55 + (d.reducedMotion ? 0 : Math.sin(t * 0.3) * 0.35);
      const targetYaw = runAmt > 0.12 ? (runDir > 0 ? Math.PI / 2 : -Math.PI / 2) : idleYaw;
      person.rotation.y += (targetYaw - person.rotation.y) * 0.14;
      person.rotation.z = -runDir * runAmt * 0.1; // slight sprinter's lean

      skyPlanets.forEach((grp) => {
        const u = grp.userData;
        if (!d.reducedMotion) u.surface.rotation.y += dt * u.spin * 3;
        grp.position.x = u.base[0] + Math.sin(t * 0.05 * u.drift + u.phase) * 3 - smooth * 6;
        grp.position.y = u.base[1] + Math.cos(t * 0.04 * u.drift + u.phase) * 1.6 - smooth * 2;
      });
      nebula.position.x = -smooth * 6;

      // The camera tracks the runner while they're the star of the shot,
      // then tilts up into the moving sky as you scroll deeper.
      lookStart.set(person.position.x * 0.85, 1.0, -4);
      lookNow.lerpVectors(lookStart, lookEnd, smooth);
      camera.position.set(person.position.x * 0.3 * (1 - smooth) + Math.sin(t * 0.15) * 0.12, lerp(1.6, 3.4, smooth), 6.4 - smooth * 0.8);
      camera.lookAt(lookNow.x + Math.sin(t * 0.1) * 0.12, lookNow.y, lookNow.z);

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => { m.map?.dispose?.(); m.dispose?.(); });
        }
      });
      disposables.forEach((x) => x.dispose?.());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [color, accent, quality]);

  useEffect(() => {
    if (!scrollRef) return undefined;
    let raf;
    const tick = () => { dataRef.current.scroll = scrollRef.current || 0; raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scrollRef]);

  return <div className="landing-scene" ref={mountRef} aria-hidden="true" />;
}
