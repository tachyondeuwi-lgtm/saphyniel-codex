const CODEX_CREDITS = [
    "« RUPTURA ABSOLUTA DEL CÓDICE »",
    "[ ALTA JERARQUÍA DEL TRONO ]",
    "Suprema Jerarquía Litúrgica: Saphyniel",
    "Autoridad del Registro: Saphyniel",
    "Arquitecta de Realidades: Saphyniel",
    "[ INGENIERÍA Y SISTEMAS ]",
    "Lógica Divina de Servidores: Saphyniel",
    "Manejador de Paradojas: Motor V8",
    "Filtro Anti-Autoclicker: Saphyniel Shield Engine",
    "[ ELENCO PRINCIPAL ]",
    "Deidad Impasible (Fase 1): Saphyniel",
    "Serafín del Juicio (Fase 2): Saphyniel",
    "Colapso del Vacío (Fase 3): Saphyniel",
    "Corazón Robado: La Paciencia del Jugador",
    "[ CITAS CANÓNICAS ]",
    "«Esmeralda Elo Hell es canon en todos los registros.»",
    "«¿Elegiste NO pensando que te dejaría ir en paz?»",
    "«El Códice no tiene errores, son pruebas de fe.»",
    "[ AGRADECIMIENTOS ESPECIALES ]",
    "A NieR:Automata por enseñarnos a amar los finales lentos.",
    "A Mili por musicalizar el colapso mental de la Fase 3.",
    "A Keiichi Okabe por Vague Hope y la catarsis del final.",
    "Y a ti...",
    "Por haber jugado conmigo."
];

let _creditsSkipped = false;

function triggerCreditsSequence(onComplete) {
    const track = document.getElementById('credits-track');
    const viewport = document.getElementById('credits-viewport');
    const skipBtn = document.getElementById('skip-credits-btn');
    if (!track || !viewport) { if (onComplete) onComplete(); return; }

    _creditsSkipped = false;
    track.innerHTML = '';
    CODEX_CREDITS.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'credit-crawl-line';
        div.innerHTML = item;
        track.appendChild(div);
    });

    let loopCount = 0;
    const maxLoops = 7;
    let animId = null;

    if (skipBtn) {
        skipBtn.onclick = (e) => {
            e.stopPropagation();
            _creditsSkipped = true;
            if (animId) cancelAnimationFrame(animId);
            finishCredits();
        };
    }

    function finishCredits() {
        const endScreen = document.getElementById('ending-screen');
        if (endScreen) endScreen.style.opacity = '0';
        
        setTimeout(() => {
            const bellEl = document.getElementById('end-record-final');
            if (bellEl) {
                bellEl.textContent = "SAPHYNIEL //";
                bellEl.classList.add('active');
            }
            if (typeof AudioManager !== 'undefined') AudioManager.playAudio(BOSS_AUDIO_PATHS.bellSound);
            if (onComplete) onComplete();
        }, 800);
    }

    function runCrawlLoop() {
        if (_creditsSkipped) return;
        const viewportHeight = viewport.offsetHeight || window.innerHeight * 0.68;
        const trackHeight = track.offsetHeight || 1200;
        
        const durationSec = Math.max(2.8, 16 - (loopCount * 2.2));
        const blurAmount = loopCount * 1.6;
        track.style.filter = `blur(${blurAmount}px)`;

        let startTime = null;
        const startY = viewportHeight;
        const endY = -trackHeight - 80;
        const distance = startY - endY;

        function step(timestamp) {
            if (_creditsSkipped) return;
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime) / 1000;
            const progress = Math.min(1, elapsed / durationSec);
            
            const currentY = startY - (progress * distance);
            track.style.transform = `translateY(${currentY}px)`;

            if (progress < 1) {
                animId = requestAnimationFrame(step);
            } else {
                loopCount++;
                if (loopCount < maxLoops) {
                    runCrawlLoop();
                } else {
                    finishCredits();
                }
            }
        }
        animId = requestAnimationFrame(step);
    }

    setTimeout(runCrawlLoop, 800);
}