import * as THREE from "https://esm.sh/three";
import { OrbitControls } from "https://esm.sh/three/addons/controls/OrbitControls.js";
import { PointerLockControls } from "https://esm.sh/three/addons/controls/PointerLockControls.js";

import { VRButton } from "https://esm.sh/three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "https://esm.sh/three/addons/webxr/XRControllerModelFactory.js";
import { Timer } from "https://esm.sh/three/addons/misc/Timer.js";

// Detect if the browser is on mobile
const onMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let nav = {
  lookx: 0,
  looky: 0
};

const raycastingObjects = [];

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

document.body.appendChild(renderer.domElement);

// Create an independent camera for VR:
let camera_vr = new THREE.PerspectiveCamera();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 100);
camera.position.y = 0.7;
camera.position.z = 5;

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  // Bugfix: don't resize renderer if in VR
  if (!renderer.xr.isPresenting)
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const controls = new PointerLockControls(camera, renderer.domElement);

// Pointer lock requires a user action to start, e.g. click on canvas to start pointerlock:
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
let Up = false;
let Down = false;
let verticalSpeed = 2; // initial speed
const dir = new THREE.Vector3();
const vel = new THREE.Vector3();

// GUI controls
const gui = new dat.GUI();
const params = {
  verticalSpeed: 2
};
gui.add(params, 'verticalSpeed', 0.1, 100).name('Vertical Speed').onChange(value => {
  verticalSpeed = value;
});

// If key is pressed
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
    case "Space":
      Up = true;
      break;
    case "KeyC":
      Down = true;
      break;
    case "AltLeft":
      Alt = true;
      break;
    case "KeyT": // Add case for 't' key
      teleportToTarget();
      break;
  }
};

// If key is not pressed
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
    case "Space":
      Up = false;
      break;
    case "KeyC":
      Down = false;
      break;
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
  // If swiped up, launch ball
  if (
    touchendY + 100 < touchstartY &&
    performance.now() - prevJoystickTime > flickJoystickInterval
  ) {
    // Temporary!
    let newTargetPosition = target.position.clone();
    newTargetPosition.y += 0.1;
    moveSphere(newTargetPosition);
    sphereOnHand = false;
    // Sphere on ground
    let diff = newTargetPosition.clone().sub(camera.position);
    sphereDist = diff.length();
    console.log("Up");
  }
}

