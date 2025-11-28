import * as THREE from 'three';
import { AssetManager } from './AssetManager.js';

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
        // Simple Box Zombie
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const tex = AssetManager.textures['zombie'];
        const mat = new THREE.MeshStandardMaterial({ map: tex });

        this.mesh = new THREE.Mesh(geometry, mat);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.visible = false; // Hidden initially

        this.scene.add(this.mesh);
    }

    spawn(position, difficultyMultiplier = 1) {
        this.mesh.position.copy(position);
        this.mesh.visible = true;
        this.active = true;
        this.hp = 10 * difficultyMultiplier;
        this.maxHp = this.hp;

        // Color/Texture change based on difficulty could go here
        // For now, just standard
    }

    update(dt, playerPos) {
        if (!this.active) return;

        // Chase Player
        const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();

        this.mesh.position.add(dir.multiplyScalar(this.speed * dt));
        this.mesh.lookAt(playerPos);
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
        // Particle effect here later
    }
}
