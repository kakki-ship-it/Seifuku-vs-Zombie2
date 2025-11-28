import * as THREE from 'three';

export class InputManager {
    static moveVector = new THREE.Vector2(0, 0);
    static keys = {};
    static joystickActive = false;
    static joystickOrigin = new THREE.Vector2();
    static joystickCurrent = new THREE.Vector2();

    static init() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            InputManager.keys[e.code] = true;
            InputManager.updateVector();
        });
        window.addEventListener('keyup', (e) => {
            InputManager.keys[e.code] = false;
            InputManager.updateVector();
        });

        // Touch / Joystick
        const zone = document.getElementById('joystick-zone');
        const knob = document.getElementById('joystick-knob');

        if (window.Game.isMobile) {
            zone.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.changedTouches[0];
                InputManager.joystickActive = true;

                // Center of the zone
                const rect = zone.getBoundingClientRect();
                InputManager.joystickOrigin.set(rect.left + rect.width / 2, rect.top + rect.height / 2);

                InputManager.updateJoystick(touch.clientX, touch.clientY);
            }, { passive: false });

            zone.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (!InputManager.joystickActive) return;
                const touch = e.changedTouches[0];
                InputManager.updateJoystick(touch.clientX, touch.clientY);
            }, { passive: false });

            zone.addEventListener('touchend', (e) => {
                e.preventDefault();
                InputManager.joystickActive = false;
                InputManager.moveVector.set(0, 0);
                knob.style.transform = `translate(-50%, -50%)`;
            });
        }
    }

    static updateJoystick(x, y) {
        const knob = document.getElementById('joystick-knob');
        const maxDist = 50; // Radius of zone

        let dx = x - InputManager.joystickOrigin.x;
        let dy = y - InputManager.joystickOrigin.y;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) {
            const ratio = maxDist / dist;
            dx *= ratio;
            dy *= ratio;
        }

        // Update Knob Visual
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

        // Update Vector (-1 to 1)
        InputManager.moveVector.set(dx / maxDist, -dy / maxDist); // Invert Y for 2D screen to 3D world mapping usually
    }

    static updateVector() {
        if (InputManager.joystickActive) return;

        let x = 0;
        let y = 0;

        if (InputManager.keys['KeyW'] || InputManager.keys['ArrowUp']) y += 1;
        if (InputManager.keys['KeyS'] || InputManager.keys['ArrowDown']) y -= 1;
        if (InputManager.keys['KeyA'] || InputManager.keys['ArrowLeft']) x -= 1;
        if (InputManager.keys['KeyD'] || InputManager.keys['ArrowRight']) x += 1;

        InputManager.moveVector.set(x, y).normalize();
    }
}
