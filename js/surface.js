/* ═══════════════════════════════════════════════════════════════
   EVAD · Surface unique (MVP tranche verticale)
   Étape 0 — le squelette : plateau persistant au centre + Deva en
   compagnon de bordure basse. Aucun outil, aucune interaction encore.
   Le plateau réutilise le moteur de terrain isométrique du jeu EVAD.
   État en mémoire uniquement (jamais de stockage navigateur).
   Vanilla JS, sans build.
   ═══════════════════════════════════════════════════════════════ */

/* ── État du projet, en mémoire ─────────────────────────────── */
const projet = {
  nom: '',
  cases: {},          // index de case -> { type, solution, statut } (rempli aux étapes suivantes)
  vue: { rot: 24, zoom: 1 },
};

/* ── Plateau : grille 12×10 (repris du jeu) ─────────────────── */
const TER_COLS = 12, TER_ROWS = 10, TER_CELLS = TER_COLS * TER_ROWS;

function plateauHTML() {
  const { rot, zoom } = projet.vue;
  const hash = i => { let x = (i + 7) * 2654435761; x ^= x >>> 13; return (x * 2246822519) >>> 0; };
  let cells = '';
  for (let i = 0; i < TER_CELLS; i++) {
    let cls = 'ter-cell' + ((((i % TER_COLS) + ((i / TER_COLS) | 0)) % 2) ? ' alt' : '');
    if (hash(i) % 7 === 0) cls += ' r1';      // micro-relief de l'herbe
    cells += `<div class="${cls}" data-i="${i}"></div>`;
  }
  return `<div class="ter-wrap">
      <div class="ter-grid live" style="--rot:${rot}deg;--zoom:${zoom}">${cells}</div>
      <div class="ter-dusk"></div><span class="ter-fly">🦋</span>
      <div class="ter-zoom"><button onclick="plateauZoom(-1)" title="Réduire">−</button><button onclick="plateauZoom(1)" title="Agrandir">+</button></div>
    </div>`;
}

function renderPlateau() {
  const el = document.getElementById('plateau'); if (!el) return;
  el.innerHTML = plateauHTML();
  bindPlateau(el.querySelector('.ter-grid'));
}

/* ── Zoom + orbite (glissé hors des cases fait pivoter) ─────── */
function plateauZoom(d) {
  const v = projet.vue;
  v.zoom = Math.round(Math.max(.6, Math.min(1.4, v.zoom + d * .15)) * 100) / 100;
  const gr = document.querySelector('.ter-grid.live'); if (gr) gr.style.setProperty('--zoom', v.zoom);
}

let ORB = null, ORB_GLOBAL = false;
function bindPlateau(grid) {
  if (!grid) return;
  const wrap = grid.closest('.ter-wrap');
  if (!ORB_GLOBAL) {
    ORB_GLOBAL = true;
    const move = x => {
      if (ORB == null) return;
      projet.vue.rot = Math.round(Math.max(0, Math.min(48, ORB.base + (x - ORB.x) * 0.22)) * 10) / 10;
      const gr = document.querySelector('.ter-grid.live'); if (gr) gr.style.setProperty('--rot', projet.vue.rot + 'deg');
    };
    window.addEventListener('mousemove', e => { if (ORB != null && (e.buttons & 1)) move(e.clientX); });
    window.addEventListener('touchmove', e => { if (ORB != null && e.touches[0]) move(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('mouseup', () => { ORB = null; });
    window.addEventListener('touchend', () => { ORB = null; });
  }
  if (wrap) {
    const start = (t, x) => { if (t.closest('.ter-zoom')) return false; ORB = { x, base: projet.vue.rot }; return true; };
    wrap.addEventListener('mousedown', e => { if (e.button === 0 && start(e.target, e.clientX)) e.preventDefault(); });
    wrap.addEventListener('touchstart', e => { const t = e.touches[0]; if (t) start(e.target, t.clientX); }, { passive: true });
    wrap.addEventListener('dblclick', () => { projet.vue.rot = 24; projet.vue.zoom = 1; grid.style.setProperty('--rot', '24deg'); grid.style.setProperty('--zoom', '1'); });
  }
}

/* ── Deva, le fil (statique pour l'étape 0) ─────────────────── */
function devaSay(html) {
  const el = document.getElementById('deva-line'); if (el) el.innerHTML = html;
}

/* ── Démarrage ──────────────────────────────────────────────── */
renderPlateau();
devaSay('Je suis là. La scène est prête, on avancera ici même, ensemble.');
