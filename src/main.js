import * as THREE from 'three';
import { gsap } from 'gsap';
import './style.css';
import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { createSecretRoom } from './secretRoom.js';

const $ = id => document.getElementById(id);
let scene, camera, renderer, world, player, clock, secretRoom;
let started = false, paused = false, muted = false, inSecretRoom = false, transitionLock = false, dialogIndex = 0, wavingNPC = false;
let flowers = 0, keyFound = false, letterFound = false;
let near = null, sittingOn = null, jumpVelocity = 0, onGround = true;
let jumpRequested = false, interactRequested = false, sprint = false;
let yaw = 0, pitch = .18;
const joy = { x: 0, y: 0 };
const look = { x: 0, y: 0 };
const velocity = new THREE.Vector3();
const wish = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
let toastTimer;

function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2300);
}

function sound(frequency = 650) {
  if (muted) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const context = new AudioCtx();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .2);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + .21);
    oscillator.onended = () => context.close();
  } catch { /* Audio is optional on unsupported browsers. */ }
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#d9c5c6');
  scene.fog = new THREE.Fog('#d9c5c6', 72, 150);
  camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 240);
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  $('game').appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight('#fff1f3', '#617967', 1.65));
  const sun = new THREE.DirectionalLight('#fff0d9', 2.1);
  sun.position.set(-35, 65, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -82;
  sun.shadow.camera.right = 82;
  sun.shadow.camera.top = 82;
  sun.shadow.camera.bottom = -82;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#e2c9f3', .5);
  fill.position.set(35, 18, -35);
  scene.add(fill);

  world = createWorld(scene);
  secretRoom = createSecretRoom(scene);
  player = createPlayer(scene);
  clock = new THREE.Clock();
  window.addEventListener('resize', resize);
  $('loadbar').style.width = '100%';
  setTimeout(() => {
    $('loading').classList.add('hide');
    $('intro').classList.remove('hide');
  }, 450);
}

