import * as THREE from 'three';
import { Projectile } from './Projectile.js';
import { EnemyManager } from './EnemyManager.js';

export class ProjectileManager {
    static projectiles = [];
    static poolSize = 50;
    static scene = null;

    static init(scene) {
        ProjectileManager.scene = scene;
        for (let i = 0; i < ProjectileManager.poolSize; i++) {
            ProjectileManager.projectiles.push(new Projectile(scene));
        }
    }

    static update(dt) {
        for (const p of ProjectileManager.projectiles) {
            if (p.active) {
                p.update(dt);
            }
        }
    }

    static fireBullet(position, direction, damageMod = 1.0) {
        const p = ProjectileManager.projectiles.find(p => !p.active);
        if (p) {
            // Adjust height
            const spawnPos = new THREE.Vector3(position.x, 1, position.z);
            p.damage = 5 * damageMod; // Base damage 5
            p.fire(spawnPos, direction);
            return true;
        }
        return false;
    }

    // Deprecated or used for simple enemies?
    static fire(position) {
        // ... logic moved to Player for advanced patterns
        return false;
    }
}
