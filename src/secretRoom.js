import * as THREE from 'three';

const mat = (color, roughness=.82, metalness=0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function box(parent, w, h, d, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
  mesh.position.set(x,y,z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function sphere(parent, r, material, x,y,z, sx=1,sy=1,sz=1) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r,16,12),material);
  mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz);
  mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}
function cylinder(parent, rt, rb, h, material, x,y,z, sides=24) {
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,sides),material);
  mesh.position.set(x,y,z); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}

function createFaizNPC(parent) {
  const npc = new THREE.Group();
  npc.position.set(0,0,-3.7);
  parent.add(npc);

  const skin=mat('#f0c5aa'), hair=mat('#49343a'), sweater=mat('#ead8c7'),
    pants=mat('#59616a'), shoes=mat('#594b52'), white=mat('#fff8ef'),
    eyes=mat('#49333b'), blush=mat('#d98e9e');

  // Body and neck
  cylinder(npc,.39,.46,.88,sweater,0,1.02,0,20);
  sphere(npc,.13,skin,0,1.52,.015,.9,1,.9);
  // Head
  sphere(npc,.42,skin,0,1.99,.02,1,1.08,.9);
  // Fluffy hair cap and fringe
  sphere(npc,.445,hair,0,2.2,-.055,1.04,.78,1);
  sphere(npc,.25,hair,0,2.34,.23,1.35,.55,.72);
  for(let i=0;i<5;i++){
    const x=(i-2)*.15;
    sphere(npc,.13,hair,x,2.29,.29,.9,1,.85);
  }
  // Ears, eyes, brows, smile
  for(const s of [-1,1]){
    sphere(npc,.085,skin,s*.405,1.99,.015);
    sphere(npc,.052,white,s*.15,2.02,.385,1,.9,.5);
    sphere(npc,.027,eyes,s*.15,2.02,.412);
    sphere(npc,.025,hair,s*.15,2.12,.398,1,.45,.45);
    sphere(npc,.065,blush,s*.26,1.91,.36,1,.55,.3);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(.075,.012,6,16,Math.PI),mat('#9c596b'));
  smile.position.set(0,1.88,.39); smile.rotation.z=Math.PI; npc.add(smile);

  // Arms are mounted outside torso, with clearly visible hands.
  const arms=[];
  for(const s of [-1,1]){
    const arm=new THREE.Group(); arm.position.set(s*.39,1.36,0); npc.add(arm);
    const sleeve=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.42,5,10),sweater);
    sleeve.position.set(s*.1,-.22,.015); sleeve.rotation.z=s*-.16; sleeve.castShadow=true; arm.add(sleeve);
    sphere(arm,.09,skin,s*.15,-.49,.07);
    arms.push({arm,side:s});
  }
  // Legs
  for(const s of [-1,1]){
    cylinder(npc,.14,.15,.55,pants,s*.18,.34,0,12);
    box(npc,.24,.14,.4,shoes,s*.18,.09,.09);
  }

  // Name plate sprite
  const canvas=document.createElement('canvas');
  canvas.width=512; canvas.height=128;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='rgba(55,39,49,.78)';
  ctx.beginPath(); ctx.roundRect(10,12,492,104,30); ctx.fill();
  ctx.strokeStyle='rgba(255,220,232,.9)'; ctx.lineWidth=5; ctx.stroke();
  ctx.font='bold 48px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='#ffe8ef'; ctx.fillText('FAIZ GANTENK ♡',256,66);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));
  label.position.set(0,3.08,0); label.scale.set(3.3,.82,1); npc.add(label);

  return {
    group:npc,
    update(dt,time, waving=false) {
      npc.position.y = Math.sin(time*1.5)*.025;
      arms.forEach(({arm,side})=>{
        const target=waving && side===1 ? -1.35 + Math.sin(time*8)*.18 : Math.sin(time*1.4+(side<0?Math.PI:0))*.045;
        arm.rotation.z += (target-arm.rotation.z)*(1-Math.exp(-8*dt));
      });
      label.position.y=3.08+Math.sin(time*2)*.045;
    }
  };
}

