let _ac = null, _sOn = true, _isF = false, _cCount = 0, _cTmr, _fTmr, _vnTmr, _typewriterTimer = null;
let _lastCmd = "";
let _currentChamp = 'kindred';
let _bossBeaten = false;
let _bossActive = false;
let _cinematicActive = false;
let _rebuildTimer = null;
let _discordAvatarUrl = CODEX_DATA.sprites.normalBody;

let _avatarHoverAttempts = 0;
let _destructionCombo = 0;
let _destructionScore = 0;
let _comboTimer = null;

function playCustomAudio(url) {
    if (!_sOn || !url) return;
    try {
        const audio = new Audio(url);
        audio.volume = 0.25;
        audio.play().catch(() => {});
    } catch (e) {}
}

(function initFullscreen() {
    const btn = document.getElementById('fullscreen-toggle');
    if (!btn) return;

    function isFs() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    }
    function enterFs() {
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
        if (req) req.call(el).catch(() => {});
    }
    function exitFs() {
        const ext = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (ext) ext.call(document).catch(() => {});
    }
    function syncIcon() {
        const active = isFs();
        btn.classList.toggle('is-fullscreen', active);
        btn.textContent = '⛶';
        btn.title = active ? 'Salir de pantalla completa' : 'Modo pantalla completa';
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    btn.addEventListener('click', () => { isFs() ? exitFs() : enterFs(); });
    ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(evt => {
        document.addEventListener(evt, syncIcon);
    });

    const supported = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen || document.documentElement.msRequestFullscreen);
    if (!supported) btn.style.display = 'none';
})();

function _initDanmaku() {
    const box = document.getElementById('danmaku-box');
    setInterval(() => {
        const el = document.createElement('div');
        el.className = 'danmaku-item';
        el.textContent = CODEX_DATA.danmaku[Math.floor(Math.random() * CODEX_DATA.danmaku.length)];
        el.style.top = `${Math.random() * 85 + 5}vh`;
        el.style.animationDuration = `${Math.random() * 12 + 14}s`;
        box.appendChild(el);
        setTimeout(() => el.remove(), 26000);
    }, 2500);
}

const _cv = document.getElementById('particle-canvas');
const _cx = _cv.getContext('2d');
let _pts = [];
let _swords = [];

function _rsz() { _cv.width = window.innerWidth; _cv.height = window.innerHeight; }
window.addEventListener('resize', _rsz);
_rsz();

class _PixPt {
    constructor(x, y, col, vx, vy, dc = 0.02, sz = 4) {
        this.x = x; this.y = y;
        this.sz = sz || (Math.random() * 4 + 2);
        this.vx = vx !== undefined ? vx : (Math.random() - 0.5) * 14;
        this.vy = vy !== undefined ? vy : (Math.random() - 0.5) * 14;
        this.lf = 1.0;
        this.dc = dc || (Math.random() * 0.03 + 0.015);
        this.col = col;
    }
    up() { this.x += this.vx; this.y += this.vy; this.lf -= this.dc; }
    dr(ctx) {
        ctx.fillStyle = this.col;
        ctx.globalAlpha = Math.max(0, this.lf);
        ctx.fillRect(this.x, this.y, this.sz, this.sz);
    }
}

class _HolySword {
    constructor(x) {
        this.x = x; this.y = -100; this.vy = 28; this.done = false;
    }
    up() {
        this.y += this.vy;
        if (this.y > window.innerHeight * 0.55) {
            this.done = true;
            _xpld(this.x, this.y, '#ffd700', 40);
            _triggerScreenShake();
            _swordImpactSound();
        }
    }
    dr(ctx) {
        ctx.fillStyle = '#fff'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 18;
        ctx.fillRect(this.x - 3, this.y, 6, 80);
        ctx.fillRect(this.x - 14, this.y + 20, 28, 6);
        ctx.shadowBlur = 0;
    }
}

function _xpld(x, y, col = '#dad4bb', cnt = 20) {
    for (let i = 0; i < cnt; i++) _pts.push(new _PixPt(x, y, col));
}

function _rainBlessing() {
    for (let i = 0; i < 45; i++) {
        const px = Math.random() * window.innerWidth;
        const py = Math.random() * -200;
        _pts.push(new _PixPt(px, py, '#ffd700', (Math.random() - 0.5) * 1.5, Math.random() * 3 + 2, 0.006, 3));
    }
}

