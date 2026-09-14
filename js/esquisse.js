/* ═══════════════════════════════════════════════════════════════
   EVAD · Esquisse (MVP)
   Moteur de modélisation repris du jeu EVAD (evadconnect/jeu, vue
   « Modélisation » — terrain isométrique en blocs, façon Luanti) et
   DÉCOUPLÉ du serious game : on garde la peinture des espaces sur la
   grille + le décor + l'orbite/zoom, on retire boucles, badges,
   Vadité, cubes-solutions et saisons de jeu.
   Ici on esquisse un projet/lieu vierge : on ajoute, nomme et place
   ses espaces soi-même.
   Vanilla JS, sans build.
   ═══════════════════════════════════════════════════════════════ */

/* ── État local (remplace le `S` global du jeu) ─────────────── */
const S = {
  projet: '',
  spaces: [
    { id: 'z1', name: 'Jardin',     type: 'jardin',   ic: '🌿' },
    { id: 'z2', name: 'Cuisine',    type: 'cuisine',  ic: '🍳' },
    { id: 'z3', name: 'Café / Bar', type: 'cafe_bar', ic: '☕' },
  ],
  terrainGrid: null,
  model: { deco: [], sel: null, mode: null, rot: 24, zoom: 1.0 },
};

/* ── Constantes reprises du jeu ─────────────────────────────── */
const TER_COLS = 12, TER_ROWS = 10, TER_CELLS = TER_COLS * TER_ROWS;

const MODEL_DECO = {
  arbre:    { ic: '🌳',  n: 'Arbre' },
  fleur:    { ic: '🌼',  n: 'Fleurs' },
  rocher:   { ic: '🪨',  n: 'Rocher' },
  chemin:   { ic: '🛤️', n: 'Chemin', flat: '#e6d5a8', stroke: '#d3bf8a' },
  eau:      { ic: '💧',  n: 'Mare',   flat: '#a9d5ea', stroke: '#8fc2dc' },
  eolienne: { ic: '🌬️', n: 'Éolienne' },
};

/* Couleur réaliste par type d'espace : [teinte, saturation, décalage de luminosité]. */
const TYPE_COLORS = {
  jardin:[115,45,0],  serre:[200,12,0],   compost:[26,35,-8],
  cuisine:[30,75,0],  cantine:[46,70,0],  cafe_bar:[22,45,0],
  atelier:[10,45,-4], fablab:[250,40,0],  stockage:[0,0,-4],
  coworking:[210,55,0], salle_reunion:[225,35,0], formation:[190,45,0], bibliotheque:[38,40,0],
  scene:[330,55,0],   expo:[280,45,0],    boutique:[345,60,0],
  hebergement:[260,30,0], sport:[170,50,0], meditation:[300,30,0], autre:[60,25,0],
};

/* Types proposés à l'ajout d'un espace (clé, libellé, icône). */
const SPACE_TYPES = [
  ['jardin','Jardin','🌿'], ['serre','Serre','🌱'], ['compost','Compost','♻️'],
  ['cuisine','Cuisine','🍳'], ['cantine','Cantine','🍽️'], ['cafe_bar','Café / Bar','☕'],
  ['atelier','Atelier','🔨'], ['fablab','Fablab','🛠️'], ['stockage','Stockage','📦'],
  ['coworking','Coworking','💻'], ['salle_reunion','Salle de réunion','🗣️'], ['formation','Formation','🎓'],
  ['bibliotheque','Bibliothèque','📚'], ['scene','Scène','🎤'], ['expo','Expo','🖼️'],
  ['boutique','Boutique','🛒'], ['hebergement','Hébergement','🛏️'], ['sport','Sport','🤸'],
  ['meditation','Méditation','🧘'], ['autre','Autre','📍'],
];
const TYPE_LABEL = Object.fromEntries(SPACE_TYPES.map(([k, l]) => [k, l]));
const TYPE_ICON  = Object.fromEntries(SPACE_TYPES.map(([k, , i]) => [k, i]));

