import * as THREE from 'three';
import { InputManager } from './InputManager.js';
import { AssetManager } from './AssetManager.js';
import { ProjectileManager } from './ProjectileManager.js';
import { SoundManager } from './SoundManager.js';
import { EnemyManager } from './EnemyManager.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.speed = 10;
        this.hp = 100;
        this.maxHp = 100;
        this.weaponCooldown = 0;

        // Stats
        this.projectileCount = 1;
        this.fireRateMod = 1.0;
        this.damageMod = 1.0;

        this.init();
    }
    init() {
        // Simple 3D representation: Box
        // We map the player texture to the front (and maybe back)
        const geometry = new THREE.BoxGeometry(1, 2, 1);

        const tex = AssetManager.textures['player'];
        const matFront = new THREE.MeshStandardMaterial({ map: tex, transparent: true });
        const matSide = new THREE.MeshStandardMaterial({ color: 0x000088 }); // Uniform color for sides

        const materials = [
            matSide, // Right
            matSide, // Left
            matSide, // Top
            matSide, // Bottom
            matFront, // Front
            matFront  // Back
        ];

        this.mesh = new THREE.Mesh(geometry, materials);
        this.mesh.position.set(0, 1, 0); // On ground
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        this.scene.add(this.mesh);
    }
    update(dt) {
        const move = InputManager.moveVector;

        if (move.lengthSq() > 0) {
            // Move relative to camera orientation? 
            // For Quarter View (Fixed), Up is -Z, Right is +X.
            // InputManager gives Y+ as Up.

            const dx = move.x * this.speed * dt;
            const dz = -move.y * this.speed * dt; // Invert Y for Z axis

            this.mesh.position.x += dx;
            this.mesh.position.z += dz;

            // Rotate to face movement
            // Calculate angle
            const angle = Math.atan2(dx, dz);
            this.mesh.rotation.y = angle;
        }

        // Update HP Bar Position
        const hpBar = document.getElementById('player-hp-bar');
        if (hpBar.style.display !== 'none') {
            const vector = this.mesh.position.clone();
            vector.y += 2.5; // Above head
            vector.project(window.Game.camera); // Access camera

            const x = (vector.x * .5 + .5) * window.innerWidth;
            const y = (-(vector.y * .5) + .5) * window.innerHeight;

            hpBar.style.left = `${x}px`;
            hpBar.style.top = `${y}px`;
        }

        // Auto Attack
        this.weaponCooldown -= dt;
        if (this.weaponCooldown <= 0) {
            // Find Nearest Enemy
            let nearest = null;
            let minDistSq = Infinity;
            const rangeSq = 20 * 20;

            for (const enemy of EnemyManager.enemies) {
                if (enemy.active) {
                    const d = this.mesh.position.distanceToSquared(enemy.mesh.position);
                    if (d < rangeSq && d < minDistSq) {
                        minDistSq = d;
                        nearest = enemy;
                    }
                }
            }

            if (nearest) {
                const baseDir = new THREE.Vector3().subVectors(nearest.mesh.position, this.mesh.position);
                baseDir.y = 0;
                baseDir.normalize();

                // Fan Fire
                const count = this.projectileCount;
                const spreadAngle = Math.PI / 6; // 30 degrees total spread approx

                // Calculate start angle
                // If count is 1, angle is 0.
                // If count is 3, angles are -15, 0, +15 (approx)

                const startAngle = count > 1 ? -spreadAngle / 2 : 0;
                const stepAngle = count > 1 ? spreadAngle / (count - 1) : 0;

                for (let i = 0; i < count; i++) {
                    const angleOffset = startAngle + (stepAngle * i);

                    // Rotate baseDir by angleOffset around Y axis
                    const dir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset);

                    ProjectileManager.fireBullet(this.mesh.position, dir, this.damageMod);
                }

                SoundManager.playShoot();
                const baseRate = 0.5;
                this.weaponCooldown = baseRate * this.fireRateMod;
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;

        // Update UI
        const hpBar = document.getElementById('player-hp-bar');
        const hpFill = document.getElementById('player-hp-fill');
        hpBar.style.display = 'block';
        hpFill.style.width = `${(this.hp / this.maxHp) * 100}%`;

        // Position bar above player
        // This needs to be done in update loop ideally to follow player, 
        // but for now let's just keep it simple or update it in update()

        if (this.hp <= 0) {
            return true; // Dead
        }
        return false;
    }
}