function _animP() {
    _cx.clearRect(0, 0, _cv.width, _cv.height);
    for (let i = _pts.length - 1; i >= 0; i--) {
        _pts[i].up();
        _pts[i].dr(_cx);
        if (_pts[i].lf <= 0) _pts.splice(i, 1);
    }
    for (let i = _swords.length - 1; i >= 0; i--) {
        _swords[i].up();
        _swords[i].dr(_cx);
        if (_swords[i].done) _swords.splice(i, 1);
    }
    requestAnimationFrame(_animP);
}
_animP();

function _aInit() {
    if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
    if (_ac.state === 'suspended') _ac.resume();
}
window.addEventListener('click', _aInit, { once: true });
window.addEventListener('touchstart', _aInit, { once: true });

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

function _liturgicalChime() {
    _beep(523.25, 2.2, 'sine', 0.07);
    setTimeout(() => _beep(659.25, 2.0, 'sine', 0.05), 180);
    setTimeout(() => _beep(783.99, 2.4, 'sine', 0.04), 360);
}

function _swordImpactSound() {
    _beep(120, 0.4, 'sawtooth', 0.08);
    _beep(880, 0.6, 'triangle', 0.06);
    setTimeout(() => _beep(1760, 0.5, 'sine', 0.04), 50);
}

function _triggerScreenShake() {
    const main = document.getElementById('main-hud');
    main.classList.remove('shake-active');
    void main.offsetWidth;
    main.classList.add('shake-active');
    setTimeout(() => main.classList.remove('shake-active'), 180);
}

function _legoClickPop() {
    const freqs = [620, 840, 1120, 1480];
    freqs.forEach((f, idx) => {
        setTimeout(() => _beep(f, 0.06, 'triangle', 0.06), idx * 40);
    });
}

function _sndTgl() {
    _aInit(); _sOn = !_sOn;
    document.getElementById('sound-btn').textContent = _sOn ? "[ AUDIO: ACTIVO ]" : "[ AUDIO: SILENCIADO ]";
    if (_sOn) _beep(880, 0.05, 'sine');
}

function _mShow(t, m) {
    if (_cinematicActive || _bossActive) return;
    document.getElementById('modal-title').textContent = t;
    document.getElementById('modal-body').innerHTML = m;
    document.getElementById('hud-modal-overlay').classList.add('active');
    _beep(650, 0.15, 'sawtooth');
}

function _mCls(e) {
    if (!e || e.target.id === 'hud-modal-overlay' || e.target.classList.contains('hud-modal-btn')) {
        document.getElementById('hud-modal-overlay').classList.remove('active');
        _beep(350, 0.05, 'sine');
    }
}

function _tSw(tId) {
    if (_cinematicActive || _bossActive) return;
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    const t = document.getElementById(tId);
    if (t) t.classList.add('active');
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    _beep(700, 0.03, 'sine');
}

function _upClk() {
    const n = new Date();
    const h = String(n.getUTCHours()).padStart(2, '0');
    const m = String(n.getUTCMinutes()).padStart(2, '0');
    const s = String(n.getUTCSeconds()).padStart(2, '0');
    const ms = String(n.getUTCMilliseconds()).padStart(3, '0');
    const el = document.getElementById('utc-clock');
    if (el) el.textContent = `HORA CANÓNICA // ${h}:${m}:${s}:${ms} UTC`;
}
setInterval(_upClk, 35);

const _bEl = document.getElementById('typewriter-text');
const _bTx = _bEl.getAttribute('data-bio');
let _bI = 0;
function _tpW() {
    if (_bI < _bTx.length) {
        if (_bTx.substr(_bI, 2) === '\\n') { _bEl.innerHTML += '<br>'; _bI += 2; }
        else { _bEl.innerHTML += _bTx.charAt(_bI); _bI++; }
        setTimeout(_tpW, Math.random() * 35 + 20);
    } else {
        _bEl.innerHTML += '<span style="animation: blink 1s infinite;">_</span>';
    }
}
window.onload = () => { 
    setTimeout(_tpW, 500); 
    _renderVerses();
    _renderFaq();
    _initDanmaku();
    _initOrbitalDraggable();
    _initRightClickDestruction();
};
document.head.insertAdjacentHTML("beforeend", `<style>@keyframes blink { 50% { opacity: 0; } }</style>`);

