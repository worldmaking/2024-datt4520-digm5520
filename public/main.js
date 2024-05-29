// import the Three.js module:
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module";
import { XRButton } from "three/addons/webxr/XRButton.js";


const overlay = document.getElementById("overlay")

let uuid = ""

// add a stats view to the page to monitor performance:
const stats = new Stats();
document.body.appendChild(stats.dom);

// create a renderer with better than default quality:
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
// make it fill the page
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
//renderer.shadowMap.enabled = true;
// create and add the <canvas>
document.body.appendChild(renderer.domElement);
document.body.appendChild(XRButton.createButton(renderer));

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

const orbitControls = new OrbitControls(camera, renderer.domElement);

// update camera & renderer when page resizes:
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  // bugfix: don't resize renderer if in VR
  if (!renderer.xr.isPresenting)
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

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

  
/////////////////////////////////////////

// connect to websocket at same location as the web-page host:
const addr = location.origin.replace(/^http/, 'ws')
console.log("connecting to", addr)

// this is how to create a client socket in the browser:
let socket = new WebSocket(addr);
socket.binaryType = 'arraybuffer';

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

let last_msg_t = clock.getElapsedTime();

socket.onmessage = function(msg) {
	if (msg.data.toString().substring(0,1) == "{") {
		// we received a JSON message; parse it:
		let json = JSON.parse(msg.data)
		// handle different message types:
		switch (json.type) {
			case "uuid": {
				// set our local ID:
				uuid = json.uuid
			} break;
			case "avatars": {
				// iterate over json.avatars to update all our avatars
			} break;
			case "creatures": {
				// iterate over json.creatures to update all our creatures
			} break;
			default: {
				console.log("received json", json)
			}
		}

	} else {
		console.log("received", msg.data);
	}
}

function socket_send_message(msg) {
	// abort if socket is not available:
	if (socket.readyState !== WebSocket.OPEN) return;
	// convert JSON to string:
	if (typeof msg != "string") msg = JSON.stringify(msg);

	//console.log(msg);
	socket.send(msg)
}

////////////////////////////////


function animate() {
	// monitor our FPS:
	stats.begin();
	
	// get current timing:
	const dt = clock.getDelta();
	const t = clock.getElapsedTime();
  
	// now draw the scene:
	renderer.render(scene, camera);

	if (uuid) {
		socket_send_message({
			type: "avatar",
			uuid,
			head: {
				position: {x: 0, y: 0, z: 0},
				direction: {x: 0, y: 0, z: 0, w: 0}
			},
			hand1: {x: 0, y: 0, z: 0},
			hand2: {x: 0, y: 0, z: 0},
			lightball: {x: 0, y: 0, z: 0},
			color: {r: 0, g: 0, b: 0},
			shape: "sphere"
		})
	}

	// monitor our FPS:
	stats.end();
}
renderer.setAnimationLoop(animate);