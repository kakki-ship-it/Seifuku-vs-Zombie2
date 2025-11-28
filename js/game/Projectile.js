import * as THREE from 'three';

export class Projectile {
    constructor(scene, position, direction, damage) {
        this.scene = scene;
        this.mesh = null;
        this.speed = 20;
        this.damage = damage;
        this.active = false;
        this.lifeTime = 0;
        this.direction = new THREE.Vector3();

        this.init();
        this.fire(position, direction);
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
        if (!this.active) return false;

        // Move
        this.mesh.position.add(this.direction.clone().multiplyScalar(this.speed * dt));

        // Lifetime
        this.lifeTime -= dt;
        if (this.lifeTime <= 0) {
            this.deactivate();
            return false;
        }

        return true;
    }

    deactivate() {
        this.active = false;
        this.mesh.visible = false;
    }
}
