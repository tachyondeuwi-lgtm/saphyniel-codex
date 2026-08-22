let _ac = null, _sOn = true;
let _bossPhase = 1;
let _bossMaxHp = 350;
let _bossCurrentHp = 350;
let _playerHp = 3;
let _damageLock = true;
let _bgmTrack = null;

let _vnTmr = null, _typewriterTimer = null;
let _bombSpawnerTimer = null;
let _qteSpawnerTimer = null;
let _crystalCooldownTimer = null;
let _trapSpawnerTimer = null;
let _enrageInterval = null;
let _phase3CameraInterval = null;

let _lastHitTime = 0;
const HIT_COOLDOWN_MS = 90;

let _crystalActive = false;
let _crystalHp = 50;
let _clones = [];
let _stolenHeartActive = false;

let _p1Hit75 = false, _p1Hit50 = false, _p1Hit20 = false;
let _p2Hit75 = false, _p2Hit50 = false, _p2Hit20 = false;
let _p2ClonesSpawned = false;

let _p3Hit75 = false, _p3Hit50 = false, _p3Hit20 = false;
let _p3EnrageTriggered = false;

const BOSS_AUDIO_PATHS = {
    bgmPhase1: "audio/boss-music-fase1.mp3",
    bgmPhase2: "audio/boss-music-fase2.mp3",
    bgmPhase3: "audio/boss-music-fase3.mp3",
    bossIntro: "audio/superattack.mp3",
    bossDefeat: "audio/victory.mp3",
    vineBoom: "audio/boom.mp3",
    defeatLaugh: "audio/defeatlaught.mp3",
    crystalSpawn: "audio/crystalbreak.mp3",
    crystalBreak: "audio/crystalbreak.mp3",
    trapHeartSpawn: "audio/trapspawn.mp3",
    trapHeartHit: "audio/traphit.mp3",
    enrageAlarm: "audio/enragealarm.mp3",
    sealBreak: "audio/sealbreak.mp3",
    antiSpamBlock: "audio/antispamblock.mp3",
    hitBoss: "audio/hitboss.mp3",
    bombExplode: "audio/bombexplode.mp3",
    bellSound: "audio/bell.mp3",
    rewindSound: "audio/rewind.mp3"
};

const BOSS_SPRITES = {
    headNormal: "img/cabezanormal.png",
    headAngry: "img/cabezaenojada.png",
    headYandere: "img/cabezayandere.png",
    coreIcon: "img/icon.png",
    bossFase3Gif: "img/boos_fase3.gif"
};

function _playBgm(trackUrl) {
    if (!_sOn || !trackUrl) return;
    try {
        if (_bgmTrack) { _bgmTrack.pause(); _bgmTrack.currentTime = 0; }
        _bgmTrack = new Audio(trackUrl);
        _bgmTrack.volume = 0.3;
        _bgmTrack.loop = true;
        _bgmTrack.play().catch(() => {});
    } catch (e) {}
}

function _stopBgm() {
    if (_bgmTrack) { _bgmTrack.pause(); _bgmTrack.currentTime = 0; _bgmTrack = null; }
}

function playAudio(path) {
    if (!_sOn || !path) return;
    try {
        const sound = new Audio(path);
        sound.volume = 0.35;
        sound.play().catch(() => {});
    } catch (e) {}
}

const _cv = document.getElementById('particle-canvas');
const _cx = _cv.getContext('2d');
let _pts = [];

function _rsz() { _cv.width = window.innerWidth; _cv.height = window.innerHeight; }
window.addEventListener('resize', _rsz);
_rsz();

class _PixPt {
    constructor(x, y, col, vx, vy, dc = 0.025, sz = 3.5) {
        this.x = x; this.y = y;
        this.sz = sz || (Math.random() * 3 + 2);
        this.vx = vx !== undefined ? vx : (Math.random() - 0.5) * 11;
        this.vy = vy !== undefined ? vy : (Math.random() - 0.5) * 11;
        this.lf = 1.0;
        this.dc = dc || (Math.random() * 0.035 + 0.02);
        this.col = col;
    }
    up() { this.x += this.vx; this.y += this.vy; this.lf -= this.dc; }
    dr(ctx) {
        ctx.fillStyle = this.col;
        ctx.globalAlpha = Math.max(0, this.lf);
        ctx.fillRect(this.x, this.y, this.sz, this.sz);
    }
}

function _xpld(x, y, col = '#dad4bb', cnt = 18) {
    const isMobile = window.innerWidth <= 680;
    const finalCount = isMobile ? Math.floor(cnt * 0.5) : cnt;
    for (let i = 0; i < finalCount; i++) _pts.push(new _PixPt(x, y, col));
}

function _animP() {
    _cx.clearRect(0, 0, _cv.width, _cv.height);
    for (let i = _pts.length - 1; i >= 0; i--) {
        _pts[i].up();
        _pts[i].dr(_cx);
        if (_pts[i].lf <= 0) _pts.splice(i, 1);
    }
    requestAnimationFrame(_animP);
}
_animP();

