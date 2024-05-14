// import the Three.js module:
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// create a renderer with better than default quality:
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
// make it fill the page
renderer.setSize(window.innerWidth, window.innerHeight);
// create and add the <canvas>
document.body.appendChild(renderer.domElement);

// create a perspective camera
const camera = new THREE.PerspectiveCamera(
  75, // this camera has a 75 degree field of view in the vertical axis
  window.innerWidth / window.innerHeight, // the aspect ratio matches the size of the window
  0.05, // anything less than 5cm from the eye will not be drawn
  100 // anything more than 100m from the eye will not be drawn
);
// position the camera
// the X axis points to the right
// the Y axis points up from the ground
// the Z axis point out of the screen toward you
camera.position.y = 1.5; // average human eye height is about 1.5m above ground
camera.position.z = 4; // let's stand 2 meters back

//const orbitControls = new OrbitControls(camera, renderer.domElement);

// update camera & renderer when page resizes:
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  // bugfix: don't resize renderer if in VR
  if (!renderer.xr.isPresenting)
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const scene = new THREE.Scene();

const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);

const MAX_NUM_SPHERES = 100
const geometry = new THREE.SphereGeometry( 0.1, 32, 16 ); 
const material = new THREE.MeshStandardMaterial( { color: 0xffffff } ); 
const sphere = new THREE.InstancedMesh( geometry, material, MAX_NUM_SPHERES ); 
scene.add( sphere );

function updateSceneFromServer(shared) {
	let count = Math.min(shared.clients.length, MAX_NUM_SPHERES)

	let mat = new THREE.Matrix4()
	let color = new THREE.Color()
	for (let i=0; i < count; i++) {
		let client = shared.clients[i]

		mat.setPosition((client.x-0.5)*2, (1.5-client.y)*2, 0)
		color.setHSL(client.hue*2, 1, 0.5)

		sphere.setMatrixAt(i, mat)
		sphere.setColorAt(i, color)
	}
	sphere.count = count
	sphere.instanceMatrix.needsUpdate = true;
}

function animate() {
	//orbitControls.update();
  
	// now draw the scene:
	renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
  


// connect to websocket at same location as the web-page host:
const addr = location.origin.replace(/^http/, 'ws')
console.log("connecting to", addr)

// this is how to create a client socket in the browser:
let socket = new WebSocket(addr);

// let's know when it works:
socket.onopen = function() { 
	// or document.write("websocket connected to "+addr); 
	console.log("websocket connected to "+addr); 
}
socket.onerror = function(err) { 
	console.error(err); 
}
socket.onclose = function(e) { 
	console.log("websocket disconnected from "+addr); 

	// a useful trick:
	// if the server disconnects (happens a lot during development!)
	// after 2 seconds, reload the page to try to reconnect:
	setTimeout(() => location.reload(), 2000)
}

document.addEventListener("pointermove", e => {
    // is the socket available?
    if (socket.readyState !== WebSocket.OPEN) return;

	// we can send any old string:
    //socket.send("boo!")
	// or send an object:
	socket.send(JSON.stringify({
		what: "pointermove",
		x: e.clientX / window.innerWidth,
		y: e.clientY / window.innerHeight,
	}))
});

socket.onmessage = function(msg) {
	
	if (msg.data.toString().substring(0,1) == "{") {
    	updateSceneFromServer(JSON.parse(msg.data))
	} else {
		console.log("received", msg.data);
	}
}