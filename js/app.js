window._isFallen = false;
window._bossBeaten = false;
window._bossActive = false;
window._cinematicActive = false;

let _danmakuInterval = null;
let _clockInterval = null;

const TabManager = {
    switchTab(tabId) {
        if (window._cinematicActive || window._bossActive) return;
        document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        const targetPane = document.getElementById(tabId);
        if (targetPane) targetPane.classList.add('active');
        if (event && event.currentTarget && event.currentTarget.classList.contains('tab-btn')) {
            event.currentTarget.classList.add('active');
        }
        AudioManager.beep(700, 0.03, 'sine');
    }
};

const ChampSelector = {
    current: 'kindred',

    select(champKey) {
        if (window._cinematicActive || window._bossActive) return;
        this.current = champKey;
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

        if (c.sound) c.sound((...args) => AudioManager.beep(...args));
        const r = document.getElementById('lol-card-trigger').getBoundingClientRect();
        ParticleEngine.explode(r.left + r.width / 2, r.top + r.height / 2, '#dad4bb', 16);
    },

    interact(e) {
        if (window._cinematicActive || window._bossActive) return;
        const c = CODEX_DATA.champions[this.current];
        if (this.current === 'kayle') {
            AvatarController.triggerFallen();
            DialogueSystem.show({ text: "¡Hereje!", speaker: "SAPHYNIEL", tone: "angry", autoHideTime: 2500 });
            const r = e.currentTarget.getBoundingClientRect();
            ParticleEngine.spawnSword(e.clientX || (r.left + r.width / 2));
        } else {
            DialogueSystem.show({ text: c.quote, speaker: "SAPHYNIEL", tone: "mid", autoHideTime: 2400 });
            if (c.sound) c.sound((...args) => AudioManager.beep(...args));
            const r = e.currentTarget.getBoundingClientRect();
            ParticleEngine.explode(e.clientX || (r.left + r.width / 2), e.clientY || (r.top + r.height / 2), '#dad4bb', 16);
        }
    }
};

const AvatarController = {
    clickCount: 0,
    clickTimer: null,
    fallenTimer: null,

    init() {
        const trigger = document.getElementById('avatar-trigger');
        const angerIcon = document.getElementById('anger-icon');
        if (!trigger || !angerIcon) return;

        trigger.addEventListener('pointerdown', () => {
            if (window._cinematicActive || window._bossActive || window._isFallen) return;

            const r = trigger.getBoundingClientRect();
            ParticleEngine.explode(r.left + r.width / 2, r.top + r.height / 2, window._isFallen ? '#ff3333' : '#dad4bb', 14);

            this.clickCount++;
            clearTimeout(this.clickTimer);
            this.clickTimer = setTimeout(() => {
                this.clickCount = 0;
                angerIcon.style.display = 'none';
            }, 3000);

            trigger.style.transform = `scale(${Math.max(0.82, 1 - (this.clickCount * 0.035))})`;
            setTimeout(() => { trigger.style.transform = 'scale(1)'; }, 100);

            if (this.clickCount >= 3) {
                angerIcon.style.display = 'block';
                angerIcon.style.transform = `scale(${1 + (this.clickCount * 0.08)}) rotate(${15 + (this.clickCount * 3)}deg)`;
            }

            if (this.clickCount >= 2 && this.clickCount <= 6) {
                const dIdx = Math.min(CODEX_DATA.avatarDialogues.length - 1, this.clickCount - 2);
                const item = CODEX_DATA.avatarDialogues[dIdx];
                DialogueSystem.show({ text: item.text, speaker: "SAPHYNIEL", tone: item.tone, autoHideTime: 2000 });
            }

            if (this.clickCount >= 6 && typeof OrbitalModule !== 'undefined' && !OrbitalModule.hasRailgun) {
                OrbitalModule.unlockRailgun('avatar');
            }

            if (this.clickCount >= 7 && !window._isFallen) {
                this.triggerFallen();
                DialogueSystem.show({ text: "¡¡NO HABRÁ MISERICORDIA!!", speaker: "SAPHYNIEL", tone: "yandere", autoHideTime: 2600 });
                this.clickCount = 0;
            }
        });
    },

    triggerFallen() {
        window._isFallen = true;
        document.body.classList.add('fallen-mode');
        document.getElementById('display-name').innerText = "CLAVIS";
        const bio = document.getElementById('typewriter-text');
        if (bio) bio.innerHTML = "FOLIO SELLADO. <br>Vanitas vanitatum et omnia vanitas.";
        AudioManager.beep(140, 0.4, 'sawtooth');

        clearTimeout(this.fallenTimer);
        this.fallenTimer = setTimeout(() => { this.restoreAngelState(); }, 6000);
    },

    restoreAngelState() {
        window._isFallen = false;
        document.body.classList.remove('fallen-mode');
        document.getElementById('display-name').innerText = "SAPHYNIEL";
        const bio = document.getElementById('typewriter-text');
        if (bio) bio.innerHTML = "Lucerna pedibus meis verbum tuum et lumen semitis meis. <br>In silentio et in spe erit fortitudo vestra.";
        const angerIcon = document.getElementById('anger-icon');
        if (angerIcon) angerIcon.style.display = 'none';
        this.clickCount = 0;
        AudioManager.beep(900, 0.25, 'sine');
    }
};

