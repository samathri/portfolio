import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const EMPTY_ITEMS = [];

function astronautModel() {
  const root = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: '#edf7fa', roughness: .4 });
  const dark = new THREE.MeshStandardMaterial({ color: '#17212e', metalness: .35, roughness: .38 });
  const visor = new THREE.MeshPhysicalMaterial({ color: '#081a2c', emissive: '#17617b', emissiveIntensity: .8, metalness: .7, roughness: .12 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.2,.4,8,16),white); torso.position.y=.82; root.add(torso);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(.28,24,18),white); helmet.position.y=1.3; root.add(helmet);
  const face = new THREE.Mesh(new THREE.SphereGeometry(.22,24,16,0,Math.PI*2,0,Math.PI*.66),visor); face.position.set(0,1.3,-.08); face.rotation.x=.2; root.add(face);
  [-1,1].forEach((side)=>{
    const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.42,6,12),white); arm.position.set(side*.28,.82,0); arm.name=side<0?'armL':'armR'; root.add(arm);
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.085,.48,6,12),dark); leg.position.set(side*.11,.28,0); leg.name=side<0?'legL':'legR'; root.add(leg);
  });
  return root;
}

function landedRocket(color) {
  const root = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({ color: '#dce9ef', metalness: .68, roughness: .24 });
  const dark = new THREE.MeshStandardMaterial({ color: '#111a25', metalness: .5, roughness: .32 });
  const glass = new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: .75, metalness: .35, roughness: .12 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.42,1.45,10,24),hull); body.position.y=1.35; root.add(body);
  const windowMesh = new THREE.Mesh(new THREE.SphereGeometry(.27,20,14),glass); windowMesh.scale.set(1,.75,.35); windowMesh.position.set(0,1.58,-.38); root.add(windowMesh);
  [-1,1].forEach(side=>{const fin=new THREE.Mesh(new THREE.BoxGeometry(.6,.08,.75),dark);fin.position.set(side*.46,.46,.1);fin.rotation.z=side*.52;root.add(fin);const leg=new THREE.Mesh(new THREE.CylinderGeometry(.035,.055,.65,10),dark);leg.position.set(side*.48,.18,.08);leg.rotation.z=side*.28;root.add(leg)});
  const door=new THREE.Mesh(new THREE.BoxGeometry(.5,.65,.06),dark);door.position.set(.48,.85,-.12);door.rotation.z=-.35;root.add(door);
  root.scale.setScalar(.82); return root;
}

function projectPreviewTexture(project, projectIndex, slideIndex, accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 960; canvas.height = 540;
  const ctx = canvas.getContext('2d');
  const palettes = [
    ['#07152b', '#16c8ee'], ['#170b29', '#db62ff'], ['#071e21', '#4de2b1'],
    ['#24120d', '#ff9d66'], ['#111529', '#8ca7ff'],
  ];
  const [base, glow] = palettes[projectIndex % palettes.length];
  const gradient = ctx.createLinearGradient(0, 0, 960, 540);
  gradient.addColorStop(0, base); gradient.addColorStop(1, '#03060d');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 960, 10);
  ctx.globalAlpha = .13; ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(790, 120, 180, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#dceeff'; ctx.font = '700 25px sans-serif'; ctx.fillText(project.title, 58, 68);
  ctx.fillStyle = glow; ctx.font = '600 12px monospace'; ctx.fillText((project.meta || 'PROJECT').toUpperCase(), 58, 96);
  if (slideIndex === 0) {
    ctx.fillStyle = '#f4f8ff'; ctx.font = '700 55px sans-serif';
    ctx.fillText('Digital experiences', 58, 200); ctx.fillText('built to perform.', 58, 262);
    ctx.fillStyle = glow; ctx.fillRect(58, 310, 158, 46);
    ctx.fillStyle = '#031018'; ctx.font = '700 15px sans-serif'; ctx.fillText('EXPLORE PROJECT', 73, 339);
  } else if (slideIndex === 1) {
    ctx.fillStyle = '#c7d6e0'; ctx.font = '600 16px monospace'; ctx.fillText('FEATURED EXPERIENCE', 58, 165);
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i === projectIndex % 3 ? glow : '#132235';
      ctx.fillRect(58 + i * 270, 205, 235, 165);
      ctx.fillStyle = '#eff8ff'; ctx.font = '700 20px sans-serif'; ctx.fillText(['HOME', 'SYSTEM', 'RESULT'][i], 78 + i * 270, 338);
    }
  } else {
    ctx.fillStyle = '#f4f8ff'; ctx.font = '700 38px sans-serif'; ctx.fillText('Project outcomes', 58, 175);
    const bars = [72, 91, 82];
    bars.forEach((value, i) => { ctx.fillStyle = '#14263a'; ctx.fillRect(58, 225 + i * 72, 650, 24); ctx.fillStyle = glow; ctx.fillRect(58, 225 + i * 72, value * 6.5, 24); });
    ctx.fillStyle = '#9eb2c1'; ctx.font = '500 14px monospace'; ctx.fillText('DESIGN  •  DEVELOPMENT  •  DELIVERY', 58, 470);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function projectScreen(project, index, accent, textureStore) {
  const group = new THREE.Group();
  const frameMaterial = new THREE.MeshPhysicalMaterial({ color: '#07111d', metalness: .6, roughness: .18, emissive: accent, emissiveIntensity: .1, transparent: true, opacity: .84 });
  const frameGeometry = new THREE.BoxGeometry(2.72, 1.72, .075);
  const frame = new THREE.Mesh(frameGeometry, frameMaterial); frame.position.y = 1.62; group.add(frame);
  const edgeMaterial = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: .8 });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(frameGeometry), edgeMaterial); edges.position.y = 1.62; group.add(edges);
  const textures = [0, 1, 2].map((slide) => projectPreviewTexture(project, index, slide, accent)); textureStore.push(...textures);
  const screenMaterial = new THREE.MeshBasicMaterial({ map: textures[0], toneMapped: false, transparent: true, opacity: .96 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.46), screenMaterial); screen.position.set(0, 1.62, .041); screen.userData = { textures, index }; group.add(screen);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 2.02), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .055, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.set(0, 1.62, -.055); group.add(halo);
  [-1, 1].forEach((side) => { const node = new THREE.Mesh(new THREE.SphereGeometry(.055, 12, 8), new THREE.MeshBasicMaterial({ color: accent })); node.position.set(side * 1.43, 1.62, .02); group.add(node); });
  const glow = new THREE.PointLight(accent, 1.65, 4.2); glow.position.set(0, 1.55, .5); group.add(glow);
  group.userData.screen = screen;
  return group;
}

