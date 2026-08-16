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

/**
 * The view out of the cockpit windshield: the ship drifts through space, the
 * section's own planet hangs ahead, the other planets float past, and the
 * starfield streams by. `scrollRef` (0..1, driven by the current content
 * block) gently banks the ship so changing blocks feels like flying.
 */
export default function StoryScene({ section, quality = 'medium', reducedMotion = false, scrollRef }) {
  const mountRef = useRef(null);
  const dataRef = useRef({ scroll: 0, reducedMotion });
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

    /* ---- the section's own planet, hanging ahead ---- */
    const hero = new THREE.Group();
    const heroHomeX = 6;
    hero.position.set(heroHomeX, 1.4, -10);
    const heroSurface = new THREE.Mesh(
      new THREE.SphereGeometry(size * 2.2, quality === 'low' ? 32 : 64, quality === 'low' ? 24 : 48),
      new THREE.MeshStandardMaterial({ color: planetColor, roughness: 0.78, metalness: 0.12, emissive: planetColor, emissiveIntensity: 0.14 }),
    );
    hero.add(heroSurface);
    hero.add(new THREE.Mesh(
      new THREE.SphereGeometry(size * 2.4, 40, 28),
      new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.16, side: THREE.BackSide }),
    ));
    const heroGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: accentColor, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
    heroGlow.scale.setScalar(size * 11); hero.add(heroGlow);
    const heroRing = new THREE.Mesh(
      new THREE.RingGeometry(size * 3.1, size * 4.2, 96),
      new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false }),
    );
    heroRing.rotation.x = Math.PI / 2.15; heroRing.rotation.y = 0.3; hero.add(heroRing);
    scene.add(hero);

    let compact = false;
    const resize = () => {
      const w = mount.clientWidth; const h = mount.clientHeight || 1;
      compact = w <= 768;
      camera.aspect = w / h;
      camera.fov = compact ? 72 : 60;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      hero.position.x = compact ? 3.4 : heroHomeX;
    };
    const observer = new ResizeObserver(resize); observer.observe(mount); resize();

    let frame; let lastTime = performance.now(); let smooth = 0; let heroZ = -140;
    const animate = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); lastTime = now;
      const d = dataRef.current;
      smooth += (d.scroll - smooth) * 0.06;
      const t = now * 0.001;

      // Block progress = how close we are. Block 1 arrives from deep space;
      // every Next flies the ship nearer, so the planet grows and grows.
      const far = -52; const near = -5;
      const targetZ = lerp(far, near, smooth);
      heroZ += (targetZ - heroZ) * 0.045;
      const closing = Math.abs(targetZ - heroZ);
      const starSpeed = d.reducedMotion ? 0 : (1 + clampN(closing * 0.22, 0, 7));

      if (!d.reducedMotion) {
        // Stars stream toward the ship — faster while closing the distance.
        const sp = starGeo.attributes.position; const sp2 = star2Geo.attributes.position;
        for (let i = 0; i < sp.count; i += 1) { let z = sp.getZ(i) + dt * 9 * starSpeed; if (z > 10) z -= depth; sp.setZ(i, z); }
        for (let i = 0; i < sp2.count; i += 1) { let z = sp2.getZ(i) + dt * 14 * starSpeed; if (z > 10) z -= depth; sp2.setZ(i, z); }
        sp.needsUpdate = true; sp2.needsUpdate = true;
        heroSurface.rotation.y += dt * 0.05;
        spiral.rotation.y += dt * 0.008;
      }

      // The one destination planet, filling more of the windshield as you go.
      const baseX = compact ? 1.5 : 2.4;
      hero.position.z = heroZ;
      hero.position.x = lerp(baseX + 0.5, baseX - 0.8, smooth);
      hero.position.y = lerp(-0.7, -0.15, smooth);
      const bob = Math.sin(t * 0.25) * 0.1;
      camera.position.x = bob * 0.5;
      camera.position.y = 0.2 + bob;
      camera.rotation.z = 0;
      camera.lookAt(lerp(0.9, 0.4, smooth), -0.1, -20);

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
    const tick = () => { dataRef.current.scroll = scrollRef.current || 0; raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scrollRef]);

  return <div className="story-scene" ref={mountRef} aria-hidden="true" />;
}
