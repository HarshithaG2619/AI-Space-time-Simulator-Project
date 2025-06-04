// Scene, Camera, Renderer
let scene, camera, renderer;
let controls;

// Space-Time Fabric
let fabric;
const fabricSize = 100;
const fabricDivisions = 50;
let originalFabricVertices;

// Objects
const objects = []; // This is the correct declaration for the 'objects' array

// --- New Simplified Planet Data ---
const planetTypes = [
    { name: "Ruby Planet (Small)", radius: 1.5, color: 0xE0115F },   // Ruby Red (more vibrant than 0xFF0000)
    { name: "Sapphire Planet (Medium)", radius: 3.0, color: 0x0F52BA },  // Sapphire Blue (deep blue)
    { name: "Emerald Planet (Large)", radius: 4.5, color: 0x50C878 },  // Emerald Green
    { name: "Gold Planet (Small)", radius: 1.5, color: 0xFFD700 },   // Gold
    { name: "Amethyst Planet (Medium)", radius: 3.0, color: 0x9966CC },  // Amethyst Purple
    { name: "Citrine Planet (Large)", radius: 4.5, color: 0xE4D00A }   // Citrine Yellow-Orange
];
let nextPlanetTypeIndex = 0;
// --- End New Simplified Planet Data ---

// Raycasting & Dragging
let raycaster;
let mouse;
let selectedObject = null;
let plane; // A plane to intersect with for dragging

function init() {
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 50); 
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000); 
    document.getElementById('scene-container').appendChild(renderer.domElement);

    // Initialize OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 200;
    controls.maxPolarAngle = Math.PI / 2.1; 

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    scene.add(directionalLight);

    createFabric();
    if (fabric) { // Ensure fabric was created before using it
        fabric.updateMatrixWorld(true); 
    } else {
        console.error("Fabric not created in init!");
        return; // Stop if fabric isn't there
    }

    // Raycasting and Dragging Setup
    raycaster = new THREE.Raycaster(); // Initialize the global raycaster
    mouse = new THREE.Vector2();     // Initialize the global mouse vector
    plane = new THREE.Plane();       // Initialize the global plane
    // Set the plane to be aligned with the fabric initially
    // The normal should be the fabric's up vector in world space
    const fabricUp = new THREE.Vector3(0, 1, 0).applyQuaternion(fabric.quaternion);
    plane.setFromNormalAndCoplanarPoint(fabricUp, fabric.position);

    // Event Listeners
    document.getElementById('addPlanetButton').addEventListener('click', addPlanet);
    document.getElementById('addBlackHoleButton').addEventListener('click', addBlackHole); 
    window.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('pointerdown', onPointerDown, false);
    renderer.domElement.addEventListener('pointermove', onPointerMove, false);
    renderer.domElement.addEventListener('pointerup', onPointerUp, false);

    animate();
}

function createFabric() {
    const geometry = new THREE.PlaneGeometry(fabricSize, fabricSize, fabricDivisions, fabricDivisions);
    geometry.rotateX(-Math.PI / 2); // Rotate plane to be horizontal (XZ plane) before further tilting
    originalFabricVertices = [...geometry.attributes.position.array]; 
    // Now, originalFabricVertices[i*3+1] is the local Y coordinate, which is 0 for all vertices initially.

    const material = new THREE.MeshPhongMaterial({ 
        color: 0x00ff00, 
        side: THREE.DoubleSide, 
        wireframe: true, 
        shininess: 30 // Adjust shininess for desired look
    });
    fabric = new THREE.Mesh(geometry, material);
    fabric.rotation.x = -Math.PI / 6; // Tilt the XZ plane
    scene.add(fabric);
    // console.log("Fabric created. Initial rotation X:", fabric.rotation.x);
}

