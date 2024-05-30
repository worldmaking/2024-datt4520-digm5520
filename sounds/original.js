import * as THREE from "three";
import { XRButton } from "three/addons/webxr/XRButton.js";
import Stats from "three/addons/libs/stats.module";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const overlay = document.getElementById("overlay");

// add a stats view to the page to monitor performance:
const stats = new Stats();
document.body.appendChild(stats.dom);

const clock = new THREE.Clock();

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(XRButton.createButton(renderer));

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.6, 5);

scene.add(new THREE.HemisphereLight(0xa5a5a5, 0x898989, 3));

const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(1, 1, 1).normalize();
scene.add(light);

const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  // this fixes the weird exit XR bug:
  if (!renderer.xr.isPresenting)
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// create an AudioListener and add it to the camera
// (this embeds the WebAudio spatialization feature of audioContext.listener)
const listener = new THREE.AudioListener();
camera.add(listener);

let mesh = new THREE.Mesh(
  new THREE.BoxGeometry(),
new THREE.MeshStandardMaterial())
scene.add(mesh)
let sound = new THREE.PositionalAudio(listener)
mesh.add(sound)

// get the AudioContext
const audioContext = listener.context;
// WebAudio requires a click to start audio:
document.body.onclick = () => {
  audioContext.resume();
};

// const navcontrols = new FlyControls(camera, renderer.domElement);
// navcontrols.movementSpeed = 1;
// navcontrols.rollSpeed = Math.PI / 3;
const controls = new OrbitControls(camera, renderer.domElement);

function animate() {
  // monitor our FPS:
  stats.begin();

  // get current timing:
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  renderer.render(scene, camera);

  // monitor our FPS:
  stats.end();
}

renderer.setAnimationLoop(animate);

async function audiosetup() {
  

  // score
  let lead = [
    "C4  q",
    "E4  q",
    "G4  q",
    "C5  qd",
    "A3  q",
    "C4  q",
    "E4  q",
    "A4  q",
    "F3  q",
    "A3  q",
    "C4  q",
    "F4  q",
    "G3  q",
    "B3  q",
    "D4  q",
    "G4  qd",
    
    

];

  let tempo = 132;
  let sequence1 = new Sequence(audioContext, tempo, lead);
  
  // Add envelope control
  let envelope = audioContext.createGain();
  envelope.gain.setValueAtTime(0, audioContext.currentTime);
  envelope.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01); // attack
  envelope.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.01 + 1.4); // decay
  envelope.connect(audioContext.destination);
  
  sequence1.staccato = 0.55;

  sequence1.gain.gain.value = 1.0;

  sequence1.mid.frequency.value = 800;
  sequence1.mid.gain.value = 3;

  sequence1.play(audioContext.currentTime);
  sound.setNodeSource(sequence1.osc)
}

audiosetup();

