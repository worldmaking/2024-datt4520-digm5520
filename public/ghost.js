
// Set up the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Dark background

const params = {
				alpha: 0.5,
				alphaHash: true,
				taa: true,
				sampleLevel: 2,
			};
// Set up the camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

//Random color
camera.position.z = 1.5;
function getRandomColor() {
   var colorRam = Math.floor(Math.random() * 6) + 1;
  //var colorRam = 6;
   
   switch (colorRam) {
        case 1:
            return '#B5C18E'; // light yellow
        case 2:
            return  '#B9B4C7'; // white
        case 3:
            return  '#99ccff'; // light blue
        case 4:
            return  '#ff99c8'; // pink
        case 5:
            return  '#ccfcff'; // Cyan
        case 6:
            return  '#9784d2'; // light purple
        
    };
}
 var headPx = 0+Math.random() * 3;
 var headPy = 0+Math.random() * 3;
 var headPz = 0+Math.random() * 3;



 var eyeRam = Math.floor(Math.random() * 3) + 1;
 var eyeRam2 = Math.floor(Math.random() * 3) + 1;

// Set up the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation is enabled
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;

       

//lights
const ambient = new THREE.AmbientLight(0xffffff, 1 + Math.random() * 2);//可改
scene.add(ambient);

 // Create ground
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
  const groundMaterial = new THREE.MeshStandardMaterial({
            color: 'pink',
            roughness: 0.2*Math.random() * 20, //Modify
            metalness: 1,
           
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2.5; // Position the ground below the ghost
        scene.add(ground);

//var colorR ='#FFA62F';
        // Create ghost head with reflective material

        var colorR = 'FFF9D0';
            colorR =getRandomColor();
       
        const ghostGeometry = new THREE.SphereGeometry(2, 32, 32);
        const ghostMaterial = new THREE.MeshStandardMaterial({
            //color: '#99ccff',

            color: colorR,
            roughness: 0.2,
            metalness: 0.5,
            transparent: true,
            opacity: 0.7+ Math.random() * 0.5, 
           
        });
        const ghostHead = new THREE.Mesh(ghostGeometry, ghostMaterial);
        ghostHead.position.x = headPx; 
        ghostHead.position.y = headPy; 
        ghostHead.position.z = headPz; 
// Set the initial height of the ghost
        scene.add(ghostHead);
        // Create eyes
        const eyeGeometry = new THREE.SphereGeometry(0.2, 32, 32);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });




if(eyeRam ==1 ){
        //inner eye
        const eyeInnerGeometry = new THREE.CylinderGeometry( 0.10, 0.10, 0.40, 32 );
        const leftEyeInnrer1 = new THREE.Mesh(eyeInnerGeometry, eyeMaterial);
        leftEyeInnrer1.position.set(-0.5, 0.6, 1.8);
        anglezE = 70 * Math.PI / 180; 
        angleyE = -13 * Math.PI / 180; 
        leftEyeInnrer1.rotation.z = anglezE;
        leftEyeInnrer1.rotation.y = angleyE;

        ghostHead.add(leftEyeInnrer1);

        const leftEyeInnrer2 = new THREE.Mesh(eyeInnerGeometry, eyeMaterial);
        leftEyeInnrer2.position.set(-0.5, 0.47, 1.83);
        anglezE = -70 * Math.PI / 180; 
        angleyE = -13 * Math.PI / 180; 
        leftEyeInnrer2.rotation.z = anglezE;
        leftEyeInnrer2.rotation.y = angleyE;

        ghostHead.add(leftEyeInnrer2);
  
} else if(eyeRam == 2){        
        const eyeHollowGeometry = new THREE.TorusGeometry( 0.18, 0.05, 16, 100 );
        
        const leftEyeHollow = new THREE.Mesh(eyeHollowGeometry, eyeMaterial);
        leftEyeHollow.position.set(-0.5, 0.57, 1.9);
        leftEyeHollow.rotation.x = -10 * Math.PI / 180;
    
        ghostHead.add(leftEyeHollow);
  
  
}else {
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.5, 0.5, 1.8);
        ghostHead.add(leftEye);
  
}
/*


*/