/* ── Petites utilités (remplacent celles du jeu) ────────────── */
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
let TOAST_T = null;
function toast(msg) {
  let t = document.getElementById('esq-toast');
  if (!t) { t = document.createElement('div'); t.id = 'esq-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(TOAST_T);
  TOAST_T = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ── Grille / espaces / couleurs (repris du jeu) ────────────── */
function terrainGrid() {
  if (!Array.isArray(S.terrainGrid) || S.terrainGrid.length !== TER_CELLS)
    S.terrainGrid = new Array(TER_CELLS).fill(-1);
  return S.terrainGrid;
}
function spaceIdx(id) { return S.spaces.findIndex(s => s.id === id); }
function spaceColor(idx, l) {
  const sp = S.spaces[idx], c = TYPE_COLORS[sp && sp.type];
  const base = (l || 80);
  if (!c) return `hsl(${Math.round(idx * 137.508) % 360} 58% ${base}%)`;
  let dup = 0; for (let i = 0; i < idx; i++) { const o = S.spaces[i]; if (o && o.type === sp.type) dup++; }
  const L = Math.max(30, Math.min(92, base + c[2] - dup * 7));
  return `hsl(${c[0]} ${c[1]}% ${L}%)`;
}
/* Couleur de plateforme : crème neutre à peine teintée par le type. */
function platColor(idx, l) {
  const sp = S.spaces[idx], c = TYPE_COLORS[sp && sp.type];
  const hue = c ? c[0] : (Math.round(idx * 137.508) % 360);
  return `hsl(${hue} 18% ${l || 88}%)`;
}
function terrainCount(idx) { const g = terrainGrid(); let n = 0; for (let i = 0; i < TER_CELLS; i++) if (g[i] === idx) n++; return n; }
function terrainUsed() { const g = terrainGrid(); let n = 0; for (let i = 0; i < TER_CELLS; i++) if (g[i] >= 0) n++; return n; }
function terrainDropSpace(idx) {
  const g = terrainGrid();
  for (let i = 0; i < TER_CELLS; i++) { if (g[i] === idx) g[i] = -1; else if (g[i] > idx) g[i]--; }
}
function modelState() {
  if (!S.model) S.model = { deco: [], sel: null, mode: null };
  if (!Array.isArray(S.model.deco)) S.model.deco = [];
  return S.model;
}

/* ── Le promeneur qui flâne sur les chemins (repris) ────────── */
function walkerHTML(deco) {
  const m = modelState();
  const path = [...deco.entries()].filter(([, t]) => t === 'chemin').map(([i]) => i);
  if (!path.length) { m.walkI = null; return ''; }
  if (m.walkI == null || deco.get(m.walkI) !== 'chemin') m.walkI = path[0];
  const colW = 100 / TER_COLS, rowH = 100 / TER_ROWS, c = m.walkI % TER_COLS, r = (m.walkI / TER_COLS) | 0;
  return `<div class="ter-walk" id="ter-walk" style="left:calc(${(c + 0.5) * colW}% - 6px);top:calc(${(r + 0.5) * rowH}% - 8px)"><span class="tc-ic">🚶</span></div>`;
}

/* ── La grille (repris et simplifié : plus de solutions/Vadité/boucles) ── */
function terrainGridHTML(live) {
  const g = terrainGrid(), m = modelState();
  const deco = new Map(m.deco.map(d => [d.i, d.t]));
  const first = new Map();
  for (let i = 0; i < TER_CELLS; i++) { const v = g[i]; if (v < 0) continue; if (!first.has(v)) first.set(v, i); }
  const hash = i => { let x = (i + 7) * 2654435761; x ^= x >>> 13; return (x * 2246822519) >>> 0; };
  let h = '';
  for (let i = 0; i < TER_CELLS; i++) {
    const v = g[i], sp = v >= 0 ? S.spaces[v] : null;
    const d = deco.get(i);
    let cls = 'ter-cell' + ((((i % TER_COLS) + ((i / TER_COLS) | 0)) % 2) ? ' alt' : '');
    if (!sp && !d && hash(i) % 7 === 0) cls += ' r1';              // micro-relief de l'herbe
    let inner = '';
    if (sp) {
      cls += ' fill' + (sp.type === 'jardin' ? ' flat' : '');
      if (first.get(v) === i)
        inner = `<span class="tc-ic">${sp.ic}</span><span class="ter-label">${escapeHtml(sp.name)}</span>`;
    }
    else if (d === 'chemin') {
      cls += ' deco-chemin';
      if (i >= TER_COLS && deco.get(i - TER_COLS) === 'chemin') cls += ' chem-n';
      if (i + TER_COLS < TER_CELLS && deco.get(i + TER_COLS) === 'chemin') cls += ' chem-s';
      if (i % TER_COLS > 0 && deco.get(i - 1) === 'chemin') cls += ' chem-w';
      if (i % TER_COLS < TER_COLS - 1 && deco.get(i + 1) === 'chemin') cls += ' chem-e';
    }
    else if (d === 'eau') cls += ' deco-eau';
    else if (d === 'eolienne') inner = '<span class="tc-ic tc-eol"><b></b></span>';
    else if (d && MODEL_DECO[d]) inner = `<span class="tc-ic">${MODEL_DECO[d].ic}</span>`;
    const style = sp ? ` style="--c:${platColor(v)};--cd:${platColor(v, 80)};--cd2:${platColor(v, 72)}"` : '';
    h += `<div class="${cls}" data-i="${i}"${style}>${inner}</div>`;
  }
  if (live) h += walkerHTML(deco);
  return `<div class="ter-grid ${live ? 'live' : 'ro'}" style="--rot:${m.rot == null ? 24 : m.rot}deg;--zoom:${m.zoom == null ? 1.0 : m.zoom}">${h}</div>`;
}

/* ── Ambiance du cadre : crépuscule + papillon (saisons de jeu retirées) ── */
function terrainAmbientHTML() {
  return '<div class="ter-dusk"></div><span class="ter-fly a">🦋</span>';
}
function terrainZoom(d) {
  const m = modelState();
  m.zoom = Math.round(Math.max(.6, Math.min(1.4, (m.zoom == null ? 1.0 : m.zoom) + d * .15)) * 100) / 100;
  const gr = document.querySelector('.ter-grid.live'); if (gr) gr.style.setProperty('--zoom', m.zoom);
}
/* Légende : « ☕ Café / Bar : 8 blocs / 120 » (repris) */
function terrainLegendHTML(spaces) {
  if (!spaces.length) return '';
  return `<div class="ter-legend">${spaces.map(sp => {
    const idx = spaceIdx(sp.id), n = terrainCount(idx);
    return `<div class="ter-leg ${n ? '' : 'none'}"><span class="tl-sw" style="background:${spaceColor(idx)}"></span>
      <span class="tl-nm">${sp.ic} ${escapeHtml(sp.name)}</span>
      <span class="tl-n">${n} bloc${n > 1 ? 's' : ''} / ${TER_CELLS}</span></div>`;
  }).join('')}</div>`;
}

/* ── Peinture (repris ; strokeEnd simplifié à un simple render) ── */
let TER_PAINTING = false, TER_DIRTY = false, TER_GLOBAL = false, TER_ORB = null;
function terrainPaint(i) {
  if (i < 0 || i >= TER_CELLS) return;
  const m = modelState(), g = terrainGrid();
  if (m.sel == null && m.mode !== 'erase') return;
  const v = m.sel != null ? m.sel : -1;
  let changed = false;
  if (v === -1) { const di = m.deco.findIndex(d => d.i === i); if (di >= 0) { m.deco.splice(di, 1); changed = true; } }
  if (g[i] !== v) { g[i] = v; changed = true; }
  if (!changed) return;
  TER_DIRTY = true;
  const cell = document.querySelector(`.ter-grid.live .ter-cell[data-i="${i}"]`);
  if (cell) {
    const sp = v >= 0 ? S.spaces[v] : null;
    cell.classList.toggle('fill', !!sp);
    cell.classList.toggle('flat', !!(sp && sp.type === 'jardin'));
    cell.classList.remove('deco-chemin', 'deco-eau');
    if (sp) { cell.style.setProperty('--c', platColor(v)); cell.style.setProperty('--cd', platColor(v, 80)); cell.style.setProperty('--cd2', platColor(v, 72)); }
    else { cell.style.removeProperty('--c'); cell.style.removeProperty('--cd'); cell.style.removeProperty('--cd2'); }
    cell.textContent = '';
  }
}
function terrainStrokeEnd() {
  if (!TER_DIRTY) return;
  TER_DIRTY = false;
  render();
}
/* Le décor se pose au clic, bloc par bloc. */
function terrainDecoClick(i) {
  const m = modelState();
  if (!m.mode || m.mode === 'erase' || !MODEL_DECO[m.mode]) return false;
  if (terrainGrid()[i] >= 0) { toast('Pose le décor sur l\'herbe, pas sur un espace 🌱'); return true; }
  if (m.deco.find(d => d.i === i)) { toast('Il y a déjà quelque chose ici'); return true; }
  m.deco.push({ t: m.mode, i }); render(); return true;
}
function terrainBind(el) {
  if (!el) return;
  if (!TER_GLOBAL) {
    TER_GLOBAL = true;
    const end = () => { if (TER_PAINTING) { TER_PAINTING = false; terrainStrokeEnd(); } TER_ORB = null; };
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
    const orbMove = (x) => {
      if (TER_ORB == null) return;
      const m = modelState();
      m.rot = Math.round(Math.max(0, Math.min(48, TER_ORB.base + (x - TER_ORB.x) * 0.22)) * 10) / 10;
      const gr = document.querySelector('.ter-grid.live'); if (gr) gr.style.setProperty('--rot', m.rot + 'deg');
    };
    window.addEventListener('mousemove', e => { if (TER_ORB != null && (e.buttons & 1)) orbMove(e.clientX); });
    window.addEventListener('touchmove', e => { if (TER_ORB != null && e.touches[0]) orbMove(e.touches[0].clientX); }, { passive: true });
  }
  const wrap = el.closest('.ter-wrap');
  if (wrap) {
    const orbStart = (t, x) => { if (t.closest('.ter-cell') || t.closest('.ter-zoom')) return false; const mo = modelState(); TER_ORB = { x, base: (mo.rot == null ? 24 : mo.rot) }; return true; };
    wrap.addEventListener('mousedown', e => { if (e.button === 0 && orbStart(e.target, e.clientX)) e.preventDefault(); });
    wrap.addEventListener('touchstart', e => { const t = e.touches[0]; if (t) orbStart(e.target, t.clientX); }, { passive: true });
    wrap.addEventListener('dblclick', e => {
      if (e.target.closest('.ter-cell')) return;
      const m = modelState(); m.rot = 24; m.zoom = 0.9;
      el.style.setProperty('--rot', '24deg'); el.style.setProperty('--zoom', '0.9');
    });
  }
  if (window.TER_WALKT) { clearInterval(window.TER_WALKT); window.TER_WALKT = null; }
  if (document.getElementById('ter-walk')) {
    window.TER_WALKT = setInterval(() => {
      const wk = document.getElementById('ter-walk');
      if (!wk || !S.model) { clearInterval(window.TER_WALKT); window.TER_WALKT = null; return; }
      const m = modelState(), deco = new Map(m.deco.map(d => [d.i, d.t]));
      if (m.walkI == null || deco.get(m.walkI) !== 'chemin') return;
      const i = m.walkI, c = i % TER_COLS;
      const nbs = [[i + 1, c < TER_COLS - 1], [i - 1, c > 0], [i + TER_COLS, true], [i - TER_COLS, true]]
        .filter(([j, ok]) => ok && j >= 0 && j < TER_CELLS && deco.get(j) === 'chemin').map(([j]) => j);
      if (!nbs.length) return;
      m.walkI = nbs[(Math.random() * nbs.length) | 0];
      const colW = 100 / TER_COLS, rowH = 100 / TER_ROWS, cc = m.walkI % TER_COLS, rr = (m.walkI / TER_COLS) | 0;
      wk.style.left = `calc(${(cc + 0.5) * colW}% - 6px)`; wk.style.top = `calc(${(rr + 0.5) * rowH}% - 8px)`;
    }, 1600);
  }
  const cellAt = t => { const c = (t && t.closest) ? t.closest('.ter-cell') : null; return c ? +c.dataset.i : -1; };
  el.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    const i = cellAt(e.target); if (i < 0) return;
    e.preventDefault();
    if (terrainDecoClick(i)) return;
    TER_PAINTING = true; terrainPaint(i);
  });
  el.addEventListener('mousemove', e => {
    if (!TER_PAINTING || !(e.buttons & 1)) return;
    const i = cellAt(e.target); if (i >= 0) terrainPaint(i);
  });
  el.addEventListener('touchstart', e => {
    const i = cellAt(e.target); if (i < 0) return;
    e.preventDefault();
    if (terrainDecoClick(i)) return;
    TER_PAINTING = true; terrainPaint(i);
  }, { passive: false });
  el.addEventListener('touchmove', e => {
    if (!TER_PAINTING) return;
    const t = e.touches[0]; if (!t) return;
    e.preventDefault();
    const i = cellAt(document.elementFromPoint(t.clientX, t.clientY));
    if (i >= 0) terrainPaint(i);
  }, { passive: false });
}