function _sndTgl() { AudioManager.toggleSound('sound-btn'); }
function _mShow(t, m) {
    if (window._cinematicActive || window._bossActive) return;
    document.getElementById('modal-title').textContent = t;
    document.getElementById('modal-body').innerHTML = m;
    document.getElementById('hud-modal-overlay').classList.add('active');
    AudioManager.beep(650, 0.15, 'sawtooth');
}
function _mCls(e) {
    if (!e || e.target.id === 'hud-modal-overlay' || e.target.classList.contains('hud-modal-btn')) {
        document.getElementById('hud-modal-overlay').classList.remove('active');
        AudioManager.beep(350, 0.05, 'sine');
    }
}
function _tSw(tabId) { TabManager.switchTab(tabId); }
function _selectChamp(key) { ChampSelector.select(key); }
function _triggerChampInteraction(e) { ChampSelector.interact(e); }
function _liturgicalChime() { AudioManager.liturgicalChime(); }

function _renderVerses() {
    const deck = document.getElementById('quotes-deck');
    if (!deck) return;
    deck.innerHTML = '';
    const shuffled = [...CODEX_DATA.verses].sort(() => 0.5 - Math.random()).slice(0, 3);
    shuffled.forEach(v => {
        const card = document.createElement('div');
        card.className = 'quote-card destructible';
        card.innerHTML = `<div class="quote-tag">${v.tag}</div><div class="quote-body">${v.body}</div>`;
        card.addEventListener('click', (e) => {
            if (window._cinematicActive || window._bossActive) return;
            card.classList.toggle('gold-seal');
            const r = card.getBoundingClientRect();
            ParticleEngine.explode(e.clientX || (r.left + r.width / 2), e.clientY || (r.top + r.height / 2), '#dad4bb', 18);
            AudioManager.beep(987.77, 0.35, 'sine', 0.06);
        });
        deck.appendChild(card);
    });
}

