const DATA_URL = new URL('./skills.json', import.meta.url).href;
const $ = (s) => document.querySelector(s);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// -------- Modal
function setupModal() {
    const backdrop = $('#modal-backdrop');
    const content = $('#modal-content');
    const title = $('#modal-title');
    const markers = $('#modal-markers');
    const what = $('#modal-what');
    const why = $('#modal-why');
    const btnClose = $('#close-modal');

    let lastFocused = null;
    const isOpen = () => !backdrop.classList.contains('pointer-events-none');

    function getFocusable() {
        return content.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    }

    function open(skillName, skillData) {
        lastFocused = document.activeElement;
        title.innerHTML = skillName;
        what.textContent = skillData.what || '';
        why.textContent = skillData.why || '';
        const badges = [];
        if (skillData.important) badges.push('<span class="bg-amber-500 text-white font-semibold px-2.5 py-0.5 rounded-full inline-block">⭐ Wichtige Fähigkeit</span>');
        if (skillData.dynamic) badges.push('<span class="bg-red-500 text-white font-semibold px-2.5 py-0.5 rounded-full inline-block">🚀 Hohe Dynamik</span>');
        markers.innerHTML = badges.join(' ');
        backdrop.classList.remove('opacity-0', 'pointer-events-none');
        backdrop.setAttribute('aria-hidden', 'false');
        content.classList.remove('scale-95', 'opacity-0');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => content.focus());
    }

    function close() {
        backdrop.classList.add('opacity-0', 'pointer-events-none');
        backdrop.setAttribute('aria-hidden', 'true');
        content.classList.add('scale-95', 'opacity-0');
        document.body.style.overflow = '';
        if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    }

    btnClose.addEventListener('click', close);
    backdrop.addEventListener('click', e => {
        if (e.target === backdrop) close();
    });

    // ESC/ENTER/SPACE schließen – nur wenn Fokus im Modal liegt
    window.addEventListener('keydown', e => {
        if (!isOpen()) return;
        if (!content.contains(document.activeElement)) return;
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            close();
        }
        if (e.key === 'Tab') {
            const f = Array.from(getFocusable());
            if (!f.length) return;
            const first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                last.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === last) {
                first.focus();
                e.preventDefault();
            }
        }
    });

    return {open, close};
}

// -------- Pan & Zoom
function setupPanZoom(viewport, map) {
    let scale = 0.75, panX = 0, panY = 0;
    let pointerId = null, startX = 0, startY = 0;
    const apply = () => {
        map.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    };

    viewport.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        if (e.target.closest('.hexagon') && !e.target.closest('.hexagon').classList.contains('placeholder')) return;
        pointerId = e.pointerId;
        viewport.setPointerCapture(pointerId);
        viewport.classList.add('is-panning');
        startX = e.clientX - panX;
        startY = e.clientY - panY;
    });

    function endPan() {
        if (pointerId !== null) {
            try {
                viewport.releasePointerCapture(pointerId);
            } catch {
            }
            pointerId = null;
            viewport.classList.remove('is-panning');
        }
    }

    viewport.addEventListener('pointermove', e => {
        if (pointerId === null) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        apply();
    });
    viewport.addEventListener('pointerup', endPan);
    viewport.addEventListener('pointercancel', endPan);
    viewport.addEventListener('pointerleave', endPan);

    viewport.addEventListener('wheel', e => {
        e.preventDefault();
        const rect = viewport.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const zoomFactor = Math.exp((-e.deltaY) * 0.0015);
        const newScale = clamp(scale * zoomFactor, 0.2, 2);
        panX = mx - (mx - panX) * (newScale / scale);
        panY = my - (my - panY) * (newScale / scale);
        scale = newScale;
        apply();
    }, {passive: false});

    function centerOnContent() {
        const kids = Array.from(map.children);
        if (!kids.length) return;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const el of kids) {
            const x = el.offsetLeft, y = el.offsetTop, w = el.offsetWidth, h = el.offsetHeight;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);
        }
        const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, vpW = viewport.clientWidth, vpH = viewport.clientHeight;
        panX = vpW / 2 - scale * cx;
        panY = vpH / 2 - scale * cy;
        apply();
    }

    function centerOnElement(el) {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const vp = viewport.getBoundingClientRect();
        panX += (vp.width / 2) - (r.left + r.width / 2);
        panY += (vp.height / 2) - (r.top + r.height / 2);
        apply();
    }

    // Zoomen per Schritt (positiv = rein, negativ = raus). Pivot optional (Viewport-Mitte sonst).
    function zoomBy(step, pivot){
        const rect = viewport.getBoundingClientRect();
        const mx = pivot ? pivot.x - rect.left : rect.width  / 2;
        const my = pivot ? pivot.y - rect.top  : rect.height / 2;
        const zoomFactor = Math.exp(step);
        const newScale = clamp(scale * zoomFactor, 0.2, 2);
        panX = mx - (mx - panX) * (newScale / scale);
        panY = my - (my - panY) * (newScale / scale);
        scale = newScale;
        apply();
    }

    const ro = new ResizeObserver(() => centerOnContent());
    ro.observe(viewport);

    return {centerOnContent, centerOnElement, zoomBy};
}

