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
    
    //Twinkle Star
    //CCGGAAGFFEEDDC  
    /**/
    "C  q",
    "C  q",
    "G  q",
    "G  q",
    "A  q",
    "A  q",
    "G  h",
    
    "F  q",
    "F  q",
    "E  q",
    "E  q",
    "D  q",
    "D  q",
    "C  w",
    
    
    //theme of star war
    //C – G – F – E – D – C – G – F – E – D – C – G – F – E – F – D – C – G – F – E – D – C – G – F – E – F – E – D – C – D – E – D – F – E – D – C – G – D – F – E – D – C – C – C – D – E – D D – E – D – C – A# – G# – G – F – D# – C – G – F – E – D – C – G – F – E – D – C – G – F – E – D – C – G – F – E – D – C – G – F – E – D – C – G – F – E – F – D – C – C – C.
    /*
    "C  q","G  q", "F  q","E  q","D  q","C  q","G  q","F  q","E  q","D  q","C  q","G  q","F  q","E  q","F  q",
    "D  q","C  q","G  q","F  q","E  q","D  q","C  q","G  q", "F  q","E  q","F  q","E  q","D  q","C  q","D  q","E  q",
     "D  q","F  q","E  q","D  q","C  q","G  q","D  q","F  q", "E  q","D  q","C  q","C  q","C  q","D  q","E  q","D  q",
    "D  q","E  q","D  q","C  q","A#  q","G#  q","G  q", "F  q","D#  q","C  q","G  q","F  q","E  q","D  q","C  q","G  q",
    "F  q","E  q","D  q","C  q","G  q","F  q","E  q", "D  q","C  q","G  q","F  q","E  q","D  q","C  q","G  q","F  q",
    "E  q","D  q","C  q","G  q","F  q","E  q","F  q", "D  q","C  q","C  q","C  q",
    */
    
    //E – E – F – G – G – F – E – D – C – C – D – E – E – D – E – F – G – G – F – E – D – C – C – D – E – D – E – C – D – E – F – E – C – D – E – F – E – D – C – D – G – G – E – E – F – G – G – F – E – D – C – D – E – D – C.
    
    //Ode to Joy
    "E  q","E  q", "F  q","G  q",
    "G  q","F  q","E  q","D  q",
    "C  q","C  q","D  q","E  q","E  qq","D  e","D  q","-  q",
    
    "E  q","E  q","F  q","G  q",
    "G  q","F  q","E  q","D  q",
    "C  q","C  q","D  q","E  q","D  dq","C  ee","C  q","-  q",
    
    "D  q","D  q","E  q","C  q",
    "D  q","E  e", "F  e","E  q","C  q",
    "D  q","E  e","F  e","E  q","D  q","C  q","D  q","G  q","G  q","-  q", 
    "E  q","E  q","F  q","G  q","G  q","F  q","E  q","D  q","C  ee","C  q","D  q","E  q", "D  q","C  ee","C  q",/**/
   
    /**/
    
    
    
    //--f-D---d--d--D-----D---d-
     //"f  q","D  q", "d  q","d  q","D  q","D  q","d  q",
    
    
    
    
    
  ];

  let tempo = 132;
  let sequence1 = new Sequence(audioContext, tempo, lead);

  sequence1.staccato = 0.55;

  sequence1.gain.gain.value = 1.0;

  sequence1.mid.frequency.value = 800;
  sequence1.mid.gain.value = 3;

  sequence1.play(audioContext.currentTime);
  sound.setNodeSource(sequence1.osc)
}

audiosetup();
