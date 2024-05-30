import * as THREE from 'three';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;


const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const bubbleGeometry = new THREE.SphereGeometry(1, 32, 32);
const bubbleMaterial = new THREE.MeshPhongMaterial({
  color: 0x9db4ff,
  transparent: true,
  opacity: 0.8,
  shininess: 100,
  specular: 0xffffff
});
const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
const bubble2 = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
scene.add(bubble);
scene.add(bubble);


const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);


const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);


let bubbleY = 0;
const animate = function () {
  requestAnimationFrame(animate);


  bubble.position.y += 0.1;
  bubbleY += 0.1;


  bubble.rotation.x += 0.01;
  bubble.rotation.y += 0.01;


  if (bubbleY > 10) {
    bubble.scale.x *= 0.95;
    bubble.scale.y *= 0.95;
    bubble.scale.z *= 0.95;

 
    if (bubble.scale.x < 0.1) {
      bubbleY = 0;
      bubble.position.y = 0;
      bubble.scale.x = 1;
      bubble.scale.y = 1;
      bubble.scale.z = 1;
    }
  }

  renderer.render(scene, camera);
};

animate();
