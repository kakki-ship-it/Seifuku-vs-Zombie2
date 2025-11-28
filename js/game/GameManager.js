import * as THREE from 'three';
import { Player } from './Player.js';
import { AssetManager } from './AssetManager.js';
import { EnemyManager } from './EnemyManager.js';
import { ProjectileManager } from './ProjectileManager.js';
import { EffectManager } from './EffectManager.js';
import { XPManager } from './XPManager.js';
import { UpgradeManager } from './UpgradeManager.js';
import { SoundManager } from './SoundManager.js';

export class GameManager {
    static scene = null;
    static player = null;
    static isPlaying = false;
    static isPaused = false;
    static timeRemaining = 180; // 3 minutes
    static kills = 0;

    // Shake
    static shakeDuration = 0;
    static shakeIntensity = 0;

    // Map / Collision
    static obstacles = []; // Array of Box3
    static mapBounds = { minX: -48, maxX: 48, minZ: -48, maxZ: 48 }; // Slightly inside 50

    static init() {
        GameManager.scene = window.Game.scene;

        // Setup Map
        GameManager.createMap();

        // Setup Managers
        EnemyManager.init(GameManager.scene);
        ProjectileManager.init(GameManager.scene);
        XPManager.init(GameManager.scene);
        EffectManager.init(GameManager.scene);

        // Setup Player
        GameManager.player = new Player(GameManager.scene);

        // UI Listeners
        const startBtn = document.getElementById('start-btn');
        startBtn.addEventListener('click', GameManager.startGame);
        startBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent double fire
            GameManager.startGame();
        }, { passive: false });

        document.getElementById('restart-btn').addEventListener('click', GameManager.restartGame);
        document.getElementById('restart-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            GameManager.restartGame();
        }, { passive: false });
    }

    static createMap() {
        GameManager.obstacles = [];

        // Floor
        const floorTex = AssetManager.textures['floor_real'] || AssetManager.textures['floor'];
        floorTex.wrapS = THREE.RepeatWrapping;
        floorTex.wrapT = THREE.RepeatWrapping;
        floorTex.repeat.set(20, 20);

        const planeGeo = new THREE.PlaneGeometry(100, 100);
        const planeMat = new THREE.MeshStandardMaterial({ map: floorTex });
        const floor = new THREE.Mesh(planeGeo, planeMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        GameManager.scene.add(floor);

        // Walls (Perimeter)
        const wallTex = AssetManager.textures['wall_real'] || AssetManager.textures['wall'];
        wallTex.wrapS = THREE.RepeatWrapping;
        wallTex.wrapT = THREE.RepeatWrapping;
        wallTex.repeat.set(20, 1); // Repeat horizontally

        const wallHeight = 4;
        const wallGeo = new THREE.BoxGeometry(100, wallHeight, 1);
        const wallMat = new THREE.MeshStandardMaterial({ map: wallTex });

        // Helper to add wall collision
        const addWall = (mesh) => {
            GameManager.scene.add(mesh);
            // We don't strictly need Box3 for perimeter if we use simple bounds check,
            // but for consistency let's rely on mapBounds for perimeter and obstacles for internal.
        };

        const wall1 = new THREE.Mesh(wallGeo, wallMat);
        wall1.position.set(0, wallHeight / 2, -50);
        addWall(wall1);

        const wall2 = new THREE.Mesh(wallGeo, wallMat);
        wall2.position.set(0, wallHeight / 2, 50);
        addWall(wall2);

        const wall3 = new THREE.Mesh(wallGeo, wallMat);
        wall3.rotation.y = Math.PI / 2;
        wall3.position.set(-50, wallHeight / 2, 0);
        addWall(wall3);

        const wall4 = new THREE.Mesh(wallGeo, wallMat);
        wall4.rotation.y = Math.PI / 2;
        wall4.position.set(50, wallHeight / 2, 0);
        addWall(wall4);

        // Random Pillars
        const pillarGeo = new THREE.BoxGeometry(2, 4, 2);
        const pillarMat = new THREE.MeshStandardMaterial({ map: wallTex }); // Use wall texture for now

        for (let i = 0; i < 10; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;

            // Avoid center (spawn)
            if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;

            const pillar = new THREE.Mesh(pillarGeo, pillarMat);
            pillar.position.set(x, 2, z);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            GameManager.scene.add(pillar);

            // Add collision box
            const box = new THREE.Box3().setFromObject(pillar);
            GameManager.obstacles.push(box);
        }
    }

    static startGame() {
        SoundManager.init();
        if (SoundManager.ctx && SoundManager.ctx.state === 'suspended') {
            SoundManager.ctx.resume();
        }
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('ui-layer').style.pointerEvents = 'none'; // Allow click through
        GameManager.isPlaying = true;
        GameManager.isPaused = false;
        GameManager.timeRemaining = 180;
        GameManager.kills = 0;
        GameManager.updateHUD();
    }

    static restartGame() {
        location.reload(); // Simple restart
    }

    static update(dt) {
        if (!GameManager.isPlaying || GameManager.isPaused) return;

        // Timer
        GameManager.timeRemaining -= dt;
        if (GameManager.timeRemaining <= 0) {
            GameManager.gameOver();
        }
        GameManager.updateHUD();

        // Updates
        if (GameManager.player) {
            GameManager.player.update(dt, GameManager.obstacles, GameManager.mapBounds);
            EnemyManager.update(dt, GameManager.player.mesh.position, GameManager.obstacles);
            ProjectileManager.update(dt, GameManager.obstacles, (enemyPos) => {
                GameManager.kills++;
                XPManager.spawn(enemyPos, 1);
                // GameManager.shake(0.1, 0.5); // Disabled by user request
            });
            XPManager.update(dt, GameManager.player.mesh.position);
            EffectManager.update(dt);

            // Player-Enemy Collision
            for (const enemy of EnemyManager.enemies) {
                if (enemy.active) {
                    const distSq = GameManager.player.mesh.position.distanceToSquared(enemy.mesh.position);
                    if (distSq < 1.0) { // Collision radius
                        const dead = GameManager.player.takeDamage(10 * dt); // DPS
                        if (dead) {
                            GameManager.gameOver();
                        }
                    }
                }
            }
        }

        // Screen Shake
        if (GameManager.shakeDuration > 0) {
            GameManager.shakeDuration -= dt;
            const rx = (Math.random() - 0.5) * GameManager.shakeIntensity;
            const ry = (Math.random() - 0.5) * GameManager.shakeIntensity;
            const rz = (Math.random() - 0.5) * GameManager.shakeIntensity;

            window.Game.camera.position.add(new THREE.Vector3(rx, ry, rz));

            if (GameManager.shakeDuration <= 0) {
                // Reset logic handled in main loop camera follow, but we might drift slightly.
                // The main loop lerps camera, so it should self-correct.
            }
        }
    }

    static shake(duration, intensity) {
        GameManager.shakeDuration = duration;
        GameManager.shakeIntensity = intensity;
    }

    static updateHUD() {
        const mins = Math.floor(GameManager.timeRemaining / 60);
        const secs = Math.floor(GameManager.timeRemaining % 60);
        document.getElementById('hud-time').innerText = `TIME: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        document.getElementById('hud-kills').innerText = `KILLS: ${GameManager.kills}`;
    }

    static triggerLevelUp() {
        GameManager.isPaused = true;
        const screen = document.getElementById('levelup-screen');
        screen.classList.remove('hidden');

        const container = document.getElementById('upgrade-container');
        container.innerHTML = '';

        const options = UpgradeManager.getOptions();
        options.forEach(opt => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `<div class="upgrade-title">${opt.name}</div><div class="upgrade-desc">${opt.desc}</div>`;
            card.onclick = () => GameManager.selectUpgrade(opt.id);
            card.addEventListener('touchstart', (e) => {
                console.log('Card touchstart fired for:', opt.name);
                e.preventDefault(); // Prevent double fire if click also fires
                GameManager.selectUpgrade(opt.id);
            }, { passive: false });
            container.appendChild(card);
        });
    }

    static selectUpgrade(id) {
        UpgradeManager.applyUpgrade(id);
        document.getElementById('levelup-screen').classList.add('hidden');
        GameManager.isPaused = false;
    }

    static gameOver() {
        GameManager.isPlaying = false;
        document.getElementById('gameover-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = `Kills: ${GameManager.kills}`;
    }
}