/* ── Sélection / outils (repris, sans boucles) ──────────────── */
function terrainSelectSpace(idx) {
  const m = modelState(); m.mode = null;
  if (m.sel === idx) {
    const sp = S.spaces[idx], n = terrainCount(idx);
    m.sel = null;
    toast(n ? `✅ « ${sp ? sp.name : 'Espace'} » occupe ${n} bloc${n > 1 ? 's' : ''}` : 'Aucun bloc placé pour cet espace');
  } else m.sel = idx;
  render();
}
function modelSelectDeco(t) { const m = modelState(); m.sel = null; m.mode = (m.mode === t ? null : t); render(); }
function terrainEraseMode() { const m = modelState(); m.sel = null; m.mode = (m.mode === 'erase' ? null : 'erase'); render(); }
function terrainClear() {
  const m = modelState();
  S.terrainGrid = new Array(TER_CELLS).fill(-1); m.deco = []; m.sel = null; m.mode = null;
  toast('Terrain effacé'); render();
}

/* ── Gestion des espaces (spécifique Esquisse : projet vierge) ── */
let ADD_OPEN = false;
function esqToggleAdd() { ADD_OPEN = !ADD_OPEN; render(); if (ADD_OPEN) setTimeout(() => { const el = document.getElementById('esq-add-name'); if (el) el.focus(); }, 40); }
function esqAddSpace() {
  const nameEl = document.getElementById('esq-add-name');
  const typeEl = document.getElementById('esq-add-type');
  if (!nameEl || !typeEl) return;
  const type = typeEl.value;
  const name = (nameEl.value || '').trim() || TYPE_LABEL[type];
  const id = 'z' + Date.now().toString(36);
  S.spaces.push({ id, name, type, ic: TYPE_ICON[type] });
  ADD_OPEN = false;
  const m = modelState(); m.sel = S.spaces.length - 1; m.mode = null;   // prêt à peindre le nouvel espace
  toast(`« ${name} » ajouté, place-le sur le terrain 📍`);
  render();
}
function esqRemoveSpace(idx) {
  const sp = S.spaces[idx]; if (!sp) return;
  terrainDropSpace(idx);
  S.spaces.splice(idx, 1);
  const m = modelState();
  if (m.sel === idx) m.sel = null; else if (m.sel > idx) m.sel--;
  toast(`« ${sp.name} » retiré`);
  render();
}
function esqSetProjet(v) { S.projet = v; }

