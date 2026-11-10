import * as THREE from 'three';
const material=(color,roughness=.9,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const rand=(a,b)=>a+Math.random()*(b-a);
function add(parent,geo,mat,x,y,z,opts={}){const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;if(opts.sx)o.scale.set(opts.sx,opts.sy??opts.sx,opts.sz??opts.sx);parent.add(o);return o;}
export function createWorld(scene){
 const root=new THREE.Group();scene.add(root);const colliders=[];const benches=[];
 const grass=material('#91ad91'),grassLight=material('#a8bea0'),path=material('#e5cfc0'),wood=material('#805d50'),cream=material('#f4e6d7'),pink=material('#e9a9c0'),pink2=material('#f5c8d5'),leaf=[material('#648b70'),material('#7fa27e'),material('#9db58b')],stone=material('#9b9a91');
 add(root,new THREE.PlaneGeometry(150,150),grass,0,-.12,0).rotation.x=-Math.PI/2;
 // softly varied lawn patches
 for(let i=0;i<35;i++){const p=add(root,new THREE.CircleGeometry(rand(3,8),24),i%2?grassLight:grass,rand(-65,65),-.105,rand(-65,65));p.rotation.x=-Math.PI/2;p.material= p.material.clone();p.material.transparent=true;p.material.opacity=.35;}
 // main winding path, broad and walkable
 const pts=[new THREE.Vector3(0,.015,58),new THREE.Vector3(2,.015,40),new THREE.Vector3(-3,.015,22),new THREE.Vector3(0,.015,5),new THREE.Vector3(12,.015,-10),new THREE.Vector3(20,.015,-25),new THREE.Vector3(14,.015,-42),new THREE.Vector3(0,.015,-55)];
 const roadShape=new THREE.Shape();roadShape.moveTo(-3.5,58);roadShape.lineTo(3.5,58);roadShape.lineTo(5.5,40);roadShape.lineTo(.5,22);roadShape.lineTo(3.5,5);roadShape.lineTo(15.5,-10);roadShape.lineTo(23.5,-25);roadShape.lineTo(17.5,-42);roadShape.lineTo(3.5,-55);roadShape.lineTo(-3.5,-55);roadShape.lineTo(10.5,-42);roadShape.lineTo(16.5,-25);roadShape.lineTo(8.5,-10);roadShape.lineTo(-3.5,5);roadShape.lineTo(-6.5,22);roadShape.lineTo(-1.5,40);roadShape.closePath();const road=new THREE.Mesh(new THREE.ShapeGeometry(roadShape),path);road.rotation.x=Math.PI/2;road.position.y=.012;road.receiveShadow=true;root.add(road);
 // secondary paths
 for(const [x,z,angle] of [[-25,12,.5],[28,-8,-.6],[-30,-28,.2]]){const p=add(root,new THREE.CylinderGeometry(1.8,1.8,0.035,32),path,x,.01,z);p.rotation.y=angle;}
 // flower clusters across garden
 const flowerM=[pink,pink2,material('#d8c5ee'),cream];
 for(let i=0;i<380;i++){let x=rand(-67,67),z=rand(-62,62);if(Math.abs(x)<5&&z> -58&&z<60)continue;if(Math.hypot(x-28,z-8)<9||Math.hypot(x+30,z+5)<10)continue;const g=new THREE.Group();g.position.set(x,0,z);root.add(g);add(g,new THREE.CylinderGeometry(.025,.035,.32,5),material('#658b63'),0,.16,0);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;add(g,new THREE.SphereGeometry(.105,7,6),flowerM[i%4],Math.cos(a)*.12,.32,Math.sin(a)*.12,{sx:1,sy:.7,sz:1});}add(g,new THREE.SphereGeometry(.07,7,6),cream,0,.34,0);}
 // trees with real trunk collision
 function tree(x,z,s=1,kind=0){const g=new THREE.Group();g.position.set(x,0,z);root.add(g);add(g,new THREE.CylinderGeometry(.25*s,.38*s,3.2*s,9),wood,0,1.6*s,0);for(let i=0;i<3;i++){const crown=add(g,new THREE.SphereGeometry(1,14,12),leaf[(kind+i)%3],(i-1)*.55*s,3.25*s+(i%2)*.48*s,0,{sx:1.15*s,sy:1.05*s,sz:1.1*s});}colliders.push({x,z,r:.8*s,type:'tree'});}
 // trees frame the garden without blocking the main trail
 for(let i=0;i<54;i++){let x=rand(-65,65),z=rand(-58,58);if(Math.abs(x)<10&&z>-58&&z<58)continue;if(Math.hypot(x+30,z-5)<13||Math.hypot(x-28,z-8)<13)continue;const missionSpots=[[-28,28],[28,29],[-39,-29],[36,-37],[15,-42],[-8,-43]];if(missionSpots.some(([mx,mz])=>Math.hypot(x-mx,z-mz)<5.5))continue;tree(x,z,rand(.8,1.25),i%3);}
 // decorative benches, collision footprint at seat + back
 function bench(x,z,rot=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;root.add(g);add(g,new THREE.BoxGeometry(2.5,.18,.72),wood,0,.85,0);add(g,new THREE.BoxGeometry(2.5,.85,.16),wood,0,1.28,-.28);for(const xx of [-.92,.92]){add(g,new THREE.BoxGeometry(.16,.85,.16),wood,xx,.45,0);add(g,new THREE.BoxGeometry(.16,.65,.16),wood,xx,1.18,-.28);}for(const xx of [-.9,0,.9])add(g,new THREE.BoxGeometry(.13,.12,.82),cream,xx,.98,0);const data={x,z,rot,type:'bench'};benches.push(data);colliders.push({x,z,r:1.48,type:'bench',bench:data});}
 bench(-17,20,.3);bench(22,17,-.5);bench(-39,-7,.7);bench(36,-34,2.4);
 // fountain plaza
 const fx=0,fz=-18;add(root,new THREE.CylinderGeometry(5,5.3,.55,48),cream,fx,.28,fz);add(root,new THREE.CylinderGeometry(4.4,4.4,.18,48),material('#8eb8b6'),fx,.62,fz);add(root,new THREE.CylinderGeometry(.65,.9,2.2,20),cream,fx,1.7,fz);add(root,new THREE.SphereGeometry(.55,18,14),pink,fx,2.95,fz);colliders.push({x:fx,z:fz,r:5.3,type:'fountain'});
 // pond at the east side; treated as impassable circular water
 const lakeX=43,lakeZ=-7;const water=new THREE.Mesh(new THREE.CircleGeometry(12,64),new THREE.MeshPhysicalMaterial({color:'#83b8b7',roughness:.2,metalness:.05,transparent:true,opacity:.92}));water.rotation.x=-Math.PI/2;water.position.set(lakeX,.025,lakeZ);root.add(water);const rim=add(root,new THREE.RingGeometry(11.8,13.1,64),cream,lakeX,.035,lakeZ);rim.rotation.x=-Math.PI/2;colliders.push({x:lakeX,z:lakeZ,r:12.2,type:'water'});
 // lake-side stepping stones
 for(let i=0;i<9;i++){const a=i/8*Math.PI*.9+Math.PI*.58;add(root,new THREE.CylinderGeometry(.8,.95,.2,8),stone,lakeX+Math.cos(a)*14,.12,lakeZ+Math.sin(a)*14);}
 // gazebo: solid base + posts; collision boundary prevents entering before final mission
 const gx=0,gz=-51;add(root,new THREE.CylinderGeometry(7.3,7.5,.35,8),cream,gx,.18,gz);for(let i=0;i<8;i++){const a=i*Math.PI/4;add(root,new THREE.CylinderGeometry(.22,.28,4.3,10),pink,gx+Math.cos(a)*5.7,2.3,gz+Math.sin(a)*5.7);}
 const roof=add(root,new THREE.ConeGeometry(7.5,3.2,8),material('#c98fa9'),gx,5.95,gz);roof.rotation.y=Math.PI/8;add(root,new THREE.SphereGeometry(.35,12,10),cream,gx,7.65,gz);
 // gazebo approach opening south; perimeter collision blocks sides and rear
 colliders.push({x:-5.8,z:gz,r:1.1,type:'gazebo'},{x:5.8,z:gz,r:1.1,type:'gazebo'},{x:0,z:gz-6.2,r:1.3,type:'gazebo'});
 // glowing mission collectibles: four flowers, key, memory letter
 function collectible(x,z,type,label,color){const group=new THREE.Group();group.position.set(x,0,z);root.add(group);const glow=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.15});add(group,new THREE.CylinderGeometry(.045,.06,.8,6),material('#688b66'),0,.4,0);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;add(group,new THREE.SphereGeometry(.18,9,7),glow,Math.cos(a)*.2,.82,Math.sin(a)*.2,{sx:1,sy:.7,sz:1});}add(group,new THREE.SphereGeometry(.1,8,7),cream,0,.84,0);const orb=add(group,new THREE.OctahedronGeometry(.28),glow,0,1.45,0);orb.userData.float=true;return {group,orb,x,z,type,label,collected:false};}
 const items=[collectible(-28,28,'flower','Bunga kenangan pertama','#ffd0df'),collectible(28,29,'flower','Bunga kenangan kedua','#f7c5a8'),collectible(-39,-29,'flower','Bunga kenangan ketiga','#d8c5f5'),collectible(36,-37,'flower','Bunga kenangan keempat','#fff0ad'),collectible(15,-42,'key','Kunci gazebo','#ffe29a'),collectible(-8,-43,'letter','Surat kecil','#f6b9d0')];
 // perimeter low hedge and distant hills
 for(let i=0;i<64;i++){const a=i/64*Math.PI*2,x=Math.cos(a)*72,z=Math.sin(a)*72;const h=add(root,new THREE.SphereGeometry(1,10,8),leaf[i%3],x,.75,z,{sx:2.8,sy:1.3,sz:2.8});}
 for(let i=0;i<28;i++){const a=i/28*Math.PI*2;const hill=add(root,new THREE.ConeGeometry(rand(7,12),rand(13,22),7),material('#82988a'),Math.cos(a)*91,5,Math.sin(a)*91);hill.rotation.z=rand(-.15,.15);}
 return {root,colliders,benches,items,gazebo:{x:gx,z:gz},lake:{x:lakeX,z:lakeZ}};
}