function _showP5Dialogue(text, speaker = "SAPHYNIEL", tone = "mid", autoHideTime = 2800, callback = null) {
    const box = document.getElementById('p5-box');
    const nameEl = document.getElementById('p5-name');
    const textEl = document.getElementById('p5-text');
    const cutinImg = document.getElementById('p5-cutin-img');

    clearTimeout(_vnTmr);
    clearTimeout(_typewriterTimer);
    document.body.classList.add('dialogue-locked');

    if (tone === 'angry') {
        box.classList.add('angry-theme');
        cutinImg.src = CODEX_DATA.sprites.angryBody;
    } else if (tone === 'yandere') {
        box.classList.add('angry-theme');
        cutinImg.src = CODEX_DATA.sprites.yandereBody;
    } else {
        box.classList.remove('angry-theme');
        cutinImg.src = CODEX_DATA.sprites.normalBody;
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
            _typewriterTimer = setTimeout(typeChar, 20);
        } else {
            if (autoHideTime > 0) {
                _vnTmr = setTimeout(() => {
                    box.classList.remove('active');
                    document.body.classList.remove('dialogue-locked');
                    if (callback) callback();
                }, autoHideTime);
            } else {
                document.body.classList.remove('dialogue-locked');
                if (callback) callback();
            }
        }
    }
    typeChar();
}

function _initRightClickDestruction() {
    function destroyElement(el, x, y) {
        if (_cinematicActive || _bossActive) return;
        if (!el || el.classList.contains('destroyed-block') || el.id === 'orbital-crosshair' || el.id === 'avatar-area' || el.id === 'frag-header') return;
        
        el.style.setProperty('--rx', Math.random().toFixed(2));
        el.style.setProperty('--ry', Math.random().toFixed(2));
        el.style.setProperty('--rr', Math.random().toFixed(2));
        el.classList.add('destroyed-block');

        _destructionCombo++;
        const basePts = 100;
        const earnedPts = basePts * _destructionCombo;
        _destructionScore += earnedPts;

        let tierColor = '#dad4bb';
        let tierText = `x${_destructionCombo} (+${earnedPts})`;
        if (_destructionCombo >= 2 && _destructionCombo < 5) tierColor = '#43b581';
        else if (_destructionCombo >= 5 && _destructionCombo < 9) tierColor = '#00b0f4';
        else if (_destructionCombo >= 9 && _destructionCombo < 14) tierColor = '#ff73fa';
        else if (_destructionCombo >= 14) {
            tierColor = '#ffd700';
            tierText = `DIVINO x${_destructionCombo} (+${earnedPts})`;
        }

        _showComboPopup(x, y, tierText, tierColor);
        _updateComboHud();

        clearTimeout(_comboTimer);
        _comboTimer = setTimeout(() => {
            _destructionCombo = 0;
            _updateComboHud();
        }, 4000);

        _xpld(x, y, tierColor, 12);
        _beep(220 + (_destructionCombo * 15), 0.15, 'sawtooth');

        clearTimeout(_rebuildTimer);
        _rebuildTimer = setTimeout(() => {
            _restoreAllDestroyed();
            _destructionCombo = 0;
            _updateComboHud();
        }, 3000);
    }

    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (_cinematicActive || _bossActive) return;
        const target = e.target.closest('.destructible') || e.target.closest('.link-btn') || e.target.closest('.quote-card') || e.target.closest('.lol-card');
        if (target && !target.closest('#frag-header')) destroyElement(target, e.clientX, e.clientY);
    });

    let lastTap = 0;
    window.addEventListener('touchend', (e) => {
        if (_cinematicActive || _bossActive) return;
        const now = Date.now();
        if (now - lastTap < 300) {
            const touch = e.changedTouches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            const dest = target && (target.closest('.destructible') || target.closest('.link-btn') || target.closest('.quote-card') || target.closest('.lol-card'));
            if (dest && !dest.closest('#frag-header')) destroyElement(dest, touch.clientX, touch.clientY);
        }
        lastTap = now;
    });
}

function _showComboPopup(x, y, text, color) {
    const pop = document.createElement('div');
    pop.className = 'combo-popup';
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    pop.style.color = color;
    pop.style.fontSize = Math.min(1.4, 0.8 + (_destructionCombo * 0.05)) + 'rem';
    pop.style.textShadow = `0 0 12px ${color}`;
    pop.textContent = text;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
}

function _updateComboHud() {
    const hud = document.getElementById('combo-hud');
    if (_destructionCombo > 1) {
        hud.classList.add('active');
        hud.textContent = `COMBO x${_destructionCombo} // PTS: ${_destructionScore}`;
        if (_destructionCombo >= 14) {
            hud.style.color = '#ffd700';
            hud.style.textShadow = '0 0 15px #ffd700, 0 0 30px #fff';
        } else if (_destructionCombo >= 9) {
            hud.style.color = '#ff73fa';
            hud.style.textShadow = '0 0 12px #ff73fa';
        } else {
            hud.style.color = '#43b581';
            hud.style.textShadow = '0 0 10px #43b581';
        }
    } else {
        hud.classList.remove('active');
    }
}

