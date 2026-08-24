const DialogueSystem = {
    timer: null,
    typewriterTimer: null,

    show(options = {}) {
        const {
            text = "",
            speaker = "SAPHYNIEL",
            tone = "mid",
            autoHideTime = 2800,
            spriteMap = null,
            isBossPhase3 = false,
            callback = null
        } = options;

        const box = document.getElementById('p5-box');
        const nameEl = document.getElementById('p5-name');
        const textEl = document.getElementById('p5-text');
        const cutinImg = document.getElementById('p5-cutin-img');
        const choices = document.getElementById('p5-choices');

        if (!box || !nameEl || !textEl || !cutinImg) return;

        clearTimeout(this.timer);
        clearTimeout(this.typewriterTimer);
        document.body.classList.add('dialogue-locked');
        if (choices) choices.classList.remove('active');

        box.classList.remove('angry-theme', 'glitch-theme', 'yandere-theme');

        const sprites = spriteMap || (typeof CODEX_DATA !== 'undefined' ? {
            normal: CODEX_DATA.sprites.normalBody,
            angry: CODEX_DATA.sprites.angryBody,
            yandere: CODEX_DATA.sprites.yandereBody
        } : {
            normal: "img/portraits/saphyniel_normal.png",
            angry: "img/portraits/saphyniel_angry.png",
            yandere: "img/portraits/Risayandere.png"
        });

        if (isBossPhase3) {
            box.classList.add('glitch-theme');
            cutinImg.src = sprites.yandere;
        } else if (tone === 'angry') {
            box.classList.add('angry-theme');
            cutinImg.src = sprites.angry;
        } else if (tone === 'yandere') {
            box.classList.add(box.id === 'p5-box' && choices ? 'yandere-theme' : 'angry-theme');
            cutinImg.src = sprites.yandere;
        } else {
            cutinImg.src = sprites.normal;
        }

        nameEl.textContent = speaker;
        textEl.innerHTML = '';
        box.classList.add('active');

        if (typeof AudioManager !== 'undefined') {
            AudioManager.balatroVoice(tone);
        }

        let idx = 0;
        const self = this;
        function typeChar() {
            if (idx < text.length) {
                textEl.innerHTML += text.charAt(idx);
                idx++;
                self.typewriterTimer = setTimeout(typeChar, 18);
            } else {
                if (autoHideTime > 0) {
                    self.timer = setTimeout(() => {
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
    },

    hide() {
        const box = document.getElementById('p5-box');
        if (box) box.classList.remove('active');
        document.body.classList.remove('dialogue-locked');
        clearTimeout(this.timer);
        clearTimeout(this.typewriterTimer);
    }
};