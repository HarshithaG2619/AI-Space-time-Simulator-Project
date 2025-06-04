# Interactive 3D Space-Time Fabric Simulator

## Description

This project is an interactive 3D simulation that visually demonstrates the concept of space-time fabric curvature as described by Einstein's theory of General Relativity. Users can add celestial objects (planets and black holes) to a 3D fabric mesh, causing it to deform in real-time, simulating gravity wells. Objects can be dragged around, and their influence on the fabric updates dynamically.

The simulation is designed to be educational and engaging, especially for younger users, with clear instructions and simplified explanations of the physics involved.

## How to Run

1.  Ensure you have a modern web browser that supports WebGL (e.g., Chrome, Firefox, Edge, Safari).
2.  Clone or download the project files to your local machine.
3.  Open the `index.html` file directly in your web browser.
    *   Alternatively, if you are using a local web server (like VS Code's Live Server), serve the project directory and navigate to `index.html`.

## Features

*   **Interactive 3D Fabric:** A green, tilted wireframe mesh represents the fabric of space-time.
*   **Dynamic Deformation:** Adding planets or black holes causes the fabric to warp realistically around them.
*   **Object Interaction:**
    *   Add planets of varying sizes and distinct colors (Ruby, Sapphire, Emerald, Gold, Amethyst, Citrine).
    *   Add black holes that create significant fabric deformation.
    *   Drag objects across the fabric with the mouse.
*   **Camera Controls:** Use mouse controls (orbit, pan, zoom) via Three.js OrbitControls to view the simulation from different angles.
*   **Educational UI:**
    *   Clear on-screen instructions for interaction.
    *   An information panel explaining the simulation concepts in a kid-friendly way (e.g., the trampoline analogy for gravity).
*   **Visual Enhancements:**
    *   Planets have a subtle emissive glow (`emissiveIntensity: 0.05`).
    *   Fabric uses `MeshPhongMaterial` for better shading and depth perception.

## Technologies Used

*   **HTML5**
*   **CSS3**
*   **JavaScript (ES6+)**
*   **Three.js:** A 3D graphics library for creating and displaying animated 3D computer graphics in a web browser.

## Project Status

The core simulation mechanics and educational UI are complete and functional. The project is ready for demonstration. Key files updated include `main.js` (for planet logic and appearance) and `index.html` (for UI text and structure).

---