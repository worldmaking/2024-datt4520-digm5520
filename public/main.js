// import the Three.js module:
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import Stats from "three/addons/libs/stats.module";
import { XRButton } from "three/addons/webxr/XRButton.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { Timer } from "three/addons/misc/Timer.js";

const onMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
	navigator.userAgent
);
let nav = {
	lookx: 0,
	looky: 0
};

const raycastingObjects = [];

const scene = new THREE.Scene();

//----------------
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);
//---------------

const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x004d00 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

//---------------
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
document.body.appendChild(VRButton.createButton(renderer));

// Add the red circle element HAOQIAN GU PART
const redCircle = document.createElement('div');
redCircle.id = 'redCircle';
redCircle.style.position = 'absolute';
redCircle.style.top = '50%';
redCircle.style.left = '50%';
redCircle.style.width = '50px';
redCircle.style.height = '50px';
redCircle.style.border = '3px solid red';
redCircle.style.borderRadius = '50%';
redCircle.style.transform = 'translate(-50%, -50%)';
redCircle.style.pointerEvents = 'none';
redCircle.style.display = 'none';
document.body.appendChild(redCircle);

// Add event listeners for the mouse down and mouse up events
window.addEventListener('mousedown', function (event) {
    if (event.button === 1) { // Middle mouse button
        redCircle.style.display = 'block';
    }
});

window.addEventListener('mouseup', function (event) {
    if (event.button === 1) { // Middle mouse button
        redCircle.style.display = 'none';
    }
});

// make an indepenent camera for VR:
let camera_vr = new THREE.PerspectiveCamera();

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
camera.position.x = Math.random()*8 - 4
camera.position.y = 0.8; // average human eye height is about 1.5m above ground
camera.position.z = Math.random()*8; // let's stand 2 meters back

//const orbitControls = new OrbitControls(camera, renderer.domElement);
const controls = new PointerLockControls(camera, renderer.domElement);

// update camera & renderer when page resizes:
window.addEventListener("resize", function () {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	// bugfix: don't resize renderer if in VR
	if (!renderer.xr.isPresenting)
		renderer.setSize(window.innerWidth, window.innerHeight);

	
});

//To add camera zoom in and out fun_  HAOQIAN GU Part
window.addEventListener("wheel", function (event) {
    // Adjust the field of view based on the wheel delta
    camera.fov += event.deltaY * 0.05;

    // Clamp the FOV to a range (e.g., between 20 and 100)
    camera.fov = THREE.MathUtils.clamp(camera.fov, 20, 100);

    // Update the camera projection matrix to apply the changes
    camera.updateProjectionMatrix();
});

//added/////////////////////////////////////////////////////////////////////////////////////////////
//Pointer lock requires a user action to start, e.g. click on canvas to start pointerlock:
renderer.domElement.addEventListener("click", function () {
	controls.lock();
});
let Forward = false;
let Backward = false;
let Right = false;
let Left = false;
let Ctrl = false;
let Shift = false;
let Alt = false;
const dir = new THREE.Vector3();
const vel = new THREE.Vector3();

//if key is pressed
const onKeyDown = (e) => {
	switch (e.code) {
		case "KeyW":
			Forward = true;
			break;
		case "KeyA":
			Left = true;
			break;
		case "KeyS":
			Backward = true;
			break;
		case "KeyD":
			Right = true;
			break;
		case "ControlLeft":
			Ctrl = true;
			break;
		case "ShiftLeft":
			Shift = true;
			break;

		//temp for codepen
		case "AltLeft":
			Alt = true;
			break;
	}
};

//If key is not pressed
const onKeyUp = (e) => {
	switch (e.code) {
		case "KeyW":
			Forward = false;
			break;
		case "KeyA":
			Left = false;
			break;
		case "KeyS":
			Backward = false;
			break;
		case "KeyD":
			Right = false;
			break;
		case "ControlLeft":
			Ctrl = false;
			break;
		case "ShiftLeft":
			Shift = false;
			break;

		//temp for code pen
		case "AltLeft":
			Alt = false;
			break;
	}
};

let touchstartY = 0;
let touchendY = 0;
let flickJoystickInterval = 100;
let prevJoystickTime = 0;
function checkDirection() {
	//if swiped up. launch ball
	if (
		touchendY + 100 < touchstartY &&
		performance.now() - prevJoystickTime > flickJoystickInterval
	) {
		// Temporary!
		let newTargetPosition = target.position.clone();
		newTargetPosition.y += 0.1;
		moveSphere(newTargetPosition);
		sphereOnHand = false;
		//sphere on ground
		let diff = newTargetPosition.clone().sub(camera.position);
		sphereDist = diff.length();
		console.log("Up");
	}
}

