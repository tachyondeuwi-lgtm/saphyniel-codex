const CODEX_DATA = {
    discordId: "409107659153735680",
    discordUserCopy: "laska.com.tv",
    uniqueVisitsKey: "saphyniel-codex",

    sprites: {
        normalBody: "img/portraits/saphyniel_normal.png",
        angryBody: "img/portraits/saphyniel_angry.png",
        yandereBody: "img/portraits/Risayandere.png",
        divineBossPhase2: "img/boss/boss_fase2.png",
        bossPhase3: "img/boss/boos_fase3.gif",
        iconDefault: "img/icons/icon.png",
        eye: "img/icons/eye.png"
    },

    sounds: {
        legoPop: "audio/sfx/lego.mp3",
        vineBoom: "audio/sfx/boom.mp3",
        defeatLaugh: "audio/sfx/defeatlaught.mp3",
        bossMusicFase1: "audio/bgm/boss-music-fase1.mp3",
        bossMusicFase2: "audio/bgm/boss-music-fase2.mp3",
        bossMusicFase3: "audio/bgm/boss-music-fase3.mp3",
        superAttack: "audio/sfx/superattack.mp3",
        victory: "audio/bgm/ending.mp3",
        bell: "audio/sfx/bell.mp3",
        rewind: "audio/sfx/rewind.mp3",
        angelCoro: "audio/sfx/angelcoro.mp3"
    },

    danmaku: [
        "祈り (Pray)", "天使降臨", "SOLI DEO GLORIA", "+++ GLORIA IN EXCELSIS +++",
        "KINDRED CARRY 1v9", "神の恵み (Gracia Divina)", "ESMERALDA ELO HELL REAL",
        "NUNCA UNO SIN EL OTRO", "CANON_INDEX_ACTIVE", "ARCHIVE_SYNC_OK"
    ],

    avatarDialogues: [
        { text: "¿Mmh? ¿Qué sucede?", tone: "mid" },
        { text: "Oye... deja de tocar ahí.", tone: "mid" },
        { text: "Te he dicho que te detengas.", tone: "low" },
        { text: "No juegues con fuego.", tone: "low" },
        { text: "Mi paciencia tiene un límite...", tone: "low" },
        { text: "¡¡TE ADVERTÍ QUE PARARAS!!", tone: "angry" }
    ],

    orbitalWarnings: {
        attempt1: "Ten cuidado a donde apuntas eso.",
        attempt2: "En serio... no quieres hacer esto.",
        attempt3: "Suficiente.",
        repeatFight: [
            { text: "¿Quieres hacerlo otra vez? ¿O solo te equivocaste?", tone: "mid" },
            { text: "Creo que alguien quiere pelear de nuevo...", tone: "low" },
            { text: "Tú lo pediste.", tone: "angry" }
        ]
    },

    champions: {
        kindred: {
            title: "KINDRED // LOS CAZADORES ETERNOS",
            meta: "CAMPEÓN PRINCIPAL • MAESTRÍA 38 (385K PTS)",
            splash: "img/champions/kindred.jpg",
            role: "JUNGLA / HIPERCARGADOR",
            pts: "385,000 PTS (NVL 38)",
            quote: "«Cordero, ¿es hora? — Es hora.»",
            sound: (_beep) => {
                _beep(220, 0.4, 'sine', 0.06);
                setTimeout(() => _beep(440, 0.5, 'triangle', 0.05), 80);
            }
        },
        shyvana: {
            title: "SHYVANA // LA HIJA DEL DRAGÓN",
            meta: "SEGUNDO CAMPEÓN • MAESTRÍA 22 (216K PTS)",
            splash: "img/champions/shyvana.jpg",
            role: "JUNGLA / COLOSO",
            pts: "216,000 PTS (NVL 22)",
            quote: "«Furia en mis venas, fuego en el corazón.»",
            sound: (_beep) => {
                _beep(130, 0.5, 'sawtooth', 0.07);
                setTimeout(() => _beep(260, 0.3, 'square', 0.05), 100);
            }
        },
        kayle: {
            title: "KAYLE // LA JUSTICIERA",
            meta: "SEGUNDO CAMPEÓN COMPARTIDO • MAESTRÍA 15 (138K PTS)",
            splash: "img/champions/kayle.jpg",
            role: "SUPERIOR / CENTRAL • ESCALADO DIVINO",
            pts: "138,000 PTS (NVL 15)",
            quote: "«El juicio no conoce la piedad.»",
            sound: (_beep) => {
                _beep(587, 0.4, 'triangle', 0.05);
                setTimeout(() => _beep(880, 0.4, 'sine', 0.04), 100);
            }
        }
    },

    verses: [
        { tag: "SALMOS // 119:105", body: '"Lámpara es a mis pies tu palabra, y lumbrera a mi camino."' },
        { tag: "ECLESIASTÉS // 3:1", body: '"Todo tiene su tiempo, y todo lo que se quiere debajo del cielo tiene su hora."' },
        { tag: "ISAÍAS // 30:15", body: '"En quietud y en confianza estará vuestra fortaleza."' },
        { tag: "PROVERBIOS // 4:23", body: '"Sobre toda cosa guardada, guarda tu corazón; porque de él mana la vida."' },
        { tag: "SALMOS // 27:1", body: '"El Señor es mi luz y mi salvación; ¿de quién temeré?"' },
        { tag: "APOCALIPSIS // 21:6", body: '"Yo soy el Alfa y la Omega, el principio y el fin."' },
        { tag: "JUAN // 1:5", body: '"La luz en las tinieblas resplandece, y las tinieblas no prevalecieron contra ella."' }
    ],

    faq: [
        {
            q: "¿QUIÉN SOY Y CÓMO ME GUSTA QUE ME LLAMEN?",
            a: "Soy Saphyniel. Me gusta mantener las cosas a mi propio ritmo, disfrutar de un buen café o té, y sumergirme en universos virtuales que tengan una atmósfera única y envolvente."
        },
        {
            q: "¿QUÉ MUNDOS Y COSAS DISFRUTO EN MI TIEMPO LIBRE?",
            a: "Me apasiona perderme en historias de fantasía, mundos con lore profundo y estéticas visuales muy cuidadas. Disfruto coleccionar detalles, explorar videojuegos con personalidades fuertes y pasar horas descubriendo música que encaje con mi estado de ánimo."
        },
        {
            q: "¿CÓMO ES MI ESTILO Y MI MANERA DE SER?",
            a: "Amo las estéticas oscuras, minimalistas, con toques de elegancia silenciosa y un aire un poco enigmático. Prefiero la tranquilidad, la sinceridad y crear un espacio propio donde pueda ser tal como soy."
        }
    ]
};