export default function PlanetExplorer({ color, accent, progress, moving, reducedMotion, sectionId, items = EMPTY_ITEMS }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ progress, moving, reducedMotion });
  useEffect(()=>{ stateRef.current={progress,moving,reducedMotion}; },[progress,moving,reducedMotion]);
  const seed = useMemo(()=>parseInt(color.replace('#','').slice(0,4),16),[color]);

  useEffect(()=>{
    const mount=mountRef.current;
    const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2('#030711',.045);
    const camera=new THREE.PerspectiveCamera(58,1,.1,100); camera.position.set(13,2.8,-20);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.45)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1; mount.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight('#789ee8','#120b19',1.15));
    const rim=new THREE.DirectionalLight(accent,3.5); rim.position.set(-4,7,4); scene.add(rim);
    const starGeo=new THREE.BufferGeometry(); const pts=new Float32Array(1500*3); for(let i=0;i<1500;i++){pts[i*3]=(Math.random()-.5)*65;pts[i*3+1]=4+Math.random()*22;pts[i*3+2]=-Math.random()*70+10} starGeo.setAttribute('position',new THREE.BufferAttribute(pts,3)); scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:'#d8ecff',size:.045,transparent:true,opacity:.85})));
    const moon=new THREE.Mesh(new THREE.SphereGeometry(2.2,32,22),new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.22})); moon.position.set(-11,11,-28); scene.add(moon);
    const groundMat=new THREE.MeshStandardMaterial({color,roughness:.94,metalness:.02});
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(30,2400,20,320),groundMat);ground.rotation.x=-Math.PI/2;ground.position.set(0,-.12,-1190);const pos=ground.geometry.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);pos.setZ(i,Math.sin(x*.72+seed)*.16+Math.cos(y*.35)*.2+Math.sin((x+y)*1.2)*.055)}pos.needsUpdate=true;ground.geometry.computeVertexNormals();scene.add(ground);
    const pathMat=new THREE.MeshStandardMaterial({color:'#131b25',roughness:.8,emissive:accent,emissiveIntensity:.025});
    const pathTiles=[];for(let i=0;i<150;i++){const slab=new THREE.Mesh(new THREE.BoxGeometry(1.36,.055,.62),pathMat);slab.position.set(0,.04,4-i*.82);scene.add(slab);pathTiles.push(slab)}
    const beacons=[]; const projectScreens=[]; const previewTextures=[];
    if(sectionId==='projects'){
      items.slice(0,5).forEach((project,index)=>{const group=projectScreen(project,index,accent,previewTextures);group.position.set(index%2?2.65:-2.65,.28,3-(index+1)*7.2);group.rotation.y=index%2?-.18:.18;group.userData.baseYaw=group.rotation.y;scene.add(group);projectScreens.push(group)});
    }else{
      [.16,.34,.52,.7,.88].forEach((part,index)=>{const group=new THREE.Group();group.position.set(index%2?2.8:-2.8,0,3-part*48);const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.46+index*.035,0),new THREE.MeshPhysicalMaterial({color:accent,emissive:color,emissiveIntensity:1.15,roughness:.18,metalness:.25,transparent:true,opacity:.9}));crystal.position.y=.75;group.add(crystal);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.018,.14,5,12),new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.16}));beam.position.y=3;group.add(beam);scene.add(group);beacons.push(group)});
    }
    const rocket=landedRocket(accent);rocket.position.set(2.6,0,4);rocket.rotation.y=-.5;scene.add(rocket);
    const astronaut=astronautModel();astronaut.position.set(0,0,3);astronaut.rotation.y=Math.PI;scene.add(astronaut);
    let compactView=false;
    function resize(){compactView=mount.clientWidth<=768;camera.aspect=mount.clientWidth/mount.clientHeight;camera.fov=compactView?66:58;camera.updateProjectionMatrix();renderer.setSize(mount.clientWidth,mount.clientHeight,false);rocket.scale.setScalar(compactView?.5:.82);rocket.position.x=compactView?2.8:2.6} const observer=new ResizeObserver(resize);observer.observe(mount);resize();
    let elevationTarget=2.9,elevationCurrent=2.9;
    const onPointerMove=(event)=>{const pointerHeight=1-(event.clientY/window.innerHeight);elevationTarget=2.75+pointerHeight*1.35};
    window.addEventListener('pointermove',onPointerMove,{passive:true});
    let frame,last=performance.now(),previousWalk=progress,travelDirection=1;
    function animate(now){const dt=Math.min((now-last)/1000,.04);last=now;const state=stateRef.current,targetZ=3-state.progress*48;const walkDelta=state.progress-previousWalk;if(walkDelta>.00001)travelDirection=1;else if(walkDelta<-.00001)travelDirection=-1;previousWalk=state.progress;astronaut.position.z+=(targetZ-astronaut.position.z)*.075;astronaut.position.x*=.92;const facingYaw=travelDirection>0?0:Math.PI;const facingDifference=Math.atan2(Math.sin(facingYaw-astronaut.rotation.y),Math.cos(facingYaw-astronaut.rotation.y));astronaut.rotation.y+=facingDifference*.14;const stride=state.moving&&!state.reducedMotion?Math.sin(now*.009):0;astronaut.children.forEach(part=>{if(part.name==='armL'||part.name==='legR')part.rotation.x=stride*.42;if(part.name==='armR'||part.name==='legL')part.rotation.x=-stride*.42});astronaut.position.y=Math.abs(stride)*.025;elevationCurrent+=(elevationTarget-elevationCurrent)*.055;const cameraX=compactView?.95:3.15;const cameraDistance=compactView?9.2:7;const cameraHeight=compactView?3.35:elevationCurrent;camera.position.x+=(cameraX-camera.position.x)*.055;camera.position.z+=(astronaut.position.z+cameraDistance-camera.position.z)*.055;camera.position.y+=(cameraHeight-camera.position.y)*.055;camera.lookAt(0,compactView?.82:1,astronaut.position.z-(compactView?3.1:3.8));pathTiles.forEach((tile)=>{const cycleLength=pathTiles.length*.82;while(tile.position.z>astronaut.position.z+8)tile.position.z-=cycleLength;while(tile.position.z<astronaut.position.z-cycleLength+8)tile.position.z+=cycleLength});beacons.forEach((b,i)=>{b.children[0].position.y=.8+Math.sin(now*.002+i)*.14});projectScreens.forEach((screenGroup,index)=>{const cycleLength=46;while(screenGroup.position.z>astronaut.position.z+7)screenGroup.position.z-=cycleLength;while(screenGroup.position.z<astronaut.position.z-cycleLength+7)screenGroup.position.z+=cycleLength;const screen=screenGroup.userData.screen;const slide=Math.floor(now/2800+index)%screen.userData.textures.length;if(screen.userData.index!==slide){screen.userData.index=slide;screen.material.map=screen.userData.textures[slide];screen.material.needsUpdate=true}screenGroup.position.y=.28+Math.sin(now*.0017+index)*.14;screenGroup.rotation.y=screenGroup.userData.baseYaw+Math.sin(now*.0009+index)*.055;screenGroup.rotation.z=Math.sin(now*.0012+index*.7)*.025});renderer.render(scene,camera);frame=requestAnimationFrame(animate)}frame=requestAnimationFrame(animate);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('pointermove',onPointerMove);observer.disconnect();previewTextures.forEach(texture=>texture.dispose());scene.traverse(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose?.()});renderer.dispose();mount.removeChild(renderer.domElement)};
  },[color,accent,seed,sectionId,items]);
  return <div className="planet-explorer-canvas" ref={mountRef} aria-hidden="true"/>;
}