function resize() {
  if (!camera || !renderer) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

function start() {
  if (started) return;
  started = true;
  $('intro').classList.add('hide');
  $('hud').classList.remove('hide');
  toast('Selamat datang di Secret Garden 🌷');
  if (!muted) {
    const music = $('bgMusic');
    music.volume = .32;
    music.play().catch(() => toast('Tambahkan lagu di public/audio/your-song.mp3'));
  }
  sound(720);
}

function collides(x, z, ignoreBench = null) {
  if (inSecretRoom) {
    if (x < -11.7 || x > 11.7 || z < -10.7 || z > 10.7) return true;
    for (const collider of secretRoom.colliders) {
      if (Math.hypot(x-collider.x,z-collider.z) < collider.r + .48) return true;
    }
    // Keep a respectful distance from Faiz so the characters never overlap.
    if (Math.hypot(x-secretRoom.npcPosition.x,z-secretRoom.npcPosition.z) < 1.15) return true;
    return false;
  }
  if (Math.hypot(x, z) > 68) return true;
  for (const collider of world.colliders) {
    if (ignoreBench && collider.bench === ignoreBench) continue;
    const radius = collider.r + .48;
    if (Math.hypot(x - collider.x, z - collider.z) < radius) return true;
  }
  return false;
}

function moveWithCollision(dx, dz) {
  const position = player.root.position;
  const nextX = position.x + dx;
  const nextZ = position.z + dz;
  // Axis-separated movement lets the character slide along walls and props.
  if (!collides(nextX, position.z)) position.x = nextX;
  if (!collides(position.x, nextZ)) position.z = nextZ;
}

function sitOnBench(bench) {
  if (sittingOn) return;
  sittingOn = bench;
  const position = new THREE.Vector3(0, 0, .62).applyAxisAngle(new THREE.Vector3(0, 1, 0), bench.rot);
  player.root.position.set(bench.x + position.x, .39, bench.z + position.z);
  player.root.rotation.y = bench.rot;
  velocity.set(0, 0, 0);
  jumpVelocity = 0;
  onGround = true;
  toast('Duduk sebentar di taman 🌷');
  sound(520);
}

function standFromBench() {
  if (!sittingOn) return;
  const bench = sittingOn;
  const offsets = [2.15, 2.65, 3.1, 3.6];
  let destination = null;
  for (const distance of offsets) {
    const offset = new THREE.Vector3(0, 0, distance).applyAxisAngle(new THREE.Vector3(0, 1, 0), bench.rot);
    const x = bench.x + offset.x;
    const z = bench.z + offset.z;
    if (!collides(x, z, bench)) { destination = { x, z }; break; }
  }
  if (destination) {
    player.root.position.set(destination.x, 0, destination.z);
  } else {
    // Fallback: small lateral step from the seat, still outside the bench footprint.
    const offset = new THREE.Vector3(1.9, 0, 1.9).applyAxisAngle(new THREE.Vector3(0, 1, 0), bench.rot);
    player.root.position.set(bench.x + offset.x, 0, bench.z + offset.z);
  }
  sittingOn = null;
  toast('Yuk, lanjut menjelajah!');
  sound(600);
}

function update(dt) {
  if (!started || paused || transitionLock) return;
  yaw -= look.x;
  pitch = THREE.MathUtils.clamp(pitch + look.y, -.1, .62);
  look.x = 0;
  look.y = 0;

  const keys = window.keys || {};
  if (sittingOn) {
    velocity.set(0, 0, 0);
    player.update(dt, velocity, false, true);
    if (interactRequested) {
      interactRequested = false;
      standFromBench();
    }
  } else {
    const ix = joy.x + (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    const iy = joy.y + (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
    const inputLength = Math.hypot(ix, iy);
    const inputX = inputLength > 1 ? ix / inputLength : ix;
    const inputY = inputLength > 1 ? iy / inputLength : iy;
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));
    wish.set(0, 0, 0).addScaledVector(right, inputX).addScaledVector(forward, -inputY);
    const moving = wish.lengthSq() > .01;
    const fast = sprint || keys.ShiftLeft || keys.ShiftRight;
    wish.normalize().multiplyScalar(moving ? (fast ? 7 : 4.2) : 0);
    velocity.x = THREE.MathUtils.damp(velocity.x, wish.x, moving ? 9 : 7, dt);
    velocity.z = THREE.MathUtils.damp(velocity.z, wish.z, moving ? 9 : 7, dt);
    moveWithCollision(velocity.x * dt, velocity.z * dt);

    if (moving && velocity.length() > .3) {
      const face = Math.atan2(velocity.x, velocity.z);
      const difference = Math.atan2(Math.sin(face - player.root.rotation.y), Math.cos(face - player.root.rotation.y));
      player.root.rotation.y += difference * (1 - Math.exp(-12 * dt));
    }

    if ((jumpRequested || keys.Space) && onGround) {
      jumpVelocity = 7.2;
      onGround = false;
      sound(380);
    }
    jumpRequested = false;
    jumpVelocity -= 18 * dt;
    player.root.position.y += jumpVelocity * dt;
    if (player.root.position.y <= 0) {
      player.root.position.y = 0;
      jumpVelocity = 0;
      onGround = true;
    }
    player.update(dt, velocity, !onGround, false);
  }

  const target = player.root.position.clone().add(new THREE.Vector3(0, inSecretRoom ? 1.75 : sittingOn ? 1.8 : 2.05, 0));
  const distance = inSecretRoom ? 4.8 : sittingOn ? 6.4 : 7.8;
  const horizontal = Math.cos(pitch) * distance;
  const vertical = Math.sin(pitch) * distance + (inSecretRoom ? .85 : 2.2);
  const desiredCamera = target.clone().add(new THREE.Vector3(Math.sin(yaw) * horizontal, vertical, Math.cos(yaw) * horizontal));
  camera.position.lerp(desiredCamera, 1 - Math.exp(-5.8 * dt));
  camera.lookAt(target);

  world.items.forEach(item => {
    if (!item.collected) {
      item.orb.rotation.y += dt;
      item.orb.position.y = 1.45 + Math.sin(clock.elapsedTime * 2.1 + item.x) * .18;
    }
  });

  const p = player.root.position;
  near = null;
  let best = 4.2;
  if (inSecretRoom) {
    const npcDistance = Math.hypot(p.x-secretRoom.npcPosition.x, p.z-secretRoom.npcPosition.z);
    if (!paused && npcDistance < 3.5) near = { type: 'npc', label: 'Bicara dengan Faiz Gantenk' };
  } else if (!sittingOn) {
    for (const item of world.items) {
      if (item.collected) continue;
      const d = Math.hypot(p.x - item.x, p.z - item.z);
      if (d < best) { best = d; near = item; }
    }
    for (const bench of world.benches) {
      const d = Math.hypot(p.x - bench.x, p.z - bench.z);
      if (d < 2.85 && d < best) { best = d; near = { type: 'bench', bench, label: 'Duduk di bangku' }; }
    }
    if (flowers === 4 && keyFound && letterFound) {
      const d = Math.hypot(p.x - world.gazebo.x, p.z - (world.gazebo.z + 7));
      if (d < 5.5 && d < best) near = { type: 'gazebo', label: 'Masuk ke gazebo rahasia' };
    }
  }

  $('interact').classList.toggle('hide', !near && !sittingOn);
  $('hint').classList.toggle('hide', !near && !sittingOn);
  $('hint').textContent = sittingOn ? 'Tekan AKSI untuk bangun' : (near?.label || '');
  const total = flowers + (keyFound ? 1 : 0) + (letterFound ? 1 : 0);
  $('count').innerHTML = `${total} <small>/ 6</small>`;
  $('progress').style.width = `${total / 6 * 100}%`;
  $('mission').textContent = inSecretRoom ? 'Momen spesial · Temui Faiz Gantenk ♡' : flowers < 4 ? `Misi 1 · Temukan bunga kenangan (${flowers}/4)` : !keyFound ? 'Misi 2 · Cari kunci gazebo' : !letterFound ? 'Misi 3 · Temukan surat tersembunyi' : 'Misi terakhir · Temui gazebo rahasia';
  $('zone').textContent = inSecretRoom ? 'THE HIDDEN ROOM' : Math.hypot(p.x - 43, p.z + 7) < 18 ? 'CRYSTAL POND' : p.z < -40 ? 'SECRET GAZEBO' : 'ROSEWATER GARDEN';

  if (interactRequested && near && !sittingOn) {
    interactRequested = false;
    interact(near);
  } else if (interactRequested && !near && !sittingOn) {
    interactRequested = false;
  }
}

function interact(item) {
  if (item.type === 'bench') { sitOnBench(item.bench); return; }
  if (item.type === 'gazebo') { enterSecretRoom(); return; }
  if (item.type === 'npc') { openFaizDialog(); return; }
  item.collected = true;
  item.group.visible = false;
  if (item.type === 'flower') {
    flowers++;
    toast(`Bunga kenangan ditemukan! (${flowers}/4)`);
  } else if (item.type === 'key') {
    keyFound = true;
    toast('Kunci gazebo ditemukan! 🗝️');
  } else if (item.type === 'letter') {
    letterFound = true;
    toast('Surat rahasia ditemukan! 💌');
  }
  sound(850);
  const total = flowers + (keyFound ? 1 : 0) + (letterFound ? 1 : 0);
  $('count').innerHTML = `${total} <small>/ 6</small>`;
  gsap.fromTo($('progress'), { opacity: .45 }, { opacity: 1, duration: .35 });
  if (flowers === 4 && !keyFound) toast('Empat bunga terkumpul. Sekarang cari kunci!');
  if (keyFound && letterFound && flowers === 4) toast('Semua kenangan terkumpul. Gazebo rahasia terbuka!');
}


function enterSecretRoom() {
  if (inSecretRoom || transitionLock) return;
  transitionLock = true;
  paused = true;
  near = null;
  $('hud').classList.add('hide');
  $('transitionTitle').innerHTML = 'SOMETHING SPECIAL<br><em>IS WAITING</em>';
  $('transitionText').textContent = 'Beneath the gazebo, a little secret is waiting for you...';
  $('transition').classList.remove('hide');
  sound(880);
  setTimeout(() => {
    world.root.visible = false;
    secretRoom.root.visible = true;
    inSecretRoom = true;
    player.root.position.set(secretRoom.spawn.x, 0, secretRoom.spawn.z);
    player.root.rotation.y = Math.PI;
    velocity.set(0,0,0);
    jumpVelocity = 0;
    onGround = true;
    yaw = 0;
    pitch = .12;
    camera.position.set(0,5,18);
    scene.background = new THREE.Color('#473b50');
    scene.fog = new THREE.Fog('#473b50', 24, 48);
    $('transitionTitle').innerHTML = 'WELCOME TO<br><em>THE HIDDEN ROOM</em>';
    $('transitionText').textContent = 'Di sini, seseorang sudah menunggumu.';
    sound(660);
    setTimeout(() => {
      $('transition').classList.add('hide');
      $('hud').classList.remove('hide');
      $('mission').textContent = 'Momen spesial · Temui Faiz Gantenk ♡';
      $('zone').textContent = 'THE HIDDEN ROOM';
      paused = false;
      transitionLock = false;
      toast('Ada seseorang yang menunggumu di sana… ♡');
    }, 1600);
  }, 1800);
}

const faizLines = [
  'Akhirnya kamu sampai juga di sini, Ais. ♡',
  'Aku sudah menyiapkan tempat kecil ini sebagai kejutan terakhir untukmu.',
  'Mungkin perjalanan tadi terlihat sederhana, tapi setiap bunga dan setiap langkah punya cerita kecilnya sendiri.',
  'Sebelum kamu pergi, ada satu hal lagi yang ingin aku sampaikan. Aku menulisnya khusus untukmu.'
];

function openFaizDialog() {
  if (paused) return;
  paused = true;
  dialogIndex = 0;
  wavingNPC = true;
  $('hud').classList.add('hide');
  $('dialogName').textContent = 'FAIZ GANTENK ♡';
  $('dialogText').textContent = '';
  $('dialogNext').textContent = 'LANJUTKAN ↗';
  $('dialog').classList.remove('hide');
  typeDialogLine(faizLines[dialogIndex]);
  sound(740);
}

let typingTimer = null;
function typeDialogLine(line) {
  clearInterval(typingTimer);
  const target=$('dialogText');
  target.textContent='';
  let i=0;
  typingTimer=setInterval(()=>{
    target.textContent=line.slice(0,++i);
    if(i>=line.length) clearInterval(typingTimer);
  },28);
}

$('dialogNext').addEventListener('click',()=>{
  if (dialogIndex < faizLines.length-1) {
    dialogIndex++;
    typeDialogLine(faizLines[dialogIndex]);
    if(dialogIndex===faizLines.length-1) $('dialogNext').textContent='BACA SURAT ♡';
  } else {
    clearInterval(typingTimer);
    $('dialog').classList.add('hide');
    $('secretLetter').classList.remove('hide');
    $('hud').classList.add('hide');
    const letter = 'Hai, Ais.\n\nTerima kasih sudah menyelesaikan perjalanan kecil ini. Kalau taman tadi punya banyak bunga, setiap bunga mengingatkanku bahwa hal-hal sederhana pun bisa terasa istimewa.\n\nAku membuat tempat ini supaya kamu punya satu kenangan kecil yang bisa dibuka kapan saja. Semoga langkahmu selalu dipenuhi hal baik, hatimu selalu diberi ketenangan, dan kamu terus menemukan alasan untuk tersenyum.\n\nJangan lupa, kamu itu berharga. Teruslah tumbuh menjadi versi terbaik dirimu.\n\nSampai bertemu di cerita baik berikutnya. ♡';
    typeLetter(letter);
    sound(920);
  }
});

function typeLetter(text) {
  const target=$('letterText');
  target.textContent='';
  let i=0;
  clearInterval(typingTimer);
  typingTimer=setInterval(()=>{
    target.textContent += text[i++];
    if(i>=text.length) clearInterval(typingTimer);
  },18);
}

$('closeLetter').addEventListener('click',()=>{
  $('secretLetter').classList.add('hide');
  $('hud').classList.remove('hide');
  paused=false;
  wavingNPC=false;
  toast('Surat Faiz tersimpan dalam kenanganmu. ♡');
});

// Keyboard
window.keys = {};
window.addEventListener('keydown', event => {
  window.keys[event.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
});
window.addEventListener('keyup', event => { window.keys[event.code] = false; });

// Mobile joystick
const ring = $('joyring');
const knob = $('joyknob');
let joyPointer = null;
function moveJoystick(event) {
  const rect = ring.getBoundingClientRect();
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);
  const max = rect.width * .34;
  const length = Math.hypot(dx, dy);
  const scale = Math.min(1, max / (length || 1));
  joy.x = dx * scale / max;
  joy.y = dy * scale / max;
  knob.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
}
ring.addEventListener('pointerdown', event => { joyPointer = event.pointerId; ring.setPointerCapture(joyPointer); moveJoystick(event); });
ring.addEventListener('pointermove', event => { if (event.pointerId === joyPointer) moveJoystick(event); });
function endJoystick(event) {
  if (event.pointerId !== joyPointer) return;
  joyPointer = null;
  joy.x = 0; joy.y = 0;
  knob.style.transform = 'translate(0,0)';
}
ring.addEventListener('pointerup', endJoystick);
ring.addEventListener('pointercancel', endJoystick);

// Camera drag zone
let lookPointer = null;
let lastX = 0, lastY = 0;
$('lookzone').addEventListener('pointerdown', event => {
  lookPointer = event.pointerId;
  lastX = event.clientX; lastY = event.clientY;
  $('lookzone').setPointerCapture(lookPointer);
});
$('lookzone').addEventListener('pointermove', event => {
  if (event.pointerId !== lookPointer) return;
  look.x += (event.clientX - lastX) * .006;
  look.y += (event.clientY - lastY) * .004;
  lastX = event.clientX; lastY = event.clientY;
});
const endLook = event => { if (event.pointerId === lookPointer) lookPointer = null; };
$('lookzone').addEventListener('pointerup', endLook);
$('lookzone').addEventListener('pointercancel', endLook);

// UI actions
$('play').addEventListener('click', start);
$('jump').addEventListener('click', () => { if (!sittingOn) jumpRequested = true; });
$('run').addEventListener('pointerdown', () => { sprint = true; });
['pointerup', 'pointercancel', 'pointerleave'].forEach(name => $('run').addEventListener(name, () => { sprint = false; }));
$('interact').addEventListener('click', () => { interactRequested = true; });
$('pauseBtn').addEventListener('click', () => { paused = true; $('pause').classList.remove('hide'); });
$('resume').addEventListener('click', () => { paused = false; $('pause').classList.add('hide'); });
$('restart').addEventListener('click', () => location.reload());
$('again').addEventListener('click', () => location.reload());
$('mapBtn').addEventListener('click', () => $('mapPanel').classList.toggle('hide'));
$('closeMap').addEventListener('click', () => $('mapPanel').classList.add('hide'));
$('audioBtn').addEventListener('click', () => {
  muted = !muted;
  $('audioBtn').textContent = muted ? '♪' : '♫';
  $('bgMusic').muted = muted;
  if (!muted && started) $('bgMusic').play().catch(() => {});
});
$('reveal').addEventListener('click', () => { $('letter').classList.remove('hide'); $('reveal').classList.add('hide'); sound(900); });

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .04);
  update(dt);
  if (secretRoom && inSecretRoom) secretRoom.npc.update(dt, clock.elapsedTime, wavingNPC);
  renderer.render(scene, camera);
}

init();
requestAnimationFrame(animate);