function _restoreAllDestroyed() {
    const destroyed = document.querySelectorAll('.destroyed-block');
    if (destroyed.length === 0) return;

    destroyed.forEach(el => {
        el.classList.remove('destroyed-block');
        el.classList.add('restoring-block');
        setTimeout(() => el.classList.remove('restoring-block'), 550);
    });

    _legoClickPop();
    playCustomAudio(CODEX_DATA.sounds.legoPop);
}

function _initOrbitalDraggable() {
    const cross = document.getElementById('orbital-crosshair');
    const ghost = document.getElementById('ghost-target');
    let isDragging = false, startX, startY;

    function onStart(e) {
        if (_cinematicActive || _bossActive) return;
        isDragging = true;
        ghost.classList.add('active');
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        startX = clientX - cross.offsetLeft;
        startY = clientY - cross.offsetTop;
    }

    function onMove(e) {
        if (!isDragging || _cinematicActive || _bossActive) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        const nx = clientX - startX;
        const ny = clientY - startY;
        cross.style.left = `${nx}px`;
        cross.style.top = `${ny}px`;
        cross.style.right = 'auto';

        const avR = document.getElementById('avatar-area').getBoundingClientRect();
        const distToAvatar = Math.hypot(clientX - (avR.left + avR.width / 2), clientY - (avR.top + avR.height / 2));
        const distToCenter = Math.hypot(clientX - (window.innerWidth / 2), clientY - (window.innerHeight / 2));

        if (distToAvatar < 70 || distToCenter < 90) {
            cross.style.borderColor = '#ff3333';
            cross.style.boxShadow = '0 0 20px #ff0000';
        } else {
            cross.style.borderColor = 'rgba(218, 212, 187, 0.75)';
            cross.style.boxShadow = 'none';
        }
    }

    function onEnd() {
        if (!isDragging) return;
        isDragging = false;
        ghost.classList.remove('active');
        if (_cinematicActive || _bossActive) return;

        const cr = cross.getBoundingClientRect();
        const cx = cr.left + cr.width / 2;
        const cy = cr.top + cr.height / 2;

        const avR = document.getElementById('avatar-area').getBoundingClientRect();
        const distToAvatar = Math.hypot(cx - (avR.left + avR.width / 2), cy - (avR.top + avR.height / 2));

        if (_bossBeaten && distToAvatar < 75) {
            const lines = CODEX_DATA.orbitalWarnings.bossRefused;
            _showP5Dialogue(lines[Math.floor(Math.random() * lines.length)], "SAPHYNIEL", "low");
            return;
        }

        if (distToAvatar < 70) {
            _avatarHoverAttempts++;
            if (_avatarHoverAttempts === 1) {
                _showP5Dialogue(CODEX_DATA.orbitalWarnings.attempt1, "SAPHYNIEL", "mid", 2800);
            } else if (_avatarHoverAttempts === 2) {
                _showP5Dialogue(CODEX_DATA.orbitalWarnings.attempt2, "SAPHYNIEL", "low", 2800);
            } else {
                _showP5Dialogue(CODEX_DATA.orbitalWarnings.attempt3, "SAPHYNIEL", "angry", 1500, () => {
                    _startBossLaunchSequence();
                });
            }
        } else {
            const distToCenter = Math.hypot(cx - (window.innerWidth / 2), cy - (window.innerHeight / 2));
            if (distToCenter < 90) _startOrbitalBombardment();
        }
    }

    cross.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    cross.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
}

function _startBossLaunchSequence() {
    _cinematicActive = true;
    _restoreAllDestroyed();
    document.getElementById('orbital-crosshair').style.display = 'none';

    const countEl = document.getElementById('orbital-countdown');
    countEl.style.display = 'block';
    let count = 3;
    countEl.textContent = count;
    _beep(800, 0.1, 'sawtooth');

    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            countEl.textContent = count;
            _beep(800, 0.1, 'sawtooth');
        } else {
            clearInterval(timer);
            countEl.style.display = 'none';
            
            const flash = document.getElementById('flash-screen');
            flash.classList.add('active');
            playCustomAudio(CODEX_DATA.sounds.vineBoom);

            setTimeout(() => {
                flash.classList.remove('active');
                const frame = document.getElementById('boss-frame');
                frame.classList.add('active');
                frame.contentWindow.postMessage({ type: 'START_BOSS' }, window.location.origin === 'null' || window.location.protocol === 'file:' ? '*' : window.location.origin);
                _bossActive = true;
                _cinematicActive = false;
            }, 120);
        }
    }, 700);
}

