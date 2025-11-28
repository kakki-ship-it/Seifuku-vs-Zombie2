import * as THREE from 'three';
import { GameManager } from './GameManager.js';
import { SoundManager } from './SoundManager.js';

export class XPManager {
    static gems = [];
    static poolSize = 100;
    static scene = null;
    static totalXp = 0;
    static level = 1;
    static nextLevelXp = 10;

    static init(scene) {
        XPManager.scene = scene;
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Cyan gems

        for (let i = 0; i < XPManager.poolSize; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.visible = false;
            scene.add(mesh);
            XPManager.gems.push({ mesh: mesh, active: false, value: 1 });
        }
    }

    static spawn(position, value) {
        const gem = XPManager.gems.find(g => !g.active);
        if (gem) {
            gem.active = true;
            gem.mesh.visible = true;
            gem.mesh.position.copy(position);
            gem.mesh.position.y = 0.5;
            gem.value = value;
        }
    }

    static update(dt, playerPos) {
        const pickupRadiusSq = 2.0 * 2.0;

        for (const gem of XPManager.gems) {
            if (gem.active) {
                // Rotate
                gem.mesh.rotation.y += dt * 2;

                // Pickup Check
                const distSq = gem.mesh.position.distanceToSquared(playerPos);
                if (distSq < pickupRadiusSq) {
                    // Magnet effect (simple lerp)
                    gem.mesh.position.lerp(playerPos, dt * 10);

                    if (distSq < 0.5) {
                        XPManager.collect(gem);
                    }
                }
            }
        }
    }

    static collect(gem) {
        gem.active = false;
        gem.mesh.visible = false;
        SoundManager.playCollect();
        XPManager.addXp(gem.value);
    }

    static addXp(amount) {
        XPManager.totalXp += amount;

        // Update UI Bar
        const progress = XPManager.totalXp / XPManager.nextLevelXp;
        document.getElementById('xp-bar-fill').style.width = `${Math.min(100, progress * 100)}%`;

        if (XPManager.totalXp >= XPManager.nextLevelXp) {
            XPManager.levelUp();
        }
    }

    static levelUp() {
        SoundManager.playLevelUp();
        XPManager.totalXp -= XPManager.nextLevelXp;
        XPManager.level++;
        XPManager.nextLevelXp = Math.floor(XPManager.nextLevelXp * 1.5);

        // Reset Bar
        document.getElementById('xp-bar-fill').style.width = `${(XPManager.totalXp / XPManager.nextLevelXp) * 100}%`;

        GameManager.triggerLevelUp();
    }
}
