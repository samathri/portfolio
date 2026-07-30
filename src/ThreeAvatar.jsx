import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const directionRotation = {
  front: 0,
  center: 0,
  right: -Math.PI / 2,
  left: Math.PI / 2,
  top: Math.PI,
  bottom: 0,
  back: 0,
};

function makeRoundedBox(width, height, depth, radius, color, roughness = 0.68) {
  const geometry = new THREE.BoxGeometry(width, height, depth, 8, 8, 8);
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    position.setXYZ(
      i,
      Math.sign(x) * Math.max(Math.abs(x) - radius, 0) + x * 0.08,
      Math.sign(y) * Math.max(Math.abs(y) - radius, 0) + y * 0.08,
      Math.sign(z) * Math.max(Math.abs(z) - radius, 0) + z * 0.08,
    );
  }

  geometry.computeVertexNormals();
  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0.04,
    }),
  );
}

function addMesh(parent, mesh, position, rotation = [0, 0, 0]) {
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createAvatar() {
  const root = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: '#f1bf9d', roughness: 0.64 });
  const hair = new THREE.MeshStandardMaterial({ color: '#17120f', roughness: 0.82 });
  const shirt = new THREE.MeshStandardMaterial({ color: '#16c7ea', roughness: 0.54, metalness: 0.05 });
  const jeans = new THREE.MeshStandardMaterial({ color: '#1f2d42', roughness: 0.72 });
  const shoe = new THREE.MeshStandardMaterial({ color: '#10151d', roughness: 0.72 });
  const accent = new THREE.MeshStandardMaterial({ color: '#ffce48', roughness: 0.56 });

  const hips = new THREE.Group();
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();

  root.add(hips, leftArm, rightArm, leftLeg, rightLeg);

  addMesh(hips, new THREE.Mesh(new THREE.SphereGeometry(0.82, 32, 24), skin), [0, 2.88, 0]);
  addMesh(hips, new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.58), hair), [0, 3.16, -0.06]);
  addMesh(hips, new THREE.Mesh(new THREE.SphereGeometry(0.46, 24, 16), hair), [-0.48, 2.88, 0.12], [0, 0, -0.25]);
  addMesh(hips, new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), hair), [0.45, 3.0, 0.16], [0, 0, 0.24]);

  const eyeGeometry = new THREE.SphereGeometry(0.055, 16, 10);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: '#111820', roughness: 0.4 });
  addMesh(hips, new THREE.Mesh(eyeGeometry, eyeMaterial), [-0.24, 2.9, 0.78]);
  addMesh(hips, new THREE.Mesh(eyeGeometry, eyeMaterial), [0.24, 2.9, 0.78]);
  addMesh(hips, new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.035, 0.035), new THREE.MeshStandardMaterial({ color: '#9b596a' })), [0, 2.64, 0.83]);

  addMesh(hips, new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.24, 12, 18), skin), [0, 2.1, 0]);
  addMesh(hips, makeRoundedBox(1.35, 1.45, 0.74, 0.12, '#16c7ea'), [0, 1.34, 0]);
  addMesh(hips, new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.78), accent), [0, 1.7, 0.02]);

  leftArm.position.set(-0.82, 1.78, 0);
  rightArm.position.set(0.82, 1.78, 0);
  addMesh(leftArm, new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 1.15, 10, 18), skin), [0, -0.58, 0], [0.12, 0, -0.12]);
  addMesh(rightArm, new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 1.15, 10, 18), skin), [0, -0.58, 0], [0.12, 0, 0.12]);

  leftLeg.position.set(-0.33, 0.62, 0);
  rightLeg.position.set(0.33, 0.62, 0);
  addMesh(leftLeg, new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.25, 10, 18), jeans), [0, -0.62, 0]);
  addMesh(rightLeg, new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.25, 10, 18), jeans), [0, -0.62, 0]);
  addMesh(leftLeg, new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.72), shoe), [0, -1.34, 0.16]);
  addMesh(rightLeg, new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.72), shoe), [0, -1.34, 0.16]);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 48),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.76;
  root.add(shadow);

  root.userData.parts = { leftArm, rightArm, leftLeg, rightLeg, hips };
  return root;
}

export default function ThreeAvatar({ direction = 'front', running = false }) {
  const hostRef = useRef(null);
  const stateRef = useRef({ direction, running });

  useEffect(() => {
    stateRef.current = { direction, running };
  }, [direction, running]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 1.7, 7.2);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#dff8ff', '#273041', 1.9));
    const key = new THREE.DirectionalLight('#ffffff', 2.8);
    key.position.set(3, 5, 5);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight('#1adaff', 1.2);
    rim.position.set(-3, 2, -4);
    scene.add(rim);

    const avatar = createAvatar();
    avatar.position.y = -1.25;
    scene.add(avatar);

    let width = 1;
    let height = 1;
    const resize = () => {
      width = Math.max(host.clientWidth, 1);
      height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let frameId = 0;
    const clock = new THREE.Clock();
    let currentRotation = 0;

    const render = () => {
      const elapsed = clock.getElapsedTime();
      const { direction: activeDirection, running: isRunning } = stateRef.current;
      const targetRotation = directionRotation[activeDirection] ?? 0;
      currentRotation += (targetRotation - currentRotation) * 0.07;
      avatar.rotation.y = currentRotation;

      const stride = isRunning ? Math.sin(elapsed * 13) : Math.sin(elapsed * 1.4) * 0.08;
      const bob = isRunning ? Math.abs(Math.sin(elapsed * 13)) * 0.12 : Math.sin(elapsed * 1.6) * 0.03;
      const { leftArm, rightArm, leftLeg, rightLeg, hips } = avatar.userData.parts;

      hips.position.y = bob;
      leftArm.rotation.x = stride * 0.75;
      rightArm.rotation.x = -stride * 0.75;
      leftLeg.rotation.x = -stride * 0.78;
      rightLeg.rotation.x = stride * 0.78;

      if (!isRunning && activeDirection === 'front') {
        avatar.rotation.y = elapsed * 0.42;
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="three-avatar" ref={hostRef} aria-hidden="true" />;
}