window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'BOSS_DEFEATED') {
        const frame = document.getElementById('boss-frame');
        frame.classList.remove('active');
        
        _bossActive = false;
        _bossBeaten = true;
        _cCount = 0;

        document.getElementById('orbital-crosshair').style.display = 'flex';
        document.getElementById('orbital-crosshair').style.top = '25px';
        document.getElementById('orbital-crosshair').style.right = '25px';
        document.getElementById('orbital-crosshair').style.left = 'auto';

        const avatarImg = document.getElementById('avatar-img');
        if (avatarImg) avatarImg.src = _discordAvatarUrl;

        setTimeout(() => {
            _showP5Dialogue("Eso fue divertido... pasé un buen momento.", "SAPHYNIEL", "mid", 3200, () => {
                setTimeout(() => {
                    _showP5Dialogue("Pero recuerda: solo podías hacer eso una vez.", "SAPHYNIEL", "mid", 3600);
                }, 400);
            });
            _liturgicalChime();
        }, 400);
    }
});

function _startOrbitalBombardment() {
    if (_cinematicActive || _bossActive) return;
    const countEl = document.getElementById('orbital-countdown');
    const beamEl = document.getElementById('orbital-beam');
    countEl.style.display = 'block';
    let count = 3;
    countEl.textContent = count;
    _beep(800, 0.1, 'sawtooth');

    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            countEl.textContent = count;
            _beep(800, 0.1, 'sawtooth');
        } else {
            clearInterval(timer);
            countEl.style.display = 'none';
            beamEl.classList.add('firing');
            _triggerScreenShake();
            _swordImpactSound();
            _triggerTotalDestruction();

            setTimeout(() => { beamEl.classList.remove('firing'); }, 350);
        }
    }, 700);
}

function _triggerTotalDestruction() {
    const allBlocks = document.querySelectorAll('.destructible, .link-btn, .quote-card, .lol-card, .tab-btn, .pc-side-panel');
    allBlocks.forEach(el => {
        el.style.setProperty('--rx', Math.random().toFixed(2));
        el.style.setProperty('--ry', Math.random().toFixed(2));
        el.style.setProperty('--rr', Math.random().toFixed(2));
        el.classList.add('destroyed-block');
        const r = el.getBoundingClientRect();
        _xpld(r.left + r.width / 2, r.top + r.height / 2, '#dad4bb', 12);
    });

    _beep(110, 0.5, 'sawtooth', 0.09);
    clearTimeout(_rebuildTimer);
    _rebuildTimer = setTimeout(_restoreAllDestroyed, 2500);
}

function _selectChamp(champKey) {
    if (_cinematicActive || _bossActive) return;
    _currentChamp = champKey;
    const c = CODEX_DATA.champions[champKey];
    if (!c) return;

    document.getElementById('lol-splash-img').src = c.splash;
    document.getElementById('lol-champ-title').textContent = c.title;
    document.getElementById('lol-champ-meta').textContent = c.meta;
    document.getElementById('lol-stat-role').textContent = c.role;
    document.getElementById('lol-stat-pts').textContent = c.pts;

    document.querySelectorAll('.champ-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === champKey);
    });

    if (c.sound) c.sound(_beep);
    const r = document.getElementById('lol-card-trigger').getBoundingClientRect();
    _xpld(r.left + r.width / 2, r.top + r.height / 2, '#ffd700', 16);
}

function _triggerChampInteraction(e) {
    if (_cinematicActive || _bossActive) return;
    const c = CODEX_DATA.champions[_currentChamp];
    if (_currentChamp === 'kayle') {
        _trgF();
        _showP5Dialogue("¡Hereje!", "SAPHYNIEL", "angry", 2500);
        const r = e.currentTarget.getBoundingClientRect();
        _swords.push(new _HolySword(e.clientX || (r.left + r.width / 2)));
    } else {
        _showP5Dialogue(c.quote, "SAPHYNIEL", "mid", 2400);
        if (c.sound) c.sound(_beep);
        const r = e.currentTarget.getBoundingClientRect();
        _xpld(e.clientX || (r.left + r.width / 2), e.clientY || (r.top + r.height / 2), '#dad4bb', 16);
    }
}

