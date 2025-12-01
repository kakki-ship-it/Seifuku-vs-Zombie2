import * as THREE from 'three';
import { AssetManager } from './AssetManager.js';
import { EffectManager } from './EffectManager.js';


export class Enemy {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.speed = 3;
        this.hp = 10;
        this.maxHp = 10;
        this.active = false;

        this.init();
    }

    init() {
        // Voxel Zombie
        this.mesh = new THREE.Group();

        const skinMat = new THREE.MeshStandardMaterial({ color: 0x55aa55 }); // Green Skin
        const shirtMat = new THREE.MeshStandardMaterial({ color: 0x444444 }); // Dark Shirt
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x222233 }); // Dark Pants

        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
        head.position.y = 1.5;
        this.mesh.add(head);

        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), shirtMat);
        body.position.y = 0.9;
        this.mesh.add(body);

        // Arms (Arms forward like a zombie)
        const armGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
        const leftArm = new THREE.Mesh(armGeo, skinMat);
        leftArm.position.set(-0.35, 1.1, 0.3);
        leftArm.rotation.x = -Math.PI / 2; // Point forward
        this.mesh.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, skinMat);
        rightArm.position.set(0.35, 1.1, 0.3);
        rightArm.rotation.x = -Math.PI / 2; // Point forward
        this.mesh.add(rightArm);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const leftLeg = new THREE.Mesh(legGeo, pantsMat);
        leftLeg.position.set(-0.15, 0.3, 0);
        this.mesh.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, pantsMat);
        rightLeg.position.set(0.15, 0.3, 0);
        this.mesh.add(rightLeg);

        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    spawn(position, difficultyMultiplier = 1) {
        this.mesh.position.copy(position);
        this.mesh.visible = true;
        this.active = true;
        this.hp = 10 * difficultyMultiplier;
        this.maxHp = this.hp;
    }

    update(dt, playerPos, obstacles, otherEnemies) {
        if (!this.active) return;

        // Chase Player
        const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
        dir.y = 0; // Ignore height difference
        dir.normalize();

        // Separation (Avoid overlapping with other enemies)
        const separation = new THREE.Vector3();
        if (otherEnemies) {
            const separationRadius = 0.8; // Minimum distance between zombies
            let count = 0;
            for (const other of otherEnemies) {
                if (other === this || !other.active) continue;
                const distSq = this.mesh.position.distanceToSquared(other.mesh.position);
                if (distSq < separationRadius * separationRadius) {
                    const pushDir = new THREE.Vector3().subVectors(this.mesh.position, other.mesh.position);
                    pushDir.y = 0; // Ignore Y in separation too
                    pushDir.normalize();
                    // Weight by distance (closer = stronger push)
                    const dist = Math.sqrt(distSq);
                    const force = (separationRadius - dist) / separationRadius;
                    separation.add(pushDir.multiplyScalar(force));
                    count++;
                }
            }
            if (count > 0) {
                separation.divideScalar(count).normalize().multiplyScalar(1.5); // Separation strength
                dir.add(separation).normalize();
            }
        }

        const moveDist = this.speed * dt;
        const nextPos = this.mesh.position.clone().add(dir.clone().multiplyScalar(moveDist));
        nextPos.y = 1; // Force ground level

        // Collision with Obstacles
        const enemyBox = new THREE.Box3().setFromCenterAndSize(nextPos, new THREE.Vector3(1, 2, 1));
        let collided = false;

        if (obstacles) {
            for (const obs of obstacles) {
                if (enemyBox.intersectsBox(obs)) {
                    collided = true;
                    break;
                }
            }
        }

        if (!collided) {
            this.mesh.position.copy(nextPos);
        } else {
            // Simple slide: Try moving only X or Z? Or just stop.
            // For zombies, maybe just stop or slide along wall.
            // Let's try simple slide along X
            const nextPosX = this.mesh.position.clone();
            nextPosX.x += dir.x * moveDist;
            const boxX = new THREE.Box3().setFromCenterAndSize(nextPosX, new THREE.Vector3(1, 2, 1));
            let colX = false;
            if (obstacles) {
                for (const obs of obstacles) {
                    if (boxX.intersectsBox(obs)) { colX = true; break; }
                }
            }

            if (!colX) {
                this.mesh.position.x = nextPosX.x;
            } else {
                const nextPosZ = this.mesh.position.clone();
                nextPosZ.z += dir.z * moveDist;
                const boxZ = new THREE.Box3().setFromCenterAndSize(nextPosZ, new THREE.Vector3(1, 2, 1));
                let colZ = false;
                if (obstacles) {
                    for (const obs of obstacles) {
                        if (boxZ.intersectsBox(obs)) { colZ = true; break; }
                    }
                }
                if (!colZ) {
                    this.mesh.position.z = nextPosZ.z;
                }
            }
        }

        this.mesh.lookAt(new THREE.Vector3(playerPos.x, this.mesh.position.y, playerPos.z));
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.die();
            return true; // Killed
        }
        return false;
    }

    die() {
        this.active = false;
        this.mesh.visible = false;
        EffectManager.spawnBlood(this.mesh.position);
    }
}