// If on mobile, displays joysticks
if (onMobile == true) {
  // Right joystick to move around
  let joystickR = nipplejs.create({
    zone: document.getElementById("jRight"),
    mode: "static",
    position: { left: "90%", top: "90%" },
    color: "blue"
  });

  // Right joystick to look around
  joystickR.on("move", function (evt, data) {
    // DO EVERYTHING
    console.log(evt, data);
    nav.lookx = data.vector.y;
    nav.looky = -data.vector.x;
  });

  // Left joystick to walk around
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

const scene = new THREE.Scene();

// Create ghost head with reflective material
const ghostGeometry = new THREE.SphereGeometry(2, 16, 16);
const ghostMaterial = new THREE.MeshStandardMaterial({
  color: "#99ccff",
  roughness: 0.2,
  metalness: 0.5
});
const ghostHead = new THREE.Mesh(ghostGeometry, ghostMaterial);
ghostHead.position.set(0, 0, 0); // Set the initial height of the ghost

// Create eyes
const eyeGeometry = new THREE.SphereGeometry(0.2, 16, 16);
const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
leftEye.position.set(-0.5, 0, -1.8);

const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
rightEye.position.set(0.5, 0, -1.8);

const handGeometry = new THREE.SphereGeometry(0.5, 16, 16);
const handMaterial = new THREE.MeshStandardMaterial({
  color: "#99ccff",
  roughness: 0.2,
  metalness: 0.5
});

const leftHand = new THREE.Mesh(handGeometry, handMaterial);
leftHand.position.set(-1, -1, -3.5);

const rightHand = new THREE.Mesh(handGeometry, handMaterial);
rightHand.position.set(1, -1, -3.5);

const avatarGroup = new THREE.Group();
avatarGroup.add(ghostHead);
avatarGroup.add(leftEye);
avatarGroup.add(rightEye);
avatarGroup.add(leftHand);
avatarGroup.add(rightHand);
avatarGroup.scale.set(0.3, 0.3, 0.3);
avatarGroup.position.set(camera.position.x, camera.position.y, camera.position.z + 0.7);
scene.add(avatarGroup);

const sphereColor = 0xf7e09a;
const planeColor = 0x4d4f4f;

const plane_geo = new THREE.PlaneGeometry(10, 10);
const plane_mat = new THREE.MeshStandardMaterial({
  color: planeColor,
  side: THREE.DoubleSide
});
const plane = new THREE.Mesh(plane_geo, plane_mat);
plane.rotateX(Math.PI / 2);
scene.add(plane);
raycastingObjects.push(plane);

const light = new THREE.HemisphereLight(0xffffff, 0x080820, 1);
scene.add(light);

const sphere1_geo = new THREE.SphereGeometry(0.1, 32, 16);
const sphere1_mat = new THREE.MeshStandardMaterial({
  color: sphereColor,
  emissive: sphereColor,
  emissiveIntensity: 0.5
});
const sphere1 = new THREE.Mesh(sphere1_geo, sphere1_mat);

let sphere1Pos = new THREE.Vector3(0, -0.3, -0.5);
const pointLight1 = new THREE.PointLight(sphereColor, 1);
pointLight1.position.copy(camera.position.clone().add(sphere1Pos));
pointLight1.add(sphere1);
scene.add(pointLight1);

const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

// Point light animation
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
    // Sphere on ground
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

// Helper functions

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
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

// Getting 2 controllers:
let controller = renderer.xr.getController(0);
scene.add(controller);

let controller2 = renderer.xr.getController(1);
scene.add(controller2);

// For each controller:
const controllerGrip = renderer.xr.getControllerGrip(0);
controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
scene.add(controllerGrip);
const controllerGrip2 = renderer.xr.getControllerGrip(1);
controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
scene.add(controllerGrip2);

raycaster.setFromXRController(controller);

// Adding event handlers for the controllers:
controller.addEventListener("selectstart", function (event) {
  fireSphere();
});
controller.addEventListener("selectend", function (event) {
  // Optional: handle end of select
});
controller2.addEventListener("selectstart", function (event) {
  fireSphere();
});
controller2.addEventListener("selectend", function (event) {
  // Optional: handle end of select
});

// Call this in the 'selectstart' event, but also call it in animate()
// so that it continuously updates while moving the controller around
function getIntersections(controller) {
  controller.updateMatrixWorld();
  raycaster.setFromXRController(controller);
  let intersections = raycaster.intersectObjects(scene.children);
  // Etc.
}

// Events for getting/losing controllers:
// Adding controller models:
controller.addEventListener("connected", function (event) {});
controller.addEventListener("disconnected", function () {});

let prevTime = performance.now();

// Jacob Start
let material = new THREE.MeshBasicMaterial({
  vertexColors: true,
  side: THREE.DoubleSide
});

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
}

const agentGeometry = new THREE.BufferGeometry();
agentGeometry.setAttribute("position", new THREE.BufferAttribute(agentPositions, 3));
agentGeometry.setAttribute("color", new THREE.Float32BufferAttribute(agentColors, 3));
const agentMaterial = new THREE.MeshBasicMaterial({
  vertexColors: true,
  side: THREE.DoubleSide
});

// Code Start

