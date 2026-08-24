const DestructionModule = {
    combo: 0,
    score: 0,
    comboTimer: null,
    rebuildTimer: null,

    init() {
        const savedScore = localStorage.getItem('codex_score');
        if (savedScore) {
            this.score = parseInt(savedScore, 10) || 0;
        }

        window.addEventListener('contextmenu', (e) => {
            if (window._cinematicActive || window._bossActive) return;
            e.preventDefault();
            const target = e.target.closest('.destructible') ||
                           e.target.closest('.link-btn') ||
                           e.target.closest('.quote-card') ||
                           e.target.closest('.lol-card');
            if (target && !target.closest('#frag-header')) {
                this.destroyElement(target, e.clientX, e.clientY);
            }
        });

        let lastTap = 0;
        window.addEventListener('touchend', (e) => {
            if (window._cinematicActive || window._bossActive) return;
            const now = Date.now();
            if (now - lastTap < 300) {
                const touch = e.changedTouches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                const dest = target && (target.closest('.destructible') ||
                                        target.closest('.link-btn') ||
                                        target.closest('.quote-card') ||
                                        target.closest('.lol-card'));
                if (dest && !dest.closest('#frag-header')) {
                    this.destroyElement(dest, touch.clientX, touch.clientY);
                }
            }
            lastTap = now;
        });
    },

    destroyElement(el, x, y) {
        if (!el || el.classList.contains('destroyed-block') ||
            el.id === 'orbital-crosshair' || el.id === 'avatar-area' || el.id === 'frag-header') return;

        el.style.setProperty('--rx', Math.random().toFixed(2));
        el.style.setProperty('--ry', Math.random().toFixed(2));
        el.style.setProperty('--rr', Math.random().toFixed(2));
        el.classList.add('destroyed-block');

        this.combo++;
        const basePts = 100;
        const earnedPts = basePts * this.combo;
        this.score += earnedPts;
        localStorage.setItem('codex_score', this.score.toString());

        let tierColor = '#dad4bb';
        let tierText = `x${this.combo} (+${earnedPts})`;
        if (this.combo >= 2 && this.combo < 5) tierColor = '#43b581';
        else if (this.combo >= 5 && this.combo < 9) tierColor = '#00b0f4';
        else if (this.combo >= 9 && this.combo < 14) tierColor = '#ff73fa';
        else if (this.combo >= 14) {
            tierColor = '#ffd700';
            tierText = `DIVINO x${this.combo} (+${earnedPts})`;
        }

        this.showComboPopup(x, y, tierText, tierColor);
        this.updateComboHud();

        if (this.combo === 10 && typeof OrbitalModule !== 'undefined' && !OrbitalModule.hasRailgun) {
            OrbitalModule.unlockRailgun('combo');
        }

        clearTimeout(this.comboTimer);
        this.comboTimer = setTimeout(() => {
            this.combo = 0;
            this.updateComboHud();
        }, 4000);

        ParticleEngine.explode(x, y, tierColor, 12);
        AudioManager.beep(220 + (this.combo * 15), 0.15, 'sawtooth');

        clearTimeout(this.rebuildTimer);
        this.rebuildTimer = setTimeout(() => {
            this.restoreAll();
            this.combo = 0;
            this.updateComboHud();
        }, 3000);
    },

    showComboPopup(x, y, text, color) {
        const pop = document.createElement('div');
        pop.className = 'combo-popup';
        pop.style.left = `${x}px`;
        pop.style.top = `${y}px`;
        pop.style.color = color;
        pop.style.fontSize = Math.min(1.4, 0.8 + (this.combo * 0.05)) + 'rem';
        pop.style.textShadow = `0 0 12px ${color}`;
        pop.textContent = text;
        document.body.appendChild(pop);
        setTimeout(() => pop.remove(), 800);
    },

    updateComboHud() {
        const hud = document.getElementById('combo-hud');
        if (!hud) return;
        if (this.combo > 1) {
            hud.classList.add('active');
            hud.textContent = `COMBO x${this.combo} // PTS: ${this.score}`;
            if (this.combo >= 14) {
                hud.style.color = '#ffd700';
                hud.style.textShadow = '0 0 15px #ffd700, 0 0 30px #fff';
            } else if (this.combo >= 9) {
                hud.style.color = '#ff73fa';
                hud.style.textShadow = '0 0 12px #ff73fa';
            } else {
                hud.style.color = '#43b581';
                hud.style.textShadow = '0 0 10px #43b581';
            }
        } else {
            hud.classList.remove('active');
        }
    },

    restoreAll() {
        const destroyed = document.querySelectorAll('.destroyed-block');
        if (destroyed.length === 0) return;

        destroyed.forEach(el => {
            el.classList.remove('destroyed-block');
            el.classList.add('restoring-block');
            setTimeout(() => el.classList.remove('restoring-block'), 550);
        });

        AudioManager.legoClickPop();
        AudioManager.playAudio(CODEX_DATA.sounds.legoPop);
    },

    triggerTotalDestruction() {
        const allBlocks = document.querySelectorAll('.destructible, .link-btn, .quote-card, .lol-card, .tab-btn, .pc-side-panel');
        allBlocks.forEach(el => {
            el.style.setProperty('--rx', Math.random().toFixed(2));
            el.style.setProperty('--ry', Math.random().toFixed(2));
            el.style.setProperty('--rr', Math.random().toFixed(2));
            el.classList.add('destroyed-block');
            const r = el.getBoundingClientRect();
            ParticleEngine.explode(r.left + r.width / 2, r.top + r.height / 2, '#dad4bb', 12);
        });

        AudioManager.beep(110, 0.5, 'sawtooth', 0.09);
        clearTimeout(this.rebuildTimer);
        this.rebuildTimer = setTimeout(() => this.restoreAll(), 2500);
    }
};