export class SoundManager {
    static ctx = null;

    static init() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            SoundManager.ctx = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    static playTone(freq, type, duration, vol = 0.1) {
        if (!SoundManager.ctx) return;
        const osc = SoundManager.ctx.createOscillator();
        const gain = SoundManager.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, SoundManager.ctx.currentTime);

        gain.gain.setValueAtTime(vol, SoundManager.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, SoundManager.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(SoundManager.ctx.destination);

        osc.start();
        osc.stop(SoundManager.ctx.currentTime + duration);
    }

    static playShoot() {
        // Pew pew
        if (!SoundManager.ctx) return;
        const osc = SoundManager.ctx.createOscillator();
        const gain = SoundManager.ctx.createGain();

        osc.frequency.setValueAtTime(600, SoundManager.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, SoundManager.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, SoundManager.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, SoundManager.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(SoundManager.ctx.destination);

        osc.start();
        osc.stop(SoundManager.ctx.currentTime + 0.1);
    }

    static playHit() {
        SoundManager.playTone(100, 'square', 0.1, 0.1);
    }

    static playCollect() {
        SoundManager.playTone(800, 'sine', 0.1, 0.05);
    }

    static playLevelUp() {
        // Arpeggio
        setTimeout(() => SoundManager.playTone(400, 'square', 0.2, 0.1), 0);
        setTimeout(() => SoundManager.playTone(500, 'square', 0.2, 0.1), 100);
        setTimeout(() => SoundManager.playTone(600, 'square', 0.4, 0.1), 200);
    }
}
