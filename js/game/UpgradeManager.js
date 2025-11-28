import { GameManager } from './GameManager.js';

export class UpgradeManager {
    static upgrades = [
        { id: 'speed', name: 'Emergency Evasion', desc: 'Move Speed +20%', type: 'stat' },
        { id: 'rate', name: 'Assault Shower', desc: 'Add Projectile & Fire Rate +20%', type: 'weapon' },
        { id: 'damage', name: 'Ammo Belt', desc: 'Damage +50%', type: 'weapon' },
        { id: 'hp', name: 'Kevlar Vest', desc: 'Max HP +20', type: 'stat' },
    ];

    static getOptions() {
        // Return 3 random options
        const shuffled = [...UpgradeManager.upgrades].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }

    static applyUpgrade(id) {
        const player = GameManager.player;

        switch (id) {
            case 'speed':
                player.speed *= 1.2;
                break;
            case 'rate':
                player.projectileCount = (player.projectileCount || 1) + 2;
                player.fireRateMod = (player.fireRateMod || 1.0) * 0.8; // Faster
                break;
            case 'damage':
                if (!player.damageMod) player.damageMod = 1.0;
                player.damageMod *= 1.5;
                break;
            case 'hp':
                player.maxHp += 20;
                player.hp += 20;
                break;
        }
        console.log(`Applied upgrade: ${id}`);
    }
}
