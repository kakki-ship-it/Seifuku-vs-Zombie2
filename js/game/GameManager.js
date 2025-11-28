import * as THREE from 'three';
import { Player } from './Player.js';
import { AssetManager } from './AssetManager.js';
import { EnemyManager } from './EnemyManager.js';
import { ProjectileManager } from './ProjectileManager.js';
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

    static init() {
        GameManager.scene = window.Game.scene;

        // Setup Map
        GameManager.createMap();

        // Setup Managers
        EnemyManager.init(GameManager.scene);
        ProjectileManager.init(GameManager.scene);
        XPManager.init(GameManager.scene);

        // Setup Player
        GameManager.player = new Player(GameManager.scene);

        // UI Listeners
        document.getElementById('start-btn').addEventListener('click', GameManager.startGame);
        document.getElementById('restart-btn').addEventListener('click', GameManager.restartGame);
    }

    static createMap() {
        // Floor
        const floorTex = AssetManager.textures['floor'];
        floorTex.wrapS = THREE.RepeatWrapping;
        floorTex.wrapT = THREE.RepeatWrapping;
        floorTex.repeat.set(20, 20);

        const planeGeo = new THREE.PlaneGeometry(100, 100);
        const planeMat = new THREE.MeshStandardMaterial({ map: floorTex });
        const floor = new THREE.Mesh(planeGeo, planeMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        GameManager.scene.add(floor);
    }

    static startGame() {
        SoundManager.init();
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
            GameManager.player.update(dt);
            EnemyManager.update(dt, GameManager.player.mesh.position);
            ProjectileManager.update(dt);
            XPManager.update(dt, GameManager.player.mesh.position);

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
