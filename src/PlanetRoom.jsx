import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const EMPTY = [];
const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ *
 *  Small builders
 * ------------------------------------------------------------------ */

// A soft radial glow sprite used for halos, nebulae and star flares.
function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// A floating text label rendered to a transparent canvas → sprite.
function labelSprite(text, accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);
  ctx.font = '600 42px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#eaf6ff';
  ctx.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.0, depthWrite: false, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.6, 0.65, 1);
  sprite.userData.baseWidth = 2.6;
  return sprite;
}

/* ------------------------------------------------------------------ *
 *  Hotspot placement per layout
 * ------------------------------------------------------------------ */

function layoutPositions(layout, count, size) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const t = count > 1 ? i / (count - 1) : 0.5;
    if (layout === 'orbit') {
      const a = (i / count) * TAU + 0.4;
      const r = size + 2.35;
      out.push([Math.cos(a) * r, Math.sin(a * 1.7) * 0.55, Math.sin(a) * r]);
    } else if (layout === 'constellation') {
      const a = (i / count) * TAU - Math.PI / 2;
      const r = 3.05;
      out.push([Math.cos(a) * r, Math.sin(a) * r * 0.62 + 0.35, Math.sin(a * 0.6) * 1.1 - 0.4]);
    } else if (layout === 'ring') {
      const spread = 1.02; // radians each side of centre
      const a = -spread + t * spread * 2;
      const r = 4.35;
      out.push([Math.sin(a) * r, 0.15 + Math.sin(a * 2) * 0.25, -Math.cos(a) * r + 3.2]);
    } else if (layout === 'pylons') {
      const x = (i - (count - 1) / 2) * 2.55;
      out.push([x, 0.55, 0.4]);
    } else if (layout === 'trail') {
      out.push([(i % 2 ? 1.5 : -1.5) * (1 - t * 0.35), 0.2 + t * 0.4, 2.6 - i * 2.75]);
    } else { // dish
      const a = -0.9 + t * 1.8;
      const r = 2.5;
      out.push([Math.sin(a) * r, 0.4 + Math.cos(a) * 0.3, -Math.cos(a) * r + 2.6]);
    }
  }
  return out;
}

// Camera framing defaults per layout.
function layoutCamera(layout) {
  switch (layout) {
    case 'ring': return { radius: 8.4, min: 5.5, max: 12, phi: 1.32, planet: [0, 1.7, -2.6], planetScale: 1.1 };
    case 'pylons': return { radius: 8.0, min: 5, max: 12, phi: 1.28, planet: [0, 2.4, -3.2], planetScale: 0.9 };
    case 'trail': return { radius: 8.8, min: 5, max: 13, phi: 1.2, planet: [0, 2.8, -6.5], planetScale: 0.8 };
    case 'constellation': return { radius: 7.6, min: 4.5, max: 11, phi: 1.35, planet: [0, 0.1, 0], planetScale: 0.72 };
    case 'dish': return { radius: 7.4, min: 4.5, max: 11, phi: 1.3, planet: [0, 2.2, -3.4], planetScale: 0.85 };
    default: return { radius: 7.2, min: 4.5, max: 10.5, phi: 1.3, planet: [0, 0.1, 0], planetScale: 1 }; // orbit
  }
}

/* ------------------------------------------------------------------ *
 *  Hotspot node — a clickable, glowing marker with layout flavour
 * ------------------------------------------------------------------ */

function makeHotspot(layout, index, accent, color, label, sharedGlow) {
  const group = new THREE.Group();
  const accentColor = new THREE.Color(accent);

  // The visible core geometry differs a little by layout for flavour.
  let coreGeo;
  if (layout === 'constellation' || layout === 'dish') coreGeo = new THREE.OctahedronGeometry(0.34, 0);
  else if (layout === 'ring') coreGeo = new THREE.BoxGeometry(0.42, 0.66, 0.1);
  else if (layout === 'pylons') coreGeo = new THREE.IcosahedronGeometry(0.32, 0);
  else if (layout === 'trail') coreGeo = new THREE.TorusGeometry(0.32, 0.11, 12, 24);
  else coreGeo = new THREE.IcosahedronGeometry(0.3, 0);

  const coreMat = new THREE.MeshStandardMaterial({
    color: accentColor, emissive: accentColor, emissiveIntensity: 1.15,
    metalness: 0.4, roughness: 0.25, transparent: true, opacity: 0.96,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.userData.isHotspot = true;
  core.userData.index = index;
  group.add(core);

  // Enlarged invisible sphere makes raycasting forgiving.
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.72, 12, 10), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.isHotspot = true;
  hit.userData.index = index;
  group.add(hit);

  // Halo behind the core.
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: sharedGlow, color: accentColor, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(1.7);
  group.add(halo);

  // A subtle wire "target ring" that spins — reads as an interactive marker.
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.56, 32),
    new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
  );
  group.add(ring);

  // Layout-specific stand / connector.
  if (layout === 'pylons') {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.14, 2.4, 12),
      new THREE.MeshStandardMaterial({ color: '#0c1622', metalness: 0.6, roughness: 0.35, emissive: accentColor, emissiveIntensity: 0.15 }),
    );
    pillar.position.y = -1.35;
    group.add(pillar);
  }

  const label3d = labelSprite(label, accent);
  label3d.position.set(0, layout === 'pylons' ? 0.95 : 0.85, 0);
  group.add(label3d);

  group.userData = { core, ring, halo, label: label3d, coreMat, baseOpacity: 0.55, spin: 0.4 + index * 0.05, index };
  return group;
}