function addPlanet() {
    if (planetTypes.length === 0) {
        console.warn("No planet types defined in planetTypes array.");
        return;
    }

    const planetData = planetTypes[nextPlanetTypeIndex];
    // console.log("Adding planet:", planetData.name, "Color:", planetData.color.toString(16)); // Debug line
    nextPlanetTypeIndex = (nextPlanetTypeIndex + 1) % planetTypes.length; // Cycle through planet types

    const planetRadius = planetData.radius;
    const planetMass = planetRadius * 5; // Keep mass proportional to new radius
    const planetGeometry = new THREE.SphereGeometry(planetRadius, 32, 32);
    const planetMaterial = new THREE.MeshPhongMaterial({
        color: planetData.color,
        emissive: planetData.color, // Planet emits its own color
        emissiveIntensity: 0.05 // Drastically reduced intensity
    });
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);

    // Calculate initial position within fabric bounds, considering tilt
    const fabricHalfSize = fabricSize / 2;
    const effectiveZBound = fabricHalfSize * Math.cos(Math.abs(fabric.rotation.x));

    const spawnRangeFactor = 0.8; // Spawn within 80% of the fabric dimension to avoid edges
    const initialX = (Math.random() - 0.5) * (fabricHalfSize * spawnRangeFactor - planetRadius);
    const initialZ = (Math.random() - 0.5) * (effectiveZBound * spawnRangeFactor - planetRadius);

    const initialY = (fabric ? fabric.position.y : 0) + 10 + planetRadius; 

    planetMesh.position.set(initialX, initialY, initialZ);

    const planetObject = {
        mesh: planetMesh,
        mass: planetMass,
        radius: planetRadius,
        worldPosition: planetMesh.position.clone(), // Store initial world position
        name: planetData.name // Store planet name
    };

    objects.push(planetObject);
    scene.add(planetMesh);
    // console.log(planetData.name + " added. Radius: " + planetRadius.toFixed(2) + ", Mass: " + planetMass.toFixed(2));
    updateFabricDeformation();
}

function addBlackHole() {
    // console.log("addBlackHole function called"); // Check if function is reached
    const holeRadius = 5; 
    const holeMass = 50;  
    const holeGeometry = new THREE.SphereGeometry(holeRadius, 32, 32);
    const holeMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 }); 
    const holeMesh = new THREE.Mesh(holeGeometry, holeMaterial);

    const initialX = (Math.random() - 0.5) * (fabricSize / 2);
    const initialZ = (Math.random() - 0.5) * (fabricSize / 2) * Math.cos(Math.abs(fabric.rotation.x));
    holeMesh.position.set(initialX, 5, initialZ); // Initial Y, will be corrected

    const holeObject = { 
        mesh: holeMesh, 
        mass: holeMass, 
        radius: holeRadius,
        worldPosition: holeMesh.position.clone()
    };
    objects.push(holeObject);
    scene.add(holeMesh);
    // console.log("Black hole object created and added. Mass:", holeMass, "Initial Pos:", holeMesh.position);
    updateFabricDeformation();
}

function updateFabricDeformation() {
    if (!fabric) return; 
    fabric.updateMatrixWorld(true); // Ensure fabric's world matrix is current for this frame's calculations

    const positions = fabric.geometry.attributes.position;
    const fabricWorldToLocal = new THREE.Matrix4().copy(fabric.matrixWorld).invert();

    // First, update all fabric vertex positions based on current object locations
    for (let i = 0; i < positions.count; i++) {
        const originalLocalX = originalFabricVertices[i * 3 + 0];
        const originalLocalY = originalFabricVertices[i * 3 + 1]; // Should be 0 for XZ plane
        const originalLocalZ = originalFabricVertices[i * 3 + 2];
        
        let totalDeformationOnVertex = 0; // This is the displacement along local Y for this vertex

        objects.forEach(obj => {
            // Transform object's world position to fabric's local space for accurate distance calc on the XZ plane of the fabric
            const objectLocalPosForDeform = obj.worldPosition.clone().applyMatrix4(fabricWorldToLocal);
            
            const dx = originalLocalX - objectLocalPosForDeform.x;
            const dz = originalLocalZ - objectLocalPosForDeform.z;
            const distanceSq = dx * dx + dz * dz;
            const strength = obj.mass;
            const spread = obj.radius * 5; 
            
            if (spread > 0 && distanceSq < (spread * 10) * (spread * 10)) { // Limit influence range
                totalDeformationOnVertex += -strength * Math.exp(-distanceSq / (2 * spread * spread));
            }
        });
        positions.setY(i, originalLocalY + totalDeformationOnVertex); // Apply deformation to local Y
    }
    positions.needsUpdate = true;
    fabric.geometry.computeVertexNormals(); // Update normals for lighting

    // Now update object positions to sit on the deformed fabric
    objects.forEach(obj => {
        const objectId = obj.mesh.uuid.substring(0, 6);
        // obj.worldPosition contains the object's current XZ (from drag/initial) and Y (from previous frame's deformation)
        // We need to convert this worldPosition to the fabric's local space to find the deformation underneath it.
        const objectWorldPosForTransform = obj.worldPosition.clone(); // Use a clone for matrix transformation
        const objectLocalPosition = objectWorldPosForTransform.applyMatrix4(fabricWorldToLocal);

        let minDeformationAtObjectCenter = 0; // This will be the Y value in fabric's local space

        objects.forEach(otherObj => {
            const otherObjectLocalPosition = otherObj.mesh.position.clone().applyMatrix4(fabricWorldToLocal);
            const dx = objectLocalPosition.x - otherObjectLocalPosition.x;
            const dz = objectLocalPosition.z - otherObjectLocalPosition.z;
            const distanceSq = dx * dx + dz * dz;
            const strength = otherObj.mass;
            const spread = otherObj.radius * 5;
            let currentDeformation = 0;
            if (spread > 0 && distanceSq < (spread * 10)*(spread * 10)) { // Added check for distanceSq
                currentDeformation = -strength * Math.exp(-distanceSq / (2 * spread * spread));
            }
            minDeformationAtObjectCenter += currentDeformation;
        });
        
        const deformedLocalY = minDeformationAtObjectCenter;
        // console.log(`  [${objectId}] Calculated deformedLocalY: ${deformedLocalY.toFixed(2)}`);

        const localSurfacePoint = new THREE.Vector3(objectLocalPosition.x, deformedLocalY, objectLocalPosition.z);
        const worldDeformedPoint = localSurfacePoint.clone().applyMatrix4(fabric.matrixWorld);

        // Update the actual mesh position
        obj.mesh.position.x = obj.worldPosition.x; // X is from dragging or initial
        obj.mesh.position.y = worldDeformedPoint.y + obj.radius; // Y is from deformation + radius offset
        obj.mesh.position.z = obj.worldPosition.z; // Z is from dragging or initial

        // Also update the stored worldPosition's Y for the next frame's calculation basis
        obj.worldPosition.y = obj.mesh.position.y;

        // console.log(`  [${objectId}] ObjCenterLocal(XZ): ${objectLocalPosition.x.toFixed(2)},${objectLocalPosition.z.toFixed(2)} | DeformedLocalY: ${deformedLocalY.toFixed(2)} | WorldSurfaceY: ${worldDeformedPoint.y.toFixed(2)} | Final Obj Y: ${obj.mesh.position.y.toFixed(2)}`);
    });

    // If an object is selected and being dragged, its XZ might have changed,
    // but we don't need to update its Y here since it's being dragged on the plane
    // and its Y is determined by the plane's intersection with the raycaster.
}

