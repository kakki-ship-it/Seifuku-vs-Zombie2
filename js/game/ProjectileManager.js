import * as THREE from 'three';
import { Projectile } from './Projectile.js';
import { EnemyManager } from './EnemyManager.js';
import { SoundManager } from './SoundManager.js';


export class ProjectileManager {
    static scene = null;
    static projectiles = [];

    static init(scene) {
        ProjectileManager.scene = scene;
        ProjectileManager.projectiles = [];
    }

    static fireBullet(position, direction, damage) {
        const p = new Projectile(ProjectileManager.scene, position, direction, damage);
        ProjectileManager.projectiles.push(p);
    }

    static update(dt, obstacles, onKill) {
        for (let i = ProjectileManager.projectiles.length - 1; i >= 0; i--) {
            const p = ProjectileManager.projectiles[i];
            const stillActive = p.update(dt); // Only moves now

            if (stillActive) {
                // 1. Obstacle Collision
                if (obstacles) {
                    const pBox = new THREE.Box3().setFromCenterAndSize(p.mesh.position, new THREE.Vector3(0.5, 0.5, 0.5));
                    for (const obs of obstacles) {
                        if (pBox.intersectsBox(obs)) {
                            p.active = false;
                            p.mesh.visible = false;
                            break;
                        }
                    }
                }

                // 2. Enemy Collision
                if (p.active) {
                    for (const enemy of EnemyManager.enemies) {
                        if (enemy.active) {
                            const distSq = p.mesh.position.distanceToSquared(enemy.mesh.position);
                            if (distSq < 1.0) { // Hit radius
                                const killed = enemy.takeDamage(p.damage);
                                SoundManager.playHit();
                                if (killed) {
                                    if (onKill) onKill(enemy.mesh.position);
                                }
                                p.active = false;
                                p.mesh.visible = false;
                                break;
                            }
                        }
                    }
                }

                // 3. Map Bounds
                const pos = p.mesh.position;
                if (pos.x < -50 || pos.x > 50 || pos.z < -50 || pos.z > 50) {
                    p.active = false;
                    p.mesh.visible = false;
                }
            }

            if (!p.active) {
                ProjectileManager.scene.remove(p.mesh);
                ProjectileManager.projectiles.splice(i, 1);
            }
        }
    }
}