function _aInit() {
    if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
    if (_ac.state === 'suspended') _ac.resume();
}

function _beep(f, d, t = 'sine', vol = 0.04) {
    if (!_sOn) return; _aInit();
    try {
        if (!_ac) return;
        const o = _ac.createOscillator(), g = _ac.createGain();
        o.type = t; o.frequency.value = f;
        g.gain.setValueAtTime(vol, _ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.00001, _ac.currentTime + d);
        o.connect(g); g.connect(_ac.destination);
        o.start(); o.stop(_ac.currentTime + d);
    } catch (e) {}
}

function _balatroVoice(tone = 'mid') {
    if (!_sOn) return; _aInit();
    try {
        if (!_ac) return;
        const tones = {
            low: [160, 210, 185],
            mid: [320, 420, 360, 480],
            high: [580, 720, 640, 800],
            angry: [110, 140, 95, 130],
            yandere: [420, 560, 680, 820]
        };
        const pool = tones[tone] || tones.mid;
        for (let k = 0; k < 4; k++) {
            const o = _ac.createOscillator(), g = _ac.createGain();
            const freq = pool[Math.floor(Math.random() * pool.length)];
            o.type = tone === 'angry' ? 'sawtooth' : 'triangle';
            o.frequency.setValueAtTime(freq, _ac.currentTime + (k * 0.045));
            g.gain.setValueAtTime(0.04, _ac.currentTime + (k * 0.045));
            g.gain.exponentialRampToValueAtTime(0.0001, _ac.currentTime + (k * 0.045) + 0.04);
            o.connect(g); g.connect(_ac.destination);
            o.start(_ac.currentTime + (k * 0.045));
            o.stop(_ac.currentTime + (k * 0.045) + 0.045);
        }
    } catch (e) {}
}

function _triggerScreenShake() {
    document.body.classList.remove('shake-active');
    void document.body.offsetWidth;
    document.body.classList.add('shake-active');
    setTimeout(() => document.body.classList.remove('shake-active'), 180);
}

function _showP5Dialogue(text, speaker = "SAPHYNIEL", tone = "mid", autoHideTime = 2800, callback = null) {
    const box = document.getElementById('p5-box');
    const nameEl = document.getElementById('p5-name');
    const textEl = document.getElementById('p5-text');
    const cutinImg = document.getElementById('p5-cutin-img');
    const choices = document.getElementById('p5-choices');

    clearTimeout(_vnTmr);
    clearTimeout(_typewriterTimer);
    choices.classList.remove('active');

    box.classList.remove('angry-theme', 'glitch-theme', 'yandere-theme');
    if (_bossPhase === 3) {
        box.classList.add('glitch-theme');
        cutinImg.src = BOSS_SPRITES.headYandere;
    } else if (tone === 'angry') {
        box.classList.add('angry-theme');
        cutinImg.src = BOSS_SPRITES.headAngry;
    } else if (tone === 'yandere') {
        box.classList.add('yandere-theme');
        cutinImg.src = BOSS_SPRITES.headYandere;
    } else {
        cutinImg.src = BOSS_SPRITES.headNormal;
    }

    nameEl.textContent = speaker;
    textEl.innerHTML = '';
    box.classList.add('active');

    _balatroVoice(tone);

    let idx = 0;
    function typeChar() {
        if (idx < text.length) {
            textEl.innerHTML += text.charAt(idx);
            idx++;
            _typewriterTimer = setTimeout(typeChar, 18);
        } else {
            if (autoHideTime > 0) {
                _vnTmr = setTimeout(() => {
                    box.classList.remove('active');
                    if (callback) callback();
                }, autoHideTime);
            } else if (callback) {
                callback();
            }
        }
    }
    typeChar();
}

function _updateHpBar() {
    const pct = Math.max(0, Math.round((_bossCurrentHp / _bossMaxHp) * 100));
    document.getElementById('boss-hp-fill').style.width = `${pct}%`;
    document.getElementById('boss-hp-num').textContent = `[${pct}%]`;
}

