const BOSS_AUDIO_PATHS = {
    bgmPhase1: "audio/bgm/boss-music-fase1.mp3",
    bgmPhase2: "audio/bgm/boss-music-fase2.mp3",
    bgmPhase3: "audio/bgm/boss-music-fase3.mp3",
    bossIntro: "audio/sfx/superattack.mp3",
    bossDefeat: "audio/bgm/ending.mp3",
    vineBoom: "audio/sfx/boom.mp3",
    defeatLaugh: "audio/sfx/defeatlaught.mp3",
    crystalSpawn: "audio/sfx/crystalbreak.mp3",
    crystalBreak: "audio/sfx/crystalbreak.mp3",
    trapHeartSpawn: "audio/sfx/trapspawn.mp3",
    trapHeartHit: "audio/sfx/traphit.mp3",
    enrageAlarm: "audio/sfx/enragealarm.mp3",
    sealBreak: "audio/sfx/sealbreak.mp3",
    antiSpamBlock: "audio/sfx/antispamblock.mp3",
    hitBoss: "audio/sfx/hitboss.mp3",
    bombExplode: "audio/sfx/bombexplode.mp3",
    bellSound: "audio/sfx/bell.mp3",
    rewindSound: "audio/sfx/rewind.mp3",
    ecoOrbital: "audio/sfx/ecoorbital.mp3",
    endingBgm: "audio/bgm/ending.mp3"
};

const isMobile = window.innerWidth <= 680;
const BOSS_SPRITES = {
    normal: "img/portraits/cabezanormal.png",
    angry: "img/portraits/cabezaenojada.png",
    yandere: "img/portraits/cabezayandere.png",
    corePhase1_2: "img/boss/core.png",
    corePhase3_pc: "img/boss/boos_fase3.gif",
    corePhase3_mobile: "img/boss/boss_fase3.png"
};