function _renderVerses() {
    const deck = document.getElementById('quotes-deck');
    deck.innerHTML = '';
    const shuffled = [...CODEX_DATA.verses].sort(() => 0.5 - Math.random()).slice(0, 3);
    shuffled.forEach(v => {
        const card = document.createElement('div');
        card.className = 'quote-card destructible';
        card.innerHTML = `<div class="quote-tag">${v.tag}</div><div class="quote-body">${v.body}</div>`;
        card.addEventListener('click', (e) => {
            if (_cinematicActive || _bossActive) return;
            card.classList.toggle('gold-seal');
            const r = card.getBoundingClientRect();
            _xpld(e.clientX || (r.left + r.width / 2), e.clientY || (r.top + r.height / 2), '#ffd700', 18);
            _beep(987.77, 0.35, 'sine', 0.06);
        });
        deck.appendChild(card);
    });
}

function _rerollVerses() {
    if (_cinematicActive || _bossActive) return;
    const deck = document.getElementById('quotes-deck');
    deck.style.opacity = '0';
    _beep(520, 0.1, 'square');
    setTimeout(() => {
        _renderVerses();
        deck.style.opacity = '1';
        _beep(880, 0.15, 'triangle');
    }, 200);
}

function _renderFaq() {
    const list = document.getElementById('faq-container-list');
    if (!list) return;
    list.innerHTML = '';
    CODEX_DATA.faq.forEach(item => {
        const details = document.createElement('details');
        details.className = 'faq-item destructible';
        details.innerHTML = `
            <summary>${item.q}</summary>
            <div class="faq-content">${item.a}</div>
        `;
        list.appendChild(details);
    });
}

const _platformSounds = {
    yt: () => { _beep(440, 0.15, 'sine'); setTimeout(() => _beep(880, 0.2, 'sine'), 60); },
    sp: () => { _beep(180, 0.2, 'sawtooth'); setTimeout(() => _beep(360, 0.25, 'triangle'), 80); },
    st: () => { _beep(550, 0.1, 'square'); setTimeout(() => _beep(733, 0.2, 'square'), 70); },
    tk: () => { _beep(700, 0.08, 'triangle'); setTimeout(() => _beep(1050, 0.15, 'triangle'), 50); },
    ds: () => { _beep(300, 0.1, 'sine'); setTimeout(() => _beep(600, 0.15, 'sine'), 50); }
};

document.querySelectorAll('.link-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        if (_cinematicActive || _bossActive) return;
        const p = btn.getAttribute('data-platform');
        if (_platformSounds[p]) _platformSounds[p]();
    });
});

const _cIn = document.getElementById('terminal-cmd');
const _tLog = document.getElementById('terminal-log');
function _aLog(m, t = '') {
    const d = document.createElement('div');
    d.className = `terminal-log-entry ${t}`;
    d.textContent = m;
    _tLog.appendChild(d);
    _tLog.scrollTop = _tLog.scrollHeight;
}

_cIn.addEventListener('keydown', (e) => {
    if (_cinematicActive || _bossActive) return;
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (_lastCmd) _cIn.value = _lastCmd;
        return;
    }
    if (e.key === 'Enter') {
        const v = _cIn.value.trim().toUpperCase();
        _cIn.value = '';
        if (!v) return;
        _lastCmd = v;
        _aLog(`> ${v}`, 'sys');

        if (v === 'BLESS') {
            _rainBlessing();
            _liturgicalChime();
            _aLog("[SACRO] LLUVIA DE BENDICIONES DERRAMADA.", "success");
        } else if (v === 'JUDGMENT') {
            _triggerScreenShake();
            _swordImpactSound();
            _swords.push(new _HolySword(window.innerWidth / 2));
            _aLog("[JUICIO] ESPADA CELESTIAL DESCENDIDA.", "err");
        } else if (v === 'KINDRED') {
            _tSw('tab-lol');
            _selectChamp('kindred');
            _aLog("[REGISTRO] CAZADORES ETERNOS EN POSICIÓN.", "success");
        } else if (v === 'SHYVANA') {
            _tSw('tab-lol');
            _selectChamp('shyvana');
            _aLog("[REGISTRO] DRAGÓN DESPERTADO.", "success");
        } else if (v === 'KAYLE') {
            _tSw('tab-lol');
            _selectChamp('kayle');
            _aLog("[REGISTRO] ASCENSIÓN DIVINA.", "success");
        } else if (v === 'FALLEN') {
            _trgF();
            _aLog("[AVISO] SECCIÓN CLAUSURADA.", "err");
        } else if (v === 'ANGEL') {
            _restoreState();
            _aLog("[OK] LECTURA RESTAURADA.", "success");
            _beep(1200, 0.3, 'sine');
        } else if (v === 'HELP') {
            _aLog("MANDATOS: BLESS, JUDGMENT, KINDRED, SHYVANA, KAYLE, FALLEN, ANGEL, CLEAR, STATUS", "sys");
        } else if (v === 'STATUS') {
            _aLog("REGISTRO: EN LÍNEA // ENCRIPTACIÓN SAGRADA ACTIVA", "success");
        } else if (v === 'CLEAR') {
            _tLog.innerHTML = '<div class="terminal-log-entry sys">[CÓDICE] Registro limpiado.</div>';
            _beep(300, 0.08, 'sine');
        } else {
            _aLog(`[ERROR] MANDATO '${v}' NO RECONOCIDO.`, "err");
            _beep(200, 0.1, 'sawtooth');
        }
    }
});