if(eyeRam2 ==1 ){
        //inner eye
        const eyeInnerGeometry = new THREE.CylinderGeometry( 0.10, 0.10, 0.40, 32 );
        const leftEyeInnrer1 = new THREE.Mesh(eyeInnerGeometry, eyeMaterial);
        leftEyeInnrer1.position.set(0.5, 0.6, 1.8);
        anglezE = -70 * Math.PI / 180; 
        angleyE = 13 * Math.PI / 180; 
        leftEyeInnrer1.rotation.z = anglezE;
        leftEyeInnrer1.rotation.y = angleyE;
 
        ghostHead.add(leftEyeInnrer1);

        const leftEyeInnrer2 = new THREE.Mesh(eyeInnerGeometry, eyeMaterial);
        leftEyeInnrer2.position.set(0.5, 0.47, 1.83);
        anglezE = 70 * Math.PI / 180; 
        angleyE = 13 * Math.PI / 180; 
        leftEyeInnrer2.rotation.z = anglezE;
        leftEyeInnrer2.rotation.y = angleyE;

        ghostHead.add(leftEyeInnrer2);
  

} else if(eyeRam == 2){        
        const eyeHollowGeometry = new THREE.TorusGeometry( 0.18, 0.05, 16, 100); 
        const rightEyeHollow = new THREE.Mesh(eyeHollowGeometry, eyeMaterial);
        rightEyeHollow.position.set(0.5, 0.57, 1.9);
        rightEyeHollow.rotation.x = -10 * Math.PI / 180;
        ghostHead.add(rightEyeHollow); 
                                                         

        
        
  
  
}else {
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.5, 0.5, 1.8);
        ghostHead.add(rightEye);
  
}
 


       // Create hands with reflective material
        //const handGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const earGeometry = new THREE.ConeGeometry( 0.5, 1, 32 );

        const earMaterial = new THREE.MeshStandardMaterial({
            color: colorR,
            roughness: 0.2,
            metalness: 0.5,
    
        });



const handGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const handMaterial = new THREE.MeshStandardMaterial({
    color: colorR,
    roughness: 0.2,
    metalness: 0.5,
});

const leftHand = new THREE.Mesh(handGeometry, handMaterial);
leftHand.position.set(-2.5, -1, 0);
ghostHead.add(leftHand);

const rightHand = new THREE.Mesh(handGeometry, handMaterial);
rightHand.position.set(2.5, -1, 0);
ghostHead.add(rightHand);


const ear1 = new THREE.Mesh(earGeometry, ghostMaterial);

ear1.position.set(-1.3, 2.3, 0);

anglex = 0 * Math.PI / 180; 
anglez = 30 * Math.PI / 180; 

ear1.rotation.x = anglex;
ear1.rotation.z = anglez;
ghostHead.add(ear1);


const ear2 = new THREE.Mesh(earGeometry, ghostMaterial);

ear2.position.set(1.3, 2.3, 0);

anglex = 0 * Math.PI / 180; 
anglez = -30 * Math.PI / 180; 


ear2.rotation.x = anglex;
// leftHand.rotation.z = 170;
ear2.rotation.z = anglez;

ghostHead.add(ear2);





        // Function to create light
        function createLight(color) {
            const intensity =10;
            const light = new THREE.PointLight(color, intensity, 10);
            light.castShadow = true;
            light.shadow.bias = -0.005; // reduces self-shadowing on double-sided objects

            let geometry = new THREE.SphereGeometry(0.3, 10, 10);
            let material = new THREE.MeshBasicMaterial({ color: color });
            material.color.multiplyScalar(intensity);
            let sphere = new THREE.Mesh(geometry, material);
            light.add(sphere);

            const texture = new THREE.CanvasTexture(generateTexture());
            texture.magFilter = THREE.NearestFilter;
            texture.wrapT = THREE.RepeatWrapping;
            texture.wrapS = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);

            geometry = new THREE.SphereGeometry(0, 32, 8);
            material = new THREE.MeshPhongMaterial({
                side: THREE.DoubleSide,
                alphaMap: texture,
                alphaTest: 0.5
            });

            sphere = new THREE.Mesh(geometry, material);
            sphere.castShadow = true;
            sphere.receiveShadow = true;
            light.add(sphere);

            return light;
        }

 function generateTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const context = canvas.getContext('2d');
            for (let i = 0; i < 20000; i++) {
                context.fillStyle = 'rgb(' + (Math.random() * 256) | 0 + ',' + (Math.random() * 256) | 0 + ',' + (Math.random() * 256) | 0 + ')';
                context.beginPath();
                context.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 3 + 1, 0, Math.PI * 2, true);
                context.fill();
            }
            return canvas;
        }
        // Create and add the light to the ghost
        const pointLight = createLight(colorR);
        pointLight.position.set(0, -1, 0); // Position the light between the hands


        ghostHead.add(pointLight);

        // Position the camera
        camera.position.set(0, 5, 10);

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        });

        // Right mouse click controls
        let moveTarget = null;
        const moveSpeed = 0.05;

        renderer.domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const rect = renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(ground);
            if (intersects.length > 0) {
                moveTarget = intersects[0].point;
            }
        });

        function updateMovement() {
            if (moveTarget) {
                const direction = new THREE.Vector3();
                direction.subVectors(moveTarget, ghostHead.position).normalize();
                const distance = ghostHead.position.distanceTo(moveTarget);
                if (distance > moveSpeed) {
                    ghostHead.position.addScaledVector(direction, moveSpeed);
                    ghostHead.position.y = 0; // Ensure the ghost stays at a constant height
                } else {
                    ghostHead.position.copy(moveTarget);
                    ghostHead.position.y = 0; // Ensure the ghost stays at a constant height
                    moveTarget = null;
                }
            }
            requestAnimationFrame(updateMovement);
        }

        updateMovement();
 