const BossState = {
    phase: 1, maxHp: 350, currentHp: 350, playerHp: 3,
    damageLock: true, isInvulnerable: false, weaponLost: false, lastHitTime: 0, hitCooldownMs: 90,
    history: [], battleStartTime: 0, autoDamageInterval: null, hpAtStart: 0,
    p1Hit75: false, p1Hit50: false, p1Hit20: false,
    p2Hit75: false, p2CinematicTriggered: false, p2Hit20: false,

    recordEvent(type, x, y) {
        if(this.phase < 3) { 
            this.history.push({ time: Date.now() - this.battleStartTime, type: type, x: x, y: y, drawn: false }); 
        }
    },

    resetBossEncounter() {
        // RESET TOTAL PARA PREVENIR EL BUG DE PANTALLA NEGRA EN REVANCHAS
        BossAttacks.clearAll();
        clearInterval(BossFlow.phase3CameraInterval);
        cancelAnimationFrame(BossFlow.subtitleLoopId);
        
        document.body.className = '';
        const darkness = document.getElementById('cinematic-darkness');
        if (darkness) darkness.classList.remove('active');

        const core = document.getElementById('boss-core');
        if (core) {
            core.style.display = 'flex';
            core.style.pointerEvents = 'auto';
            core.style.top = '48%';
            core.style.left = '50%';
            core.style.transform = `translate(-50%, -50%) scale(${isMobile ? 1.0 : 1.6})`;
            core.className = 'boss-core-container';
        }

        const coreImg = document.getElementById('boss-core-img');
        if (coreImg) {
            coreImg.className = 'boss-core-img';
            coreImg.src = BOSS_SPRITES.corePhase1_2;
        }

        const bossHud = document.getElementById('boss-hud');
        if (bossHud) {
            bossHud.style.display = 'flex';
            bossHud.style.opacity = '1';
        }

        const playerHud = document.getElementById('player-hud');
        if (playerHud) {
            playerHud.style.display = 'flex';
            playerHud.style.opacity = '1';
        }

        const shield = document.getElementById('boss-shield');
        if (shield) shield.className = 'boss-shield-aura';

        const aura = document.getElementById('boss-aura-farm');
        if (aura) aura.className = 'boss-aura-farm';

        const endingScreen = document.getElementById('ending-screen');
        if (endingScreen) endingScreen.classList.remove('visible');

        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) gameOverScreen.classList.remove('visible');

        const bell = document.getElementById('end-record-final');
        if (bell) bell.classList.remove('active');

        const lyrics = document.getElementById('lyrics-container');
        if (lyrics) lyrics.innerHTML = '';

        const title = document.getElementById('boss-title-name');
        if (title) title.textContent = "SAPHYNIEL // DEIDAD TRANSCENDENTE";

        this.phase = 1;
        this.maxHp = 350;
        this.currentHp = 350;
        this.playerHp = 3;
        this.damageLock = true;
        this.isInvulnerable = false;
        this.weaponLost = false;
        this.p1Hit75 = false;
        this.p1Hit50 = false;
        this.p1Hit20 = false;
        this.p2Hit75 = false;
        this.p2CinematicTriggered = false;
        this.p2Hit20 = false;

        for (let i = 1; i <= 3; i++) {
            const h = document.getElementById(`heart-${i}`);
            if (h) h.classList.remove('lost');
        }

        this.updateHpBar();
        this.updateCoreSprite();
    },

    updateCoreSprite() {
        const img = document.getElementById('boss-core-img');
        if (!img) return;
        if (this.phase === 3) {
            img.src = isMobile ? BOSS_SPRITES.corePhase3_mobile : BOSS_SPRITES.corePhase3_pc;
        } else {
            img.src = BOSS_SPRITES.corePhase1_2;
        }
    },

    updateHpBar() {
        const pct = Math.max(0, Math.round((this.currentHp / this.maxHp) * 100));
        document.getElementById('boss-hp-fill').style.width = `${pct}%`;
        document.getElementById('boss-hp-num').textContent = `[${pct}%]`;
    },

    spawnDamagePopup(x, y, dmg, type = 'normal') {
        const el = document.createElement('div');
        el.className = `damage-number ${type}`;
        if (type === 'heal') el.textContent = `+${dmg}`;
        else if (type === 'blocked') el.textContent = dmg; 
        else el.textContent = `-${dmg}`;
        el.style.left = `${x + (Math.random() - 0.5) * 40}px`; 
        el.style.top = `${y + (Math.random() - 0.5) * 20}px`;
        document.body.appendChild(el); 
        setTimeout(() => el.remove(), 600);
    },

    damagePlayer() {
        if (this.playerHp <= 0) return;
        this.playerHp--;
        AudioManager.beep(90, 0.3, 'sawtooth', 0.08); 
        ScreenUtils.triggerShake();
        for (let i = 1; i <= 3; i++) {
            const heart = document.getElementById(`heart-${i}`);
            if (heart) {
                if (i > this.playerHp) heart.classList.add('lost');
                else heart.classList.remove('lost');
            }
        }
        if (this.playerHp <= 0) {
            BossAttacks.clearAll();
            BossFlow.triggerBadEnding();
        }
    },

    moveBossCore() {
        const core = document.getElementById('boss-core');
        let targetX, targetY;

        if (this.phase === 1) {
            targetX = isMobile ? Math.random() * 30 + 35 : Math.random() * 40 + 30;
            targetY = isMobile ? Math.random() * 20 + 38 : Math.random() * 25 + 35;
            core.style.transition = "top 0.8s ease, left 0.8s ease, transform 0.4s ease";
            core.style.transform = `translate(-50%, -50%) scale(${isMobile ? 1.0 : 1.6})`;
        } else {
            targetX = isMobile ? Math.random() * 50 + 25 : Math.random() * 65 + 15;
            targetY = isMobile ? Math.random() * 30 + 30 : Math.random() * 40 + 25;
            let baseScale = isMobile ? 1.1 : 1.7;
            if (this.phase === 3) baseScale = isMobile ? 1.3 : 2.2;
            const randomScale = (baseScale + (Math.random() * 0.4 - 0.2)).toFixed(2);
            core.style.transition = "top 0.4s ease, left 0.4s ease, transform 0.3s ease";
            core.style.transform = `translate(-50%, -50%) scale(${randomScale})`;
        }
        
        core.style.top = `${targetY}%`; 
        core.style.left = `${targetX}%`;
        this.recordEvent('move', targetX, targetY);
        if (BossAttacks.clones.length > 0) BossAttacks.moveClones();
    }
};

