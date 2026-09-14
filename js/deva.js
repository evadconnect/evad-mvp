/* ═══════════════════════════════════════════════════════════════
   EVAD · Deva, le fil (MVP tranche verticale)
   Étape 1 — Deva plein écran accueille : bonjour, prénom, option
   présentation (vidéo Vision), puis la question d'intention et ses
   4 portes. Deva est SCRIPTÉE par règles (pas de LLM, pas de RAG).
   État en mémoire uniquement (jamais de stockage navigateur).
   La bascule vers le panneau latéral + l'outil arrive à l'étape 2.
   ═══════════════════════════════════════════════════════════════ */

const AVATAR = 'img/deva.png';
const VISION_VIDEO_URL = '';        // à remplacer par l'URL réelle quand elle existera

/* ── État du projet, en mémoire ─────────────────────────────── */
const projet = {
  prenom: '',
  intention: null,   // 'creer' | 'visiter' | 'solutions' | 'rejoindre'
  vue: { rot: 24, zoom: 1 },
  cases: {},         // index de case -> { type, solution, statut } (rempli aux étapes suivantes)
};

const thread   = document.getElementById('thread');
const composer = document.getElementById('composer');

/* ── Affichage du fil ───────────────────────────────────────── */
function scrollDown() {
  requestAnimationFrame(() => { thread.scrollTop = thread.scrollHeight; });
}
function bubble(who, html) {
  const row = document.createElement('div');
  row.className = 'row ' + who;
  if (who === 'deva') row.innerHTML = `<img class="avatar" src="${AVATAR}" alt="Deva">`;
  const b = document.createElement('div');
  b.className = 'bubble'; b.innerHTML = html;
  row.appendChild(b);
  thread.appendChild(row);
  scrollDown();
  return row;
}
// Deva "réfléchit" puis parle
function devaSay(html, delay = 700) {
  clearComposer();
  const row = document.createElement('div');
  row.className = 'row deva';
  row.innerHTML = `<img class="avatar" src="${AVATAR}" alt="Deva"><div class="bubble"><span class="typing"><span></span><span></span><span></span></span></div>`;
  thread.appendChild(row);
  scrollDown();
  return new Promise(resolve => setTimeout(() => {
    row.querySelector('.bubble').innerHTML = html;
    scrollDown();
    resolve(row);
  }, delay));
}
async function devaSequence(lines) {
  for (const line of lines) {
    const [html, delay] = Array.isArray(line) ? line : [line, 700];
    await devaSay(html, delay);
  }
}

/* ── Le composer (puces + champ) ────────────────────────────── */
function clearComposer() { composer.innerHTML = ''; composer.classList.add('hidden'); }
function showChips(build) {
  composer.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'chips';
  build(box);
  composer.appendChild(box);
  composer.classList.remove('hidden');
  scrollDown();
}
function chip(cls, ico, label, sub, onClick) {
  const b = document.createElement('button');
  b.className = 'btn ' + cls;
  b.innerHTML = `<span class="ico">${ico}</span><span>${label}${sub ? `<span class="sub">${sub}</span>` : ''}</span>`;
  b.addEventListener('click', onClick);
  return b;
}

/* ── 1. Accueil ─────────────────────────────────────────────── */
async function stepWelcome() {
  await devaSequence([
    ['Bonjour', 550],
    ['Je suis <strong>Deva</strong>, la compagne de ton projet sur EVAD. On avance pas à pas, ici même.', 900],
    'Pour commencer, comment tu t\'appelles ?'
  ]);
  stepAskName();
}

/* ── 2. Prénom ──────────────────────────────────────────────── */
function stepAskName() {
  showChips(box => {
    const f = document.createElement('form');
    f.className = 'field';
    f.innerHTML = `<input type="text" id="prenom" placeholder="Ton prénom" autocomplete="given-name" aria-label="Ton prénom"><button class="send" type="submit" aria-label="Valider">→</button>`;
    f.addEventListener('submit', e => {
      e.preventDefault();
      const v = f.querySelector('input').value.trim();
      if (!v) return;
      projet.prenom = v.charAt(0).toUpperCase() + v.slice(1);
      bubble('me', projet.prenom);
      stepPresentation();
    });
    box.appendChild(f);
    setTimeout(() => f.querySelector('input').focus(), 80);
  });
}

/* ── 3. Présentation (optionnelle) ──────────────────────────── */
async function stepPresentation() {
  await devaSequence([
    [`Enchantée, <strong>${projet.prenom}</strong>.`, 650],
    'Tu veux une courte présentation d\'EVAD en vidéo, ou on y va directement ?'
  ]);
  showChips(box => {
    box.appendChild(chip('btn-gold', '🎬', 'Voir la présentation', 'La vidéo Vision', () => {
      bubble('me', 'Voir la présentation'); stepVision();
    }));
    box.appendChild(chip('btn-ghost', '👉', 'On y va', 'Aller au choix', () => {
      bubble('me', 'On y va'); stepIntention();
    }));
  });
}
async function stepVision() {
  clearComposer();
  const row = document.createElement('div');
  row.className = 'row deva'; row.style.maxWidth = '100%';
  row.innerHTML = `<img class="avatar" src="${AVATAR}" alt="Deva">`;
  const card = document.createElement('div');
  card.className = 'video-card'; card.style.flex = '1';
  card.innerHTML = VISION_VIDEO_URL
    ? `<div class="video-frame" style="padding:0"><iframe src="${VISION_VIDEO_URL}" style="width:100%;height:100%;border:0" allow="fullscreen" allowfullscreen></iframe></div>`
    : `<div class="video-frame"><div class="play">▶</div><strong>La Vision d'EVAD</strong><small>Emplacement vidéo, l'URL sera ajoutée ici</small></div>
       <div class="cap">🌍 EVAD relie les lieux, les gens et leurs projets pour régénérer les territoires.</div>`;
  row.appendChild(card);
  thread.appendChild(row);
  scrollDown();
  await devaSay('Voilà l\'esprit. On continue ?', 1300);
  showChips(box => box.appendChild(chip('btn-primary', '👉', 'Continuer', '', () => {
    bubble('me', 'Continuer'); stepIntention();
  })));
}

