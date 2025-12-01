import * as THREE from 'three';
import { Enemy } from './Enemy.js';

export class EnemyManager {
    static enemies = [];
    static poolSize = 100;
    static spawnTimer = 0;
    static spawnInterval = 1.0; // Seconds
    static scene = null;

    static init(scene) {
        EnemyManager.scene = scene;
        // Create Pool
        for (let i = 0; i < EnemyManager.poolSize; i++) {
            EnemyManager.enemies.push(new Enemy(scene));
        }
    }

    static update(dt, playerPos, obstacles) {
        // Spawning
        EnemyManager.spawnTimer += dt;
        if (EnemyManager.spawnTimer > EnemyManager.spawnInterval) {
            EnemyManager.spawnTimer = 0;
            EnemyManager.spawnEnemy(playerPos);

            // Ramp up difficulty (spawn faster)
            if (EnemyManager.spawnInterval > 0.2) {
                EnemyManager.spawnInterval -= 0.005;
            }
        }

        // Update Enemies
        for (const enemy of EnemyManager.enemies) {
            if (enemy.active) {
                enemy.update(dt, playerPos, obstacles, EnemyManager.enemies);
            }
        }
    }

    static spawnEnemy(playerPos) {
        const enemy = EnemyManager.enemies.find(e => !e.active);
        if (!enemy) return; // Pool full

        // Random position outside camera view (approx 20 units away)
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 10;
        const spawnPos = new THREE.Vector3(
            playerPos.x + Math.cos(angle) * dist,
            1, // Ground level
            playerPos.z + Math.sin(angle) * dist
        );

        // Difficulty Color
        let color = 0x55aa55; // Green
        let hpMult = 1;
        if (EnemyManager.spawnInterval < 0.8) { color = 0xaaaa55; hpMult = 2; } // Yellow-ish
        if (EnemyManager.spawnInterval < 0.5) { color = 0xaa5555; hpMult = 4; } // Red-ish

        // Apply color to skin parts (Head, Arms)
        enemy.mesh.children.forEach(child => {
            // Simple heuristic: if material is the skin material (we can't easily check instance, but we can check initial color or just set all for now)
            // Let's just tint everything for simplicity or try to target skin.
            // Actually, setting everything is clearer for difficulty.
            if (child.material) {
                child.material.color.setHex(color);
            }
        });

        enemy.spawn(spawnPos, hpMult);
    }
}
