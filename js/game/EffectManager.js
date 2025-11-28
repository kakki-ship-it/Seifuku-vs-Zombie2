import * as THREE from 'three';

export class EffectManager {
    static scene = null;
    static particles = [];

    static init(scene) {
        EffectManager.scene = scene;
        EffectManager.particles = [];
    }

    static spawnBlood(position, color = 0x55aa55, count = 10) {
        const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const mat = new THREE.MeshStandardMaterial({ color: color });

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);

            // Random velocity
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                (Math.random() * 5) + 2, // Upward bias
                (Math.random() - 0.5) * 5
            );

            EffectManager.scene.add(mesh);
            EffectManager.particles.push({ mesh, velocity, life: 1.0 });
        }
    }

    static update(dt) {
        for (let i = EffectManager.particles.length - 1; i >= 0; i--) {
            const p = EffectManager.particles[i];
            p.life -= dt;

            if (p.life <= 0) {
                EffectManager.scene.remove(p.mesh);
                p.mesh.geometry.dispose(); // Cleanup
                EffectManager.particles.splice(i, 1);
                continue;
            }

            // Physics
            p.velocity.y -= 15 * dt; // Gravity
            p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
            p.mesh.rotation.x += p.velocity.z * dt;
            p.mesh.rotation.z -= p.velocity.x * dt;

            // Ground collision
            if (p.mesh.position.y < 0.1) {
                p.mesh.position.y = 0.1;
                p.velocity.y *= -0.5; // Bounce
                p.velocity.x *= 0.8; // Friction
                p.velocity.z *= 0.8;
            }

            // Shrink
            const scale = p.life;
            p.mesh.scale.set(scale, scale, scale);
        }
    }
}
