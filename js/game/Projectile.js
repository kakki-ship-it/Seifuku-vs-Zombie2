import * as THREE from 'three';
import { EnemyManager } from './EnemyManager.js';
import { GameManager } from './GameManager.js';
import { XPManager } from './XPManager.js';
import { SoundManager } from './SoundManager.js';

export class Projectile {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.speed = 20;
        this.damage = 5;
        this.active = false;
        this.lifeTime = 0;
        this.direction = new THREE.Vector3();

        this.init();
    }

    init() {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    fire(position, direction) {
        this.mesh.position.copy(position);
        this.direction.copy(direction).normalize();
        this.active = true;
        this.mesh.visible = true;
        this.lifeTime = 2.0; // Seconds
    }

    update(dt) {
        if (!this.active) return;

        // Move
        this.mesh.position.add(this.direction.clone().multiplyScalar(this.speed * dt));

        // Lifetime
        this.lifeTime -= dt;
        if (this.lifeTime <= 0) {
            this.deactivate();
            return;
        }

        // Collision with Enemies
        // Simple radius check
        for (const enemy of EnemyManager.enemies) {
            if (enemy.active) {
                const distSq = this.mesh.position.distanceToSquared(enemy.mesh.position);
                if (distSq < 1.0) { // Hit radius
                    const killed = enemy.takeDamage(this.damage);
                    SoundManager.playHit();
                    if (killed) {
                        GameManager.kills++;
                        XPManager.spawn(enemy.mesh.position, 1);
                        GameManager.shake(0.1, 0.5);
                    }
                    this.deactivate();
                    break; // One hit per bullet for now (unless piercing)
                }
            }
        }
    }

    deactivate() {
        this.active = false;
        this.mesh.visible = false;
    }
}