document.getElementById('core-trigger').addEventListener('pointerdown', (e) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (BossState.damageLock && !BossState.weaponLost) return;

    if (BossState.weaponLost) {
        AudioManager.playAudio(BOSS_AUDIO_PATHS.antiSpamBlock);
        BossState.spawnDamagePopup(e.clientX, e.clientY, "NO TIENES ARMA", 'blocked');
        AudioManager.beep(150, 0.2, 'sawtooth');
        ScreenUtils.triggerShake();
        return;
    }

    if (BossState.isInvulnerable) {
        AudioManager.playAudio(BOSS_AUDIO_PATHS.antiSpamBlock);
        BossState.spawnDamagePopup(e.clientX, e.clientY, "BLOQUEADO", 'blocked');
        return;
    }

    const now = Date.now();
    if (now - BossState.lastHitTime < BossState.hitCooldownMs) {
        AudioManager.playAudio(BOSS_AUDIO_PATHS.antiSpamBlock);
        BossState.spawnDamagePopup(e.clientX, e.clientY, "BLOQUEADO", 'blocked');
        return;
    }
    BossState.lastHitTime = now;

    if (BossAttacks.crystalActive) {
        AudioManager.playAudio(BOSS_AUDIO_PATHS.antiSpamBlock);
        BossState.spawnDamagePopup(e.clientX, e.clientY, "BLOQUEADO", 'blocked');
        AudioManager.beep(300, 0.1, 'sawtooth');
        return;
    }

    const dmg = 10;
    BossState.currentHp -= dmg;

    if (BossState.phase === 3 && !BossState.weaponLost && BossState.currentHp <= 1) {
        BossState.currentHp = 1;
    }

    const r = e.currentTarget.getBoundingClientRect();
    const posX = e.clientX || (r.left + r.width / 2), posY = e.clientY || (r.top + r.height / 2);
    BossState.recordEvent('hit', posX, posY);

    ParticleEngine.explode(posX, posY, BossState.phase === 3 ? '#ffffff' : BossState.phase === 2 ? '#ffaa00' : '#ff3333', 15);
    BossState.spawnDamagePopup(posX, posY, dmg);
    ScreenUtils.triggerShake(); 
    AudioManager.playAudio(BOSS_AUDIO_PATHS.hitBoss);
    BossState.moveBossCore();

    if (BossState.phase === 1 && BossState.currentHp <= 1) { 
        BossState.currentHp = 1; 
        BossState.updateHpBar(); 
        BossFlow.triggerPhase2(); 
        return; 
    }
    
    if (BossState.phase === 2 && BossState.currentHp <= 1) { 
        BossState.currentHp = 1; 
        BossState.updateHpBar(); 
        BossFlow.triggerGoodEndingCutscene(); 
        return; 
    }
    
    BossState.updateHpBar();
    const hpPercent = (BossState.currentHp / BossState.maxHp) * 100;

    if (BossState.phase === 1) {
        if (hpPercent <= 75 && !BossState.p1Hit75) {
            BossState.p1Hit75 = true; 
            DialogueSystem.show({ text: "La fragilidad de tu código es evidente.", speaker: "SAPHYNIEL // DEIDAD", tone: "mid", autoHideTime: 2500, spriteMap: BOSS_SPRITES });
        } else if (hpPercent <= 50 && !BossState.p1Hit50) {
            BossState.p1Hit50 = true; 
            DialogueSystem.show({ text: "Los mortales y su absurda necesidad de destruir lo que no comprenden.", speaker: "SAPHYNIEL // DEIDAD", tone: "low", autoHideTime: 2800, spriteMap: BOSS_SPRITES });
        } else if (hpPercent <= 20 && !BossState.p1Hit20) {
            BossState.p1Hit20 = true; 
            DialogueSystem.show({ text: "¿Insistes en desafiar la arquitectura perfecta?", speaker: "SAPHYNIEL // DEIDAD", tone: "angry", autoHideTime: 2500, spriteMap: BOSS_SPRITES });
        }
    } else if (BossState.phase === 2) {
        if (hpPercent <= 75 && !BossState.p2Hit75) {
            BossState.p2Hit75 = true; 
            DialogueSystem.show({ text: "La entropía es la única constante. Tu esfuerzo es una anomalía.", speaker: "SAPHYNIEL // DIVINO", tone: "mid", autoHideTime: 3000, spriteMap: BOSS_SPRITES });
        } else if (hpPercent <= 50 && !BossState.p2CinematicTriggered) {
            BossState.p2CinematicTriggered = true; 
            BossState.damageLock = true; 
            BossAttacks.clearAll(); 
            document.getElementById('cinematic-darkness').classList.add('active');
            DialogueSystem.show({ 
                text: "Tanta devoción por una causa vacía...", 
                speaker: "SAPHYNIEL // DIVINO", 
                tone: "low", 
                autoHideTime: 3500, 
                spriteMap: BOSS_SPRITES,
                callback: () => {
                    DialogueSystem.show({ 
                        text: "Incluso si quiebras este escudo, solo encontrarás el abismo.", 
                        speaker: "SAPHYNIEL // DIVINO", 
                        tone: "yandere", 
                        autoHideTime: 3800, 
                        spriteMap: BOSS_SPRITES,
                        callback: () => {
                            document.getElementById('cinematic-darkness').classList.remove('active'); 
                            BossState.damageLock = false;
                            BossState.isInvulnerable = false;
                            BossAttacks.bombSpawnerTimer = setInterval(() => BossAttacks.spawnBomb(), 2800); 
                            BossAttacks.qteSpawnerTimer = setInterval(() => BossAttacks.spawnQteCross(), 5500); 
                            BossAttacks.spawnClones();
                        }
                    });
                }
            }); 
            return;
        } else if (hpPercent <= 20 && !BossState.p2Hit20) {
            BossState.p2Hit20 = true; 
            DialogueSystem.show({ text: "El sistema purgará este error. ¡TÚ ERES EL ERROR!", speaker: "SAPHYNIEL // DIVINO", tone: "angry", autoHideTime: 2500, spriteMap: BOSS_SPRITES });
        }
    }
});