/* ── 4. Intention : les 4 portes ────────────────────────────── */
async function stepIntention() {
  await devaSay(`Qu'est-ce que tu veux faire, <strong>${projet.prenom}</strong> ?`, 750);
  showChips(box => {
    box.appendChild(chip('btn-primary', '🌱', 'Créer un projet', 'Esquisser un lieu', () => choose('creer')));
    box.appendChild(chip('btn-primary', '🗺', 'Visiter le monde', 'Explorer les lieux', () => choose('visiter')));
    box.appendChild(chip('btn-primary', '💡', 'Trouver des solutions', 'Le Commun', () => choose('solutions')));
    box.appendChild(chip('btn-primary', '🤝', 'Rejoindre un projet', 'La carte des projets', () => choose('rejoindre')));
  });
}

const PORTE_LABEL = {
  creer: 'Créer un projet', visiter: 'Visiter le monde',
  solutions: 'Trouver des solutions', rejoindre: 'Rejoindre un projet'
};

async function choose(key) {
  projet.intention = key;
  bubble('me', PORTE_LABEL[key]);
  if (key === 'creer') {
    await devaSay('Parfait. Je te fais de la place, le plateau s\'ouvre à droite.', 650);
    ouvrirEsquisse();
  } else {
    await devaSay('Cette porte viendra plus tard. Pour cette démonstration, prenons plutôt <strong>Créer un projet</strong>.', 750);
    stepIntention();
  }
}

/* ═══════════════════════════════════════════════════════════════
   Étape 2 — La bascule : Deva se décale à gauche, la fenêtre d'outil
   s'ouvre à droite. Deva persiste et continue de parler. On peut
   revenir à l'accueil (changer d'intention) à tout moment.
   ═══════════════════════════════════════════════════════════════ */

async function ouvrirEsquisse() {
  clearComposer();
  document.getElementById('tool-name').textContent = 'Esquisse';
  document.getElementById('tool-sub').textContent = 'le plateau de ton projet';
  renderPlateau();
  // la bascule : on change de phase (CSS anime la largeur des colonnes)
  document.body.dataset.phase = 'outil';
  document.body.dataset.mode = 'esquisse';
  document.getElementById('mode-label').textContent = 'Esquisse';
  document.getElementById('tool-panel').setAttribute('aria-hidden', 'false');
  await devaSay('Voilà ton plateau. Je reste ici, à gauche. Bientôt, tu y poseras tes espaces.', 850);
}

function retourAccueil() {
  document.body.dataset.phase = 'accueil';
  document.body.dataset.mode = 'accueil';
  document.getElementById('mode-label').textContent = 'Accueil';
  document.getElementById('tool-panel').setAttribute('aria-hidden', 'true');
  projet.intention = null;
  stepIntention();
}
document.getElementById('back-btn').addEventListener('click', retourAccueil);

/* ═══════════════════════════════════════════════════════════════
   Le plateau (moteur repris du jeu EVAD, grille 12×10). Vide pour
   l'instant : poser des cases arrive à l'étape 3.
   ═══════════════════════════════════════════════════════════════ */
const TER_COLS = 12, TER_ROWS = 10, TER_CELLS = TER_COLS * TER_ROWS;

function plateauHTML() {
  const { rot, zoom } = projet.vue;
  const hash = i => { let x = (i + 7) * 2654435761; x ^= x >>> 13; return (x * 2246822519) >>> 0; };
  let cells = '';
  for (let i = 0; i < TER_CELLS; i++) {
    let cls = 'ter-cell' + ((((i % TER_COLS) + ((i / TER_COLS) | 0)) % 2) ? ' alt' : '');
    if (hash(i) % 7 === 0) cls += ' r1';
    cells += `<div class="${cls}" data-i="${i}"></div>`;
  }
  return `<div class="plateau-wrap"><div class="ter-wrap">
      <div class="ter-grid live" style="--rot:${rot}deg;--zoom:${zoom}">${cells}</div>
      <div class="ter-dusk"></div><span class="ter-fly">🦋</span>
      <div class="ter-zoom"><button onclick="plateauZoom(-1)" title="Réduire">−</button><button onclick="plateauZoom(1)" title="Agrandir">+</button></div>
    </div></div>`;
}
function renderPlateau() {
  const el = document.getElementById('tool-body'); if (!el) return;
  el.innerHTML = plateauHTML();
  bindPlateau(el.querySelector('.ter-grid'));
}
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

/* ── Go ─────────────────────────────────────────────────────── */
stepWelcome();
