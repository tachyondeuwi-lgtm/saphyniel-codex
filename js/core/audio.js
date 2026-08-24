const AudioManager = {
    ctx: null,
    enabled: true,
    bgmTrack: null,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggleSound(buttonId = 'sound-btn') {
        this.init();
        this.enabled = !this.enabled;
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.textContent = this.enabled ? "[ AUDIO: ACTIVO ]" : "[ AUDIO: SILENCIADO ]";
        }
        if (this.enabled) {
            this.beep(880, 0.05, 'sine');
        } else {
            this.stopBgm();
        }
        return this.enabled;
    },

    beep(freq, duration, type = 'sine', volume = 0.04) {
        if (!this.enabled) return;
        this.init();
        try {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    },

    balatroVoice(tone = 'mid') {
        if (!this.enabled) return;
        this.init();
        try {
            if (!this.ctx) return;
            const tones = {
                low: [160, 210, 185],
                mid: [320, 420, 360, 480],
                high: [580, 720, 640, 800],
                angry: [110, 140, 95, 130],
                yandere: [420, 560, 680, 820]
            };
            const pool = tones[tone] || tones.mid;
            for (let k = 0; k < 4; k++) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const freq = pool[Math.floor(Math.random() * pool.length)];
                osc.type = tone === 'angry' ? 'sawtooth' : 'triangle';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + (k * 0.045));
                gain.gain.setValueAtTime(0.04, this.ctx.currentTime + (k * 0.045));
                gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + (k * 0.045) + 0.04);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + (k * 0.045));
                osc.stop(this.ctx.currentTime + (k * 0.045) + 0.045);
            }
        } catch (e) {}
    },

    liturgicalChime() {
        this.beep(523.25, 2.2, 'sine', 0.07);
        setTimeout(() => this.beep(659.25, 2.0, 'sine', 0.05), 180);
        setTimeout(() => this.beep(783.99, 2.4, 'sine', 0.04), 360);
    },

    swordImpactSound() {
        this.beep(120, 0.4, 'sawtooth', 0.08);
        this.beep(880, 0.6, 'triangle', 0.06);
        setTimeout(() => this.beep(1760, 0.5, 'sine', 0.04), 50);
    },

    legoClickPop() {
        const freqs = [620, 840, 1120, 1480];
        freqs.forEach((f, idx) => {
            setTimeout(() => this.beep(f, 0.06, 'triangle', 0.06), idx * 40);
        });
    },

    playAudio(url, volume = 0.35) {
        if (!this.enabled || !url) return;
        try {
            const audio = new Audio(url);
            audio.volume = volume;
            audio.play().catch(() => {});
        } catch (e) {}
    },

    playBgm(trackUrl, volume = 0.3) {
        if (!this.enabled || !trackUrl) return;
        try {
            if (this.bgmTrack) {
                this.bgmTrack.pause();
                this.bgmTrack.currentTime = 0;
            }
            this.bgmTrack = new Audio(trackUrl);
            this.bgmTrack.volume = volume;
            this.bgmTrack.loop = true;
            this.bgmTrack.play().catch(() => {});
        } catch (e) {}
    },

    stopBgm() {
        if (this.bgmTrack) {
            this.bgmTrack.pause();
            this.bgmTrack.currentTime = 0;
            this.bgmTrack = null;
        }
    }
};

window.addEventListener('click', () => AudioManager.init(), { once: true });
window.addEventListener('touchstart', () => AudioManager.init(), { once: true });