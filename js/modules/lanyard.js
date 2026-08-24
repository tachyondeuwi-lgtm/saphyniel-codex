const LanyardModule = {
    discordAvatarUrl: CODEX_DATA.sprites.normalBody,

    init() {
        if (CODEX_DATA.discordId !== "") {
            this.fetchData();
            setInterval(() => this.fetchData(), 4000);
        }
        this.initUniqueVisits();
    },

    fetchData() {
        fetch(`https://api.lanyard.rest/v1/users/${CODEX_DATA.discordId}`)
            .then(r => r.json())
            .then(res => {
                if (res.success) {
                    const d = res.data, u = d.discord_user;
                    if (!window._isFallen && !window._bossActive) {
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
                        this.discordAvatarUrl = `https://cdn.discordapp.com/avatars/${CODEX_DATA.discordId}/${hsh}.${ext}?size=512`;
                        const ai = document.getElementById('avatar-img');
                        if (ai && !window._isFallen && !window._bossActive && !window._cinematicActive) {
                            ai.src = this.discordAvatarUrl;
                        }
                    }
                    
                    const dt = document.getElementById('badge-desktop');
                    const mb = document.getElementById('badge-mobile');
                    const wb = document.getElementById('badge-web');
                    if (dt) dt.className = `platform-badge ${d.active_on_discord_desktop ? 'active' : ''}`;
                    if (mb) mb.className = `platform-badge ${d.active_on_discord_mobile ? 'active' : ''}`;
                    if (wb) wb.className = `platform-badge ${d.active_on_discord_web ? 'active' : ''}`;
                    
                    this.renderRichPresence(d);
                }
            })
            .catch(() => {});
    },

    resolveAsset(appId, assetId) {
        if (!assetId) return null;
        if (assetId.startsWith("http://") || assetId.startsWith("https://")) return assetId;
        if (assetId.startsWith("mp:external/")) return `https://media.discordapp.net/external/${assetId.replace("mp:external/", "")}`;
        if (assetId.startsWith("spotify:")) return `https://i.scdn.co/image/${assetId.replace("spotify:", "")}`;
        return `https://cdn.discordapp.com/app-assets/${appId}/${assetId}.png`;
    },

    renderRichPresence(d) {
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
            if (spTitle) spTitle.textContent = d.spotify.song;
            if (spSub) spSub.textContent = `${d.spotify.artist} • ${d.spotify.album}`;
            if (spArt) {
                spArt.src = d.spotify.album_art_url;
                spArt.style.display = 'block';
            }
            if (vz) vz.style.display = 'flex';
            if (spBox) spBox.style.display = 'flex';
        } else {
            if (spBox) spBox.style.display = 'none';
            if (vz) vz.style.display = 'none';
        }

        const act = d.activities && d.activities.find(a => a.type === 0 && a.id !== "spotify:1");
        if (act) {
            hasGame = true;
            headers.push(`JUGANDO: ${act.name.toUpperCase()}`);
            if (gmLabel) gmLabel.textContent = `[ACTIVIDAD // ${act.name.toUpperCase()}]`;
            if (gmTitle) gmTitle.textContent = act.details || act.name;
            if (gmSub) gmSub.textContent = act.state ? `${act.state}` : 'SESIÓN ACTIVA';
            
            let gameImg = null;
            if (act.assets && act.assets.large_image) {
                gameImg = this.resolveAsset(act.application_id, act.assets.large_image);
            }
            
            if (gmArt) {
                if (gameImg) {
                    gmArt.src = gameImg;
                    gmArt.style.display = 'block';
                } else {
                    gmArt.style.display = 'none';
                }
            }

            if (gmBox) gmBox.style.display = 'flex';
        } else {
            if (gmBox) gmBox.style.display = 'none';
        }

        if (hasSpotify || hasGame) {
            if (idlBox) idlBox.style.display = 'none';
            if (st) st.textContent = headers.join(' // ');
        } else {
            if (idlBox) idlBox.style.display = 'flex';
            if (st) st.textContent = 'ESTADO: REPOSO';
        }
    },

    initUniqueVisits() {
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
};