export function createSecretRoom(scene) {
  const root=new THREE.Group();
  root.visible=false;
  scene.add(root);
  const stone=mat('#d7c6c0'), floor=mat('#e9d9d4'), trim=mat('#b88b9c'),
    pink=mat('#e7a9c0'), softPink=mat('#f4cbd7'), gold=mat('#d8b77e',.35,.55),
    leaf=mat('#668b70'), water=mat('#83b9bb',.2), dark=mat('#55464e');
  const colliders=[];

  // Enclosed chamber, 26 x 24 units. Open entrance is on the south wall.
  box(root,26,.45,24,floor,0,-.25,0);
  box(root,26,.55,.7,stone,0,4.1,-12);
  box(root,.7,4.5,24,stone,-13,2,-0);
  box(root,.7,4.5,24,stone,13,2,0);
  box(root,8,.55,.7,stone,-9,4.1,12);
  box(root,8,.55,.7,stone,9,4.1,12);
  // Ceiling beams and glowing inset ceiling
  box(root,25,.35,23,mat('#806c76'),0,5,-.1);
  box(root,20,.08,18,mat('#b49aa5'),0,4.78,0);
  for(const x of [-9,-5,0,5,9]) box(root,.12,.08,18,gold,x,4.68,0);
  for(const z of [-8,-4,0,4,8]) box(root,20,.08,.12,gold,0,4.68,z);

  // Entrance arch framing the player arrival
  for(const x of [-4.2,4.2]) cylinder(root,.22,.25,4.2,trim,x,2,11.3,12);
  const arch= new THREE.Mesh(new THREE.TorusGeometry(4.2,.22,10,32,Math.PI),trim);
  arch.position.set(0,3.7,11.3); arch.rotation.z=Math.PI; root.add(arch);

  // Central patterned rug
  box(root,8,.06,5,trim,0,.035,1.2);
  box(root,7.5,.045,4.5,softPink,0,.075,1.2);
  for(let i=-3;i<=3;i++) box(root,.035,.02,4.2,gold,i,.105,1.2);

  // Side tables, chairs, flower pots
  box(root,2.3,.22,1.25,dark,-8,.85,-1);
  cylinder(root,.09,.11,.95,gold,-8,.42,-1,12);
  box(root,2.2,.18,1.2,dark,8,.85,-1);
  cylinder(root,.09,.11,.95,gold,8,.42,-1,12);
  for(const x of [-9.4,9.4]){
    cylinder(root,.35,.42,.55,trim,x,.27,-7,16);
    for(let j=0;j<5;j++) sphere(root,.15,pink,x+Math.cos(j*1.25)*.25,.78,-7+Math.sin(j*1.25)*.25);
    cylinder(root,.22,.3,.4,leaf,x,.95,-7,12);
    colliders.push({x,z:-7,r:.75});
  }

  // Back wall secret window with garden-like glow
  box(root,7,3.2,.18,mat('#725e70'),0,2.45,-11.55);
  box(root,6.45,2.65,.08,mat('#b9a5c9'),0,2.48,-11.42);
  for(const x of [-3.1,0,3.1]) box(root,.1,2.7,.12,gold,x,2.45,-11.3);
  box(root,6.4,.1,.12,gold,0,2.45,-11.28);
  // Decorative glowing crystal clusters
  for(let i=0;i<13;i++){
    const x=-10+(i%7)*3.3, z=i<7?-9:9;
    const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.22+(i%3)*.08),mat('#dcb8ed'));
    crystal.position.set(x,.7+(i%3)*.25,z); root.add(crystal);
  }

  // Small indoor reflecting pool on left; rim collision
  const pool=new THREE.Mesh(new THREE.CylinderGeometry(2.15,2.15,.28,40),trim);
  pool.position.set(-8,.12,5); root.add(pool);
  const poolWater=new THREE.Mesh(new THREE.CircleGeometry(1.92,40),new THREE.MeshPhysicalMaterial({color:'#8cc5c5',roughness:.15,transparent:true,opacity:.88}));
  poolWater.rotation.x=-Math.PI/2; poolWater.position.set(-8,.28,5); root.add(poolWater);
  colliders.push({x:-8,z:5,r:2.15});

  // Soft glowing lamps
  for(const [x,z] of [[-10,-10],[10,-10],[-10,8],[10,8],[0,-10]]){
    cylinder(root,.18,.23,.38,gold,x,3.75,z,12);
    sphere(root,.22,mat('#ffe5b2',.25),x,3.48,z,1,1,1);
    const light=new THREE.PointLight('#ffd9e6',1.25,8,2);
    light.position.set(x,3.35,z); root.add(light);
  }

  // Flower vines and wall decorations
  for(const side of [-1,1]){
    for(let i=0;i<7;i++){
      const x=side*12.55, z=-9+i*3;
      cylinder(root,.035,.045,2.3,leaf,x,1.6,z,6);
      sphere(root,.16,pink,x-side*.2,2.4,z);
      sphere(root,.12,softPink,x+side*.18,1.3,z+.25);
    }
  }

  // A little table for the letter, placed away from NPC path.
  box(root,2.2,.18,1.2,trim,7.7,.95,6.3);
  for(const x of [7,8.4]) cylinder(root,.07,.08,.9,gold,x,.48,6.3,10);
  const envelope=box(root,.75,.06,.52,softPink,7.7,1.08,6.3);
  envelope.rotation.y=-.16;
  const seal=sphere(root,.12,mat('#bd6688'),7.7,1.13,6.3,.9,.5,.9);

  // NPC stands near the far side of the chamber.
  const npc=createFaizNPC(root);
  // Decorative pillars
  for(const x of [-11,11]) for(const z of [-9,9]){
    cylinder(root,.28,.34,4,trim,x,2,z,12);
    cylinder(root,.42,.42,.18,gold,x,3.95,z,12);
    colliders.push({x,z,r:.62});
  }

  return {root,colliders,npc,letterObject:envelope,seal,spawn:{x:0,z:6.4},npcPosition:{x:0,z:-3.7}};
}
