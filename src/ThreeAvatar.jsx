import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const directionRotation = {
  front: 0,
  center: 0,
  right: Math.PI / 2,
  left: -Math.PI / 2,
  top: Math.PI,
  bottom: 0,
  back: 0,
};

const material = (color, roughness = 0.65, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function mesh(parent, geometry, surface, position, rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const item = new THREE.Mesh(geometry, surface);
  item.position.set(...position);
  item.rotation.set(...rotation);
  item.scale.set(...scale);
  item.castShadow = true;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}

function capsule(parent, radius, length, surface, position, rotation = [0, 0, 0]) {
  return mesh(
    parent,
    new THREE.CapsuleGeometry(radius, length, 10, 20),
    surface,
    position,
    rotation,
  );
}

function createOfficeAvatar() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const skin = material('#e7b39e', 0.58);
  const skinSoft = material('#efc2ad', 0.62);
  const white = material('#285b43', 0.48);
  const whiteShadow = material('#163a2a', 0.56);
  const black = material('#191b20', 0.7);
  const hair = material('#111013', 0.48);
  const brown = material('#3b291f', 0.62);
  const gold = material('#cda33c', 0.28, 0.7);
  const eye = material('#211a18', 0.42);
  const lip = material('#a85961', 0.5);

  // Hips are the animation anchor. The torso has a natural hourglass silhouette.
  const hips = new THREE.Group();
  body.add(hips);
  mesh(hips, new THREE.SphereGeometry(0.55, 40, 28), black, [0, 2.13, -0.015], [0, 0, 0], [1, 0.56, 0.72]);
  mesh(hips, new THREE.CylinderGeometry(0.47, 0.53, 0.42, 40), black, [0, 2.12, 0], [0, 0, 0], [1, 1, 0.8]);
  mesh(hips, new THREE.TorusGeometry(0.505, 0.045, 10, 40), brown, [0, 2.39, 0], [Math.PI / 2, 0, 0], [1, 0.78, 1]);
  mesh(hips, new THREE.BoxGeometry(0.17, 0.12, 0.055), gold, [0, 2.39, 0.405]);
  mesh(hips, new THREE.BoxGeometry(0.09, 0.055, 0.065), brown, [0, 2.39, 0.44]);

  mesh(hips, new THREE.SphereGeometry(0.61, 32, 24), white, [0, 2.82, 0.015], [0, 0, 0], [0.94, 1.08, 0.66]);
  mesh(hips, new THREE.CylinderGeometry(0.46, 0.52, 0.75, 32), white, [0, 2.58, 0], [0, 0, 0], [1, 1, 0.78]);
  mesh(hips, new THREE.CylinderGeometry(0.49, 0.56, 0.48, 32), white, [0, 2.25, 0], [0, 0, 0], [1, 1, 0.8]);
  mesh(hips, new THREE.BoxGeometry(0.43, 1.12, 0.055), white, [-0.225, 2.71, 0.405], [0, 0, -0.025]);
  mesh(hips, new THREE.BoxGeometry(0.43, 1.12, 0.055), white, [0.225, 2.71, 0.405], [0, 0, 0.025]);
  mesh(hips, new THREE.BoxGeometry(0.045, 1.18, 0.035), whiteShadow, [0, 2.7, 0.445]);
  mesh(hips, new THREE.BoxGeometry(0.94, 0.075, 0.05), whiteShadow, [0, 2.08, 0.38]);

  // Collar, buttons, and sleeve cuffs make the outfit read as the supplied blouse.
  mesh(hips, new THREE.BoxGeometry(0.42, 0.32, 0.055), whiteShadow, [-0.18, 3.23, 0.39], [0.08, 0, -0.58]);
  mesh(hips, new THREE.BoxGeometry(0.42, 0.32, 0.055), whiteShadow, [0.18, 3.23, 0.39], [0.08, 0, 0.58]);
  mesh(hips, new THREE.BoxGeometry(0.28, 0.48, 0.06), whiteShadow, [-0.13, 3.02, 0.42], [0, 0, -0.32]);
  mesh(hips, new THREE.BoxGeometry(0.28, 0.48, 0.06), whiteShadow, [0.13, 3.02, 0.42], [0, 0, 0.32]);
  for (let y = 2.42; y <= 2.9; y += 0.24) {
    mesh(hips, new THREE.SphereGeometry(0.035, 14, 10), gold, [0.08, y, 0.46]);
  }

  capsule(hips, 0.15, 0.23, skin, [0, 3.49, 0]);

  // Head and understated facial features.
  const head = new THREE.Group();
  head.position.set(0, 3.94, 0);
  hips.add(head);
  mesh(head, new THREE.SphereGeometry(0.43, 48, 36), skinSoft, [0, 0, 0.01], [0, 0, 0], [0.82, 1.08, 0.8]);
  mesh(head, new THREE.SphereGeometry(0.39, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.64), hair, [0, 0.19, -0.045]);
  mesh(head, new THREE.SphereGeometry(0.15, 24, 18), hair, [-0.27, 0.14, 0.045], [0, 0, -0.25]);
  mesh(head, new THREE.SphereGeometry(0.14, 24, 18), hair, [0.27, 0.14, 0.045], [0, 0, 0.25]);
  mesh(head, new THREE.SphereGeometry(0.043, 16, 10), eye, [-0.135, 0.04, 0.34]);
  mesh(head, new THREE.SphereGeometry(0.043, 16, 10), eye, [0.135, 0.04, 0.34]);
  mesh(head, new THREE.CapsuleGeometry(0.018, 0.14, 5, 10), hair, [-0.135, 0.135, 0.337], [0, 0, Math.PI / 2]);
  mesh(head, new THREE.CapsuleGeometry(0.018, 0.14, 5, 10), hair, [0.135, 0.135, 0.337], [0, 0, Math.PI / 2]);
  mesh(head, new THREE.ConeGeometry(0.045, 0.16, 16), skin, [0, -0.04, 0.39], [Math.PI / 2, 0, 0]);
  mesh(head, new THREE.CapsuleGeometry(0.027, 0.13, 6, 12), lip, [0, -0.17, 0.355], [0, 0, Math.PI / 2]);

  // Voluminous shoulder-length layered lob with a rounded back and soft,
  // longer face-framing sections.
  const ponytail = new THREE.Group();
  ponytail.position.set(0, 0.18, -0.18);
  ponytail.rotation.x = 0;
  head.add(ponytail);
  mesh(ponytail, new THREE.SphereGeometry(0.46, 36, 28), hair, [0, 0, -0.1], [0, 0, 0], [0.98, 1.14, 0.78]);
  mesh(ponytail, new THREE.SphereGeometry(0.38, 32, 24), hair, [0, -0.35, -0.09], [0, 0, 0], [1.05, 1.22, 0.74]);
  mesh(ponytail, new THREE.SphereGeometry(0.31, 28, 22), hair, [0, -0.68, -0.04], [0.05, 0, 0], [1.12, 1.05, 0.68]);
  mesh(ponytail, new THREE.CapsuleGeometry(0.11, 0.62, 10, 18), hair, [-0.34, -0.42, 0.18], [0.04, 0, -0.08]);
  mesh(ponytail, new THREE.CapsuleGeometry(0.11, 0.62, 10, 18), hair, [0.34, -0.42, 0.18], [0.04, 0, 0.08]);
  mesh(ponytail, new THREE.CapsuleGeometry(0.075, 0.52, 10, 18), hair, [-0.29, -0.3, 0.34], [0.08, 0, -0.1]);
  mesh(ponytail, new THREE.CapsuleGeometry(0.075, 0.52, 10, 18), hair, [0.29, -0.3, 0.34], [0.08, 0, 0.1]);
  mesh(ponytail, new THREE.SphereGeometry(0.18, 22, 18), hair, [-0.24, 0.18, 0.1], [0, 0, -0.18], [1, 0.72, 0.7]);
  mesh(ponytail, new THREE.SphereGeometry(0.18, 22, 18), hair, [0.24, 0.18, 0.1], [0, 0, 0.18], [1, 0.72, 0.7]);

  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  leftArm.position.set(-0.56, 3.15, 0);
  rightArm.position.set(0.56, 3.15, 0);
  body.add(leftArm, rightArm);

  for (const [arm, side] of [[leftArm, -1], [rightArm, 1]]) {
    capsule(arm, 0.16, 0.65, white, [side * 0.035, -0.38, 0], [0, 0, side * -0.08]);
    capsule(arm, 0.125, 0.55, skin, [side * 0.075, -1.03, 0.015], [0, 0, side * -0.045]);
    mesh(arm, new THREE.CylinderGeometry(0.17, 0.145, 0.13, 24), whiteShadow, [side * 0.07, -0.73, 0]);
    mesh(arm, new THREE.SphereGeometry(0.14, 20, 16), skin, [side * 0.1, -1.4, 0.02], [0, 0, 0], [0.75, 1.28, 0.58]);
  }

  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  leftLeg.position.set(-0.24, 1.62, 0);
  rightLeg.position.set(0.24, 1.62, 0);
  body.add(leftLeg, rightLeg);

  for (const [leg, side] of [[leftLeg, -1], [rightLeg, 1]]) {
    capsule(leg, 0.205, 0.72, black, [0, -0.38, 0]);
    capsule(leg, 0.16, 0.7, black, [0, -1.12, 0.01]);
    mesh(leg, new THREE.SphereGeometry(0.18, 24, 18), black, [0, -0.78, 0], [0, 0, 0], [1, 0.76, 1]);
    capsule(leg, 0.12, 0.16, skin, [0, -1.55, 0.03]);
    mesh(leg, new THREE.BoxGeometry(0.31, 0.12, 0.62), black, [0, -1.65, 0.16], [0.05, 0, 0], [0.8, 1, 1]);
    mesh(leg, new THREE.CylinderGeometry(0.035, 0.045, 0.35, 12), black, [0, -1.78, -0.08], [0.12, 0, side * 0.02]);
    mesh(leg, new THREE.ConeGeometry(0.07, 0.16, 14), gold, [0, -1.65, 0.49], [Math.PI / 2, 0, 0]);
  }

  const shadow = mesh(
    root,
    new THREE.CircleGeometry(0.9, 48),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.2 }),
    [0, -0.62, 0],
    [-Math.PI / 2, 0, 0],
  );
  shadow.castShadow = false;

  root.userData.parts = { body, leftArm, rightArm, leftLeg, rightLeg, hips, head, ponytail };
  return root;
}