const _avTr = document.getElementById('avatar-trigger');
const _angI = document.getElementById('anger-icon');

_avTr.addEventListener('pointerdown', () => {
    if (_cinematicActive || _bossActive || _isF) return;

    const r = _avTr.getBoundingClientRect();
    _xpld(r.left + r.width / 2, r.top + r.height / 2, _isF ? '#ff3333' : '#dad4bb', 14);
    
    _cCount++;
    clearTimeout(_cTmr);
    _cTmr = setTimeout(() => { 
        _cCount = 0; 
        _angI.style.display = 'none';
    }, 3000);

    _avTr.style.transform = `scale(${Math.max(0.82, 1 - (_cCount * 0.035))})`;
    setTimeout(() => { _avTr.style.transform = 'scale(1)'; }, 100);

    if (_cCount >= 3) {
        _angI.style.display = 'block';
        _angI.style.transform = `scale(${1 + (_cCount * 0.08)}) rotate(${15 + (_cCount * 3)}deg)`;
    }

    if (_cCount >= 2 && _cCount <= 7) {
        const dIdx = Math.min(CODEX_DATA.avatarDialogues.length - 1, _cCount - 2);
        const item = CODEX_DATA.avatarDialogues[dIdx];
        _showP5Dialogue(item.text, "SAPHYNIEL", item.tone, 2000);
    }

    if (_cCount >= 7 && !_isF) {
        _trgF();
        _showP5Dialogue("¡¡NO HABRÁ MISERICORDIA!!", "SAPHYNIEL", "yandere", 2600);
        _cCount = 0;
    }
});

function _trgF() {
    _isF = true;
    document.body.classList.add('fallen-mode');
    document.getElementById('display-name').innerText = "CLAVIS";
    _bEl.innerHTML = "FOLIO SELLADO. <br>Vanitas vanitatum et omnia vanitas.";
    _beep(140, 0.4, 'sawtooth');

    clearTimeout(_fTmr);
    _fTmr = setTimeout(() => { _restoreState(); }, 6000);
}

function _restoreState() {
    _isF = false;
    document.body.classList.remove('fallen-mode');
    document.getElementById('display-name').innerText = "SAPHYNIEL";
    _bEl.innerHTML = "Lucerna pedibus meis verbum tuum et lumen semitis meis. <br>In silentio et in spe erit fortitudo vestra.";
    _angI.style.display = 'none';
    _cCount = 0;
    _beep(900, 0.25, 'sine');
}

if (CODEX_DATA.discordId !== "") {
    fetchLanyardData();
    setInterval(fetchLanyardData, 4000);
}

function fetchLanyardData() {
    fetch(`https://api.lanyard.rest/v1/users/${CODEX_DATA.discordId}`)
        .then(r => r.json())
        .then(res => {
            if (res.success) {
                const d = res.data, u = d.discord_user;
                if (!_isF && !_bossActive) {
                    const ne = document.getElementById('display-name');
                    if (ne) ne.textContent = (u.global_name || u.username).toUpperCase();
                }
                const st = d.discord_status;
                const sc = st === "online" ? "#43b581" : st === "idle" ? "#faa61a" : st === "dnd" ? "#f04747" : "#747f8d";
                const hd = document.getElementById('discord-status-hud');
                if (hd) hd.innerHTML = `DISCORD: <span style="color:${sc}">● ${st.toUpperCase()}</span>`;
                
                const hsh = u.avatar;
                if (hsh) {
                    const ext = hsh.startsWith("a_") ? "gif" : "png";
                    _discordAvatarUrl = `https://cdn.discordapp.com/avatars/${CODEX_DATA.discordId}/${hsh}.${ext}?size=512`;
                    const ai = document.getElementById('avatar-img');
                    if (ai && !_isF && !_bossActive && !_cinematicActive) {
                        ai.src = _discordAvatarUrl;
                    }
                }
                
                document.getElementById('badge-desktop').className = `platform-badge ${d.active_on_discord_desktop ? 'active' : ''}`;
                document.getElementById('badge-mobile').className = `platform-badge ${d.active_on_discord_mobile ? 'active' : ''}`;
                document.getElementById('badge-web').className = `platform-badge ${d.active_on_discord_web ? 'active' : ''}`;
                _rRP(d);
            }
        })
        .catch(() => {});
}