//if on mobile, displays joysticks
if (onMobile == true) {
	//Right joystick to move around
	let joystickR = nipplejs.create({
		zone: document.getElementById("jRight"),
		mode: "static",
		position: { left: "90%", top: "90%" },
		color: "blue"
	});

	//Right joystick to look around
	joystickR.on("move", function (evt, data) {
		// DO EVERYTHING
		//console.log(evt, data);
		nav.lookx = data.vector.y;
		nav.looky = -data.vector.x;
	});

	//Left joystick to walk around
	let joystickL = nipplejs.create({
		zone: document.getElementById("jLeft"),
		mode: "static",
		position: { left: "10%", top: "90%" },
		color: "red"
	});

	joystickL.on("end", function (evt, data) {
		dir.z = 0;
		dir.x = 0;
	});

	joystickL.on("move", function (evt, data) {
		dir.z = data.vector.y;
		dir.x = data.vector.x;
	});
}
//////////////////////////////////////////////////////////////////////////////////////////////
//Create ghost head with reflective material
//const avatarGroupe;
function makeAvatarGroup() {
	const ghostGeometry = new THREE.SphereGeometry(2, 16, 16);
	const ghostMaterial = new THREE.MeshStandardMaterial({
		color: "#99ccff",
		roughness: 0.2,
		metalness: 0.5
	});
	const ghostHead = new THREE.Mesh(ghostGeometry, ghostMaterial);
	ghostHead.position.set(0, 0, 0); // Set the initial height of the ghost
	ghostHead.name = "avatarHead";

	// // Create eyes
	const eyeGeometry = new THREE.SphereGeometry(0.2, 16, 16);
	const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

	const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
	leftEye.position.set(-0.5, 0, -1.8);

	const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
	rightEye.position.set(0.5, 0, -1.8);

	// Create hands with reflective material
	const handGeometry = new THREE.SphereGeometry(0.5, 16, 16);
	const handMaterial = new THREE.MeshStandardMaterial({
		color: "#99ccff",
		roughness: 0.2,
		metalness: 0.5
	});

	const leftHand = new THREE.Mesh(handGeometry, handMaterial);
	leftHand.position.set(-1, -1, -3.5);
	leftHand.name = "leftHand";

	const rightHand = new THREE.Mesh(handGeometry, handMaterial);
	rightHand.position.set(1, -1, -3.5);
	rightHand.name = "rightHand";

	const tempAvatar = new THREE.Group();
	tempAvatar.add(ghostHead);
	tempAvatar.add(leftEye);
	tempAvatar.add(rightEye);
	tempAvatar.add(leftHand);
	tempAvatar.add(rightHand);
	tempAvatar.scale.set(0.3, 0.3, 0.3);
	tempAvatar.position.set(
		Math.random()*8 - 4,
		0.8,
		Math.random()*8
	);

	return tempAvatar;
}

const avatarGroup = makeAvatarGroup();

scene.add(avatarGroup);


/////////////////////////////////////////////////////////////////////////////////////////////////
const sphereColor = 0xf7e09a;
//const planeColor = 0x4d4f4f;

//const plane_geo = new THREE.PlaneGeometry(10, 10);
//const plane_mat = new THREE.MeshStandardMaterial({
	//color: planeColor,
	//side: THREE.DoubleSide
//});
//const plane = new THREE.Mesh(plane_geo, plane_mat);
//plane.rotateX(Math.PI / 2);
//scene.add(plane);


raycastingObjects.push(ground);
let grid = new THREE.GridHelper(10, 10);
// scene.add(grid);



const sphere1_geo = new THREE.SphereGeometry(0.1, 32, 16);
const sphere1_mat = new THREE.MeshStandardMaterial({
	color: sphereColor,
	emissive: sphereColor,
	emissiveIntensity: 0.5
});
const sphere1 = new THREE.Mesh(sphere1_geo, sphere1_mat);

let sphere1Pos = new THREE.Vector3(-1, 0.1, -0.5);
const pointLight1 = new THREE.PointLight(sphereColor, 1);
pointLight1.position.copy(avatarGroup.getObjectByName("rightHand").localToWorld(sphere1Pos.clone()));
pointLight1.add(sphere1);
scene.add(pointLight1);
console.log(avatarGroup.getObjectByName("rightHand").worldToLocal(new THREE.Vector3(0, 0, 0)));


// Seagrass setup:
const seagrassGeometry = new THREE.CylinderGeometry(0.01, 0.02, 1.5, 3);
const seagrassMaterial = new THREE.MeshStandardMaterial({ color: 'green',   emissive:0x00FF00,  emissiveIntensity: 0.5});

// setting seagrass-----------------------------
const numSeagrass = 200;
const seagrassInstances = new THREE.InstancedMesh(seagrassGeometry, seagrassMaterial, numSeagrass);
for (let i = 0; i < numSeagrass; i++) {
  const position = new THREE.Vector3(
    (Math.random() - 0.5) * 10, 0.75,(Math.random() - 0.5) * 10 );

  const quaternion = new THREE.Quaternion();
  quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);

  const scale = new THREE.Vector3(1, 1, 1);

  const matrix = new THREE.Matrix4().compose(position, quaternion, scale);
  seagrassInstances.setMatrixAt(i, matrix);
}
scene.add(seagrassInstances);

