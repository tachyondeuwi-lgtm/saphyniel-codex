const OrbitalModule = {
    hasRailgun: false,
    hasFiredFirstBombardment: false,
    avatarHoverAttempts: 0,
    isDragging: false,
    startX: 0,
    startY: 0,

    init() {
        // Cargar estado persistente de railgun
        if (localStorage.getItem('codex_railgun_unlocked') === 'true') {
            this.hasRailgun = true;
            this.hasFiredFirstBombardment = true;
            const cross = document.getElementById('orbital-crosshair');
            if (cross) cross.classList.add('unlocked');
        }

        const cross = document.getElementById('orbital-crosshair');
        const ghost = document.getElementById('ghost-target');
        if (!cross || !ghost) return;

        const onStart = (e) => {
            if (!this.hasRailgun || window._cinematicActive || window._bossActive) return;
            this.isDragging = true;
            ghost.classList.add('active');
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            this.startX = clientX - cross.offsetLeft;
            this.startY = clientY - cross.offsetTop;
        };

        const onMove = (e) => {
            if (!this.isDragging || !this.hasRailgun || window._cinematicActive || window._bossActive) return;
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            const nx = clientX - this.startX;
            const ny = clientY - this.startY;
            cross.style.left = `${nx}px`;
            cross.style.top = `${ny}px`;
            cross.style.right = 'auto';

            const avR = document.getElementById('avatar-area').getBoundingClientRect();
            const distToAvatar = Math.hypot(clientX - (avR.left + avR.width / 2), clientY - (avR.top + avR.height / 2));
            const distToCenter = Math.hypot(clientX - (window.innerWidth / 2), clientY - (window.innerHeight / 2));

            if (!this.hasFiredFirstBombardment && distToAvatar < 75) {
                cross.style.borderColor = '#ff3333';
                cross.style.boxShadow = '0 0 20px #ff0000';
            } else if (distToAvatar < 70 || distToCenter < 90) {
                cross.style.borderColor = '#ff3333';
                cross.style.boxShadow = '0 0 20px #ff0000';
            } else {
                cross.style.borderColor = 'rgba(218, 212, 187, 0.75)';
                cross.style.boxShadow = 'none';
            }
        };

        const onEnd = () => {
            if (!this.isDragging || !this.hasRailgun) return;
            this.isDragging = false;
            ghost.classList.remove('active');
            if (window._cinematicActive || window._bossActive) return;

            const cr = cross.getBoundingClientRect();
            const cx = cr.left + cr.width / 2;
            const cy = cr.top + cr.height / 2;

            const avR = document.getElementById('avatar-area').getBoundingClientRect();
            const distToAvatar = Math.hypot(cx - (avR.left + avR.width / 2), cy - (avR.top + avR.height / 2));
            const distToCenter = Math.hypot(cx - (window.innerWidth / 2), cy - (window.innerHeight / 2));

            if (!this.hasFiredFirstBombardment && distToAvatar < 75) {
                cross.style.top = '25px';
                cross.style.right = '25px';
                cross.style.left = 'auto';
                DialogueSystem.show({
                    text: "Te dije que apuntaras al centro del Códice, no hacia mí...",
                    speaker: "SAPHYNIEL",
                    tone: "low",
                    autoHideTime: 2600
                });
                AudioManager.beep(160, 0.25, 'sawtooth');
                ScreenUtils.triggerShake('main-hud');
                return;
            }

            if (distToAvatar < 70) {
                this.avatarHoverAttempts++;

                if (window._bossBeaten) {
                    if (this.avatarHoverAttempts === 1) {
                        DialogueSystem.show({ text: CODEX_DATA.orbitalWarnings.repeatFight[0].text, speaker: "SAPHYNIEL", tone: "mid", autoHideTime: 2800 });
                    } else if (this.avatarHoverAttempts === 2) {
                        DialogueSystem.show({ text: CODEX_DATA.orbitalWarnings.repeatFight[1].text, speaker: "SAPHYNIEL", tone: "low", autoHideTime: 2800 });
                    } else {
                        DialogueSystem.show({
                            text: CODEX_DATA.orbitalWarnings.repeatFight[2].text,
                            speaker: "SAPHYNIEL",
                            tone: "angry",
                            autoHideTime: 1500,
                            callback: () => this.startBossLaunchSequence()
                        });
                    }
                } else {
                    if (this.avatarHoverAttempts === 1) {
                        DialogueSystem.show({ text: CODEX_DATA.orbitalWarnings.attempt1, speaker: "SAPHYNIEL", tone: "mid", autoHideTime: 2800 });
                    } else if (this.avatarHoverAttempts === 2) {
                        DialogueSystem.show({ text: CODEX_DATA.orbitalWarnings.attempt2, speaker: "SAPHYNIEL", tone: "low", autoHideTime: 2800 });
                    } else {
                        DialogueSystem.show({
                            text: CODEX_DATA.orbitalWarnings.attempt3,
                            speaker: "SAPHYNIEL",
                            tone: "angry",
                            autoHideTime: 1500,
                            callback: () => this.startBossLaunchSequence()
                        });
                    }
                }
            } else if (distToCenter < 90) {
                this.startOrbitalBombardment();
            }
        };

        cross.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        cross.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd);
    },

    unlockRailgun(source = "unknown") {
        if (this.hasRailgun || window._bossActive || window._cinematicActive) return;
        this.hasRailgun = true;
        localStorage.setItem('codex_railgun_unlocked', 'true');

        window._cinematicActive = true;
        const dropEl = document.getElementById('railgun-drop');
        if (dropEl) dropEl.classList.add('dropping');

        AudioManager.playAudio(CODEX_DATA.sounds.angelCoro, 0.7);
        ParticleEngine.explode(window.innerWidth / 2, window.innerHeight * 0.35, '#ffffff', 50);

        setTimeout(() => {
            ScreenUtils.triggerShake('main-hud');
            ParticleEngine.explode(window.innerWidth / 2, window.innerHeight * 0.35, '#dad4bb', 70);

            setTimeout(() => {
                if (dropEl) dropEl.classList.remove('dropping');
                window._cinematicActive = false;

                DialogueSystem.show({
                    text: "¿Esa reliquia orbital...? No sé qué registros alteraste para invocarla, pero admite que tiene estilo.",
                    speaker: "SAPHYNIEL",
                    tone: "mid",
                    autoHideTime: 3600,
                    callback: () => {
                        DialogueSystem.show({
                            text: "Prueba su potencia. Arrastra la mira hacia el centro de la pantalla y destruye la interfaz.",
                            speaker: "SAPHYNIEL",
                            tone: "mid",
                            autoHideTime: 3800,
                            callback: () => {
                                const cross = document.getElementById('orbital-crosshair');
                                const ghost = document.getElementById('ghost-target');
                                if (cross) cross.classList.add('unlocked');
                                if (ghost) ghost.classList.add('guide-mode');
                            }
                        });
                    }
                });
            }, 900);
        }, 1100);
    },

    startOrbitalBombardment() {
        if (window._cinematicActive || window._bossActive) return;
        
        const ghost = document.getElementById('ghost-target');
        if (ghost) ghost.classList.remove('guide-mode');

        const countEl = document.getElementById('orbital-countdown');
        const beamEl = document.getElementById('orbital-beam');
        countEl.style.display = 'block';
        let count = 3;
        countEl.textContent = count;
        AudioManager.beep(800, 0.1, 'sawtooth');

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countEl.textContent = count;
                AudioManager.beep(800, 0.1, 'sawtooth');
            } else {
                clearInterval(timer);
                countEl.style.display = 'none';
                beamEl.classList.add('firing');
                ScreenUtils.triggerShake('main-hud');
                AudioManager.swordImpactSound();
                DestructionModule.triggerTotalDestruction();

                setTimeout(() => { 
                    beamEl.classList.remove('firing'); 
                    
                    if (!this.hasFiredFirstBombardment) {
                        this.hasFiredFirstBombardment = true;
                        setTimeout(() => {
                            DialogueSystem.show({
                                text: "Vaya... había olvidado lo devastador que se siente ese impacto.",
                                speaker: "SAPHYNIEL",
                                tone: "mid",
                                autoHideTime: 3200,
                                callback: () => {
                                    DialogueSystem.show({
                                        text: "Solo mantén esa mira lejos de mi avatar... por nuestro bien, ¿de acuerdo?",
                                        speaker: "SAPHYNIEL",
                                        tone: "low",
                                        autoHideTime: 3500
                                    });
                                }
                            });
                        }, 900);
                    }
                }, 350);
            }
        }, 700);
    },

    startBossLaunchSequence() {
        window._cinematicActive = true;
        DestructionModule.restoreAll();
        document.getElementById('orbital-crosshair').style.display = 'none';

        const countEl = document.getElementById('orbital-countdown');
        countEl.style.display = 'block';
        let count = 3;
        countEl.textContent = count;
        AudioManager.beep(800, 0.1, 'sawtooth');

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countEl.textContent = count;
                AudioManager.beep(800, 0.1, 'sawtooth');
            } else {
                clearInterval(timer);
                countEl.style.display = 'none';
                
                const flash = document.getElementById('flash-screen');
                flash.classList.add('active');
                AudioManager.playAudio(CODEX_DATA.sounds.vineBoom);

                setTimeout(() => {
                    flash.classList.remove('active');
                    const frame = document.getElementById('boss-frame');
                    frame.classList.add('active');
                    
                    ParticleEngine.pause();
                    
                    frame.contentWindow.postMessage({ type: 'START_BOSS' }, window.location.origin === 'null' || window.location.protocol === 'file:' ? '*' : window.location.origin);
                    window._bossActive = true;
                    window._cinematicActive = false;
                }, 120);
            }
        }, 700);
    }
};