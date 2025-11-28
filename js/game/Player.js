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

        // Animation
        this.animTime = 0;
        this.leftLeg = null;
        this.rightLeg = null;
        this.leftArm = null;
        this.rightArm = null;

        this.mesh = new THREE.Group();

        // Materials
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa }); // Skin
        const hairMat = new THREE.MeshStandardMaterial({ color: 0xffe082 }); // Blonde Hair
        const shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff }); // White Shirt
        const skirtMat = new THREE.MeshStandardMaterial({ color: 0x000080 }); // Navy Skirt
        const sockMat = new THREE.MeshStandardMaterial({ color: 0xffffff }); // White Socks
        const shoeMat = new THREE.MeshStandardMaterial({ color: 0x333333 }); // Dark Shoes
        const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red Ribbon

        // Head (0.5 x 0.5 x 0.5)
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 1.5;
        head.castShadow = true;
        this.mesh.add(head);

        // Hair (Slightly larger box on top/back)
        const hairGeo = new THREE.BoxGeometry(0.55, 0.2, 0.55);
        const hair = new THREE.Mesh(hairGeo, hairMat);
        hair.position.y = 1.7;
        this.mesh.add(hair);

        // Long Hair Back
        const hairBackGeo = new THREE.BoxGeometry(0.55, 0.6, 0.2);
        const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
        hairBack.position.set(0, 1.4, -0.2);
        this.mesh.add(hairBack);

        // Body (0.4 x 0.6 x 0.3)
        const bodyGeo = new THREE.BoxGeometry(0.4, 0.6, 0.3);
        const body = new THREE.Mesh(bodyGeo, shirtMat);
        body.position.y = 0.95;
        body.castShadow = true;
        this.mesh.add(body);

        // Ribbon
        const ribbonGeo = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
        ribbon.position.set(0, 1.0, 0.15); // Chest
        this.mesh.add(ribbon);

        // Skirt (0.45 x 0.3 x 0.35)
        const skirtGeo = new THREE.BoxGeometry(0.45, 0.3, 0.35);
        const skirt = new THREE.Mesh(skirtGeo, skirtMat);
        skirt.position.y = 0.6;
        skirt.castShadow = true;
        this.mesh.add(skirt);

        // Arms (0.15 x 0.6 x 0.15)
        const armGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
        this.leftArm = new THREE.Mesh(armGeo, shirtMat); // Sleeves
        this.leftArm.position.set(-0.3, 0.95, 0);
        this.mesh.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeo, shirtMat); // Sleeves
        this.rightArm.position.set(0.3, 0.95, 0);
        this.mesh.add(this.rightArm);

        // Hands (Skin) - Attach to arms for simpler animation? 
        // For now, keep separate or just assume sleeves cover hands for voxel simplicity.
        // Let's attach hands to arms if we want them to move together, but simple rotation is fine.
        // Actually, let's just make the arms slightly longer or add hands as children of arms.
        // For simplicity, I'll just animate the arm meshes I created.
        const handGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
        const leftHand = new THREE.Mesh(handGeo, skinMat);
        leftHand.position.set(-0.3, 0.6, 0);
        this.mesh.add(leftHand);

        const rightHand = new THREE.Mesh(handGeo, skinMat);
        rightHand.position.set(0.3, 0.6, 0);
        this.mesh.add(rightHand);

        // Gun
        const gunGroup = new THREE.Group();
        const gunMat = new THREE.MeshStandardMaterial({ color: 0x222222 }); // Black

        // Barrel
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.4), gunMat);
        barrel.position.set(0, 0, 0.2);
        gunGroup.add(barrel);

        // Handle
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), gunMat);
        handle.position.set(0, 0.1, 0); // Moved up (which becomes down in arm space)
        handle.rotation.x = -Math.PI / 4; // Angled back
        gunGroup.add(handle);

        // Attach Gun to Right Arm
        gunGroup.position.set(0, -0.3, 0.15); // Relative to Arm center
        gunGroup.rotation.x = -Math.PI / 2; // Rotate to point forward (Align Z with Arm Y)
        this.rightArm.add(gunGroup);

        // Legs (Socks)
        const legGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
        this.leftLeg = new THREE.Mesh(legGeo, sockMat);
        this.leftLeg.position.set(-0.1, 0.35, 0);
        this.mesh.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeo, sockMat);
        this.rightLeg.position.set(0.1, 0.35, 0);
        this.mesh.add(this.rightLeg);

        // Shoes - Attach to legs?
        // For now, static shoes or just part of leg animation.
        // Let's just animate the legs and assume shoes move with them (visually close enough).
        const shoeGeo = new THREE.BoxGeometry(0.17, 0.15, 0.2);
        const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
        leftShoe.position.set(-0.1, 0.075, 0);
        this.mesh.add(leftShoe);

        const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
        rightShoe.position.set(0.1, 0.075, 0);
        this.mesh.add(rightShoe);

        this.mesh.position.set(0, 0, 0); // On ground
        this.scene.add(this.mesh);
    }
    update(dt, obstacles, bounds) {
        const move = InputManager.moveVector;
        let isMoving = false;

        if (move.lengthSq() > 0) {
            isMoving = true;
            // Move relative to camera orientation? 
            // For Quarter View (Fixed), Up is -Z, Right is +X.
            // InputManager gives Y+ as Up.

            const dx = move.x * this.speed * dt;
            const dz = -move.y * this.speed * dt; // Invert Y for Z axis

            // Collision Detection
            const nextPos = this.mesh.position.clone();
            nextPos.x += dx;
            nextPos.z += dz;

            // 1. Map Bounds
            // const bounds = GameManager.mapBounds; // Passed as arg
            if (nextPos.x < bounds.minX) nextPos.x = bounds.minX;
            if (nextPos.x > bounds.maxX) nextPos.x = bounds.maxX;
            if (nextPos.z < bounds.minZ) nextPos.z = bounds.minZ;
            if (nextPos.z > bounds.maxZ) nextPos.z = bounds.maxZ;

            // 2. Obstacles (Pillars)
            // Player collision box is roughly 1 unit wide, 2 units tall, 1 unit deep
            const playerBox = new THREE.Box3().setFromCenterAndSize(nextPos, new THREE.Vector3(1, 2, 1));
            let collided = false;
            for (const obs of obstacles) {
                if (playerBox.intersectsBox(obs)) {
                    collided = true;
                    break;
                }
            }

            if (!collided) {
                this.mesh.position.copy(nextPos);
            } else {
                // Slide? Simple stop for now.
                // Try moving only X
                const nextPosX = this.mesh.position.clone();
                nextPosX.x += dx;
                // Clamp bounds X
                if (nextPosX.x < bounds.minX) nextPosX.x = bounds.minX;
                if (nextPosX.x > bounds.maxX) nextPosX.x = bounds.maxX;

                const boxX = new THREE.Box3().setFromCenterAndSize(nextPosX, new THREE.Vector3(1, 2, 1));
                let colX = false;
                for (const obs of obstacles) {
                    if (boxX.intersectsBox(obs)) { colX = true; break; }
                }
                if (!colX) {
                    this.mesh.position.x = nextPosX.x;
                } else {
                    // Try moving only Z
                    const nextPosZ = this.mesh.position.clone();
                    nextPosZ.z += dz;
                    // Clamp bounds Z
                    if (nextPosZ.z < bounds.minZ) nextPosZ.z = bounds.minZ;
                    if (nextPosZ.z > bounds.maxZ) nextPosZ.z = bounds.maxZ;

                    const boxZ = new THREE.Box3().setFromCenterAndSize(nextPosZ, new THREE.Vector3(1, 2, 1));
                    let colZ = false;
                    for (const obs of obstacles) {
                        if (boxZ.intersectsBox(obs)) { colZ = true; break; }
                    }
                    if (!colZ) {
                        this.mesh.position.z = nextPosZ.z;
                    }
                }
            }

            // Rotate to face movement
            // Calculate angle
            const angle = Math.atan2(dx, dz);
            this.mesh.rotation.y = angle;
        }

        // Animation
        if (isMoving) {
            this.animTime += dt * 10;
            const legRot = Math.sin(this.animTime) * 0.5;
            const armRot = Math.cos(this.animTime) * 0.5;

            if (this.leftLeg) this.leftLeg.rotation.x = legRot;
            if (this.rightLeg) this.rightLeg.rotation.x = -legRot;
            if (this.leftArm) this.leftArm.rotation.x = armRot;
            if (this.rightArm) this.rightArm.rotation.x = -armRot; // Walking swing
        } else {
            // Reset
            if (this.leftLeg) this.leftLeg.rotation.x = 0;
            if (this.rightLeg) this.rightLeg.rotation.x = 0;
            if (this.leftArm) this.leftArm.rotation.x = 0;
            if (this.rightArm) this.rightArm.rotation.x = 0; // Reset
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
            const rangeSq = 100 * 100;

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

                    const spawnPos = this.mesh.position.clone();
                    spawnPos.y = 1.0; // Raise bullet height
                    ProjectileManager.fireBullet(spawnPos, dir, 5 * this.damageMod);
                }

                SoundManager.playShoot();

                // Attack Animation (Recoil) - Removed for permanent aim
                // if (this.rightArm) { ... }

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
