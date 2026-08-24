const BossAttacks = {
    bombSpawnerTimer: null, qteSpawnerTimer: null, crystalCooldownTimer: null,
    trapSpawnerTimer: null, survivalMoveInterval: null,
    crystalActive: false, crystalHp: 50, clones: [], stolenHeartActive: false,

    clearAll() {
        clearInterval(this.bombSpawnerTimer); 
        clearInterval(this.qteSpawnerTimer);
        clearInterval(this.trapSpawnerTimer); 
        clearInterval(this.survivalMoveInterval);
        clearTimeout(this.crystalCooldownTimer);
        document.querySelectorAll('.boss-bomb, .qte-cross, .trap-heart-container, .chain-seal').forEach(el => el.remove());
        this.destroyShieldCrystal(); 
        this.destroyClones(); 
        this.stolenHeartActive = false;
    },

    startSurvivalMode() {
        this.clearAll();
        this.bombSpawnerTimer = setInterval(() => this.spawnBomb(), 850);
        this.trapSpawnerTimer = setInterval(() => this.spawnTrapHeart(), 5000);
        this.survivalMoveInterval = setInterval(() => { BossState.moveBossCore(); }, 900);
    },

    getNonOverlappingCoords() {
        const isMobile = window.innerWidth <= 680;
        const minDistancePx = isMobile ? 85 : 120;
        let attempts = 0;
        let chosenX = 50, chosenY = 50;

        while (attempts < 15) {
            const topPct = isMobile ? Math.random() * 32 + 32 : Math.random() * 45 + 28;
            const leftPct = isMobile ? Math.random() * 65 + 18 : Math.random() * 70 + 15;
            
            const pxX = (leftPct / 100) * window.innerWidth;
            const pxY = (topPct / 100) * window.innerHeight;

            const existingElements = document.querySelectorAll('.boss-bomb, .trap-heart-container, #boss-core');
            let collides = false;

            existingElements.forEach(el => {
                const r = el.getBoundingClientRect();
                const centerX = r.left + r.width / 2;
                const centerY = r.top + r.height / 2;
                if (Math.hypot(pxX - centerX, pxY - centerY) < minDistancePx) {
                    collides = true;
                }
            });

            if (!collides) {
                chosenX = leftPct;
                chosenY = topPct;
                break;
            }
            attempts++;
        }
        return { top: chosenY, left: chosenX };
    },

    spawnBomb() {
        if (BossState.damageLock && BossState.currentHp > 0 && !BossState.weaponLost) return;
        if (BossState.playerHp <= 0) return;
        
        const bomb = document.createElement('div');
        bomb.className = 'boss-bomb spawn-blip';
        
        if (BossState.phase === 3) bomb.classList.add('golden-bomb');
        
        const pos = this.getNonOverlappingCoords();
        bomb.style.top = `${pos.top}vh`;
        bomb.style.left = `${pos.left}vw`;

        let timeRemaining = BossState.phase === 3 ? 3.4 : (BossState.phase === 1 ? 3.0 : 2.0);
        bomb.textContent = Math.ceil(timeRemaining);

        const countdown = setInterval(() => {
            timeRemaining -= 0.1;
            bomb.textContent = Math.ceil(timeRemaining);
            if (timeRemaining <= 0) {
                clearInterval(countdown);
                if (bomb.parentNode) {
                    ParticleEngine.explode(bomb.offsetLeft + 22, bomb.offsetTop + 22, BossState.phase === 3 ? '#ffffff' : '#ff3333', 18);
                    AudioManager.playAudio(BOSS_AUDIO_PATHS.bombExplode);
                    ScreenUtils.triggerShake();
                    bomb.remove(); 
                    BossState.damagePlayer();
                }
            }
        }, 100);

        bomb.addEventListener('pointerdown', (e) => {
            e.preventDefault(); 
            e.stopPropagation(); 
            clearInterval(countdown);
            ParticleEngine.explode(bomb.offsetLeft + 22, bomb.offsetTop + 22, '#ffffff', 16);
            AudioManager.playAudio(BOSS_AUDIO_PATHS.sealBreak); 
            bomb.remove();
        });
        document.body.appendChild(bomb);
    },

    spawnQteCross() {
        if (BossState.damageLock || BossState.currentHp <= 0 || BossState.phase === 3) return;
        const cross = document.createElement('div');
        cross.className = 'qte-cross spawn-blip';
        cross.style.top = `${Math.random() * 40 + 30}vh`; 
        cross.style.left = `${Math.random() * 70 + 15}vw`;

        const timeout = setTimeout(() => {
            if (cross.parentNode) {
                cross.remove();
                const healAmount = Math.round(BossState.maxHp * 0.12);
                BossState.currentHp = Math.min(BossState.maxHp, BossState.currentHp + healAmount); 
                BossState.updateHpBar();
                const core = document.getElementById('boss-core'), r = core.getBoundingClientRect();
                ParticleEngine.explode(r.left + r.width / 2, r.top + r.height / 2, '#43b581', 20);
                BossState.spawnDamagePopup(r.left + r.width / 2, r.top + r.height / 2, healAmount, 'heal');
                AudioManager.beep(659.25, 0.3, 'sine', 0.06);
            }
        }, 2000);

        cross.addEventListener('pointerdown', (e) => {
            e.preventDefault(); 
            e.stopPropagation(); 
            clearTimeout(timeout);
            ParticleEngine.explode(cross.offsetLeft + 25, cross.offsetTop + 25, '#dad4bb', 18);
            AudioManager.playAudio(BOSS_AUDIO_PATHS.sealBreak); 
            cross.remove();
        });
        document.body.appendChild(cross);
    },

    spawnTrapHeart() {
        if (this.stolenHeartActive || BossState.playerHp <= 1) return;
        this.stolenHeartActive = true;
        const targetHeartIndex = BossState.playerHp;
        const hudHeart = document.getElementById(`heart-${targetHeartIndex}`);
        if (hudHeart) hudHeart.classList.add('lost');

        const trap = document.createElement('div'); 
        trap.className = 'trap-heart-container spawn-blip';
        trap.innerHTML = `<div class="trap-heart-chains"></div><div class="trap-heart-icon">❤</div>`;

        const hudRect = hudHeart ? hudHeart.getBoundingClientRect() : { left: 30, top: 100 };
        trap.style.top = `${hudRect.top}px`; 
        trap.style.left = `${hudRect.left}px`;
        document.body.appendChild(trap); 
        AudioManager.playAudio(BOSS_AUDIO_PATHS.trapHeartSpawn);

        const pos = this.getNonOverlappingCoords();
        setTimeout(() => { trap.style.top = `${pos.top}vh`; trap.style.left = `${pos.left}vw`; }, 50);

        let destroyedByPlayer = false;
        trap.addEventListener('pointerdown', (e) => {
            e.preventDefault(); 
            e.stopPropagation(); 
            destroyedByPlayer = true;
            ParticleEngine.explode(trap.offsetLeft + 25, trap.offsetTop + 25, '#ff0055', 20);
            AudioManager.playAudio(BOSS_AUDIO_PATHS.trapHeartHit); 
            trap.remove();
            this.stolenHeartActive = false; 
            BossState.damagePlayer();
        });

        setTimeout(() => {
            if (!destroyedByPlayer && trap.parentNode) {
                ParticleEngine.explode(trap.offsetLeft + 25, trap.offsetTop + 25, '#43b581', 16);
                AudioManager.playAudio(BOSS_AUDIO_PATHS.crystalBreak);
                trap.style.top = `${hudRect.top}px`; 
                trap.style.left = `${hudRect.left}px`;
                setTimeout(() => {
                    trap.remove(); 
                    this.stolenHeartActive = false;
                    if (hudHeart && BossState.playerHp >= targetHeartIndex) hudHeart.classList.remove('lost');
                }, 600);
            }
        }, 4000);
    },

    spawnShieldCrystal() {
        if (this.crystalActive || BossState.phase === 3) return;
        this.crystalActive = true; 
        this.crystalHp = 50; 
        const crystal = document.getElementById('shield-crystal'), shield = document.getElementById('boss-shield'), fill = document.getElementById('crystal-hp-fill');
        const isMobile = window.innerWidth <= 680;
        crystal.style.top = `${isMobile ? Math.random() * 30 + 35 : Math.random() * 40 + 30}%`;
        crystal.style.left = `${isMobile ? Math.random() * 50 + 25 : Math.random() * 60 + 20}%`;
        fill.style.width = '100%'; 
        crystal.classList.add('active', 'spawn-blip'); 
        shield.classList.add('active');
        AudioManager.playAudio(BOSS_AUDIO_PATHS.crystalSpawn);
    },

    destroyShieldCrystal() {
        this.crystalActive = false;
        const crystal = document.getElementById('shield-crystal'), shield = document.getElementById('boss-shield');
        if (crystal) crystal.classList.remove('active');
        if (shield && !shield.classList.contains('divine')) shield.classList.remove('active');
    },

    spawnClones() {
        if (BossState.phase === 3) return;
        this.destroyClones();
        for (let i = 0; i < 2; i++) {
            const clone = document.createElement('div'); 
            clone.className = 'boss-clone-container spawn-blip';
            clone.innerHTML = `<div class="boss-wings" style="opacity:1;"></div><div class="sacred-wheel-1"></div><div class="sacred-wheel-2"></div><div class="boss-core-btn"><img class="boss-core-img" src="${BOSS_SPRITES.corePhase1_2}" alt="Clone"></div>`;
            document.body.appendChild(clone); 
            this.clones.push(clone);
        }
        this.moveClones();
    },

    moveClones() { 
        this.clones.forEach(clone => { 
            clone.style.left = `${Math.random() * 65 + 15}%`; 
            clone.style.top = `${Math.random() * 40 + 25}%`; 
        }); 
    },
    
    destroyClones() { 
        this.clones.forEach(c => c.remove()); 
        this.clones = []; 
    }
};

document.getElementById('shield-crystal').addEventListener('pointerdown', (e) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (!BossAttacks.crystalActive) return;

    BossAttacks.crystalHp -= 10;
    document.getElementById('crystal-hp-fill').style.width = `${Math.max(0, (BossAttacks.crystalHp / 50) * 100)}%`;
    const r = e.currentTarget.getBoundingClientRect();
    ParticleEngine.explode(e.clientX || (r.left + r.width / 2), e.clientY || (r.top + r.height / 2), '#00ffff', 14);
    AudioManager.playAudio(BOSS_AUDIO_PATHS.hitBoss);

    if (BossAttacks.crystalHp <= 0) {
        BossAttacks.destroyShieldCrystal(); 
        AudioManager.playAudio(BOSS_AUDIO_PATHS.crystalBreak); 
        ScreenUtils.triggerShake();
        BossAttacks.crystalCooldownTimer = setTimeout(() => {
            if (BossState.phase >= 2 && !BossState.damageLock && BossState.currentHp > 0) BossAttacks.spawnShieldCrystal();
        }, 18000);
    }
});