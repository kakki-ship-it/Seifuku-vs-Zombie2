import * as THREE from 'three';
import { GameManager } from './game/GameManager.js';
import { AssetManager } from './game/AssetManager.js';
import { InputManager } from './game/InputManager.js';

// Global Game Object
window.Game = {
    scene: null,
    camera: null,
    renderer: null,
    deltaTime: 0,
    time: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
};

async function init() {
    // 1. Setup Three.js
    Game.scene = new THREE.Scene();
    Game.scene.background = new THREE.Color(0x202030); // Dark blueish night
    Game.scene.fog = new THREE.Fog(0x202030, 10, 50);

    // Camera (Quarter View)
    // Orthographic might be better for "Vampire Survivors" feel, but user asked for 3D Quarter View.
    // Perspective is more "3D". Let's stick to Perspective for now, high angle.
    Game.camera = new THREE.PerspectiveCamera(60, Game.width / Game.height, 0.1, 1000);
    Game.camera.position.set(0, 15, 15); // High up, looking down
    Game.camera.lookAt(0, 0, 0);

    // Renderer
    Game.renderer = new THREE.WebGLRenderer({ antialias: true });
    Game.renderer.setSize(Game.width, Game.height);
    Game.renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(Game.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft white light
    Game.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    Game.scene.add(dirLight);

    // 2. Initialize Managers
    await AssetManager.loadAll(); // Load textures
    InputManager.init();
    GameManager.init();

    // 3. Event Listeners
    window.addEventListener('resize', onWindowResize, false);

    // Mobile Joystick Check
    const joystickZone = document.getElementById('joystick-zone');
    if (Game.isMobile && joystickZone) {
        joystickZone.style.display = 'block';
    }

    // 4. Start Loop
    requestAnimationFrame(animate);
}

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();
    Game.deltaTime = dt;
    Game.time = clock.getElapsedTime();

    if (GameManager.isPlaying) {
        GameManager.update(dt);
    }

    // Camera Follow Player (Simple)
    if (GameManager.player) {
        const targetPos = GameManager.player.mesh.position.clone();
        targetPos.add(new THREE.Vector3(0, 15, 15)); // Offset
        Game.camera.position.lerp(targetPos, 0.1); // Smooth follow
        Game.camera.lookAt(GameManager.player.mesh.position);
    }

    Game.renderer.render(Game.scene, Game.camera);
}

function onWindowResize() {
    Game.width = window.innerWidth;
    Game.height = window.innerHeight;
    Game.camera.aspect = Game.width / Game.height;
    Game.camera.updateProjectionMatrix();
    Game.renderer.setSize(Game.width, Game.height);
}

// Start
init();