// Arrays of shapes
const vertices2 = [
  new Float32Array([
    -0.3, -0.3, 0.3, // v0
    0.3, -0.3, 0.3, // v1
    0.3, 0.3, 0.3 // v2
  ]),
  new Float32Array([
    -0.3, -0.3, 0.3,
    0.3, -0.3, 0.3,
    0.3, 0, 0.3,
    0, 3.0, 0.3,
    -0.3, 0, 0.3 // v3
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

// Call this to add 1 random new agent
function newAgent() {
  let points = getRandomInt(0, getRandomInt(0, vertices2.length));
  console.log(points, vertices2.length);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices2[points], 3));
  const color = new THREE.Color(Math.random(), Math.random(), Math.random());
  const colors = [];
  for (let i = 0; i < vertices2[points].length / 3; i++) {
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  let mesh = new THREE.Mesh(geometry, agentMaterial);

  function dispose(a) {
    scene.remove(a);
  }

  agents.push({
    pos: randomVec(),
    mesh: mesh,
    speed: Math.random() * maxSpeed - minSpeed,
    goal: randomVec(),
    hunting: false,
    target: getRandomAgent(),
    dead: false,
    dispose
  });

  agents[agents.length - 1].mesh.position.x = agents[agents.length - 1].pos.x;
  agents[agents.length - 1].mesh.position.y = agents[agents.length - 1].pos.y;
  agents[agents.length - 1].mesh.position.z = agents[agents.length - 1].pos.z;
  scene.add(agents[agents.length - 1].mesh);
}

// Draws Initial Agents
for (let i = 0; i < MaxNumOfAgents; i++) {
  newAgent();
}

// Updates Agent positions and Behaviours. Needs to be animated.
function moveAgents() {
  for (let a of agents) {
    if (a.pos.distanceTo(new THREE.Vector3(0, borderSize / 3, 0)) > borderSize || a.pos.y < 0) {
      a.pos = randomVec();
      a.goal = randomVec();
    }

    // If agent is not hunting or looking at lights
    if (!a.hunting) {
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
      }
    } else {
      if (a.target.pos.distanceTo(a.pos) < a.speed + 0.05) {
        console.log("caught!");
        // What happens when the agent catches its prey
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

    // Rotates Agents;
    a.mesh.rotation.x += Math.random() * 0.01 - 0.01;
    a.mesh.rotation.y += Math.random() * 0.01 - 0.01;
    a.mesh.rotation.z += Math.random() * 0.01 - 0.01;
  }

  // Filter out dead agents:
  agents.forEach((a) => {
    if (a.dead) a.dispose(a.mesh);
  });
  agents = agents.filter((a) => !a.dead);
  if (agents.length < 3) {
    newAgent();
  }
}

// Returns random Vector pos
function randomVec() {
  return new THREE.Vector3(
    getRandomInt(0, borderSize) - borderSize / 2,
    getRandomInt(0, borderSize),
    getRandomInt(0, borderSize) - borderSize / 2
  );
}

// Jacob End

function fireSphere() {
  const newTargetPosition = camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(5));
  newTargetPosition.y += 0.1;
  moveSphere(newTargetPosition);
  sphereOnHand = false;
  // Sphere on ground
  let diff = newTargetPosition.clone().sub(camera.position);
  sphereDist = diff.length();
}

function animate(timestamp) {
  moveAgents();
  const delta = (timestamp - prevTime) / 1000;

  if (!onMobile) {
    dir.z = Number(Forward) - Number(Backward);
    dir.x = Number(Right) - Number(Left);

    // When pointer is showing
    if (controls.isLocked) {
      vel.z -= vel.z * 80.0 * delta;
      vel.x -= vel.x * 80.0 * delta;
      // Move WS
      if (Forward || Backward) {
        vel.z -= dir.z * 150 * delta;
      }
      // Move AD
      if (Left || Right) {
        vel.x -= dir.x * 150 * delta;
      }
      // Crouch
      // WARNING: bugs out if ctrl + wasd occurs because it is the same as many shortcuts for codepen so I added alt temporarily
      if (Ctrl && Alt) {
        camera.position.y = 0.5;
        vel.z -= dir.z * 20 * delta;
        vel.x -= dir.x * 20 * delta;
      } else {
        if (!Up && !Down) {
          camera.position.y = Math.max(camera.position.y, 0.8);  // Maintain at least 0.8 if not moving up or down
        }
        vel.z -= dir.z * 150 * delta;
        vel.x -= dir.x * 150 * delta;
      }
      // Run
      if (Shift) {
        vel.z -= dir.z * 300 * delta;
        vel.x -= dir.x * 300 * delta;
      }
      // Up (ascend)
      if (Up) {
        camera.position.y += verticalSpeed * delta;
      }
      // Down (descend)
      if (Down) {
        camera.position.y -= verticalSpeed * delta;
      }

      controls.moveForward(-vel.z * delta);
      controls.moveRight(-vel.x * delta);
    }
  } else {
    // Move Up & Down
    vel.z = -dir.z * 150 * delta;

    // Move Left & Right
    vel.x = -dir.x * 100 * delta;

    if (dir.z === 0) {
      vel.z = 0;
    }
    if (dir.x === 0) {
      vel.x = 0;
    }

    camera.rotation.x = nav.lookx;
    camera.rotation.y = nav.looky;
    camera.updateMatrixWorld();

    controls.moveForward(-vel.z * delta);
    controls.moveRight(-vel.x * delta);
  }

  // VR Controller Joystick Control
  const session = renderer.xr.getSession();
  if (session) {
    for (const inputSource of session.inputSources) {
      if (inputSource.gamepad) {
        const axes = inputSource.gamepad.axes;
        const joystickThreshold = 0.1;  // Adjust sensitivity if needed

        dir.z = Math.abs(axes[3]) > joystickThreshold ? -axes[3] : 0;  // Left joystick vertical axis
        dir.x = Math.abs(axes[2]) > joystickThreshold ? axes[2] : 0;   // Left joystick horizontal axis

        vel.z = dir.z * 150 * delta;
        vel.x = dir.x * 150 * delta;

        controls.moveForward(vel.z * delta);
        controls.moveRight(vel.x * delta);

        // Handle A button (button 0) for diving
        if (inputSource.gamepad.buttons[0].pressed) {
          camera.position.y -= verticalSpeed * delta;
        }
        // Handle B button (button 1) for floating
        if (inputSource.gamepad.buttons[1].pressed) {
          camera.position.y += verticalSpeed * delta;
        }
      }
    }
  }

  // Get sphere distance from camera
  let sphereDiff = pointLight1.position.clone().sub(camera.position);
  if (sphereDiff.length() - sphereDist > 2) {
    pointLight1.intensity = 1;
    let forward = new THREE.Vector3();
    controls.getDirection(forward);
    forward.normalize();
    let right = forward.clone().cross(camera.up).normalize();
    moveSphere(
      camera.position
        .clone()
        .add(camera.up.clone().multiplyScalar(sphere1Pos.y))
        .add(right.multiplyScalar(sphere1Pos.x))
        .add(forward.clone().multiplyScalar(-sphere1Pos.z))
    );
    comeback = true;
  }
  if (comeback) {
    let forward = new THREE.Vector3();
    controls.getDirection(forward);
    forward.normalize();
    let right = forward.clone().cross(camera.up).normalize();
    targetPosition = camera.position
      .clone()
      .add(camera.up.clone().multiplyScalar(sphere1Pos.y))
      .add(right.multiplyScalar(sphere1Pos.x))
      .add(forward.clone().multiplyScalar(-sphere1Pos.z));
  }

  // Update the picking ray with the camera and eye position
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

  const intersects = raycaster.intersectObjects(raycastingObjects);

  for (let i = 0; i < intersects.length; i++) {
    target.position.copy(intersects[i].point);
  }

  // Animate pointlight
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
    pointLight1.position.copy(diff.multiplyScalar(easeOutCubic(animationTime)).add(startPosition));
  }

  let forward = new THREE.Vector3();
  controls.getDirection(forward);
  forward.normalize();
  let right = forward.clone().cross(camera.up).normalize();
  
  avatarGroup.position.copy(
    camera.position.clone().add(forward.clone().multiplyScalar(-0.7))
  );
  avatarGroup.rotation.copy(camera.rotation);
  
  if (sphereOnHand) {
    pointLight1.position.copy(
      camera.position
        .clone()
        .add(camera.up.clone().multiplyScalar(sphere1Pos.y))
        .add(right.clone().multiplyScalar(sphere1Pos.x))
        .add(forward.clone().multiplyScalar(-sphere1Pos.z))
    );
    firstTree = true;
  }

  for (let i = 0; i < trees.length; i++) {
    let diff = trees[i].position.clone().sub(pointLight1.position);
    if (diff.length() < 2 && !sphereOnHand) {
      trees[i].grow();
    }
  }

  // Collision detection and bouncing response
  for (let i = 0; i < trees.length; i++) {
    let diff = trees[i].position.clone().sub(pointLight1.position);
    if (diff.length() < 0.5) {
      // Calculate bounce direction
      let bounceDirection = diff.normalize().multiplyScalar(0.1);
      targetPosition.add(bounceDirection);
      startPosition = pointLight1.position.clone();
      animationTime = 0;
      comeback = false;
    }
  }

  prevTime = timestamp;

  renderer.render(scene, camera);
}

function teleportToTarget() {
  camera.position.set(target.position.x, target.position.y, target.position.z);
}

window.addEventListener("click", onPointerClick);
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);

renderer.setAnimationLoop(animate);