function _rAst(appId, assetId) {
    if (!assetId) return null;
    if (assetId.startsWith("http://") || assetId.startsWith("https://")) return assetId;
    if (assetId.startsWith("mp:external/")) return `https://media.discordapp.net/external/${assetId.replace("mp:external/", "")}`;
    if (assetId.startsWith("spotify:")) return `https://i.scdn.co/image/${assetId.replace("spotify:", "")}`;
    return `https://cdn.discordapp.com/app-assets/${appId}/${assetId}.png`;
}

function _rRP(d) {
    const st = document.getElementById('rp-status-text');
    const spBox = document.getElementById('rp-spotify-box');
    const gmBox = document.getElementById('rp-game-box');
    const idlBox = document.getElementById('rp-idle-box');

    const spTitle = document.getElementById('rp-title');
    const spSub = document.getElementById('rp-subtitle');
    const spArt = document.getElementById('rp-art');
    const vz = document.getElementById('rp-visualizer');

    const gmLabel = document.getElementById('rp-game-label');
    const gmTitle = document.getElementById('rp-game-title');
    const gmSub = document.getElementById('rp-game-subtitle');
    const gmArt = document.getElementById('rp-game-art');

    let headers = [];
    let hasSpotify = false;
    let hasGame = false;

    if (d.listening_to_spotify && d.spotify) {
        hasSpotify = true;
        headers.push("SPOTIFY // EN VIVO");
        spTitle.textContent = d.spotify.song;
        spSub.textContent = `${d.spotify.artist} • ${d.spotify.album}`;
        spArt.src = d.spotify.album_art_url;
        spArt.style.display = 'block';
        vz.style.display = 'flex';
        spBox.style.display = 'flex';
    } else {
        spBox.style.display = 'none';
        vz.style.display = 'none';
    }

    const act = d.activities && d.activities.find(a => a.type === 0 && a.id !== "spotify:1");
    if (act) {
        hasGame = true;
        headers.push(`JUGANDO: ${act.name.toUpperCase()}`);
        gmLabel.textContent = `[ACTIVIDAD // ${act.name.toUpperCase()}]`;
        gmTitle.textContent = act.details || act.name;
        gmSub.textContent = act.state ? `${act.state}` : 'SESIÓN ACTIVA';
        
        let gameImg = null;
        if (act.assets && act.assets.large_image) {
            gameImg = _rAst(act.application_id, act.assets.large_image);
        }
        
        if (gameImg) {
            gmArt.src = gameImg;
            gmArt.style.display = 'block';
        } else {
            gmArt.style.display = 'none';
        }

        gmBox.style.display = 'flex';
    } else {
        gmBox.style.display = 'none';
    }

    if (hasSpotify || hasGame) {
        idlBox.style.display = 'none';
        st.textContent = headers.join(' // ');
    } else {
        idlBox.style.display = 'flex';
        st.textContent = 'ESTADO: REPOSO';
    }
}

function _initUniqueVisits() {
    const namespace = CODEX_DATA.uniqueVisitsKey;
    const key = "visits";
    const el = document.getElementById('sys-metric');

    const alreadyVisited = sessionStorage.getItem('codex_counted');
    const endpoint = alreadyVisited 
        ? `https://abacus.jasoncameron.dev/get/${namespace}/${key}`
        : `https://abacus.jasoncameron.dev/hit/${namespace}/${key}`;

    fetch(endpoint)
        .then(r => r.json())
        .then(data => {
            if (data && typeof data.value === 'number') {
                if (!alreadyVisited) sessionStorage.setItem('codex_counted', 'true');
                const hexVal = data.value.toString(16).toUpperCase().padStart(4, '0');
                if (el) el.textContent = `0x${hexVal}`;
            }
        })
        .catch(() => {
            if (el) el.textContent = "0x0001";
        });
}
_initUniqueVisits();