const friendlyMessages = [
  { text: 'Hi!', gesture: 'wave' },
  { text: 'How are you?', gesture: null },
  { text: 'Nice to see you!', gesture: 'welcome' },
  { text: 'My skills are this way!', gesture: 'pointUpOne' },
  { text: 'Wanna see my projects!', gesture: 'pointRight' },
  { text: 'Here is more about me!', gesture: 'pointLeft' },
  { text: 'Contact me!', gesture: 'pointDownOne' },
  { text: 'Welcome to my portfolio.', gesture: 'openDiagonal45' },
];

export default function ThreeAvatar({
  direction = 'front',
  running = false,
  talking = false,
}) {
  const hostRef = useRef(null);
  const stateRef = useRef({ direction, running });
  const gestureRef = useRef(null);
  const [speech, setSpeech] = useState(null);

  useEffect(() => {
    stateRef.current = { direction, running };
  }, [direction, running]);

  useEffect(() => {
    if (!talking) return undefined;

    let showTimer;
    let hideTimer;
    let previousIndex = -1;
    let hasGreeted = false;

    const scheduleMessage = (delay = 2600) => {
      showTimer = window.setTimeout(() => {
        let nextIndex;

        if (!hasGreeted) {
          nextIndex = 0;
          hasGreeted = true;
        } else {
          nextIndex = 1 + Math.floor(Math.random() * (friendlyMessages.length - 1));
          if (nextIndex === previousIndex) {
            nextIndex = 1 + (nextIndex % (friendlyMessages.length - 1));
          }
        }

        previousIndex = nextIndex;
        const nextSpeech = friendlyMessages[nextIndex];
        gestureRef.current = nextSpeech.gesture;
        setSpeech(nextSpeech);

        hideTimer = window.setTimeout(() => {
          gestureRef.current = null;
          setSpeech(null);
          scheduleMessage(5500 + Math.random() * 5000);
        }, 3200);
      }, delay);
    };

    scheduleMessage();

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      gestureRef.current = null;
    };
  }, [talking]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.2, 8.35);
    camera.lookAt(0, 0.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#f4f8ff', '#35313a', 2.4));
    const key = new THREE.DirectionalLight('#fff7ef', 3.5);
    key.position.set(4, 7, 6);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight('#d7eaff', 1.8);
    fill.position.set(-4, 3, 4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight('#ffffff', 1.6);
    rim.position.set(1, 4, -5);
    scene.add(rim);
    const spotlight = new THREE.SpotLight('#fff4dc', 18, 18, Math.PI / 7, 0.72, 1.2);
    spotlight.position.set(0, 7, 4);
    spotlight.target.position.set(0, 0, 0);
    spotlight.castShadow = true;
    scene.add(spotlight, spotlight.target);

    const avatar = createOfficeAvatar();
    avatar.position.y = -1.66;
    avatar.scale.setScalar(0.9);
    scene.add(avatar);

    const pointer = { yaw: 0, pitch: 0 };
    const trackPointer = (event) => {
      const x = event.clientX / Math.max(window.innerWidth, 1) * 2 - 1;
      const y = event.clientY / Math.max(window.innerHeight, 1) * 2 - 1;
      pointer.yaw = THREE.MathUtils.clamp(x, -1, 1) * 0.72;
      pointer.pitch = THREE.MathUtils.clamp(y, -1, 1) * 0.3;
    };
    const resetPointer = () => {
      pointer.yaw = 0;
      pointer.pitch = 0;
    };
    window.addEventListener('pointermove', trackPointer);
    window.addEventListener('blur', resetPointer);

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const clock = new THREE.Clock();
    let frameId = 0;
    let currentRotation = 0;

    const render = () => {
      const elapsed = clock.getElapsedTime();
      const { direction: activeDirection, running: isRunning } = stateRef.current;
      const targetRotation = directionRotation[activeDirection] ?? 0;
      currentRotation += (targetRotation - currentRotation) * 0.075;
      avatar.rotation.y = currentRotation;

      const stride = isRunning ? Math.sin(elapsed * 10.5) : 0;
      const idle = Math.sin(elapsed * 1.4);
      const bob = isRunning ? Math.abs(stride) * 0.09 : idle * 0.018;
      const { body, leftArm, rightArm, leftLeg, rightLeg, hips, head, ponytail } = avatar.userData.parts;
      hips.position.y = bob;
      const bodyYaw = isRunning ? 0 : pointer.yaw * 0.2;
      const bodyLean = isRunning ? 0 : -pointer.pitch * 0.08;
      body.rotation.y += (bodyYaw - body.rotation.y) * 0.08;
      body.rotation.z += (bodyLean - body.rotation.z) * 0.08;
      head.rotation.y += (pointer.yaw - head.rotation.y) * 0.22;
      head.rotation.x += (pointer.pitch - head.rotation.x) * 0.22;
      const activeGesture = isRunning ? null : gestureRef.current;
      let leftArmX = isRunning ? stride * 0.52 : idle * 0.025;
      let rightArmX = isRunning ? -stride * 0.52 : -idle * 0.025;
      let leftArmZ = 0;
      let rightArmZ = 0;

      if (activeGesture === 'wave') {
        rightArmZ = 2.35;
        rightArmX = Math.sin(elapsed * 8) * 0.38;
      } else if (activeGesture === 'welcome') {
        leftArmZ = -0.95;
        rightArmZ = 0.95;
        leftArmX = -0.18;
        rightArmX = -0.18;
      } else if (activeGesture === 'pointUpOne') {
        rightArmZ = 2.72;
        rightArmX = -0.12;
      } else if (activeGesture === 'pointRight') {
        rightArmZ = 1.52;
        rightArmX = -0.28;
      } else if (activeGesture === 'pointLeft') {
        leftArmZ = -1.52;
        leftArmX = -0.28;
      } else if (activeGesture === 'pointDownOne') {
        rightArmZ = 0.18;
        rightArmX = -0.18;
      } else if (activeGesture === 'openDiagonal45') {
        leftArmZ = -Math.PI * 0.75;
        rightArmZ = Math.PI / 4;
        leftArmX = -0.18;
        rightArmX = -0.18;
      }

      leftArm.rotation.x += (leftArmX - leftArm.rotation.x) * 0.14;
      rightArm.rotation.x += (rightArmX - rightArm.rotation.x) * 0.14;
      leftArm.rotation.z += (leftArmZ - leftArm.rotation.z) * 0.14;
      rightArm.rotation.z += (rightArmZ - rightArm.rotation.z) * 0.14;
      leftLeg.rotation.x = isRunning ? -stride * 0.48 : 0;
      rightLeg.rotation.x = isRunning ? stride * 0.48 : 0;
      ponytail.rotation.x = isRunning ? Math.abs(stride) * 0.055 : idle * 0.012;

      if (!isRunning && activeDirection === 'front') {
        avatar.rotation.y = Math.sin(elapsed * 0.34) * 0.12;
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', trackPointer);
      window.removeEventListener('blur', resetPointer);
      observer.disconnect();
      renderer.dispose();
      scene.traverse((item) => {
        item.geometry?.dispose();
        if (Array.isArray(item.material)) item.material.forEach((entry) => entry.dispose());
        else item.material?.dispose();
      });
      host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="three-avatar" aria-hidden="true">
      <div className="three-avatar-stage" ref={hostRef} />
      {talking && speech && <div className="avatar-speech">{speech.text}</div>}
    </div>
  );
}
