import * as THREE from 'three';

export class AssetManager {
    static textures = {};

    static async loadAll() {
        const loader = new THREE.TextureLoader();

        // Helper to load texture with promise
        const loadTexture = (name, path) => {
            return new Promise((resolve) => {
                let timedOut = false;
                const timer = setTimeout(() => {
                    timedOut = true;
                    console.warn(`Timeout loading ${path}, using placeholder.`);
                    AssetManager.textures[name] = AssetManager.createPlaceholder(name);
                    resolve();
                }, 2000); // 2 second timeout

                loader.load(path, (tex) => {
                    if (timedOut) return;
                    clearTimeout(timer);
                    console.log(`Loaded texture: ${name}`);
                    tex.magFilter = THREE.NearestFilter; // Pixel art look
                    tex.minFilter = THREE.NearestFilter;
                    tex.colorSpace = THREE.SRGBColorSpace;
                    AssetManager.textures[name] = tex;
                    resolve();
                }, undefined, (err) => {
                    if (timedOut) return;
                    clearTimeout(timer);
                    console.warn(`Failed to load ${path}, using placeholder. Error:`, err);
                    AssetManager.textures[name] = AssetManager.createPlaceholder(name);
                    resolve();
                });
            });
        };

        // Load Player (Generated)
        await loadTexture('player', './assets/textures/player.png');
        await loadTexture('floor_real', './assets/textures/floor_real.jpg');
        await loadTexture('wall_real', './assets/textures/wall_real.jpg');

        // Generate Placeholders for others (Quota limit)
        AssetManager.textures['zombie'] = AssetManager.createPlaceholder('zombie', '#00ff00'); // Green
        AssetManager.textures['floor'] = AssetManager.createPlaceholder('floor', '#555555', true); // Grey Grid
        AssetManager.textures['wall'] = AssetManager.createPlaceholder('wall', '#aaaaaa'); // Whiteish
    }

    static createPlaceholder(name, color = '#ff00ff', isGrid = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Fill
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 64, 64);

        // Pattern
        if (isGrid) {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, 64, 64);
        } else {
            // Simple face or detail
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(10, 10, 20, 20); // Eye/Detail
            ctx.fillRect(34, 10, 20, 20); // Eye/Detail
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }
}