function _rerollVerses() {
    if (window._cinematicActive || window._bossActive) return;
    const deck = document.getElementById('quotes-deck');
    if (!deck) return;
    deck.style.opacity = '0';
    AudioManager.beep(520, 0.1, 'square');
    setTimeout(() => {
        _renderVerses();
        deck.style.opacity = '1';
        AudioManager.beep(880, 0.15, 'triangle');
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

function _initDanmaku() {
    const box = document.getElementById('danmaku-box');
    if (!box) return;
    if (_danmakuInterval) clearInterval(_danmakuInterval);
    _danmakuInterval = setInterval(() => {
        if (window._bossActive) return;
        const el = document.createElement('div');
        el.className = 'danmaku-item';
        el.textContent = CODEX_DATA.danmaku[Math.floor(Math.random() * CODEX_DATA.danmaku.length)];
        el.style.top = `${Math.random() * 85 + 5}vh`;
        el.style.animationDuration = `${Math.random() * 12 + 14}s`;
        box.appendChild(el);
        setTimeout(() => el.remove(), 26000);
    }, 2500);
}

function _upClk() {
    if (window._bossActive) return;
    const n = new Date();
    const h = String(n.getUTCHours()).padStart(2, '0');
    const m = String(n.getUTCMinutes()).padStart(2, '0');
    const s = String(n.getUTCSeconds()).padStart(2, '0');
    const ms = String(n.getUTCMilliseconds()).padStart(3, '0');
    const el = document.getElementById('utc-clock');
    if (el) el.textContent = `HORA CANÓNICA // ${h}:${m}:${s}:${ms} UTC`;
}

const _bEl = document.getElementById('typewriter-text');
const _bTx = _bEl ? _bEl.getAttribute('data-bio') : "";
let _bI = 0;
function _tpW() {
    if (!_bEl) return;
    if (_bI < _bTx.length) {
        if (_bTx.substr(_bI, 2) === '\\n') { _bEl.innerHTML += '<br>'; _bI += 2; }
        else { _bEl.innerHTML += _bTx.charAt(_bI); _bI++; }
        setTimeout(_tpW, Math.random() * 35 + 20);
    } else {
        _bEl.innerHTML += '<span style="animation: blink 1s infinite;">_</span>';
    }
}

const _platformSounds = {
    yt: () => { AudioManager.beep(440, 0.15, 'sine'); setTimeout(() => AudioManager.beep(880, 0.2, 'sine'), 60); },
    sp: () => { AudioManager.beep(180, 0.2, 'sawtooth'); setTimeout(() => AudioManager.beep(360, 0.25, 'triangle'), 80); },
    st: () => { AudioManager.beep(550, 0.1, 'square'); setTimeout(() => AudioManager.beep(733, 0.2, 'square'), 70); },
    tk: () => { AudioManager.beep(700, 0.08, 'triangle'); setTimeout(() => AudioManager.beep(1050, 0.15, 'triangle'), 50); },
    ds: () => { AudioManager.beep(300, 0.1, 'sine'); setTimeout(() => AudioManager.beep(600, 0.15, 'sine'), 50); }
};

document.querySelectorAll('.link-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        if (window._cinematicActive || window._bossActive) return;
        const p = btn.getAttribute('data-platform');
        if (_platformSounds[p]) _platformSounds[p]();
    });
});

window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'BOSS_DEFEATED') {
        const frame = document.getElementById('boss-frame');
        if (frame) frame.classList.remove('active');
        
        window._bossActive = false;
        window._bossBeaten = true;
        localStorage.setItem('codex_boss_beaten', 'true');
        AvatarController.clickCount = 0;
        if (typeof OrbitalModule !== 'undefined') {
            OrbitalModule.avatarHoverAttempts = 0;
        }

        document.body.classList.add('transcended-world');
        ParticleEngine.resume();
        ParticleEngine.startPetalRain(40);
        _initDanmaku();

        const cross = document.getElementById('orbital-crosshair');
        if (cross) {
            cross.style.display = 'flex';
            cross.style.top = '25px';
            cross.style.right = '25px';
            cross.style.left = 'auto';
        }

        const avatarImg = document.getElementById('avatar-img');
        if (avatarImg) avatarImg.src = LanyardModule.discordAvatarUrl;

        setTimeout(() => {
            DialogueSystem.show({
                text: "Eso fue divertido... pasé un buen momento.",
                speaker: "SAPHYNIEL",
                tone: "mid",
                autoHideTime: 3400
            });
            AudioManager.liturgicalChime();
        }, 400);
    }
});

(function initFullscreenToggle() {
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

window.addEventListener('DOMContentLoaded', () => {
    // Restaurar estado de victoria al recargar
    if (localStorage.getItem('codex_boss_beaten') === 'true') {
        window._bossBeaten = true;
        document.body.classList.add('transcended-world');
    }

    ParticleEngine.init('particle-canvas');
    if (window._bossBeaten) {
        ParticleEngine.startPetalRain(40);
    }

    DestructionModule.init();
    OrbitalModule.init();
    TerminalModule.init();
    AvatarController.init();
    LanyardModule.init();
    _renderVerses();
    _renderFaq();
    _initDanmaku();
    _clockInterval = setInterval(_upClk, 35);
    setTimeout(_tpW, 500);
});
document.head.insertAdjacentHTML("beforeend", `<style>@keyframes blink { 50% { opacity: 0; } }</style>`);