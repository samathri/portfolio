import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const TAU = Math.PI * 2;
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

// Soft radial glow sprite for halos and nebulae.
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

// Procedural planet surface — continents, seas and polar haze in the planet's
// own colours, so the ground reads as real terrain when the horizon fills the
// windshield during the final descent.
function planetTexture(color, accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const base = new THREE.Color(color);
  const dark = base.clone().multiplyScalar(0.55);
  const light = base.clone().lerp(new THREE.Color('#ffffff'), 0.25);
  const tint = new THREE.Color(accent);
  ctx.fillStyle = `#${dark.getHexString()}`;
  ctx.fillRect(0, 0, 1024, 512);
  // Large continents.
  for (let i = 0; i < 46; i += 1) {
    ctx.fillStyle = `#${(i % 3 ? base : light).getHexString()}`;
    ctx.globalAlpha = 0.25 + Math.random() * 0.4;
    ctx.beginPath();
    ctx.ellipse(Math.random() * 1024, Math.random() * 512, 40 + Math.random() * 150, 22 + Math.random() * 70, Math.random() * Math.PI, 0, TAU);
    ctx.fill();
  }
  // Fine terrain speckle.
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = Math.random() > 0.5 ? `#${light.getHexString()}` : `#${dark.getHexString()}`;
    ctx.globalAlpha = 0.12 + Math.random() * 0.2;
    ctx.beginPath();
    ctx.ellipse(Math.random() * 1024, Math.random() * 512, 2 + Math.random() * 12, 1 + Math.random() * 7, Math.random() * Math.PI, 0, TAU);
    ctx.fill();
  }
  // Accent-tinted weather bands.
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = `#${tint.getHexString()}`;
    ctx.globalAlpha = 0.05 + Math.random() * 0.07;
    ctx.fillRect(0, Math.random() * 512, 1024, 14 + Math.random() * 42);
  }
  // Polar caps.
  ctx.globalAlpha = 0.5; ctx.fillStyle = '#e8f2f8';
  ctx.fillRect(0, 0, 1024, 26); ctx.fillRect(0, 486, 1024, 26);
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * The view out of the cockpit windshield: the ship drifts through space, the
 * section's own planet hangs ahead, the other planets float past, and the
 * starfield streams by. `scrollRef` (0..1, driven by the current content
 * block) gently banks the ship so changing blocks feels like flying.
 */
