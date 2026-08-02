import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { destinations } from './content.js';

const disposeTree = (root) => root.traverse((node) => {
  node.geometry?.dispose?.();
  if (Array.isArray(node.material)) node.material.forEach((item) => { item.map?.dispose?.(); item.dispose(); });
  else { node.material?.map?.dispose?.(); node.material?.dispose?.(); }
});

function makePlanetFocusTexture(accent) {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = accent; ctx.lineWidth = 5; ctx.shadowColor = accent; ctx.shadowBlur = 22;
  ctx.beginPath(); ctx.arc(128, 128, 105, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 2; ctx.globalAlpha = .65; ctx.setLineDash([10, 12]);
  ctx.beginPath(); ctx.arc(128, 128, 116, 0, Math.PI * 2); ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeShip() {
  const ship = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({ color: '#d9e5ed', metalness: 0.75, roughness: 0.22 });
  const dark = new THREE.MeshStandardMaterial({ color: '#07121d', metalness: 0.65, roughness: 0.28 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#35d7ff', emissive: '#0a6e91', emissiveIntensity: 1.3, metalness: 0.15, roughness: 0.08 });
  const engine = new THREE.MeshBasicMaterial({ color: '#62e8ff', transparent: true, opacity: 0.9 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.15, 8, 20), hull);
  body.rotation.x = Math.PI / 2;
  ship.add(body);
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), glass);
  cockpit.scale.set(0.72, 0.48, 1.15); cockpit.position.z = -0.23; cockpit.position.y = 0.17; ship.add(cockpit);
  const wingGeo = new THREE.BoxGeometry(1.15, 0.06, 0.62);
  const wings = new THREE.Mesh(wingGeo, dark); wings.position.z = 0.28; ship.add(wings);
  [-0.38, 0.38].forEach((x) => {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.65, 16), hull);
    pod.rotation.x = Math.PI / 2; pod.position.set(x, -0.02, 0.34); ship.add(pod);
    const glow = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.65, 16), engine);
    glow.rotation.x = -Math.PI / 2; glow.position.set(x, 0, 0.98); glow.name = 'engineGlow'; ship.add(glow);
  });
  ship.scale.setScalar(0.78);
  return ship;
}

function makeAstronaut() {
  const group = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color: '#e9f3f7', roughness: 0.42 });
  const trim = new THREE.MeshStandardMaterial({ color: '#172639', metalness: 0.3, roughness: 0.36 });
  const visor = new THREE.MeshPhysicalMaterial({ color: '#0a1d32', emissive: '#184e68', emissiveIntensity: 0.55, metalness: 0.65, roughness: 0.12 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.35, 8, 16), suit); torso.position.y = 0.64; group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), suit); head.position.y = 1.08; group.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.65), visor); face.position.set(0, 1.08, -0.07); face.rotation.x = 0.18; group.add(face);
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.35, 6, 12), suit); arm.position.set(side * 0.25, 0.66, 0); arm.rotation.z = side * 0.14; arm.name = side < 0 ? 'armL' : 'armR'; group.add(arm);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.4, 6, 12), trim); leg.position.set(side * 0.1, 0.23, 0); leg.name = side < 0 ? 'legL' : 'legR'; group.add(leg);
  });
  group.visible = false; group.scale.setScalar(0.75); return group;
}