/* ── Rendu du panneau + terrain (adapté de renderModele) ────── */
function render() {
  const el = document.getElementById('esq'); if (!el) return;
  const m = modelState(); terrainGrid();
  const spaces = S.spaces;
  if (m.sel != null && !S.spaces[m.sel]) m.sel = null;
  const selSp = m.sel != null ? S.spaces[m.sel] : null;

  const hint = selSp
    ? `📍 Clique (ou <b>glisse</b>) sur le terrain pour placer « <b>${escapeHtml(selSp.name)}</b> », puis re-clique son bouton pour confirmer ✅`
    : m.mode === 'erase' ? '🧽 Clique ou glisse sur le terrain pour effacer, puis re-clique 🧽 Gomme pour terminer'
    : m.mode ? `👆 Clique le terrain pour poser ${MODEL_DECO[m.mode].ic} ${MODEL_DECO[m.mode].n}`
    : 'Choisis un espace 👇 puis place ses blocs sur le terrain : il occupe autant de blocs que tu veux.';

  const paintedN = spaces.filter(sp => terrainCount(spaceIdx(sp.id)) > 0).length;

  let panel = `<div class="model-panel">
    <div class="cp-title">🧱 Esquisse ton lieu</div>
    <label class="esq-projet"><span>Nom du projet</span>
      <input id="esq-projet" type="text" placeholder="Mon tiers-lieu…" value="${escapeHtml(S.projet)}" oninput="esqSetProjet(this.value)"></label>
    <div class="mp-hint">${hint}</div>
    <div class="mp-sect">🏡 Tes espaces</div>`;

  if (!spaces.length) panel += `<div class="mp-hint">Ajoute un premier espace ci-dessous 👇</div>`;
  else panel += spaces.map((sp, idx) => {
    const on = m.sel === idx, n = terrainCount(idx);
    return `<div class="mp-item ${on ? 'on' : ''}">
      <button class="mpi-main" onclick="terrainSelectSpace(${idx})">
        <span class="mpi-ic" style="background:${spaceColor(idx)}">${sp.ic}</span>
        <span class="mpi-tx"><span class="mpi-nm">${escapeHtml(sp.name)}</span><span class="mpi-sub">🧱 ${n} bloc${n > 1 ? 's' : ''}</span></span>
        <span class="mpi-st ${n ? 'ok' : ''}">${on ? '📍 en cours' : (n ? '✅ placé' : 'à placer')}</span>
      </button>
      <button class="mpi-del" title="Retirer cet espace" onclick="esqRemoveSpace(${idx})">✕</button>
    </div>`;
  }).join('');

  panel += ADD_OPEN
    ? `<div class="esq-add">
        <input id="esq-add-name" type="text" placeholder="Nom de l'espace" onkeydown="if(event.key==='Enter')esqAddSpace()">
        <select id="esq-add-type">${SPACE_TYPES.map(([k, l, i]) => `<option value="${k}">${i} ${l}</option>`).join('')}</select>
        <div class="esq-add-row">
          <button class="esq-add-ok" onclick="esqAddSpace()">Ajouter</button>
          <button class="esq-add-cancel" onclick="esqToggleAdd()">Annuler</button>
        </div>
      </div>`
    : `<button class="esq-add-btn" onclick="esqToggleAdd()">+ Ajouter un espace</button>`;

  panel += `<div class="mp-sect mp-deco-sect">🌿 Décor</div>
    <div class="mp-deco">${Object.entries(MODEL_DECO).map(([k, d]) => `<button class="mp-deco-btn ${m.mode === k ? 'on' : ''}" onclick="modelSelectDeco('${k}')" title="${d.n}"><span>${d.ic}</span><small>${d.n}</small></button>`).join('')}</div>
    <div class="mp-tools">
      <button class="${m.mode === 'erase' ? 'on' : ''}" onclick="terrainEraseMode()">🧽 Gomme</button>
      <button onclick="terrainClear()">🗑️ Tout effacer</button>
    </div>
    <div class="mp-counts">🏡 ${paintedN}/${spaces.length} espace(s) placé(s) · 🧱 ${terrainUsed()}/${TER_CELLS} blocs</div>
  </div>`;

  el.innerHTML = `<div class="model-wrap">
    <div class="ter-wrap">${terrainGridHTML(true)}${terrainAmbientHTML()}
      <div class="ter-zoom"><button onclick="terrainZoom(-1)" title="Réduire">−</button><button onclick="terrainZoom(1)" title="Agrandir">+</button></div>
      ${terrainLegendHTML(spaces)}
    </div>
    ${panel}
  </div>`;
  terrainBind(el.querySelector('.ter-grid'));
}

/* ── Prénom transmis par l'onboarding (facultatif) ──────────── */
try {
  const p = new URLSearchParams(location.search).get('prenom');
  if (p) { const g = document.getElementById('esq-greet'); if (g) g.textContent = `Bien joué ${p}, place tes espaces sur le terrain 🧱`; }
} catch (e) {}

render();