export default function StoryScene({ section, quality = 'medium', reducedMotion = false, scrollRef, flightRef }) {
  const mountRef = useRef(null);
  const dataRef = useRef({ scroll: 0, reducedMotion, flight: null });
  useEffect(() => { dataRef.current.reducedMotion = reducedMotion; }, [reducedMotion]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const { color, accent, size } = section;
    const accentColor = new THREE.Color(accent);
    const planetColor = new THREE.Color(color);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#02040b', 0.01);
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, quality === 'high' ? 1.7 : quality === 'low' ? 1 : 1.4));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#9fc2ff', '#0a0714', 1.0));
    const key = new THREE.DirectionalLight(accentColor, 2.6); key.position.set(-6, 5, 6); scene.add(key);
    const fill = new THREE.PointLight(planetColor, 22, 60, 1.6); fill.position.set(6, 2, 6); scene.add(fill);

    const glow = glowTexture();
    const disposables = [glow];

    /* ---- starfield streaming toward the ship (flight) ---- */
    const starCount = quality === 'low' ? 1600 : quality === 'high' ? 4200 : 2800;
    const starPos = new Float32Array(starCount * 3);
    const spread = 120; const depth = 220;
    for (let i = 0; i < starCount; i += 1) {
      starPos[i * 3] = (Math.random() - 0.5) * spread;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.7;
      starPos[i * 3 + 2] = -Math.random() * depth;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: '#dff0ff', size: quality === 'high' ? 0.12 : 0.16, transparent: true, opacity: 0.9, depthWrite: false });
    disposables.push(starGeo, starMat);
    const stars = new THREE.Points(starGeo, starMat); scene.add(stars);

    // A tinted accent star layer for depth.
    const star2Pos = new Float32Array(Math.floor(starCount * 0.4) * 3);
    for (let i = 0; i < star2Pos.length / 3; i += 1) {
      star2Pos[i * 3] = (Math.random() - 0.5) * spread;
      star2Pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.7;
      star2Pos[i * 3 + 2] = -Math.random() * depth;
    }
    const star2Geo = new THREE.BufferGeometry();
    star2Geo.setAttribute('position', new THREE.BufferAttribute(star2Pos, 3));
    const star2Mat = new THREE.PointsMaterial({ color: accent, size: 0.22, transparent: true, opacity: 0.6, depthWrite: false });
    disposables.push(star2Geo, star2Mat);
    const stars2 = new THREE.Points(star2Geo, star2Mat); scene.add(stars2);

    /* ---- spiral galaxy + nebula far away ---- */
    const spiralCount = quality === 'low' ? 900 : 2200;
    const sPos = new Float32Array(spiralCount * 3);
    const sCol = new Float32Array(spiralCount * 3);
    for (let i = 0; i < spiralCount; i += 1) {
      const arm = i % 3;
      const dist = Math.pow(Math.random(), 0.6) * 40 + 6;
      const angle = dist * 0.24 + (arm / 3) * TAU + (Math.random() - 0.5) * 0.5;
      sPos[i * 3] = Math.cos(angle) * dist - 26;
      sPos[i * 3 + 1] = 16 + (Math.random() - 0.5) * 5;
      sPos[i * 3 + 2] = Math.sin(angle) * dist - 80;
      const mix = accentColor.clone().lerp(new THREE.Color('#ffffff'), Math.random() * 0.55);
      sCol[i * 3] = mix.r; sCol[i * 3 + 1] = mix.g; sCol[i * 3 + 2] = mix.b;
    }
    const spiralGeo = new THREE.BufferGeometry();
    spiralGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    spiralGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
    const spiralMat = new THREE.PointsMaterial({ size: 0.34, vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
    disposables.push(spiralGeo, spiralMat);
    const spiral = new THREE.Points(spiralGeo, spiralMat);
    spiral.rotation.z = 0.5; scene.add(spiral);

    const nebula = new THREE.Group();
    [['#ffffff', 0.05], [accent, 0.1], [color, 0.08]].forEach(([tint, op], i) => {
      const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: new THREE.Color(tint), transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
      cloud.scale.setScalar(46 + i * 16);
      cloud.position.set((i - 1) * 30, 8 + i * 4, -70 - i * 10);
      nebula.add(cloud);
    });
    scene.add(nebula);

    /* ---- the destination planet, built at true landing scale ----
       One giant sphere. Far away it reads as a small lit disc; on final
       approach its top limb becomes a curved horizon under the ship — the
       same progression you'd see on a real orbital descent. */
    const R = 46;
    const hero = new THREE.Group();
    const surfaceMap = planetTexture(color, accent);
    disposables.push(surfaceMap);
    const heroSurface = new THREE.Mesh(
      new THREE.SphereGeometry(R, quality === 'low' ? 48 : 96, quality === 'low' ? 32 : 64),
      new THREE.MeshStandardMaterial({ map: surfaceMap, color: '#cfd6dd', roughness: 0.9, metalness: 0.04, emissive: planetColor, emissiveIntensity: 0.08, fog: false }),
    );
    hero.add(heroSurface);
    // Atmosphere shell — thickens as you descend into it.
    const atmoMat = new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.1, side: THREE.BackSide, depthWrite: false, fog: false });
    hero.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.035, 64, 44), atmoMat));
    // Limb glow (the bright rim you see against space).
    const limbMat = new THREE.SpriteMaterial({ map: glow, color: accentColor, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const heroGlow = new THREE.Sprite(limbMat);
    heroGlow.scale.setScalar(R * 2.55); hero.add(heroGlow);
    // Ring system — visible from space, fades once you drop beneath it.
    const ringMat = new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false, fog: false });
    const heroRing = new THREE.Mesh(new THREE.RingGeometry(R * 1.5, R * 2.05, 128), ringMat);
    heroRing.rotation.x = Math.PI / 2.15; heroRing.rotation.y = 0.3; hero.add(heroRing);
    scene.add(hero);

    // Flight path: distant disc up-ahead → looming sphere → horizon below.
    const farPos = new THREE.Vector3(9, 5, -420);
    const nearPos = new THREE.Vector3(0, -(R + 2.8), -26);

    let compact = false;
    const resize = () => {
      const w = mount.clientWidth; const h = mount.clientHeight || 1;
      compact = w <= 768;
      camera.aspect = w / h;
      camera.fov = compact ? 72 : 60;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      farPos.x = compact ? 5 : 9;
    };
    const observer = new ResizeObserver(resize); observer.observe(mount); resize();

    let frame; let lastTime = performance.now(); let smooth = 0; let bank = 0;
    const animate = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); lastTime = now;
      const d = dataRef.current;
      const fl = d.flight || { gear: 2, boost: 0, cam: false };
      // GEAR sets cruise speed: higher gear closes distance faster and the
      // stars streak harder. BOOST is a decaying burst on top.
      const gearMult = [0.55, 1, 1.9, 3.1][(fl.gear || 2) - 1];
      fl.boost = Math.max(0, (fl.boost || 0) - dt * 0.85);
      smooth += (d.scroll - smooth) * (0.02 + (fl.gear || 2) * 0.013);
      const t = now * 0.001;
      const rate = Math.abs(d.scroll - smooth);              // how hard we're burning
      const p = smooth * smooth * (3 - 2 * smooth);          // eased approach 0..1
      const starSpeed = d.reducedMotion ? 0 : ((1 + clampN(rate * 60, 0, 7)) * gearMult + fl.boost * 10);

      if (!d.reducedMotion) {
        // Stars stream toward the ship — streaking hardest mid-burn.
        const sp = starGeo.attributes.position; const sp2 = star2Geo.attributes.position;
        for (let i = 0; i < sp.count; i += 1) { let z = sp.getZ(i) + dt * 9 * starSpeed; if (z > 10) z -= depth; sp.setZ(i, z); }
        for (let i = 0; i < sp2.count; i += 1) { let z = sp2.getZ(i) + dt * 14 * starSpeed; if (z > 10) z -= depth; sp2.setZ(i, z); }
        sp.needsUpdate = true; sp2.needsUpdate = true;
        heroSurface.rotation.y += dt * lerp(0.02, 0.004, p); // huge worlds turn slowly
        spiral.rotation.y += dt * 0.008;
      }

      // Real approach staging along the flight path:
      //  p≈0   deep space — the planet is a small distant disc
      //  p≈0.5 orbit — it looms and fills half the glass
      //  p≈1   descent — its curved horizon stretches beneath the ship
      hero.position.lerpVectors(farPos, nearPos, p);

      // Atmosphere thickens and the limb brightens as you sink into it;
      // the ring slides out of view once you drop below the ring plane.
      atmoMat.opacity = lerp(0.08, 0.34, p);
      limbMat.opacity = lerp(0.22, 0.5, p);
      ringMat.opacity = 0.24 * (1 - clampN((p - 0.55) / 0.3, 0, 1));
      // Space dims as the atmosphere takes over; the LIGHTS knob scales it.
      const lightsLevel = 0.25 + 0.75 * (fl.lights ?? 0.8);
      starMat.opacity = lerp(0.9, 0.35, p) * lightsLevel;
      star2Mat.opacity = lerp(0.6, 0.2, p) * lightsLevel;
      spiralMat.opacity = lerp(0.5, 0.12, p) * lightsLevel;

      // Entry rumble on the final descent, plus a kick while boosting.
      const rumbleAmt = clampN(rate * 30, 0, 1) * ((p > 0.7 && rate > 0.004) ? 0.12 : 0) + fl.boost * 0.1;
      const rumble = d.reducedMotion ? 0 : Math.sin(now * 0.055) * rumbleAmt;
      // The BANK lever rolls the ship into a turn and swings the view across
      // (eased, so it leans in and settles back like a real aircraft).
      bank += ((fl.turn || 0) - bank) * 0.09;
      const bob = Math.sin(t * 0.25) * 0.08;
      camera.position.x = bob * 0.5 + rumble * 0.6 + bank * 1.8;
      camera.position.y = 0.2 + bob + rumble;
      // CAM toggle widens the view; boost adds a warp-stretch FOV kick.
      const targetFov = (compact ? 72 : 60) + (fl.cam ? 9 : 0) + fl.boost * 8;
      camera.fov += (targetFov - camera.fov) * 0.08;
      camera.updateProjectionMatrix();
      // Nose tips down as the horizon rises; banking swings the gaze sideways.
      camera.lookAt(lerp(1.2, 0, p) - bank * 9, lerp(0.6, -2.6, p), -24);
      // Roll must be applied after lookAt (which resets orientation).
      camera.rotation.z += rumble * 0.02 - bank * 0.3;

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
  }, [section, quality]);

  useEffect(() => {
    if (!scrollRef) return undefined;
    let raf;
    const tick = () => {
      dataRef.current.scroll = scrollRef.current || 0;
      if (flightRef) dataRef.current.flight = flightRef.current;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scrollRef, flightRef]);

  return <div className="story-scene" ref={mountRef} aria-hidden="true" />;
}
