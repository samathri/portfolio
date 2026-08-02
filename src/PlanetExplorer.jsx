import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

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

export default function PlanetExplorer({ color, accent, progress, moving, reducedMotion }) {
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
    const beacons=[];
    [.16,.34,.52,.7,.88].forEach((part,index)=>{const group=new THREE.Group();group.position.set(index%2?2.8:-2.8,0,3-part*48);const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.46+index*.035,0),new THREE.MeshPhysicalMaterial({color:accent,emissive:color,emissiveIntensity:1.15,roughness:.18,metalness:.25,transparent:true,opacity:.9}));crystal.position.y=.75;group.add(crystal);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.018,.14,5,12),new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.16}));beam.position.y=3;group.add(beam);scene.add(group);beacons.push(group)});
    const rocket=landedRocket(accent);rocket.position.set(2.6,0,4);rocket.rotation.y=-.5;scene.add(rocket);
    const astronaut=astronautModel();astronaut.position.set(0,0,3);astronaut.rotation.y=Math.PI;scene.add(astronaut);
    function resize(){camera.aspect=mount.clientWidth/mount.clientHeight;camera.updateProjectionMatrix();renderer.setSize(mount.clientWidth,mount.clientHeight,false)} const observer=new ResizeObserver(resize);observer.observe(mount);resize();
    let elevationTarget=2.9,elevationCurrent=2.9;
    const onPointerMove=(event)=>{const pointerHeight=1-(event.clientY/window.innerHeight);elevationTarget=2.75+pointerHeight*1.35};
    window.addEventListener('pointermove',onPointerMove,{passive:true});
    let frame,last=performance.now();
    function animate(now){const dt=Math.min((now-last)/1000,.04);last=now;const state=stateRef.current,targetZ=3-state.progress*48;astronaut.position.z+=(targetZ-astronaut.position.z)*.075;astronaut.position.x*=.92;astronaut.rotation.y=Math.PI;const stride=state.moving&&!state.reducedMotion?Math.sin(now*.009):0;astronaut.children.forEach(part=>{if(part.name==='armL'||part.name==='legR')part.rotation.x=stride*.42;if(part.name==='armR'||part.name==='legL')part.rotation.x=-stride*.42});astronaut.position.y=Math.abs(stride)*.025;elevationCurrent+=(elevationTarget-elevationCurrent)*.055;camera.position.x+=(4.7-camera.position.x)*.055;camera.position.z+=(astronaut.position.z+7-camera.position.z)*.055;camera.position.y+=(elevationCurrent-camera.position.y)*.055;camera.lookAt(0,1,astronaut.position.z-3.8);pathTiles.forEach((tile)=>{const cycleLength=pathTiles.length*.82;while(tile.position.z>astronaut.position.z+8)tile.position.z-=cycleLength;while(tile.position.z<astronaut.position.z-cycleLength+8)tile.position.z+=cycleLength});beacons.forEach((b,i)=>{b.children[0].position.y=.8+Math.sin(now*.002+i)*.14});renderer.render(scene,camera);frame=requestAnimationFrame(animate)}frame=requestAnimationFrame(animate);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('pointermove',onPointerMove);observer.disconnect();scene.traverse(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose?.()});renderer.dispose();mount.removeChild(renderer.domElement)};
  },[color,accent,seed]);
  return <div className="planet-explorer-canvas" ref={mountRef} aria-hidden="true"/>;
}