//---------------------------------
// bubble
const bubbleGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const bubbleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7 });

const bubbles = [];
function createBubble() {
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
    bubble.position.set(
        (Math.random() - 0.5) * 10,
        0,
        (Math.random() - 0.5) * 10
    );
    bubble.scale.setScalar(Math.random() * 0.5 + 0.1);
    bubble.speed = Math.random() * 0.02 + 0.01;
    bubbles.push(bubble);
    scene.add(bubble);
}
//---------------------------

const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

const pointer = new THREE.Vector2();

function onPointerMove(event) {
	pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
	pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// point light animation
let targetPosition = new THREE.Vector3(0, 0, 0);
let startPosition;
let animationTime = 0;
let sphereDist;
let comeback = false;
let sphereOnHand = true;

function moveSphere(newTargetPosition) {
	targetPosition = newTargetPosition;
	startPosition = pointLight1.position.clone();
	animationTime = 0;
}
function onPointerClick(event) {
	const intersects = raycaster.intersectObjects(raycastingObjects);

	if (intersects.length > 0) {
		let newTargetPosition = intersects[0].point;
		newTargetPosition.y += 0.1;
		moveSphere(newTargetPosition);
		sphereOnHand = false;
		//sphere on ground
		let diff = newTargetPosition.clone().sub(camera.position);
		sphereDist = diff.length();
	}
}
const circleRadius = 0.05;
const circleSegments = 32;
const circleGeometry = new THREE.SphereGeometry(circleRadius, circleSegments);
const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const target = new THREE.Mesh(circleGeometry, circleMaterial);
target.rotateX(Math.PI / 2);
scene.add(target);

function easeOutCubic(x) {
	return 1 - Math.pow(1 - x, 3);
}

// // Helper functions

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandom(min, max) {
	return Math.random() * (max - min) + min;
}

function rgbToHex(r, g, b) {
	return (r << 16) | (g << 8) | b;
}

function hexToRgb(hex) {
	let r = (hex >> 16) & 0xff;
	let g = (hex >> 8) & 0xff;
	let b = hex & 0xff;
	return [r, g, b];
}

// Tree

const radiusDecay = 2 / 3;
const heightDecayMin = 0.1;
const heightDecayMax = 1.2;
const maxBranches = 5;
const maxSpreadness = Math.PI / 4;
const minSpreadness = Math.PI / 8;
const colorFactor = 1.2;
let trees = [];
let firstTree = true;

class Tree extends THREE.Group {
	constructor(
		radius,
		height,
		depth,
		growSpeed = 0.1,
		minBranches = 5,
		minBranchHeight = -1,
		maxBranchHeight = 1,
		color = 0xffffff
	) {
		super();
		this.radius = radius;
		this.height = height;
		this.growSpeed = growSpeed;
		this.depth = depth;
		this.minBranches = minBranches;
		this.minBranchHeight = minBranchHeight;
		this.maxBranchHeight = maxBranchHeight;
		this.color = color;

		if (this.depth == 0) {
			const leaf_geo = new THREE.SphereGeometry(height, 32, 32);
			const leaf_mat = new THREE.MeshStandardMaterial({ color: this.color });
			this.trunk = new THREE.Mesh(leaf_geo, leaf_mat);
			this.trunk.scale.x = 0;
			this.trunk.scale.y = 0;
			this.trunk.scale.z = 0;
			this.add(this.trunk);
			this.branched = true;
		} else {
			const trunk_geo = new THREE.CylinderGeometry(
				radius * radiusDecay,
				radius,
				height,
				32
			);
			const trunk_mat = new THREE.MeshStandardMaterial({ color: this.color });
			this.trunk = new THREE.Mesh(trunk_geo, trunk_mat);
			this.trunk.scale.y = 0;
			this.add(this.trunk);
			this.branched = false;
		}
	}

	grow() {
		this.children.forEach((branch) => {
			if (branch instanceof Tree) {
				branch.grow();
			}
		});
		if (this.trunk.scale.y >= 1) {
			if (!this.branched && this.depth > 0) {
				let n = getRandomInt(this.minBranches, maxBranches);
				let spreadness = getRandom(minSpreadness, maxSpreadness);
				this.addBranches(n, spreadness);
			}
		} else {
			this.trunk.scale.y = Math.min(this.trunk.scale.y + this.growSpeed, 1);
			if (this.depth == 0) {
				this.trunk.scale.x = Math.min(this.trunk.scale.x + this.growSpeed, 1);
				this.trunk.scale.z = Math.min(this.trunk.scale.x + this.growSpeed, 1);
			} else {
				this.trunk.position.y = Math.min(
					this.trunk.position.y + (this.height * this.growSpeed) / 2,
					this.height / 2
				);
			}
		}
	}

	addBranches(n, spreadness) {
		let theta = -Math.PI / 2;
		for (let i = 0; i < n; i++) {
			let heightDecay = getRandom(heightDecayMin, heightDecayMax);
			let branchHeight = Math.max(
				Math.min(this.height * heightDecay, this.maxBranchHeight),
				this.minBranchHeight
			);

			let [r, g, b] = hexToRgb(this.color);
			r = Math.min(255, r * colorFactor);
			g = Math.min(255, g * colorFactor);
			b = Math.min(255, b * colorFactor);
			let branchColor = rgbToHex(r, g, b);

			let branch = new Tree(
				this.radius * radiusDecay,
				branchHeight,
				this.depth - 1,
				this.growSpeed,
				1,
				this.minBranchHeight,
				this.maxBranchHeight,
				branchColor
			);
			branch.rotateOnAxis(new THREE.Vector3(0, 1, 0), theta);

			branch.rotateOnAxis(new THREE.Vector3(1, 0, 0), -spreadness);
			branch.rotateOnAxis(new THREE.Vector3(0, 0, 1), spreadness);

			branch.position.y += this.height;
			theta += (2 * Math.PI) / n;
			this.add(branch);
		}
		this.branched = true;
	}
}

const controllerModelFactory = new XRControllerModelFactory();

// getting 2 controllers:
let controller = renderer.xr.getController(0);
scene.add(controller);

let controller2 = renderer.xr.getController(1);
scene.add(controller2);

// for each controller:
const controllerGrip = renderer.xr.getControllerGrip(0);
controllerGrip.add(
	controllerModelFactory.createControllerModel(controllerGrip)
);
scene.add(controllerGrip);
const controllerGrip2 = renderer.xr.getControllerGrip(1);
controllerGrip2.add(
	controllerModelFactory.createControllerModel(controllerGrip2)
);
scene.add(controllerGrip);
scene.add(controllerGrip2);

raycaster.setFromXRController(controller2);

// adding event handlers for the controllers:
controller.addEventListener("selectstart", function (event) {
	const controller = event.target;
	// do a ray intersection:
	getIntersections(controller);
});
controller.addEventListener("selectend", function (event) {
	const controller = event.target;
	// etc.
});
controller2.addEventListener("selectstart", function (event) {
	const controller2 = event.target;
	// do a ray intersection:
	getIntersections(controller);
});
controller2.addEventListener("selectend", function (event) {
	const controller2 = event.target;
	// etc.
});

// call this in the 'selectstart' event, but also call it in animate()
// so that it continuously updates while moving the controller around
function getIntersections(controller) {
	controller.updateMatrixWorld();
	raycaster.setFromXRController(controller);
	let intersections = raycaster.intersectObjects(scene.children);
	// etc.
}

// events for getting/losing controllers:
// adding controller models:
controller.addEventListener("connected", function (event) { });
controller.addEventListener("disconnected", function () { });
// ////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////

const clock = new THREE.Clock();

// const gridHelper = new THREE.GridHelper(10, 10);
// scene.add(gridHelper);

// const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
// scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);

const MAX_NUM_AVATARS = 100
let avatar_meshes = []
//const avatar_geometry = new THREE.BoxGeometry(0.4, 0.4, 0.1);
for (let i = 0; i < MAX_NUM_AVATARS; i++) {
	//let avatar_material = new THREE.MeshStandardMaterial({ color: 0xffffff });
	//let avatar_mesh = new THREE.Mesh(avatar_geometry, avatar_material);
	let userAvatar = makeAvatarGroup();
	scene.add(userAvatar);

	avatar_meshes[i] = userAvatar
}

// this is the shared state sent to all clients:
let shared = {
	avatars: [],
	creatures: []
}

//Jacob Start
// let material2 = new THREE.MeshBasicMaterial({
//   vertexColors: true,
//   side: THREE.DoubleSide
// });

const MAX_NUM_CREATURES = 99
const creature_mesh = new THREE.BoxGeometry(0.1, 0.2, 0.6);
const creature_material = new THREE.MeshStandardMaterial()
const creatures = new THREE.InstancedMesh(creature_mesh, creature_material, MAX_NUM_CREATURES)
for (let i=0; i<MAX_NUM_CREATURES; i++) {
	creatures.setColorAt(i, new THREE.Color().setHSL(Math.random(), 0.7, 0.7))
}
scene.add(creatures)

const boundaryX = Math.floor(Math.random() * 4);
const boundaryY = Math.floor(Math.random() * 4);
const boundaryZ = Math.floor(Math.random() * 4);

const agentPositions = new Float32Array(99);
const agentColors = new Float32Array(99);
for (let i = 0; i < agentPositions.length; i += 3) {
	agentPositions[i] = Math.random() - 0.5 + boundaryX;
	agentPositions[i + 1] = Math.random() - 0.5 + boundaryY;
	agentPositions[i + 2] = Math.random() - 0.5 + boundaryZ;

	agentColors[i] = Math.random();
	agentColors[i + 1] = Math.random();
	agentColors[i + 2] = Math.random();
	//}
}

const agentGeometry = new THREE.BufferGeometry();
agentGeometry.setAttribute(
	"position",
	new THREE.BufferAttribute(agentPositions, 3)
);
agentGeometry.setAttribute(
	"color",
	new THREE.Float32BufferAttribute(agentColors),
	3
);
const agentMaterial = new THREE.MeshBasicMaterial({
	vertexColors: true,
	side: THREE.DoubleSide
});

//Code Start

//Arrays of shapes
const vertices2 = [
	new Float32Array([
		-0.3,
		-0.3,
		0.3, // v0
		0.3,
		-0.3,
		0.3, // v1
		0.3,
		0.3,
		0.3 // v2
	]),
	new Float32Array([
		-0.3,
		-0.3,
		0.3,
		0.3,
		-0.3,
		0.3,
		0.3,
		0,
		0.3,
		0,
		3.0,
		0.3,
		-0.3,
		0,
		0.3 // v3
	])
];

let lightPoints = [];
let borderSize = 20;
let MaxNumOfAgents = 100;
let minSpeed = 0.002;
let maxSpeed = 0.02;
let agents = [];

function pick(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomAgent(self) {
	let a;
	{
		a = pick(agents);
	}
	return a;
}

//Call this to add 1 random new agent
function newAgent() {
	let points = getRandomInt(0, getRandomInt(0, vertices2.length - 1));
	//console.log(points, vertices2.length);
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute(
		"position",
		new THREE.BufferAttribute(vertices2[points], 3)
	);
	const color = new THREE.Color(Math.random(), Math.random(), Math.random());
	const colors = [];
	for (let i = 0; i < vertices2[points].length / 3; i++) {
		colors.push(color.r, color.g, color.b);
	}
	geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
	let mesh = new THREE.Mesh(geometry, agentMaterial);
	mesh.visible = false
	mesh.userData.color = color

	function dispose(a) {
		// geometry.getAttribute("position").remove()
		// geometry.getAttribute("color").dispose()
		scene.remove(a);
		//mesh.dispose()
	}

	agents.push({
		pos: randomVec(),
		mesh: mesh,
		speed: Math.random() * maxSpeed - minSpeed,
		goal: randomVec(),
		hunting: false,
		target: getRandomAgent(), //getRandomInt(agents.length)
		dead: false,

		dispose
	});

	agents[agents.length - 1].mesh.position.x = agents[agents.length - 1].pos.x;
	agents[agents.length - 1].mesh.position.y = agents[agents.length - 1].pos.y;
	agents[agents.length - 1].mesh.position.z = agents[agents.length - 1].pos.z;
	scene.add(agents[agents.length - 1].mesh);
}

//Draws Initial Agents
for (let i = 0; i < MaxNumOfAgents; i++) {
	newAgent();
}

//Updates Agent positions and Behvaiours. Needs to be animated.
function moveAgents() {
	//Splicer Array
	// let splicer = [];

	//Limit to borders
	//for (let i = 0; i < agents.length; i++) {
	for (let a of agents) {
		if (
			a.pos.distanceTo(new THREE.Vector3(0, borderSize / 3, 0)) > borderSize ||
			a.pos.y < 0
		) {
			a.pos = randomVec();
			a.goal = randomVec();
		}

		//If agent is not hunting or looking at lights
		if (a.hunting === false) {
			if (a.goal.distanceTo(a.pos) > 0.5) {
				a.pos.lerp(a.goal, a.speed);
				a.mesh.position.x = a.pos.x;
				a.mesh.position.y = a.pos.y;
				a.mesh.position.z = a.pos.z;
			} else {
				a.goal = randomVec();
				a.speed = Math.random() * maxSpeed - minSpeed;
				if (getRandomInt(0, 10) < 3) {
					a.hunting = true;
					a.target = getRandomAgent(a);
				} else if (a.pos.distanceTo(pointLight1.position) < 10 && getRandomInt(0, 10) < 10) {
					while (a.goal.distanceTo(pointLight1.position) > 1) {
						a.goal = randomVec();
					}
				}

				/*else if (lightPoint1.length > 0 && getRandomInt(0, 10) > 5) {
				  for (let b of lightPoints) {
					if (a.pos.distanceTo(b.pos) < 5 && getRandomInt(0, 10) < 5) {
					  while (a.goal.distanceTo(b.pos) > 1) {
						a.goal = randomVec();
					  }
					}
				  }
				}*/
			}
		} else if (a.hunting === true) {
			if (a.target.pos.distanceTo(a.pos) < a.speed + 0.05) {
				console.log("caught!");
				//What happens when the agent catches its prey
				a.target.dead = true;
				a.target = getRandomAgent(a);
				a.hunting = false;
				a.goal = randomVec();
				a.speed = Math.random() * maxSpeed - minSpeed;
			} else {
				a.goal = a.target.pos;
				a.pos.lerp(a.goal, a.speed);
				a.mesh.position.x = a.pos.x;
				a.mesh.position.y = a.pos.y;
				a.mesh.position.z = a.pos.z;
				a.speed += 0.001;
			}
		}

		//Rotates Agents;
		a.mesh.rotation.x += Math.random() * 0.01 - 0.01;
		a.mesh.rotation.y += Math.random() * 0.01 - 0.01;
		a.mesh.rotation.z += Math.random() * 0.01 - 0.01;
	}

	// filter out dead agent:
	agents.forEach((a) => {
		if (a.dead) a.dispose(a.mesh);
	});
	agents = agents.filter((a) => !a.dead);
	if (agents.length < 3) {
		newAgent();
	}
}

function updateCreatures() {
	creatures.count = Math.min(MAX_NUM_CREATURES, agents.length)
	let mat = new THREE.Matrix4()
	let position = new THREE.Vector3()
	let quaternion = new THREE.Quaternion()
	let scale = new THREE.Vector3(1, 1, 1)
	let color = new THREE.Color()
	for (let i=0; i<creatures.count; i++) {
		let agent = agents[i]

		position.copy(agent.mesh.position)
		quaternion.copy(agent.mesh.quaternion)
		mat.compose(position, quaternion, scale)
		creatures.setMatrixAt(i, mat)
		creatures.setColorAt(i, agent.mesh.userData.color)
	}
	creatures.instanceMatrix.needsUpdate = true;
	//creatures.instanceColor.needsUpdate = true;
}

//Returns random Vector pos
function randomVec() {
	return new THREE.Vector3(
		getRandomInt(0, borderSize) - borderSize / 2,
		getRandomInt(0, borderSize),
		getRandomInt(0, borderSize) - borderSize / 2
	);
}

//Jacob End

function animate() {


	// monitor our FPS:
	stats.begin();

	// get current timing:
	const dt = clock.getDelta();
	const t = clock.getElapsedTime();


	moveAgents();

	updateCreatures()

	//////////////////////////////////////////////////////////////////////////////////////////////
	const timestamp = t
	const delta = dt

	if (!onMobile) {
		dir.z = Number(Forward) - Number(Backward);
		dir.x = Number(Right) - Number(Left);

		//when pointer is showing
		if (controls.isLocked) {
			vel.z -= vel.z * 80.0 * delta;
			vel.x -= vel.x * 80.0 * delta;
			//move WS
			if (Forward || Backward) {
				vel.z -= dir.z * 150 * delta;
			}
			//move AD
			if (Left || Right) {
				vel.x -= dir.x * 150 * delta;
			}
			//crouch
			//WARNING: bugs out if ctrl + wasd occurs because it is the same as many shortcuts for codepen so I added alt temporarily
			if (Ctrl == true && Alt == true) {
				camera.position.y = 0.5;
				vel.z -= dir.z * 20 * delta;
				vel.x -= dir.x * 20 * delta;
			} else {
				camera.position.y = 0.8;
				vel.z -= dir.z * 150 * delta;
				vel.x -= dir.x * 150 * delta;
			}
			//run
			if (Shift) {
				vel.z -= dir.z * 300 * delta;
				vel.x -= dir.x * 300 * delta;
			}

			controls.moveForward(-vel.z * delta);
			controls.moveRight(-vel.x * delta);
		}
	} else {
		//move Up & Down
		vel.z = -dir.z * 150 * delta;

		//move Left & Right
		vel.x = -dir.x * 100 * delta;

		if (dir.z == 0) {
			vel.z = 0;
		}
		if (dir.x == 0) {
			vel.x = 0;
		}

		if (nav.lookx) console.log(nav.lookx);

		camera.rotation.x = nav.lookx;
		camera.rotation.y = nav.looky;
		camera.updateMatrixWorld();

		controls.moveForward(-vel.z * delta);
		controls.moveRight(-vel.x * delta);
	}
//--------
   // bubble location
    bubbles.forEach(bubble => {
        bubble.position.y += bubble.speed;
        if (bubble.position.y > 5) {
            scene.remove(bubble);
            bubbles.splice(bubbles.indexOf(bubble), 1);
        }
    });

    // random bubble
    if (Math.random() < 0.05) {
        createBubble();
    }
  //---------
	//get sphere distance from camera
	let sphereDiff = pointLight1.position.clone().sub(camera.position);
	if (sphereDiff.length() - sphereDist > 2) {
		pointLight1.intensity = 1;
		let zAxis = new THREE.Vector3(0, 0, -1);
		let forward = new THREE.Vector3();
		controls.getDirection(forward);
		forward.normalize();
		let right = forward.clone().cross(camera.up).normalize();
		moveSphere(avatarGroup.getObjectByName("rightHand").localToWorld(sphere1Pos.clone()));
		comeback = true;
	}
	if (comeback) {
		let zAxis = new THREE.Vector3(0, 0, -1);
		let forward = new THREE.Vector3();
		controls.getDirection(forward);
		forward.normalize();
		let right = forward.clone().cross(camera.up).normalize();
		targetPosition = avatarGroup.getObjectByName("rightHand").localToWorld(sphere1Pos.clone());
	}

	// update the picking ray with the camera and eye position
	raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

	const intersects = raycaster.intersectObjects(raycastingObjects);

	for (let i = 0; i < intersects.length; i++) {
		target.position.copy(intersects[i].point);
		// intersects[ i ].object.material.color.set( 0xff0000 );
	}

	//animate pointlight
	animationTime += 0.02;
	if (animationTime >= 1) {
		animationTime = 1;
		if (comeback) {
			comeback = false;
			sphereOnHand = true;
		}
	}
	if (firstTree && !sphereOnHand && animationTime >= 1) {
		pointLight1.intensity = 10;
		const tree = new Tree(0.1, 0.5, 4, 0.05, 3, 0.1, 0.3, 0x755707); // gray = 0xB0B0B0
		tree.position.x = targetPosition.x;
		tree.position.z = targetPosition.z;
		trees.push(tree);
		scene.add(tree);
		firstTree = false;
	}
	if (startPosition) {
		let diff = targetPosition.clone().sub(startPosition);
		pointLight1.position.copy(
			diff.multiplyScalar(easeOutCubic(animationTime)).add(startPosition)
		);
	}

	let zAxis = new THREE.Vector3(0, 0, -1);
	let forward = new THREE.Vector3();
	controls.getDirection(forward);
	forward.normalize();
	let right = forward.clone().cross(camera.up).normalize();

	avatarGroup.position.copy(
		camera.position
			.clone()
			.add(forward.clone().multiplyScalar(-0.7))
	);
	avatarGroup.rotation.copy(camera.rotation);

	if (sphereOnHand) {
		pointLight1.position.copy(avatarGroup.getObjectByName("rightHand").localToWorld(sphere1Pos.clone()));
		firstTree = true;
	}

	for (let i = 0; i < trees.length; i++) {
		let diff = trees[i].position.clone().sub(pointLight1.position);
		if (diff.length() < 2 && !sphereOnHand) {
			trees[i].grow();
		}
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////


	// update appearance of avatars:
	{

		let count = Math.min(shared.avatars.length, MAX_NUM_AVATARS)
		for (let i = 0; i < MAX_NUM_AVATARS; i++) {
			let avatarGroup = avatar_meshes[i]
			let avatar = shared.avatars[i]

			// hide and skip any meshes that we don't need to render:
			if (!avatar) {
				avatarGroup.traverse(o => o.visible = false);
			 	continue;
			}

			// // don't render our own avatar
			if (avatar.uuid == uuid) {
				avatarGroup.traverse(o => o.visible = false);
				continue;
			}

			// show it:
			avatarGroup.traverse(o => o.visible = true);

			// udpate pose:
			if (avatar && avatar.head) {
				avatarGroup.position.fromArray(avatar.head.pos)
				avatarGroup.quaternion.fromArray(avatar.head.dir)
				avatarGroup.updateMatrix();
			}

			// update color:
			let head = avatarGroup.getObjectByName("avatarHead")
			if (head && avatar.color) {
				head.material.color.setHex(avatar.color)
				head.material.needsUpdate = true
			}
		}

		// let color = new THREE.Color()
		// for (let i=0; i < count; i++) {
		// 	// update the instanced Mesh from this avatar:
		// 	let avatar = shared.avatars[i]
		// 	//console.log(avatar)

		// 	position.fromArray(avatar.head.pos)
		// 	direction.fromArray(avatar.head.dir)
		// 	mat.compose(position, direction, scale)
		// 	avatar_mesh.setMatrixAt(i, mat)

		// 	color.setHex(avatar.color)
		// 	avatar_mesh.setColorAt(i, color)
		// }
		// avatar_mesh.count = count
		// avatar_mesh.instanceMatrix.needsUpdate = true;
		// avatar_mesh.instanceColor.needsUpdate = true;
	}

	//////////////////////

	// now draw the scene:
	renderer.render(scene, camera);

	// send our pose to the server
	if (uuid) {
		socket_send_message({
			type: "avatar",
			uuid,
			head: {
				// pos: avatarGroup.getObjectByName("avatarHead").position.toArray(),
				// dir: avatarGroup.getObjectByName("avatarHead").quaternion.toArray(),
				pos: avatarGroup.position.toArray(),
				dir: avatarGroup.quaternion.toArray(),
			},
			hand1: avatarGroup.getObjectByName("leftHand").position.toArray(),
			hand2: avatarGroup.getObjectByName("rightHand").position.toArray(),
			lightball:  pointLight1.position.toArray(),
			color: avatarNav.color.getHex(),
			//shape: "sphere"
		})
	}


	// monitor our FPS:
	stats.end();
}
renderer.setAnimationLoop(animate);

//////////////////////////////////////////////////////////////////////////////////////////////////
window.addEventListener("click", onPointerClick);
window.addEventListener("selectstart", onPointerClick);
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////

// connect to websocket at same location as the web-page host:
const addr = location.origin.replace(/^http/, 'ws')
console.log("connecting to", addr)

// this is how to create a client socket in the browser:
let socket = new WebSocket(addr);
socket.binaryType = 'arraybuffer';

// let's know when it works:
socket.onopen = function () {
	// or document.write("websocket connected to "+addr);
	console.log("websocket connected to " + addr);
}
socket.onerror = function (err) {
	console.error(err);
}
socket.onclose = function (e) {
	console.log("websocket disconnected from " + addr);
	// a useful trick:
	// if the server disconnects (happens a lot during development!)
	// after 2 seconds, reload the page to try to reconnect:
	setTimeout(() => location.reload(), 2000)
}

socket.onmessage = function (msg) {
  if (msg.data.toString().substring(0, 1) == "{") {
    // we received a JSON message; parse it:
    let json = JSON.parse(msg.data);
    // handle different message types:
    switch (json.type) {
      // case "uuid":
      //   {
      //     // set our local ID:
      //     uuid = json.uuid;
      //   }
      //   break;
      case "login-success":
        {
          uuid = json.uuid;
          // json.avatar is the avatar data of client
          const loginForm = document.getElementById("loginForm");
          if (loginForm) {
            loginForm.style.display = "none";
          }
          //console.log(json.avatar);
        }
        break;
      case "avatars":
        {
          // iterate over json.avatars to update all our avatars
          shared.avatars = json.avatars;
        }
        break;
      case "creatures":
        {
          // iterate over json.creatures to update all our creatures
          shared.creatures = json.creatures;
        }
        break;
      default: {
        console.log("received json", json);
      }
    }
  } else {
    console.log("received", msg.data);
  }
};

function socket_send_message(msg) {
	// abort if socket is not available:
	if (socket.readyState !== WebSocket.OPEN) return;
	// convert JSON to string:
	if (typeof msg != "string") msg = JSON.stringify(msg);

	//console.log(msg);
	socket.send(msg)
}

document.addEventListener("DOMContentLoaded", function () {
  const loginButton = document.getElementById("loginButton");
  if (loginButton) {
    loginButton.addEventListener("click", login);
    loginForm.addEventListener("submit", login);
  }
});

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const message = {
    type: "login",
    username: username,
    password: password,
  };
  socket_send_message(message);
}

////////////////////////////////

let avatarNav = {
	color: new THREE.Color(),
	pos: new THREE.Vector3(
		Math.random() * 4 - 2,
		0.8,
		Math.random() * 4 - 2
	),
	dir: new THREE.Quaternion(),
}

renderer.setAnimationLoop(animate);

////// AUDIO ///////

async function audiosetup() {

	// score
	let lead = [
		"Bb3 s",
		"A3  s",
		"Bb3 e",
		"G3  e",
		"A3  e",
		"G3  e",
		"F3  e",
		"G3  ee",

		"G3  e",
		"A3  e",
		"Bb3 e",
		"A3  e",
		"G3  e",
		"A3  e",
		"F3  q",

		"B4  s",
		"A4  s",
		"G4  e",
		"A4  e",
		"B4  e",
		"C5  e",
		"D5  q",

		"E4  s",
		"F4  s",
		"G4  e",
		"F4  e",
		"E4  e",
		"D4  e",
		"C4  q",

		"E4  e",
		"F4  e",
		"G4  e",
		"A4  e",
		"B4  e",
		"C5  e",
		"D5  e",
		"E5  q",
		"C5  h",
		"G4  e",
		"E4  e",
		"C4  hh"
	];

	let lead2 = [
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
		"G4  qd"
	];


	// create an AudioListener and add it to the camera
	// (this embeds the WebAudio spatialization feature of audioContext.listener)
	const listener = new THREE.AudioListener();
	camera.add(listener);

	// get the AudioContext
	const audioContext = listener.context;
	// WebAudio requires a click to start audio:
	document.body.onclick = () => {
		audioContext.resume();
	};

	function makeAudioSequence(score, position) {
		let tempo = 10;
		let sequence1 = new Sequence(audioContext, tempo, score);

		sequence1.staccato = 0.55;

		let mesh = new THREE.Mesh(
			new THREE.SphereGeometry(0.3),
			new THREE.MeshStandardMaterial()
		);
		mesh.position.copy(position);
		scene.add(mesh);
		let sound = new THREE.PositionalAudio(listener);
		mesh.add(sound);
		sequence1.play(audioContext.currentTime);
		sound.setNodeSource(sequence1.output);
	}


	makeAudioSequence(lead, new THREE.Vector3(-2, 0.5, -2));
	makeAudioSequence(lead2, new THREE.Vector3(2, 0.5, 2));
}

audiosetup()