/* ------------------------------------------------------------------ *
 *  Main component
 * ------------------------------------------------------------------ */

export default function PlanetRoom({
  section, hotspots = EMPTY, quality = 'medium', reducedMotion = false,
  focusedIndex = null, onHotspotHover, onHotspotClick, onReady,
}) {
  const mountRef = useRef(null);
  const stateRef = useRef({ reducedMotion, focusedIndex });
  const callbackRef = useRef({ onHotspotHover, onHotspotClick, onReady });
  const labels = useMemo(() => hotspots.map((h, i) => String(i + 1).padStart(2, '0') + ' · ' + (h.short || h.title || h.label || '')), [hotspots]);

  useEffect(() => { stateRef.current = { reducedMotion, focusedIndex }; }, [reducedMotion, focusedIndex]);
  useEffect(() => { callbackRef.current = { onHotspotHover, onHotspotClick, onReady }; }, [onHotspotHover, onHotspotClick, onReady]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const { color, accent, size, layout = 'orbit' } = section;
    const accentColor = new THREE.Color(accent);
    const planetColor = new THREE.Color(color);
    const cameraCfg = layoutCamera(layout);
    const count = labels.length;

    /* ---- renderer / scene / camera ---- */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#02040b', layout === 'trail' ? 0.03 : 0.045);
    const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, quality === 'high' ? 1.75 : quality === 'low' ? 1 : 1.4));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    mount.appendChild(renderer.domElement);

    /* ---- lights ---- */
    scene.add(new THREE.HemisphereLight('#8fb6ff', '#0a0714', 1.1));
    const key = new THREE.DirectionalLight(accentColor, 2.6); key.position.set(-5, 7, 5); scene.add(key);
    const fill = new THREE.PointLight(planetColor, 22, 40, 1.6); fill.position.set(4, 3, 4); scene.add(fill);

    const sharedGlow = glowTexture();
    const disposables = [sharedGlow];

    /* ---- galaxy backdrop: two star layers + a faint spiral disk ---- */
    const starCount = quality === 'low' ? 1200 : quality === 'high' ? 4200 : 2400;
    const makeStars = (n, spread, sizePx, opacity, tint) => {
      const positions = new Float32Array(n * 3);
      for (let i = 0; i < n; i += 1) {
        const r = spread * (0.35 + Math.random() * 0.65);
        const a = Math.random() * TAU; const b = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(b) * Math.cos(a);
        positions[i * 3 + 1] = r * Math.cos(b) * 0.75;
        positions[i * 3 + 2] = r * Math.sin(b) * Math.sin(a);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({ color: tint, size: sizePx, transparent: true, opacity, depthWrite: false });
      disposables.push(geo, mat);
      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      return pts;
    };
    const starsA = makeStars(starCount, 60, quality === 'high' ? 0.09 : 0.12, 0.85, '#dff0ff');
    const starsB = makeStars(Math.floor(starCount * 0.4), 42, 0.16, 0.6, accent);

    // Spiral galaxy disk — flat rotating point cloud tinted with the accent.
    const spiralCount = quality === 'low' ? 900 : 2000;
    const spiralPos = new Float32Array(spiralCount * 3);
    const spiralColors = new Float32Array(spiralCount * 3);
    const arms = 3;
    for (let i = 0; i < spiralCount; i += 1) {
      const arm = i % arms;
      const dist = Math.pow(Math.random(), 0.6) * 30 + 3;
      const angle = dist * 0.28 + (arm / arms) * TAU + (Math.random() - 0.5) * 0.5;
      spiralPos[i * 3] = Math.cos(angle) * dist + (Math.random() - 0.5) * 2;
      spiralPos[i * 3 + 1] = -6 + (Math.random() - 0.5) * 2.2;
      spiralPos[i * 3 + 2] = Math.sin(angle) * dist + (Math.random() - 0.5) * 2;
      const mix = accentColor.clone().lerp(new THREE.Color('#ffffff'), Math.random() * 0.5);
      spiralColors[i * 3] = mix.r; spiralColors[i * 3 + 1] = mix.g; spiralColors[i * 3 + 2] = mix.b;
    }
    const spiralGeo = new THREE.BufferGeometry();
    spiralGeo.setAttribute('position', new THREE.BufferAttribute(spiralPos, 3));
    spiralGeo.setAttribute('color', new THREE.BufferAttribute(spiralColors, 3));
    const spiralMat = new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
    disposables.push(spiralGeo, spiralMat);
    const spiral = new THREE.Points(spiralGeo, spiralMat);
    spiral.rotation.x = 0.35;
    scene.add(spiral);

    // Nebula clouds for depth.
    const nebula = new THREE.Group();
    [['#ffffff', 0.05], [accent, 0.09], [color, 0.08]].forEach(([tint, op], i) => {
      const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: sharedGlow, color: new THREE.Color(tint), transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
      cloud.scale.setScalar(26 + i * 9);
      cloud.position.set((i - 1) * 16, 4 - i * 5, -22 - i * 6);
      nebula.add(cloud);
    });
    scene.add(nebula);

    /* ---- centerpiece planet ---- */
    const planet = new THREE.Group();
    planet.position.set(...cameraCfg.planet);
    planet.scale.setScalar(cameraCfg.planetScale);
    const planetSurface = new THREE.Mesh(
      new THREE.SphereGeometry(size, quality === 'low' ? 32 : 64, quality === 'low' ? 24 : 48),
      new THREE.MeshStandardMaterial({ color: planetColor, roughness: 0.78, metalness: 0.12, emissive: planetColor, emissiveIntensity: 0.12 }),
    );
    planet.add(planetSurface);
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(size * 1.12, 40, 28),
      new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.16, side: THREE.BackSide }),
    );
    planet.add(atmosphere);
    // A halo glow disk behind the planet.
    const planetGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: sharedGlow, color: accentColor, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
    planetGlow.scale.setScalar(size * 5.2);
    planet.add(planetGlow);
    // A tilted ring for extra sci-fi flavour on a few layouts.
    if (layout === 'orbit' || layout === 'dish' || layout === 'constellation') {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(size * 1.5, size * 2.15, 96),
        new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }),
      );
      ring.rotation.x = Math.PI / 2.1; ring.rotation.y = 0.2;
      planet.add(ring);
    }
    scene.add(planet);

    /* ---- hotspots ---- */
    const positions = layoutPositions(layout, count, size);
    const hotspotGroups = [];
    const hitMeshes = [];
    positions.forEach((pos, i) => {
      const group = makeHotspot(layout, i, accent, color, labels[i] || '', sharedGlow);
      group.position.set(...pos);
      group.userData.homeY = pos[1];
      scene.add(group);
      hotspotGroups.push(group);
      group.traverse((o) => { if (o.userData?.isHotspot) hitMeshes.push(o); });
    });

    // Constellation / trail connective lines.
    if (count > 1 && (layout === 'constellation' || layout === 'trail')) {
      const linePts = [];
      if (layout === 'constellation') {
        // spokes from centre + a loop through the nodes
        positions.forEach((p) => { linePts.push(new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(...p)); });
        positions.forEach((p, i) => { const q = positions[(i + 1) % count]; linePts.push(new THREE.Vector3(...p), new THREE.Vector3(...q)); });
      } else {
        for (let i = 0; i < count - 1; i += 1) linePts.push(new THREE.Vector3(...positions[i]), new THREE.Vector3(...positions[i + 1]));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
      const lineMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.4 });
      disposables.push(lineGeo, lineMat);
      scene.add(new THREE.LineSegments(lineGeo, lineMat));
    }

    /* ---- orbit camera state ---- */
    const target = new THREE.Vector3(0, layout === 'trail' ? 0.4 : 0.6, layout === 'trail' ? -2 : 0);
    let theta = layout === 'trail' ? 0.05 : 0.7;
    let phi = cameraCfg.phi;
    let radius = cameraCfg.radius;
    let targetTheta = theta; let targetPhi = phi; let targetRadius = radius;
    let autoRotate = true;
    const applyCamera = () => {
      const st = Math.sin(phi), ct = Math.cos(phi);
      camera.position.set(
        target.x + radius * st * Math.sin(theta),
        target.y + radius * ct,
        target.z + radius * st * Math.cos(theta),
      );
      camera.lookAt(target);
    };
    applyCamera();

    /* ---- pointer: drag to orbit, wheel to zoom, click hotspot ---- */
    let dragging = false; let moved = 0; let lastX = 0; let lastY = 0; let downX = 0; let downY = 0;
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    let hovered = -1;

    const pick = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(hitMeshes, false)[0];
      return hit ? hit.object.userData.index : -1;
    };
    const setHover = (index) => {
      if (index === hovered) return;
      hovered = index;
      renderer.domElement.style.cursor = index >= 0 ? 'pointer' : 'grab';
      callbackRef.current.onHotspotHover?.(index >= 0 ? index : null);
    };
    const onDown = (e) => {
      dragging = true; moved = 0; autoRotate = false;
      lastX = downX = e.clientX; lastY = downY = e.clientY;
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (dragging) {
        const dx = e.clientX - lastX; const dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        moved += Math.abs(dx) + Math.abs(dy);
        targetTheta -= dx * 0.005;
        targetPhi = Math.min(1.5, Math.max(0.45, targetPhi - dy * 0.005));
      } else {
        setHover(pick(e.clientX, e.clientY));
      }
    };
    const onUp = (e) => {
      if (dragging && moved < 6) {
        const index = pick(e.clientX ?? downX, e.clientY ?? downY);
        if (index >= 0) callbackRef.current.onHotspotClick?.(index);
      }
      dragging = false;
      renderer.domElement.releasePointerCapture?.(e.pointerId);
    };
    const onWheel = (e) => {
      targetRadius = Math.min(cameraCfg.max, Math.max(cameraCfg.min, targetRadius + e.deltaY * 0.01));
    };
    const onLeave = () => setHover(-1);
    const el = renderer.domElement;
    el.style.cursor = 'grab';
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('wheel', onWheel, { passive: true });

    /* ---- resize ---- */
    let compact = false;
    const resize = () => {
      const w = mount.clientWidth; const h = mount.clientHeight || 1;
      compact = w <= 768;
      camera.aspect = w / h;
      camera.fov = compact ? 66 : 56;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const observer = new ResizeObserver(resize); observer.observe(mount); resize();

    callbackRef.current.onReady?.();

    /* ---- animation loop ---- */
    let frame; let last = performance.now();
    const animate = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      const st = stateRef.current;

      // Focus handling — ease the camera to face the selected hotspot.
      if (st.focusedIndex != null && positions[st.focusedIndex]) {
        const p = positions[st.focusedIndex];
        targetTheta = Math.atan2(p[0], p[2]);
        targetPhi = Math.min(1.4, Math.max(0.6, cameraCfg.phi - 0.08));
        targetRadius = Math.max(cameraCfg.min, cameraCfg.radius - 1.8);
        autoRotate = false;
      } else if (!dragging && !st.reducedMotion) {
        autoRotate = true;
      }
      if (autoRotate && !st.reducedMotion) targetTheta += dt * 0.055;

      theta += (targetTheta - theta) * 0.08;
      phi += (targetPhi - phi) * 0.08;
      radius += (targetRadius - radius) * 0.08;
      applyCamera();

      if (!st.reducedMotion) {
        planetSurface.rotation.y += dt * 0.06;
        spiral.rotation.y += dt * 0.012;
        starsA.rotation.y += dt * 0.004;
        starsB.rotation.y -= dt * 0.006;
      }

      hotspotGroups.forEach((group, i) => {
        const ud = group.userData;
        const isFocus = st.focusedIndex === i;
        const isHover = hovered === i;
        const active = isFocus || isHover;
        if (!st.reducedMotion) {
          ud.core.rotation.y += dt * (0.6 + ud.spin);
          ud.core.rotation.x += dt * 0.25;
          ud.ring.rotation.z -= dt * 0.7;
          group.position.y = ud.homeY + Math.sin(now * 0.0015 + i) * 0.12;
        }
        // Face rings/labels toward the camera.
        ud.ring.lookAt(camera.position);
        ud.label.material.opacity += ((active ? 1 : 0.28) - ud.label.material.opacity) * 0.12;
        const labelScale = active ? 1.12 : 1;
        ud.label.scale.x += (ud.label.userData.baseWidth * labelScale - ud.label.scale.x) * 0.14;
        const targetHalo = active ? 1 : 0.5;
        ud.halo.material.opacity += (targetHalo - ud.halo.material.opacity) * 0.12;
        const targetScale = active ? 1.32 : 1;
        group.scale.setScalar(group.scale.x + (targetScale - group.scale.x) * 0.14);
        ud.coreMat.emissiveIntensity += ((active ? 2.1 : 1.15) - ud.coreMat.emissiveIntensity) * 0.12;
      });

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    /* ---- teardown ---- */
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('wheel', onWheel);
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => { m.map?.dispose?.(); m.dispose?.(); });
        }
      });
      disposables.forEach((d) => d.dispose?.());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [section, labels, quality]);

  return <div className="planet-room-canvas" ref={mountRef} aria-hidden="true" />;
}