export default function SpaceScene({ progress, selected, journey, quality, reducedMotion, focusedPlanetId, onPlanetClick, onPlanetHover, onJourneyDone }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ progress, selected, journey, quality, reducedMotion, focusedPlanetId });
  const callbackRef = useRef({ onPlanetClick, onPlanetHover, onJourneyDone });
  useEffect(() => { stateRef.current = { progress, selected, journey, quality, reducedMotion, focusedPlanetId }; }, [progress, selected, journey, quality, reducedMotion, focusedPlanetId]);
  useEffect(() => { callbackRef.current = { onPlanetClick, onPlanetHover, onJourneyDone }; }, [onPlanetClick, onPlanetHover, onJourneyDone]);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#020711', 0.026);
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 180);
    camera.position.set(0, 2.3, 8.8);
    const renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 1.8 : 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#7ac7ff', '#05030b', 1.25));
    const sunLight = new THREE.PointLight('#ffd6a0', 75, 80, 1.5); sunLight.position.set(-9, 6, 8); scene.add(sunLight);
    const sun = new THREE.Mesh(new THREE.SphereGeometry(2.3, 32, 24), new THREE.MeshBasicMaterial({ color: '#ffbd68' })); sun.position.set(-12, 7, -14); scene.add(sun);
    const sunHalo = new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 18), new THREE.MeshBasicMaterial({ color: '#ff9c42', transparent: true, opacity: 0.08, side: THREE.BackSide })); sun.add(sunHalo);

    const starCount = quality === 'low' ? 900 : quality === 'high' ? 3000 : 1800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      starPositions[i * 3] = (Math.random() - 0.5) * 90;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      starPositions[i * 3 + 2] = -Math.random() * 100 + 18;
    }
    const starsGeo = new THREE.BufferGeometry(); starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: '#d9f2ff', size: quality === 'high' ? 0.055 : 0.075, transparent: true, opacity: 0.86 })); scene.add(stars);

    const planetMeshes = [];
    destinations.forEach((data, index) => {
      const group = new THREE.Group(); group.position.set(...data.position); group.userData = data;
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(data.size, quality === 'low' ? 24 : 48, quality === 'low' ? 16 : 32), new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.72, metalness: 0.08, emissive: data.color, emissiveIntensity: 0.08 })); sphere.name = 'planetSurface';
      sphere.userData = data; group.add(sphere); planetMeshes.push(sphere);
      const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(data.size * 1.09, 32, 22), new THREE.MeshBasicMaterial({ color: data.accent, transparent: true, opacity: 0.1, side: THREE.BackSide })); atmosphere.name = 'atmosphere'; group.add(atmosphere);
      const focusRing = new THREE.Sprite(new THREE.SpriteMaterial({ map: makePlanetFocusTexture(data.accent), color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, depthTest: false })); focusRing.name = 'focusRing'; focusRing.scale.setScalar(data.size * 2.72); group.add(focusRing);
      if (index === 2 || index === 5) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(data.size * 1.35, data.size * 1.75, 64), new THREE.MeshBasicMaterial({ color: data.accent, transparent: true, opacity: 0.34, side: THREE.DoubleSide })); ring.rotation.x = Math.PI / 2.25; group.add(ring);
      }
      scene.add(group);
    });

    const ship = makeShip(); ship.position.set(0, 0, 3.2); scene.add(ship);
    const astronaut = makeAstronaut(); scene.add(astronaut);
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    let hovered = null; let frame; let last = performance.now(); let journeyStart = 0; let journeyId = null; let doneSent = false; let compactView = false;

    let normalFov = 55;
    function resize() {
      const { clientWidth, clientHeight } = mount;
      compactView = clientWidth <= 768;
      camera.aspect = clientWidth / clientHeight;
      normalFov = camera.aspect < .62 ? 70 : camera.aspect < .9 ? 63 : 55;
      camera.updateProjectionMatrix(); renderer.setSize(clientWidth, clientHeight, false);
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(mount); resize();

    function pointerEvent(event, click = false) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(planetMeshes, false)[0];
      const next = hit?.object?.userData || null;
      if (hovered !== next?.id) { hovered = next?.id || null; callbackRef.current.onPlanetHover?.(next); renderer.domElement.style.cursor = next ? 'pointer' : 'grab'; }
      if (click && next) callbackRef.current.onPlanetClick?.(next.id);
    }
    const onMove = (event) => pointerEvent(event); const onClick = (event) => pointerEvent(event, true);
    renderer.domElement.addEventListener('pointermove', onMove); renderer.domElement.addEventListener('click', onClick);

    function animate(now) {
      const dt = Math.min((now - last) / 1000, 0.04); last = now;
      const state = stateRef.current; const targetZ = 4 - state.progress * 47;
      if (state.journey?.id !== journeyId) { journeyId = state.journey?.id || null; journeyStart = now; doneSent = false; }
      const destination = destinations.find((item) => item.id === state.selected);
      if (state.journey && destination) {
        const duration = state.reducedMotion ? 700 : 6200; const t = Math.min((now - journeyStart) / duration, 1);
        const start = new THREE.Vector3(0, 0.1, targetZ - 1);
        const approach = new THREE.Vector3(destination.position[0], destination.position[1] + destination.size * .7, destination.position[2] + 5.2);
        const descentTop = new THREE.Vector3(destination.position[0], destination.position[1] + destination.size + 4.1, destination.position[2] + 1.5);
        const touchdown = new THREE.Vector3(destination.position[0], destination.position[1] + destination.size + .48, destination.position[2] + 1.5);
        if (t < .56) {
          const p = t / .56; const eased = 1 - Math.pow(1 - p, 3);
          ship.position.lerpVectors(start, approach, eased); ship.rotation.x += (0 - ship.rotation.x) * .12; ship.rotation.z = Math.sin(p * Math.PI) * -.2;
        } else if (t < .72) {
          const p = (t - .56) / .16; const eased = p * p * (3 - 2 * p);
          ship.position.lerpVectors(approach, descentTop, eased); ship.rotation.x = eased * Math.PI / 2; ship.rotation.z *= .82;
        } else {
          const p = (t - .72) / .28; const eased = p * p * (3 - 2 * p);
          ship.position.lerpVectors(descentTop, touchdown, eased); ship.rotation.x = Math.PI / 2; ship.rotation.z = Math.sin(p * Math.PI * 5) * .018 * (1 - p);
        }
        const closeCamera = t > .56 ? 4.4 : 6.2;
        camera.position.lerp(new THREE.Vector3(ship.position.x + (t > .56 ? 3 : 0), ship.position.y + 1.55, ship.position.z + closeCamera), 0.065);
        camera.lookAt(ship.position.x, ship.position.y - (compactView ? .55 : 0), ship.position.z - (t > .56 ? 0 : 1));
        camera.fov += ((t > .72 ? Math.max(46, normalFov - 9) : normalFov) - camera.fov) * .06; camera.updateProjectionMatrix();
        // The astronaut remains inside the rocket for the entire landing shot.
        // It is introduced only after touchdown in the planetary explorer.
        astronaut.visible = false;
        if (t >= 1 && !doneSent) { doneSent = true; callbackRef.current.onJourneyDone?.(); }
      } else {
        astronaut.visible = false;
        const previousProgress = ship.userData.lastProgress ?? state.progress;
        const progressDelta = state.progress - previousProgress;
        if (progressDelta > .00002) ship.userData.travelDirection = 1;
        else if (progressDelta < -.00002) ship.userData.travelDirection = -1;
        if (!ship.userData.travelDirection) ship.userData.travelDirection = 1;

        // Turn automatically only after the rocket has physically reached a
        // boundary—not merely when the scroll value first touches 0% or 100%.
        const reachedEnd = state.progress >= .999 && Math.abs(targetZ - ship.position.z) < .15;
        const reachedStart = state.progress <= .001 && Math.abs(targetZ - ship.position.z) < .15;
        if (reachedEnd) ship.userData.travelDirection = -1;
        else if (reachedStart) ship.userData.travelDirection = 1;

        const returning = ship.userData.travelDirection < 0;
        const targetYaw = returning ? Math.PI : 0;
        const yawDifference = Math.atan2(
          Math.sin(targetYaw - ship.rotation.y),
          Math.cos(targetYaw - ship.rotation.y),
        );
        ship.rotation.y += yawDifference * .085;

        // On a direction change, turn through 90 degrees before travelling.
        // The rest of the U-turn completes smoothly while the rocket moves.
        const readyToTravel = Math.abs(yawDifference) <= Math.PI / 2 + .04;
        if (readyToTravel) ship.position.z += (targetZ - ship.position.z) * .055;
        ship.position.x += (Math.sin(state.progress * Math.PI * 3) * .45 - ship.position.x) * .025;
        ship.rotation.z += (progressDelta * -2.2 - ship.rotation.z) * .08;
        // Always restore the normal horizontal flight pose after leaving a planet.
        ship.rotation.x += (0 - ship.rotation.x) * 0.09;
        camera.fov += (normalFov - camera.fov) * .08; camera.updateProjectionMatrix();
        ship.userData.lastProgress = state.progress;

        // Keep the camera behind the rocket for both directions. During the
        // U-turn it travels around the rocket horizontally instead of rising
        // into the empty top-down view seen in the recording.
        const cameraDistance = camera.aspect < .7 ? 9.2 : 7.6;
        const cameraTargetX = ship.position.x + Math.sin(ship.rotation.y) * cameraDistance;
        const cameraTargetZ = ship.position.z + Math.cos(ship.rotation.y) * cameraDistance;
        const lookAheadX = ship.position.x - Math.sin(ship.rotation.y) * 3;
        const lookAheadZ = ship.position.z - Math.cos(ship.rotation.y) * 3;
        camera.position.x += (cameraTargetX - camera.position.x) * .045;
        camera.position.y += ((compactView ? 2.05 : 2.2) - camera.position.y) * .04;
        camera.position.z += (cameraTargetZ - camera.position.z) * .045;
        camera.lookAt(lookAheadX, compactView ? -1.15 : 0, lookAheadZ);
      }
      const moving = Math.abs(targetZ - ship.position.z) > .08 || state.journey;
      ship.children.filter((item) => item.name === 'engineGlow').forEach((glow) => { glow.scale.y = 0.75 + (moving ? Math.sin(now * .02) * .18 + .65 : .05); glow.material.opacity = moving ? .9 : .35; });
      scene.children.forEach((object) => {
        if (object.userData?.id) {
          object.rotation.y += dt * .13;
          const focused = object.userData.id === (state.focusedPlanetId || hovered);
          const popScale = focused ? 1.1 + Math.sin(now * .004) * .012 : 1;
          object.scale.setScalar(object.scale.x + (popScale - object.scale.x) * .09);
          const atm = object.getObjectByName('atmosphere');
          if (atm) { const atmosphereScale = focused ? 1.13 + Math.sin(now*.004)*.025 : 1; atm.scale.setScalar(atm.scale.x + (atmosphereScale - atm.scale.x) * .12); atm.material.opacity += ((focused ? .24 : .1) - atm.material.opacity) * .12; }
          const focusRing = object.getObjectByName('focusRing');
          if (focusRing) { focusRing.material.opacity += ((focused ? .95 : 0) - focusRing.material.opacity) * .14; focusRing.rotation.z -= dt * .18; }
          const surface = object.getObjectByName('planetSurface');
          if (surface) surface.material.emissiveIntensity += ((focused ? .24 : .08) - surface.material.emissiveIntensity) * .1;
        }
      });
      stars.position.z = (state.progress * 6) % 8;
      if (astronaut.visible && !state.reducedMotion) astronaut.children.forEach((part) => { if (part.name?.startsWith('arm') || part.name?.startsWith('leg')) part.rotation.x = Math.sin(now * .007) * (part.name.endsWith('L') ? 0.28 : -0.28); });
      renderer.render(scene, camera); frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); resizeObserver.disconnect(); renderer.domElement.removeEventListener('pointermove', onMove); renderer.domElement.removeEventListener('click', onClick); disposeTree(scene); renderer.dispose(); mount.removeChild(renderer.domElement); };
  }, []);

  return <div className="space-canvas" ref={mountRef} aria-hidden="true" />;
}