// -------- Map
function buildMap(container, data) {
    const frag = document.createDocumentFragment();
    for (const category of Object.keys(data)) {
        const island = data[category];

        if (island.placeholder) {
            const ph = document.createElement('div');
            ph.className = 'island-placeholder';
            frag.appendChild(ph);
            continue;
        }

        const wrapper = document.createElement('section');
        wrapper.className = `island-wrapper ${island.background}/20`;
        wrapper.setAttribute('aria-label', `Insel ${category}`);

        const title = document.createElement('h2');
        title.className = `text-4xl font-bold text-center mb-8 ${island.color}`;
        title.textContent = category;
        wrapper.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'hexagon-grid';
        grid.style.setProperty('--cols', island.width);

        const skills = Object.keys(island.skills);
        skills.forEach((name, i) => {
            const s = island.skills[name];
            const hex = document.createElement('div');
            hex.className = `hexagon ${island.color}`;

            if (s.placeholder) {
                hex.classList.add('placeholder');
                hex.setAttribute('aria-hidden', 'true');
            } else {
                hex.dataset.skill = name;
                hex.dataset.category = category;
                const col = i % island.width;
                const offset = (col % 2 === 1) ? 'calc((var(--s) + var(--m)) / 2)' : '0px';
                hex.style.setProperty('--odd-offset', offset);
                if (!s.important) hex.style.filter = 'brightness(0.6)';
                hex.setAttribute('role', 'button');
                hex.setAttribute('tabindex', '0');
                hex.setAttribute('aria-label', `${name} öffnen`);
                if (s.important) hex.setAttribute('aria-description', 'Wichtige Fähigkeit');

                const content = document.createElement('div');
                content.className = 'hexagon-content';
                content.innerHTML = name;
                hex.appendChild(content);
            }
            grid.appendChild(hex);
        });

        wrapper.appendChild(grid);
        frag.appendChild(wrapper);
    }
    container.appendChild(frag);
}

// -------- Bootstrapping
const viewport = document.getElementById('map-viewport');
const container = document.getElementById('map-container');
const modal = setupModal();

async function loadData(url) {
    // Cache-Bust beim Dev-Refresh, ohne ETags kaputt zu machen
    const cacheBust = (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
    const res = await fetch(url + cacheBust, {credentials: 'omit'});
    if (!res.ok) throw new Error(`Laden fehlgeschlagen: ${res.status} ${res.statusText}`);
    return res.json();
}

try {
    const data = await loadData(DATA_URL);
    buildMap(container, data);
    const pz = setupPanZoom(viewport, container);

    container.addEventListener('click', e => {
        const el = e.target.closest('.hexagon');
        if (!el || el.classList.contains('placeholder')) return;
        const {skill, category} = el.dataset;
        modal.open(skill, data[category].skills[skill]);
    });

    container.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = e.target.closest('.hexagon');
        if (!el || el.classList.contains('placeholder')) return;
        e.preventDefault();
        e.stopPropagation(); // verhindert sofortiges Schließen durch globalen Handler
        const {skill, category} = el.dataset;
        modal.open(skill, data[category].skills[skill]);
    });

    // Beim Tabben: Island des fokussierten Hex zentrieren
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const modalOpen = !document.getElementById('modal-backdrop').classList.contains('pointer-events-none');
        if (modalOpen) return;
        setTimeout(() => {
            const activeHex = document.activeElement?.closest?.('.hexagon');
            if (!activeHex || activeHex.classList.contains('placeholder')) return;
            const island = activeHex.closest('.island-wrapper');
            if (island) pz.centerOnElement(island);
        }, 0);
    });

    document.addEventListener('keydown', (e) => {
        // Modal offen? Dann nicht stören
        const modalOpen = !document.getElementById('modal-backdrop')
            .classList.contains('pointer-events-none');
        if (modalOpen) return;

        // Zoom
        if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd'){
            e.preventDefault(); pz.zoomBy(0.1); return;
        }
        if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract'){
            e.preventDefault(); pz.zoomBy(-0.1); return;
        }

    });

    requestAnimationFrame(() => pz.centerOnContent());
} catch (err) {
    console.error(err);
    const errBox = document.createElement('div');
    errBox.className = "fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-700 text-white px-4 py-2 rounded shadow";
    errBox.textContent = "Fehler beim Laden der Daten (skills.json). Öffne die DevTools für Details.";
    document.body.appendChild(errBox);
}