function onPointerDown(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects.map(o => o.mesh));

    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        controls.enabled = false; // Disable camera controls while dragging an object

        // Update the drag plane to be at the selected object's current world Y position
        // and aligned with the fabric's general orientation (its up-vector in world space)
        fabric.updateMatrixWorld(true); // Ensure fabric's matrix is current
        const fabricUp = new THREE.Vector3(0, 1, 0).applyQuaternion(fabric.quaternion);
        
        // We want to intersect with a plane that goes through the object's current position,
        // but is oriented like the fabric (tilted).
        const objectWorldPosition = selectedObject.getWorldPosition(new THREE.Vector3());
        plane.setFromNormalAndCoplanarPoint(fabricUp, objectWorldPosition);
    }
}

function onPointerMove(event) {
    if (selectedObject) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersectionPoint = new THREE.Vector3();

        if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
            // intersectionPoint is in world space.
            // We want the object to follow X and Z from this point.
            // The Y from intersectPlane is on the 'drag plane', not necessarily the deformed fabric surface yet.
            selectedObject.position.x = intersectionPoint.x;
            selectedObject.position.z = intersectionPoint.z;

            // Constrain the selected object's X and Z to stay within the fabric bounds (world space)
            const halfFabricXSpan = fabricSize / 2;
            const halfFabricZSpan = (fabricSize / 2) * Math.cos(Math.abs(fabric.rotation.x)); // Adjusted for tilt

            selectedObject.position.x = Math.max(-halfFabricXSpan, Math.min(halfFabricXSpan, selectedObject.position.x));
            selectedObject.position.z = Math.max(-halfFabricZSpan, Math.min(halfFabricZSpan, selectedObject.position.z));
            
            const objData = objects.find(o => o.mesh === selectedObject);
            if (objData) {
                // Update worldPosition with the new XZ. Y will be updated by updateFabricDeformation.
                objData.worldPosition.x = selectedObject.position.x;
                objData.worldPosition.z = selectedObject.position.z;
                // Keep objData.worldPosition.y as is, or let updateFabricDeformation derive it freshly.
                // For now, let updateFabricDeformation fully determine Y based on the new XZ.
            }
            updateFabricDeformation(); // Update fabric and object Y positions in real-time
        }
    }
}

function onPointerUp() {
    if (selectedObject) {
        // When releasing, trigger a final fabric update to ensure correct Y positioning
        updateFabricDeformation(); 
    }
    selectedObject = null;
    controls.enabled = true; // Re-enable camera controls
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // No need to call updateFabricDeformation here unless fabric size depends on window size
}

function animate() {
    requestAnimationFrame(animate);
    // updateFabricDeformation(); // Call this if objects can move or mass changes dynamically
    
    controls.update(); // Update OrbitControls

    renderer.render(scene, camera);
}

init();