function _spawnDamagePopup(x, y, dmg, type = 'normal') {
    const el = document.createElement('div');
    el.className = `damage-number ${type}`;
    if (type === 'heal') el.textContent = `+${dmg}`;
    else if (type === 'blocked') el.textContent = `BLOQUEADO`;
    else el.textContent = `-${dmg}`;
    el.style.left = `${x + (Math.random() - 0.5) * 40}px`;
    el.style.top = `${y + (Math.random() - 0.5) * 20}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 600);
}

function _damagePlayer() {
    if (_playerHp <= 0) return;
    _playerHp--;
    _beep(90, 0.3, 'sawtooth', 0.08);
    _triggerScreenShake();

    for (let i = 1; i <= 3; i++) {
        const heart = document.getElementById(`heart-${i}`);
        if (i > _playerHp) heart.classList.add('lost');
    }

    if (_playerHp <= 0) {
        _triggerBadEnding();
    }
}

function _clearAllTimersAndAttacks() {
    clearInterval(_bombSpawnerTimer);
    clearInterval(_qteSpawnerTimer);
    clearInterval(_trapSpawnerTimer);
    clearTimeout(_crystalCooldownTimer);
    clearInterval(_enrageInterval);
    clearInterval(_phase3CameraInterval);
    document.body.classList.remove('phase-3-tilt-a', 'phase-3-tilt-b', 'phase-3-tilt-reset');
    document.querySelectorAll('.boss-bomb, .qte-cross, .trap-heart-container, .chain-seal').forEach(el => el.remove());
    
    _destroyShieldCrystal();
    _destroyClones();
    _stolenHeartActive = false;
    
    const enrageOverlay = document.getElementById('enrage-overlay');
    if (enrageOverlay) enrageOverlay.classList.remove('active');
}

function _spawnBomb() {
    if (_damageLock || _bossCurrentHp <= 0) return;
    const bomb = document.createElement('div');
    bomb.className = 'boss-bomb spawn-blip';
    
    const isMobile = window.innerWidth <= 680;
    const topLimit = isMobile ? Math.random() * 35 + 30 : Math.random() * 50 + 25;
    const leftLimit = isMobile ? Math.random() * 70 + 15 : Math.random() * 75 + 10;
    
    bomb.style.top = `${topLimit}vh`;
    bomb.style.left = `${leftLimit}vw`;

    let timer = _bossPhase === 1 ? 3 : 2;
    bomb.textContent = timer;

    const countdown = setInterval(() => {
        timer--;
        if (timer > 0) {
            bomb.textContent = timer;
        } else {
            clearInterval(countdown);
            if (bomb.parentNode) {
                _xpld(bomb.offsetLeft + 22, bomb.offsetTop + 22, '#ff3333', 18);
                playAudio(BOSS_AUDIO_PATHS.bombExplode);
                bomb.remove();
                _damagePlayer();
            }
        }
    }, _bossPhase === 3 ? 550 : 750);

    const onBombHit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearInterval(countdown);
        _xpld(bomb.offsetLeft + 22, bomb.offsetTop + 22, '#ffd700', 16);
        playAudio(BOSS_AUDIO_PATHS.sealBreak);
        bomb.remove();
    };

    bomb.addEventListener('pointerdown', onBombHit);
    document.body.appendChild(bomb);
}

function _spawnQteCross() {
    if (_damageLock || _bossCurrentHp <= 0) return;
    const cross = document.createElement('div');
    cross.className = 'qte-cross spawn-blip';
    cross.style.top = `${Math.random() * 40 + 30}vh`;
    cross.style.left = `${Math.random() * 70 + 15}vw`;

    const timeout = setTimeout(() => {
        if (cross.parentNode) {
            cross.remove();
            const healAmount = Math.round(_bossMaxHp * 0.12);
            _bossCurrentHp = Math.min(_bossMaxHp, _bossCurrentHp + healAmount);
            _updateHpBar();
            
            const core = document.getElementById('boss-core');
            const r = core.getBoundingClientRect();
            _xpld(r.left + r.width / 2, r.top + r.height / 2, '#43b581', 20);
            _spawnDamagePopup(r.left + r.width / 2, r.top + r.height / 2, healAmount, 'heal');
            _beep(659.25, 0.3, 'sine', 0.06);
            _showP5Dialogue("El Códice me restaura. ¡Tus dudas alimentan mi poder!", "SAPHYNIEL", "angry", 2000);
        }
    }, _bossPhase === 3 ? 1500 : 2000);

    const onCrossHit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearTimeout(timeout);
        _xpld(cross.offsetLeft + 25, cross.offsetTop + 25, '#ffd700', 18);
        playAudio(BOSS_AUDIO_PATHS.sealBreak);
        cross.remove();
    };

    cross.addEventListener('pointerdown', onCrossHit);
    document.body.appendChild(cross);
}

function _spawnTrapHeart() {
    if (_damageLock || _bossCurrentHp <= 0 || _bossPhase !== 3 || _stolenHeartActive || _playerHp <= 1) return;
    _stolenHeartActive = true;

    const hudHeart = document.getElementById(`heart-${_playerHp}`);
    if (hudHeart) hudHeart.classList.add('lost');

    const trap = document.createElement('div');
    trap.className = 'trap-heart-container spawn-blip';
    trap.innerHTML = `
        <div class="trap-heart-chains"></div>
        <div class="trap-heart-icon">❤</div>
    `;

    const hudRect = hudHeart ? hudHeart.getBoundingClientRect() : { left: 30, top: 100 };
    trap.style.top = `${hudRect.top}px`;
    trap.style.left = `${hudRect.left}px`;
    document.body.appendChild(trap);

    playAudio(BOSS_AUDIO_PATHS.trapHeartSpawn);
    _showP5Dialogue("¡He sellado parte de tu vitalidad!", "SAPHYNIEL // VACÍO", "angry", 1800);

    setTimeout(() => {
        trap.style.top = `${Math.random() * 45 + 30}vh`;
        trap.style.left = `${Math.random() * 65 + 15}vw`;
    }, 50);

    let destroyedByPlayer = false;
    const onTrapHit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        destroyedByPlayer = true;
        _xpld(trap.offsetLeft + 30, trap.offsetTop + 30, '#ff0055', 20);
        playAudio(BOSS_AUDIO_PATHS.trapHeartHit);
        trap.remove();
        _stolenHeartActive = false;
        _damagePlayer();
        _showP5Dialogue("¡Destruiste tu propio corazón!", "SAPHYNIEL", "yandere", 1600);
    };

    trap.addEventListener('pointerdown', onTrapHit);

    setTimeout(() => {
        if (!destroyedByPlayer && trap.parentNode) {
            _xpld(trap.offsetLeft + 30, trap.offsetTop + 30, '#43b581', 16);
            playAudio(BOSS_AUDIO_PATHS.crystalBreak);
            
            trap.style.top = `${hudRect.top}px`;
            trap.style.left = `${hudRect.left}px`;

            setTimeout(() => {
                trap.remove();
                _stolenHeartActive = false;
                if (hudHeart && _playerHp > 0) hudHeart.classList.remove('lost');
                _showP5Dialogue("Las cadenas se rompieron... lograste recuperarlo.", "SAPHYNIEL", "low", 1800);
            }, 600);
        }
    }, 4500);
}

function _spawnShieldCrystal() {
    if (_crystalActive || _damageLock) return;
    _crystalActive = true;
    _crystalHp = _bossPhase === 3 ? 80 : 50;

    const crystal = document.getElementById('shield-crystal');
    const shield = document.getElementById('boss-shield');
    const fill = document.getElementById('crystal-hp-fill');

    const isMobile = window.innerWidth <= 680;
    const randomX = isMobile ? Math.random() * 50 + 25 : Math.random() * 60 + 20;
    const randomY = isMobile ? Math.random() * 30 + 35 : Math.random() * 40 + 30;
    crystal.style.top = `${randomY}%`;
    crystal.style.left = `${randomX}%`;

    fill.style.width = '100%';
    crystal.classList.add('active', 'spawn-blip');
    shield.classList.add('active');

    playAudio(BOSS_AUDIO_PATHS.crystalSpawn);
    _showP5Dialogue("El cristal sagrado me resguarda. ¡Rómpelo si puedes!", "SAPHYNIEL", "angry", 2000);
}

function _destroyShieldCrystal() {
    _crystalActive = false;
    const crystal = document.getElementById('shield-crystal');
    const shield = document.getElementById('boss-shield');
    if (crystal) crystal.classList.remove('active');
    if (shield) shield.classList.remove('active');
}

document.getElementById('shield-crystal').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!_crystalActive) return;
    
    _crystalHp -= 10;
    const fill = document.getElementById('crystal-hp-fill');
    const maxHp = _bossPhase === 3 ? 80 : 50;
    fill.style.width = `${Math.max(0, (_crystalHp / maxHp) * 100)}%`;

    const r = e.currentTarget.getBoundingClientRect();
    _xpld(e.clientX || (r.left + r.width / 2), e.clientY || (r.top + r.height / 2), '#00ffff', 14);
    playAudio(BOSS_AUDIO_PATHS.hitBoss);

    if (_crystalHp <= 0) {
        _destroyShieldCrystal();
        playAudio(BOSS_AUDIO_PATHS.crystalBreak);
        _triggerScreenShake();
        _showP5Dialogue("¡Mi defensa ha caído!", "SAPHYNIEL", "angry", 1800);

        _crystalCooldownTimer = setTimeout(() => {
            if (_bossPhase >= 2 && !_damageLock && _bossCurrentHp > 0) {
                _spawnShieldCrystal();
            }
        }, _bossPhase === 3 ? 12000 : 18000);
    }
});

function _spawnClones() {
    _destroyClones();
    for (let i = 0; i < 2; i++) {
        const clone = document.createElement('div');
        clone.className = 'boss-clone-container spawn-blip';
        clone.innerHTML = `
            <div class="boss-wings" style="opacity:1;"></div>
            <div class="sacred-wheel-1"></div>
            <div class="sacred-wheel-2"></div>
            <div class="boss-core-btn">
                <img class="boss-core-img" src="${_bossPhase === 3 ? BOSS_SPRITES.bossFase3Gif : BOSS_SPRITES.coreIcon}" alt="Clone">
            </div>
        `;
        document.body.appendChild(clone);
        _clones.push(clone);
    }
    _moveClones();
}

function _moveClones() {
    _clones.forEach(clone => {
        const rx = Math.random() * 65 + 15;
        const ry = Math.random() * 40 + 25;
        clone.style.left = `${rx}%`;
        clone.style.top = `${ry}%`;
    });
}

function _destroyClones() {
    _clones.forEach(c => c.remove());
    _clones = [];
}

function _moveBossCore() {
    const core = document.getElementById('boss-core');
    const isMobile = window.innerWidth <= 680;
    
    if (_bossPhase === 1) {
        const randomX = isMobile ? Math.random() * 30 + 35 : Math.random() * 40 + 30;
        const randomY = isMobile ? Math.random() * 20 + 38 : Math.random() * 25 + 35;
        const baseScale = isMobile ? 1.0 : 1.6;
        core.style.transition = "top 0.8s ease, left 0.8s ease, transform 0.4s ease";
        core.style.top = `${randomY}%`;
        core.style.left = `${randomX}%`;
        core.style.transform = `translate(-50%, -50%) scale(${baseScale})`;
        return;
    }

    const randomX = isMobile ? Math.random() * 50 + 25 : Math.random() * 65 + 15;
    const randomY = isMobile ? Math.random() * 30 + 30 : Math.random() * 40 + 25;
    
    let baseScale = isMobile ? 1.1 : 1.7;
    if (_bossPhase === 3) baseScale = isMobile ? 1.3 : 2.2;
    
    const randomScale = (baseScale + (Math.random() * 0.4 - 0.2)).toFixed(2);
    
    core.style.transition = "top 0.4s ease, left 0.4s ease, transform 0.3s ease";
    core.style.top = `${randomY}%`;
    core.style.left = `${randomX}%`;
    core.style.transform = `translate(-50%, -50%) scale(${randomScale})`;

    if (_clones.length > 0) _moveClones();
}

function _startPhase3CameraFX() {
    clearInterval(_phase3CameraInterval);
    let step = 0;
    _phase3CameraInterval = setInterval(() => {
        document.body.classList.remove('phase-3-tilt-a', 'phase-3-tilt-b', 'phase-3-tilt-reset');
        if (step === 0) {
            document.body.classList.add('phase-3-tilt-a');
            step = 1;
        } else if (step === 1) {
            document.body.classList.add('phase-3-tilt-reset');
            step = 2;
        } else if (step === 2) {
            document.body.classList.add('phase-3-tilt-b');
            step = 3;
        } else {
            document.body.classList.add('phase-3-tilt-reset');
            step = 0;
        }
    }, 2800);
}

document.getElementById('core-trigger').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (_damageLock) return;

    const now = Date.now();
    if (now - _lastHitTime < HIT_COOLDOWN_MS) {
        playAudio(BOSS_AUDIO_PATHS.antiSpamBlock);
        _spawnDamagePopup(e.clientX, e.clientY, 0, 'blocked');
        return;
    }
    _lastHitTime = now;

    if (_crystalActive) {
        playAudio(BOSS_AUDIO_PATHS.antiSpamBlock);
        _spawnDamagePopup(e.clientX, e.clientY, 0, 'blocked');
        _beep(300, 0.1, 'sawtooth');
        return;
    }

    const dmg = 10;
    _bossCurrentHp -= dmg;

    const r = e.currentTarget.getBoundingClientRect();
    const posX = e.clientX || (r.left + r.width / 2);
    const posY = e.clientY || (r.top + r.height / 2);

    _xpld(posX, posY, _bossPhase === 3 ? '#ffffff' : _bossPhase === 2 ? '#ffaa00' : '#ff3333', 15);
    _spawnDamagePopup(posX, posY, dmg);
    _triggerScreenShake();
    playAudio(BOSS_AUDIO_PATHS.hitBoss);

    _moveBossCore();

    if (_bossPhase === 1 && _bossCurrentHp <= 1) {
        _bossCurrentHp = 1;
        _updateHpBar();
        _triggerPhase2();
        return;
    }

    if (_bossPhase === 2 && _bossCurrentHp <= 1) {
        _bossCurrentHp = 1;
        _updateHpBar();
        _triggerGoodEndingCutscene();
        return;
    }

    if (_bossPhase === 3 && _bossCurrentHp <= 50 && !_p3EnrageTriggered) {
        _p3EnrageTriggered = true;
        _triggerPhase3Enrage();
        return;
    }

    if (_bossPhase === 3 && _bossCurrentHp <= 0) {
        _endTrueVictory();
        return;
    }

    _updateHpBar();

    const hpPercent = (_bossCurrentHp / _bossMaxHp) * 100;

    if (_bossPhase === 1) {
        if (hpPercent <= 75 && !_p1Hit75) {
            _p1Hit75 = true;
            _showP5Dialogue("¿Eso es todo lo que tienes? Apenas un rasguño.", "SAPHYNIEL // DEIDAD", "angry", 2200);
        } else if (hpPercent <= 50 && !_p1Hit50) {
            _p1Hit50 = true;
            _showP5Dialogue("Tus golpes carecen de fe. ¡Sigue intentándolo!", "SAPHYNIEL // DEIDAD", "angry", 2200);
        } else if (hpPercent <= 20 && !_p1Hit20) {
            _p1Hit20 = true;
            _showP5Dialogue("¡No podrás quebrar este registro sagrado!", "SAPHYNIEL // DEIDAD", "angry", 2200);
        }
    } else if (_bossPhase === 2) {
        if (hpPercent <= 75 && !_p2Hit75) {
            _p2Hit75 = true;
            _showP5Dialogue("¡NO ME DETENDRÁS! ¡ARDE EN EL JUICIO!", "SAPHYNIEL // DIVINO", "angry", 2200);
        } else if (hpPercent <= 40 && !_p2ClonesSpawned) {
            _p2ClonesSpawned = true;
            _spawnClones();
            _showP5Dialogue("¿Puedes encontrar la verdad entre los reflejos del Códice?", "SAPHYNIEL // DIVINO", "angry", 2500);
        } else if (hpPercent <= 20 && !_p2Hit20) {
            _p2Hit20 = true;
            _showP5Dialogue("¡¡ES INÚTIL RESISTIRSE AL DESTINO!!", "SAPHYNIEL // DIVINO", "angry", 2200);
        }
    } else if (_bossPhase === 3) {
        if (hpPercent <= 75 && !_p3Hit75) {
            _p3Hit75 = true;
            _showP5Dialogue("¡EL VACÍO DEVORARÁ TUS REGISTROS!", "SAPHYNIEL // VACÍO", "yandere", 2200);
        } else if (hpPercent <= 50 && !_p3Hit50) {
            _p3Hit50 = true;
            _showP5Dialogue("¡SENTIRÁS EL COLAPSO ABSOLUTO!", "SAPHYNIEL // VACÍO", "yandere", 2200);
        }
    }
});

function _triggerPhase2() {
    _damageLock = true;
    _clearAllTimersAndAttacks();

    const sequence = [
        { text: "Imposible... ¿creíste que podrías quebrar mi código base?", speaker: "SAPHYNIEL", tone: "low", time: 2600 },
        { text: "Este receptáculo mortal solo contenía una fracción de mi poder.", speaker: "SAPHYNIEL", tone: "low", time: 2800 },
        { text: "Las leyes del Códice se reescriben a mi voluntad.", speaker: "SAPHYNIEL", tone: "low", time: 2600 }
    ];

    let sIdx = 0;
    function playSeq() {
        if (sIdx < sequence.length) {
            const item = sequence[sIdx];
            _showP5Dialogue(item.text, item.speaker, item.tone, item.time, () => {
                sIdx++;
                setTimeout(playSeq, 300);
            });
        } else {
            document.getElementById('boss-title-name').textContent = "SAPHYNIEL // DIOSA TRANSCENDENTE";
            document.body.classList.add('phase-2-active');

            _triggerScreenShake();
            playAudio(BOSS_AUDIO_PATHS.vineBoom);

            _bossPhase = 2;
            _bossMaxHp = 500;
            _bossCurrentHp = 1;

            _playBgm(BOSS_AUDIO_PATHS.bgmPhase2);
            _showP5Dialogue("¡¡CONTEMPLA LA VERDADERA DIVINIDAD!!", "SAPHYNIEL // DIVINO", "angry", 0);

            let healInterval = setInterval(() => {
                _bossCurrentHp += 15;
                _triggerScreenShake();
                _xpld(window.innerWidth / 2, window.innerHeight * 0.48, '#ffaa00', 6);

                if (_bossCurrentHp >= _bossMaxHp) {
                    _bossCurrentHp = _bossMaxHp;
                    clearInterval(healInterval);
                    _damageLock = false;

                    _spawnShieldCrystal();
                    _bombSpawnerTimer = setInterval(_spawnBomb, 2800);
                    _qteSpawnerTimer = setInterval(_spawnQteCross, 5500);

                    setTimeout(() => { document.getElementById('p5-box').classList.remove('active'); }, 1200);
                }
                _updateHpBar();
            }, 60);
        }
    }
    playSeq();
}

function _triggerGoodEndingCutscene() {
    _damageLock = true;
    _clearAllTimersAndAttacks();
    _stopBgm();

    document.getElementById('boss-core').style.display = 'none';
    document.getElementById('boss-hud').style.display = 'none';
    document.getElementById('player-hud').style.display = 'none';

    playAudio(BOSS_AUDIO_PATHS.bossDefeat);
    const endScreen = document.getElementById('ending-screen');
    document.getElementById('ending-title').textContent = "GOOD ENDING";
    
    const track = document.getElementById('credits-track');
    if (track) track.innerHTML = '';
    
    endScreen.classList.add('visible');

    setTimeout(() => {
        _showP5Dialogue("¿Te has divertido?", "SAPHYNIEL", "mid", 0, () => {
            const choices = document.getElementById('p5-choices');
            choices.classList.add('active');
        });
    }, 800);
}

document.getElementById('choice-yes').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('p5-choices').classList.remove('active');
    _showP5Dialogue("Qué bien... me alegra que la hayamos pasado bien.", "SAPHYNIEL", "mid", 3200, () => {
        setTimeout(() => {
            window.parent.postMessage({ type: 'BOSS_DEFEATED' }, window.location.origin === 'null' || window.location.protocol === 'file:' ? '*' : window.location.origin);
        }, 1000);
    });
});

document.getElementById('choice-no').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('p5-choices').classList.remove('active');
    _showP5Dialogue("[. . .]", "SAPHYNIEL", "yandere", 2200, () => {
        const endScreen = document.getElementById('ending-screen');
        endScreen.classList.remove('visible');
        _triggerPhase3Glitch();
    });
});

function _triggerBadEnding() {
    _damageLock = true;
    _clearAllTimersAndAttacks();
    _stopBgm();

    document.getElementById('boss-core').style.display = 'none';
    document.getElementById('boss-hud').style.display = 'none';
    document.getElementById('player-hud').style.display = 'none';

    playAudio(BOSS_AUDIO_PATHS.defeatLaugh);
    const gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.classList.add('visible');
    document.getElementById('retry-btn').classList.remove('visible');

    const laughDialogues = [
        { text: "jajajajaja", time: 1800, tone: "angry" },
        { text: "jajajajaja...", time: 2000, tone: "yandere" },
        { text: "jajajaja...- suficiente...", time: 2400, tone: "low" },
        { text: "¿Quieres intentarlo de nuevo?", time: 0, tone: "mid" }
    ];

    let lIdx = 0;
    function playLaughSequence() {
        if (lIdx < laughDialogues.length) {
            const item = laughDialogues[lIdx];
            _showP5Dialogue(item.text, "SAPHYNIEL", item.tone, item.time, () => {
                lIdx++;
                if (lIdx < laughDialogues.length) {
                    setTimeout(playLaughSequence, 300);
                } else {
                    document.getElementById('retry-btn').classList.add('visible');
                }
            });
        }
    }
    setTimeout(playLaughSequence, 1200);
}

document.getElementById('retry-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.classList.remove('visible');
    document.getElementById('retry-btn').classList.remove('visible');
    document.getElementById('p5-box').classList.remove('active');
    document.getElementById('end-record-final').classList.remove('active');

    _clearAllTimersAndAttacks();

    _bossPhase = 1;
    _bossMaxHp = 350;
    _bossCurrentHp = 350;
    _playerHp = 3;
    _damageLock = true;
    _crystalActive = false;
    _stolenHeartActive = false;
    _p1Hit75 = _p1Hit50 = _p1Hit20 = false;
    _p2Hit75 = _p2Hit50 = _p2Hit20 = _p2ClonesSpawned = false;
    _p3Hit75 = _p3Hit50 = _p3Hit20 = _p3EnrageTriggered = false;

    document.body.classList.remove('phase-2-active', 'phase-3-active', 'glitch-flash');
    document.getElementById('boss-title-name').textContent = "SAPHYNIEL // DEIDAD TRANSCENDENTE";
    document.getElementById('boss-core-img').src = BOSS_SPRITES.coreIcon;
    
    const core = document.getElementById('boss-core');
    core.style.display = 'flex';
    core.style.top = '48%';
    core.style.left = '50%';
    core.style.transform = 'translate(-50%, -50%) scale(1.6)';

    document.getElementById('boss-hud').style.display = 'flex';
    document.getElementById('player-hud').style.display = 'flex';

    for (let i = 1; i <= 3; i++) {
        document.getElementById(`heart-${i}`).classList.remove('lost');
    }
    _updateHpBar();

    _playBgm(BOSS_AUDIO_PATHS.bgmPhase1);

    _showP5Dialogue("Bueno, te dejaré una segunda oportunidad...", "SAPHYNIEL", "mid", 2600, () => {
        _showP5Dialogue("Así podré reírme de ti.", "SAPHYNIEL", "angry", 2400, () => {
            _damageLock = false;
            _bombSpawnerTimer = setInterval(_spawnBomb, 3200);
            _qteSpawnerTimer = setInterval(_spawnQteCross, 6500);
        });
    });
});

function _triggerPhase3Glitch() {
    document.body.classList.remove('phase-2-active');
    document.body.classList.add('glitch-flash');
    playAudio(BOSS_AUDIO_PATHS.vineBoom);

    setTimeout(() => {
        document.body.classList.remove('glitch-flash');
        document.body.classList.add('phase-3-active');

        document.getElementById('boss-title-name').textContent = "SAPHYNIEL // COLAPSO DEL VACÍO";
        
        const core = document.getElementById('boss-core');
        core.style.display = 'flex';
        document.getElementById('boss-hud').style.display = 'flex';
        document.getElementById('player-hud').style.display = 'flex';

        const coreImg = document.getElementById('boss-core-img');
        coreImg.src = BOSS_SPRITES.bossFase3Gif;

        _bossPhase = 3;
        _bossMaxHp = 650;
        _bossCurrentHp = _bossMaxHp;
        _updateHpBar();

        _playBgm(BOSS_AUDIO_PATHS.bgmPhase3);
        _startPhase3CameraFX();
        _spawnClones();
        _spawnShieldCrystal();

        _damageLock = false;

        _bombSpawnerTimer = setInterval(_spawnBomb, 2000);
        _qteSpawnerTimer = setInterval(_spawnQteCross, 4500);
        _trapSpawnerTimer = setInterval(_spawnTrapHeart, 6000);

        _showP5Dialogue("ENTONCES DESTRUYAMOS ESTA REALIDAD.", "SAPHYNIEL // VACÍO", "yandere", 2800);
    }, 2000);
}

function _triggerPhase3Enrage() {
    _damageLock = true;
    _clearAllTimersAndAttacks();

    const enrageOverlay = document.getElementById('enrage-overlay');
    const timerEl = document.getElementById('enrage-timer');
    enrageOverlay.classList.add('active');

    playAudio(BOSS_AUDIO_PATHS.enrageAlarm);
    _showP5Dialogue("¡¡JUICIO FINAL!! ¡QUEBRAREMOS TU CÓDICE!", "SAPHYNIEL // VACÍO", "yandere", 2000);

    let remainingSeals = 5;
    let timeLeft = 4.0;

    for (let i = 0; i < 5; i++) {
        const seal = document.createElement('div');
        seal.className = 'chain-seal spawn-blip';
        seal.textContent = '❖';
        seal.style.top = `${Math.random() * 55 + 20}vh`;
        seal.style.left = `${Math.random() * 70 + 15}vw`;

        const onSealHit = (e) => {
            e.preventDefault();
            e.stopPropagation();
            remainingSeals--;
            _xpld(seal.offsetLeft + 30, seal.offsetTop + 30, '#ffffff', 20);
            playAudio(BOSS_AUDIO_PATHS.sealBreak);
            seal.remove();

            if (remainingSeals <= 0) {
                clearInterval(_enrageInterval);
                enrageOverlay.classList.remove('active');

                const impactFrame = document.getElementById('anime-impact-frame');
                impactFrame.classList.add('active');
                _beep(80, 0.12, 'sawtooth', 0.1);

                setTimeout(() => {
                    impactFrame.classList.remove('active');
                    _bossCurrentHp = 0;
                    _updateHpBar();
                    _endTrueVictory();
                }, 120);
            }
        };

        seal.addEventListener('pointerdown', onSealHit);
        document.body.appendChild(seal);
    }

    _enrageInterval = setInterval(() => {
        timeLeft -= 0.1;
        timerEl.textContent = `${Math.max(0, timeLeft).toFixed(1)}s`;

        if (timeLeft <= 0) {
            clearInterval(_enrageInterval);
            enrageOverlay.classList.remove('active');
            document.querySelectorAll('.chain-seal').forEach(s => s.remove());
            
            _playerHp = 0;
            _damagePlayer();
        }
    }, 100);
}

function _endTrueVictory() {
    _damageLock = true;
    _clearAllTimersAndAttacks();
    _stopBgm();

    document.getElementById('boss-core').style.display = 'none';
    document.getElementById('boss-hud').style.display = 'none';
    document.getElementById('player-hud').style.display = 'none';

    const core = document.getElementById('boss-core');
    const r = core.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    _showP5Dialogue("Tú... realmente has trascendido todo límite...", "SAPHYNIEL", "low", 3000, () => {
        for (let k = 0; k < 6; k++) {
            setTimeout(() => {
                _xpld(cx, cy, '#ffffff', 30);
                _xpld(cx, cy, '#ffd700', 30);
                _triggerScreenShake();
                _beep(90 + (k * 60), 0.3, 'sawtooth', 0.09);
            }, k * 180);
        }

        setTimeout(() => {
            playAudio(BOSS_AUDIO_PATHS.bossDefeat);
            const endScreen = document.getElementById('ending-screen');
            document.getElementById('ending-title').textContent = "TRUE TRANSCENDENCE";
            endScreen.style.opacity = '1';
            endScreen.classList.add('visible');

            triggerCreditsSequence(() => {
                setTimeout(() => {
                    const bellEl = document.getElementById('end-record-final');
                    if (bellEl) {
                        bellEl.classList.add('glitch-flash');
                        setTimeout(() => {
                            bellEl.classList.remove('glitch-flash', 'active');
                            endScreen.classList.remove('visible');
                            window.parent.postMessage({ type: 'BOSS_DEFEATED' }, window.location.origin === 'null' || window.location.protocol === 'file:' ? '*' : window.location.origin);
                        }, 2500);
                    }
                }, 3000);
            });
        }, 1300);
    });
}

window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'START_BOSS') {
        _aInit();
        _playBgm(BOSS_AUDIO_PATHS.bgmPhase1);

        const introQuotes = [
            "¿Creíste que una máquina orbital perturbaría mi presencia?",
            "Has despertado la voluntad absoluta del Códice...",
            "Pobre alma mortal. Contempla el peso del juicio divino."
        ];

        let qIdx = 0;
        function showNextIntroQuote() {
            if (qIdx < introQuotes.length) {
                _showP5Dialogue(introQuotes[qIdx], "SAPHYNIEL // DEIDAD", "low", 2800, () => {
                    qIdx++;
                    setTimeout(showNextIntroQuote, 350);
                });
            } else {
                _damageLock = false;
                _showP5Dialogue("¡DEMUÉSTRAME SI ERES DIGNO DE TRASCENDER!", "SAPHYNIEL // DEIDAD", "angry", 2600);
                playAudio(BOSS_AUDIO_PATHS.bossIntro);

                _bombSpawnerTimer = setInterval(_spawnBomb, 3200);
                _qteSpawnerTimer = setInterval(_spawnQteCross, 6500);
            }
        }
        showNextIntroQuote();
    }
});