window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'START_BOSS') {
        BossState.resetBossEncounter();
        BossState.battleStartTime = Date.now(); 
        BossState.history = []; 
        AudioManager.init(); 
        AudioManager.playBgm(BOSS_AUDIO_PATHS.bgmPhase1);
        
        const introQuotes = [ 
            "¿Creíste que una máquina orbital perturbaría mi presencia?", 
            "Has despertado la voluntad absoluta del Códice...", 
            "Pobre alma mortal. Contempla el peso del juicio divino." 
        ];
        let qIdx = 0;
        function showNextIntroQuote() {
            if (qIdx < introQuotes.length) {
                DialogueSystem.show({ 
                    text: introQuotes[qIdx], 
                    speaker: "SAPHYNIEL // DEIDAD", 
                    tone: "low", 
                    autoHideTime: 2800, 
                    spriteMap: BOSS_SPRITES, 
                    callback: () => { qIdx++; setTimeout(showNextIntroQuote, 350); }
                });
            } else {
                BossState.damageLock = false; 
                DialogueSystem.show({ text: "¡DEMUÉSTRAME SI ERES DIGNO DE TRASCENDER!", speaker: "SAPHYNIEL // DEIDAD", tone: "angry", autoHideTime: 2600, spriteMap: BOSS_SPRITES });
                AudioManager.playAudio(BOSS_AUDIO_PATHS.bossIntro); 
                BossAttacks.bombSpawnerTimer = setInterval(() => BossAttacks.spawnBomb(), 3200); 
                BossAttacks.qteSpawnerTimer = setInterval(() => BossAttacks.spawnQteCross(), 6500);
            }
        }
        showNextIntroQuote();
    }
});

window.addEventListener('DOMContentLoaded', () => { 
    ParticleEngine.init('particle-canvas'); 
});