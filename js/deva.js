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
  nom: '',
  vue: { rot: 24, zoom: 1 },
  spaces: [],        // { id, type, ic, name }
  terrainGrid: null, // Array(120) : index de case -> index d'espace, ou -1
  deco: [],          // { t, i } : décor posé (arbre, chemin, mare...) sur une case d'herbe
  paint: { sel: null, mode: null },  // sel = espace peint ; mode = 'erase' | clé de décor | null
  suggested: null,   // type d'espace que Deva pointe (pull)
  commun: { open: false, espaceIdx: null },  // fenêtre du Commun ouverte sous l'esquisse
};

const thread   = document.getElementById('thread');
const composer = document.getElementById('composer');

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

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
  document.getElementById('tool-sub').textContent = 'la maquette de ton projet';
  renderPlateau();
  // la bascule : on change de phase (CSS anime la largeur des colonnes)
  document.body.dataset.phase = 'outil';
  document.body.dataset.mode = 'esquisse';
  document.getElementById('mode-label').textContent = 'Esquisse';
  document.getElementById('tool-panel').setAttribute('aria-hidden', 'false');
  await devaSay('Voilà ta maquette, encore vide. Dis-m\'en un peu plus et tu vas la dessiner toi-même.', 850);
  stepNomLieu();
}

/* ═══════════════════════════════════════════════════════════════
   Étape 3 — Deva mène l'entretien ; la maquette se remplit via la
   PALETTE d'espaces sous le plateau : on choisit un espace et on pose
   autant de blocs qu'on veut. Deva invite et pointe (pull), l'humain
   personnalise. Deva questionne le projet, jamais la personne.
   ═══════════════════════════════════════════════════════════════ */

// Liste complète des types d'espaces (repris du jeu / fiche lieu) : [type, label, icône]
const SPACE_TYPES = [
  ['cuisine', 'Cuisine', '🍳'], ['cafe_bar', 'Café / Bar', '☕'], ['cantine', 'Cantine / Resto', '🍽️'],
  ['coworking', 'Coworking', '💻'], ['salle_reunion', 'Salle de réunion', '🗣️'], ['atelier', 'Atelier', '🔧'],
  ['fablab', 'FabLab', '⚙️'], ['scene', 'Scène / Événements', '🎪'], ['expo', 'Espace expo', '🖼️'],
  ['boutique', 'Boutique', '🛍️'], ['bibliotheque', 'Bibliothèque', '📚'], ['formation', 'Salle de formation', '🎓'],
  ['jardin', 'Jardin', '🌿'], ['serre', 'Serre', '🌱'], ['compost', 'Compost / Déchets', '♻️'],
  ['hebergement', 'Hébergement', '🛏️'], ['sport', 'Sport / Bien-être', '🤸'], ['meditation', 'Méditation / Yoga', '🧘'],
  ['stockage', 'Stockage', '📦'], ['autre', 'Autre', '✨'],
];
const TYPE_META = Object.fromEntries(SPACE_TYPES.map(([t, l, i]) => [t, { label: l, ic: i }]));
// Décor posable sur l'herbe (repris du jeu). flat = décor à plat (chemin, mare).
const MODEL_DECO = {
  arbre:    { ic: '🌳',  n: 'Arbre' },
  fleur:    { ic: '🌼',  n: 'Fleurs' },
  rocher:   { ic: '🪨',  n: 'Rocher' },
  chemin:   { ic: '🛤️', n: 'Chemin', flat: true },
  eau:      { ic: '💧',  n: 'Mare',   flat: true },
  eolienne: { ic: '🌬️', n: 'Éolienne' },
};
// Couleur réaliste par type : [teinte, saturation, décalage de luminosité] (repris du jeu)
const TYPE_COLORS = {
  jardin: [115, 45, 0], serre: [200, 12, 0], compost: [26, 35, -8],
  cuisine: [30, 75, 0], cantine: [46, 70, 0], cafe_bar: [22, 45, 0],
  atelier: [10, 45, -4], fablab: [250, 40, 0], stockage: [0, 0, -4],
  coworking: [210, 55, 0], salle_reunion: [225, 35, 0], formation: [190, 45, 0], bibliotheque: [38, 40, 0],
  scene: [330, 55, 0], expo: [280, 45, 0], boutique: [345, 60, 0],
  hebergement: [260, 30, 0], sport: [170, 50, 0], meditation: [300, 30, 0], autre: [60, 25, 0],
};

let devaAReagi = false;

async function stepNomLieu() {
  await devaSay('Pour commencer, comment s\'appelle ton lieu, ou ton projet ?', 650);
  showChips(box => {
    const f = document.createElement('form');
    f.className = 'field';
    f.innerHTML = `<input type="text" id="nom-lieu" placeholder="Nom du lieu" aria-label="Nom du lieu"><button class="send" type="submit" aria-label="Valider">→</button>`;
    f.addEventListener('submit', e => {
      e.preventDefault();
      const v = f.querySelector('input').value.trim();
      if (!v) return;
      projet.nom = v;
      bubble('me', v);
      document.getElementById('tool-sub').textContent = v;
      stepInviteEspaces();
    });
    box.appendChild(f);
    setTimeout(() => f.querySelector('input').focus(), 80);
  });
}

async function stepInviteEspaces() {
  await devaSequence([
    [`Bien. Pour dessiner <strong>${escapeHtml(projet.nom)}</strong>, regarde la <strong>palette des espaces</strong> sous le plateau.`, 800],
    'Choisis un espace, puis pose autant de blocs que tu veux sur la grille. Un jardin pour commencer ?'
  ]);
  projet.suggested = 'jardin';   // pull : Deva pointe le jardin dans la palette
  render();
  clearComposer();
}

// Deva réagit une fois, doucement, quand les premiers blocs sont posés (pull, pas push)
async function devaPeutReagir() {
  if (devaAReagi) return;
  if (terrainUsed() > 0) {
    devaAReagi = true;
    const sp = projet.spaces[projet.paint.sel] || projet.spaces.find((_, i) => terrainCount(i) > 0);
    const nm = sp ? sp.name.toLowerCase() : 'ton espace';
    await devaSay(`Voilà, ${nm} prend sa place. Continue ta maquette, puis quand tu veux je regarde le Commun.`, 500);
    offrirCommun();   // marque discrète : Deva propose, elle n'impose pas (pull)
  }
}

/* ═══════════════════════════════════════════════════════════════
   Étape 4 — Le Commun : Deva fait glisser dans le fil des cartes de
   solutions (source toujours visible, badge de fiche provisoire).
   L'humain rattache une solution à un espace. Deva ne propose QUE des
   fiches du Commun ; si rien ne correspond, elle le dit, sans inventer.
   ═══════════════════════════════════════════════════════════════ */

// Le Commun : une dizaine de fiches EN DUR, marquées provisoires.
const COMMUN = [
  { id: 'compost', ic: '♻️', titre: 'Compost partagé', source: 'Réseau Compost Citoyen', types: ['jardin', 'compost', 'cuisine', 'cantine'], desc: 'Un composteur collectif pour transformer les biodéchets en terreau, animé par les habitants.' },
  { id: 'potager', ic: '🌱', titre: 'Potager en permaculture', source: 'Réseau Permaculture', types: ['jardin', 'serre'], desc: 'Des buttes nourricières sans pesticide, en associant les cultures pour un sol vivant.' },
  { id: 'eaupluie', ic: '💧', titre: "Récupération d'eau de pluie", source: 'Guide ADEME', types: ['jardin', 'serre', 'autre'], desc: 'Des cuves reliées aux toitures pour arroser sans puiser dans le réseau.' },
  { id: 'repaircafe', ic: '🔧', titre: 'Repair Café', source: 'Réseau des Repair Cafés', types: ['atelier', 'cafe_bar', 'fablab'], desc: "Un rendez-vous où l'on répare ensemble objets et vélos plutôt que de jeter." },
  { id: 'amap', ic: '🥕', titre: 'AMAP, panier paysan', source: 'Réseau des AMAP', types: ['cuisine', 'cantine', 'boutique', 'cafe_bar'], desc: 'Un partenariat direct avec des paysans locaux, en paniers hebdomadaires.' },
  { id: 'frigo', ic: '🧊', titre: 'Frigo solidaire', source: 'Les Frigos Solidaires', types: ['cuisine', 'cafe_bar', 'cantine'], desc: 'Un frigo en libre accès pour partager les surplus et lutter contre le gaspillage.' },
  { id: 'fresque', ic: '🌍', titre: 'Fresque du Climat', source: 'Association Fresque du Climat', types: ['formation', 'salle_reunion', 'coworking'], desc: 'Un atelier collaboratif de 3h pour comprendre le changement climatique.' },
  { id: 'gratiferia', ic: '🎁', titre: 'Boîte à dons', source: 'Mouvement Gratiferia', types: ['boutique', 'expo', 'autre'], desc: 'Un espace où déposer et prendre gratuitement, pour donner une seconde vie aux objets.' },
  { id: 'solaire', ic: '☀️', titre: 'Autoconsommation solaire', source: 'Guide ADEME', types: ['coworking', 'stockage', 'autre', 'fablab'], desc: 'Des panneaux photovoltaïques pour couvrir une partie des besoins en électricité.' },
  { id: 'toilettes', ic: '🚻', titre: 'Toilettes sèches', source: 'Réseau Assainissement Écologique', types: ['jardin', 'autre', 'scene'], desc: 'Des toilettes sans eau dont le compost enrichit les sols.' },
  { id: 'vrac', ic: '🫙', titre: 'Épicerie en vrac', source: 'Réseau Vrac', types: ['boutique', 'cuisine'], desc: 'Vente sans emballage, avec des contenants réutilisables apportés par les habitants.' },
  { id: 'velo', ic: '🚲', titre: 'Atelier vélo participatif', source: "L'Heureux Cyclage", types: ['atelier', 'fablab', 'sport'], desc: "Un local outillé pour apprendre à entretenir et réparer son vélo." },
];

// Marque discrète dans le fil : Deva propose d'ouvrir le Commun
function offrirCommun() {
  showChips(box => box.appendChild(chip('btn-ghost', '🔎', 'Des solutions du Commun ?', 'Pour un de tes espaces', stepCommunEspace)));
}

async function stepCommunEspace() {
  const poses = projet.spaces.filter((_, i) => terrainCount(i) > 0);
  if (!poses.length) { await devaSay('Pose d\'abord un espace sur la maquette, puis je chercherai des solutions.', 600); offrirCommun(); return; }
  await devaSay('Pour quel espace veux-tu des solutions du Commun ?', 650);
  showChips(box => {
    projet.spaces.forEach((sp, idx) => {
      if (terrainCount(idx) > 0) box.appendChild(chip('btn-primary', sp.ic, sp.name, sp.solution ? '🔗 déjà une solution' : '', () => ouvrirCommun(idx)));
    });
  });
}

async function ouvrirCommun(idx) {
  const sp = projet.spaces[idx];
  bubble('me', `Solutions pour ${sp.name}`);
  const matches = COMMUN.filter(s => s.types.includes(sp.type));
  if (!matches.length) {
    await devaSay(`Je n'ai rien dans le Commun pour « ${escapeHtml(sp.name)} » pour l'instant. Je ne t'invente pas de solution.`, 800);
    offrirCommun();
    return;
  }
  document.body.dataset.mode = 'commun';
  document.getElementById('mode-label').textContent = 'Le Commun';
  projet.commun = { open: true, espaceIdx: idx };
  renderPlateau();   // la bibliothèque s'ouvre en fenêtre sous l'esquisse
  await devaSay(`Le Commun s'ouvre sous ta maquette. Regarde les fiches proposées pour <strong>${escapeHtml(sp.name)}</strong> et rattache celle que tu veux. Je ne décide rien.`, 850);
  clearComposer();
}

function revenirEsquisse() {
  document.body.dataset.mode = 'esquisse';
  document.getElementById('mode-label').textContent = 'Esquisse';
}
function fermerCommun() {
  projet.commun = { open: false, espaceIdx: null };
  revenirEsquisse();
  renderPlateau();
  offrirCommun();
}

// La fenêtre du Commun, rendue SOUS l'esquisse (panneau de droite)
function communDrawerHTML() {
  if (!projet.commun.open) return '';
  const idx = projet.commun.espaceIdx, sp = projet.spaces[idx];
  if (!sp) return '';
  const matches = COMMUN.filter(s => s.types.includes(sp.type)).slice(0, 6);
  return `<div class="commun-drawer">
    <div class="cd-head"><span class="cd-ic">🏷️</span>
      <div class="cd-tx"><div class="cd-title">Le Commun</div><div class="cd-sub">solutions pour ${sp.ic} ${escapeHtml(sp.name)}</div></div>
      <button class="cd-close" onclick="fermerCommun()" title="Fermer">✕</button></div>
    <div class="cd-cards">${matches.map(sol => solCardHTML(sol, idx)).join('')}</div>
  </div>`;
}
function solCardHTML(sol, idx) {
  const sp = projet.spaces[idx];
  const attached = sp.solution && sp.solution.id === sol.id;
  return `<div class="sol-card${attached ? ' attached' : ''}">
    <div class="sol-head"><span class="sol-ic">${sol.ic}</span>
      <div class="sol-tx"><div class="sol-titre">${escapeHtml(sol.titre)}</div>
      <div class="sol-src" title="Source de la fiche">🏷️ ${escapeHtml(sol.source)} · <em>fiche provisoire</em></div></div></div>
    <button class="sol-more" onclick="toggleSol(this)">Voir la fiche ▾</button>
    <div class="sol-desc" hidden>${escapeHtml(sol.desc)}</div>
    <button class="sol-attach" onclick="rattacher('${sol.id}',${idx})">${attached ? '✅ Rattaché' : '🔗 Rattacher à ' + escapeHtml(sp.name)}</button>
  </div>`;
}
function toggleSol(btn) {
  const d = btn.nextElementSibling;
  const open = !d.hidden; d.hidden = open;
  btn.textContent = open ? 'Voir la fiche ▾' : 'Masquer la fiche ▴';
}

async function rattacher(solId, idx) {
  const sol = COMMUN.find(s => s.id === solId), sp = projet.spaces[idx];
  if (!sol || !sp) return;
  sp.solution = { id: sol.id, ic: sol.ic, titre: sol.titre, source: sol.source };
  bubble('me', `Rattacher « ${sol.titre} » à ${sp.name}`);
  projet.commun = { open: false, espaceIdx: null };
  revenirEsquisse();
  renderPlateau();
  await devaSequence([
    [`C'est relié : <strong>${escapeHtml(sol.titre)}</strong> est rattaché à ${escapeHtml(sp.name)}, avec sa source.`, 750],
    'À la prochaine étape, tu valideras une action réelle et cet espace passera au vert.'
  ]);
  offrirCommun();
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
   Le plateau : moteur de peinture repris du jeu EVAD (grille 12×10).
   On choisit un espace dans la palette, puis on pose autant de blocs
   qu'on veut au clic / glissé. Espaces colorés par type.
   ═══════════════════════════════════════════════════════════════ */
const TER_COLS = 12, TER_ROWS = 10, TER_CELLS = TER_COLS * TER_ROWS;

function terrainGrid() {
  if (!Array.isArray(projet.terrainGrid) || projet.terrainGrid.length !== TER_CELLS)
    projet.terrainGrid = new Array(TER_CELLS).fill(-1);
  return projet.terrainGrid;
}
function terrainCount(idx) { const g = terrainGrid(); let n = 0; for (let i = 0; i < TER_CELLS; i++) if (g[i] === idx) n++; return n; }
function terrainUsed() { const g = terrainGrid(); let n = 0; for (let i = 0; i < TER_CELLS; i++) if (g[i] >= 0) n++; return n; }
function terrainDropSpace(idx) { const g = terrainGrid(); for (let i = 0; i < TER_CELLS; i++) { if (g[i] === idx) g[i] = -1; else if (g[i] > idx) g[i]--; } }

// Couleur vive d'un espace (légende, pastilles)
function spaceColor(idx, l) {
  const sp = projet.spaces[idx], c = TYPE_COLORS[sp && sp.type], base = (l || 60);
  if (!c) return `hsl(${Math.round(idx * 137.508) % 360} 55% ${base}%)`;
  let dup = 0; for (let i = 0; i < idx; i++) { const o = projet.spaces[i]; if (o && o.type === sp.type) dup++; }
  const L = Math.max(30, Math.min(80, base + c[2] - dup * 7));
  return `hsl(${c[0]} ${c[1]}% ${L}%)`;
}
// Couleur de la plateforme (posée sur le plateau) : teinte du type, plus claire
function platColor(idx, l) {
  const sp = projet.spaces[idx], c = TYPE_COLORS[sp && sp.type];
  const hue = c ? c[0] : (Math.round(idx * 137.508) % 360), sat = c ? Math.min(60, c[1]) : 45;
  return `hsl(${hue} ${sat}% ${l || 70}%)`;
}

/* ── Rendu : plateau + légende + palette ── */
function renderPlateau() {
  const el = document.getElementById('tool-body'); if (!el) return;
  el.innerHTML = `<div class="plateau-wrap">${terWrapHTML()}${legendHTML()}${paletteHTML()}${communDrawerHTML()}</div>`;
  bindPlateau(el.querySelector('.ter-grid'));
  if (projet.commun.open) { const d = el.querySelector('.commun-drawer'); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}

function terWrapHTML() {
  const { rot, zoom } = projet.vue, g = terrainGrid();
  const hash = i => { let x = (i + 7) * 2654435761; x ^= x >>> 13; return (x * 2246822519) >>> 0; };
  const first = new Map();
  for (let i = 0; i < TER_CELLS; i++) { const v = g[i]; if (v >= 0 && !first.has(v)) first.set(v, i); }
  const deco = new Map(projet.deco.map(d => [d.i, d.t]));
  let cells = '';
  for (let i = 0; i < TER_CELLS; i++) {
    const v = g[i], sp = v >= 0 ? projet.spaces[v] : null, d = deco.get(i);
    let cls = 'ter-cell' + ((((i % TER_COLS) + ((i / TER_COLS) | 0)) % 2) ? ' alt' : '');
    let inner = '', style = '';
    if (sp) {
      cls += ' fill' + (sp.type === 'jardin' ? ' flat' : '');
      style = ` style="--c:${platColor(v)};--cd:${platColor(v, 58)};--cd2:${platColor(v, 48)}"`;
      if (first.get(v) === i) inner = `<span class="tc-ic">${sp.ic}</span><span class="ter-label">${sp.solution ? '🔗 ' : ''}${escapeHtml(sp.name)}</span>`;
    } else if (d === 'chemin') {
      cls += ' deco-chemin';
      if (i >= TER_COLS && deco.get(i - TER_COLS) === 'chemin') cls += ' chem-n';
      if (i + TER_COLS < TER_CELLS && deco.get(i + TER_COLS) === 'chemin') cls += ' chem-s';
      if (i % TER_COLS > 0 && deco.get(i - 1) === 'chemin') cls += ' chem-w';
      if (i % TER_COLS < TER_COLS - 1 && deco.get(i + 1) === 'chemin') cls += ' chem-e';
    } else if (d === 'eau') cls += ' deco-eau';
    else if (d === 'eolienne') inner = '<span class="tc-ic tc-eol"><b></b></span>';
    else if (d && MODEL_DECO[d]) inner = `<span class="tc-ic">${MODEL_DECO[d].ic}</span>`;
    else if (hash(i) % 7 === 0) cls += ' r1';
    cells += `<div class="${cls}" data-i="${i}"${style}>${inner}</div>`;
  }
  return `<div class="ter-wrap">
      <div class="ter-grid live" style="--rot:${rot}deg;--zoom:${zoom}">${cells}</div>
      <div class="ter-dusk"></div><span class="ter-fly">🦋</span>
      <div class="ter-zoom"><button onclick="plateauZoom(-1)" title="Réduire">−</button><button onclick="plateauZoom(1)" title="Agrandir">+</button></div>
    </div>`;
}

function legendHTML() {
  if (!projet.spaces.length) return '';
  return `<div class="ter-legend">${projet.spaces.map((sp, idx) => {
    const n = terrainCount(idx), on = projet.paint.sel === idx;
    return `<button class="ter-leg${on ? ' on' : ''}${n ? '' : ' none'}" onclick="selectEspace(${idx})">
      <span class="tl-sw" style="background:${spaceColor(idx)}"></span>
      <span class="tl-nm">${sp.ic} ${escapeHtml(sp.name)}</span>
      <span class="tl-n">${n} bloc${n > 1 ? 's' : ''} / ${TER_CELLS}</span>
      <span class="tl-x" title="Retirer" onclick="event.stopPropagation();retirerEspace(${idx})">✕</span>
      ${sp.solution ? `<span class="tl-sol">🔗 ${escapeHtml(sp.solution.titre)} <em>· ${escapeHtml(sp.solution.source)}</em></span>` : ''}
    </button>`;
  }).join('')}</div>`;
}

function paletteHTML() {
  const m = projet.paint.mode;
  const sel = projet.paint.sel != null ? projet.spaces[projet.paint.sel] : null;
  const hint = m === 'erase' ? '🧽 Efface en cliquant sur le plateau'
    : (m && MODEL_DECO[m]) ? `Pose ${MODEL_DECO[m].ic} <b>${MODEL_DECO[m].n}</b> sur l'herbe (clic à l'unité)`
    : sel ? `Pose des blocs de <b>${escapeHtml(sel.name)}</b> sur le plateau`
    : 'Choisis un espace, puis pose des blocs sur le plateau';
  return `<div class="palette">
    <div class="pal-hint">${hint}</div>
    <div class="pal-sect">🏡 Espaces</div>
    <div class="pal-chips">${SPACE_TYPES.map(([t, l, ic]) =>
      `<button class="pal-chip${projet.suggested === t ? ' suggested' : ''}" onclick="ajouterEspace('${t}')" title="Ajouter ${l}"><span class="pc-ic">${ic}</span>${l}</button>`).join('')}</div>
    <div class="pal-sect">🌿 Décor</div>
    <div class="deco-grid">${Object.entries(MODEL_DECO).map(([k, d]) =>
      `<button class="deco-card${m === k ? ' on' : ''}" onclick="selectDeco('${k}')" title="${d.n}"><span class="dc-ic">${d.ic}</span><span class="dc-nm">${d.n}</span></button>`).join('')}</div>
    <div class="pal-tools">
      <button class="${m === 'erase' ? 'on' : ''}" onclick="gomme()">🧽 Gomme</button>
      <button onclick="toutEffacer()">🗑️ Tout effacer</button>
    </div>
  </div>`;
}

/* ── Palette : ajouter / sélectionner / retirer un espace ── */
function ajouterEspace(type) {
  const meta = TYPE_META[type] || { label: type, ic: '✨' };
  const same = projet.spaces.filter(s => s.type === type).length;
  const name = same ? `${meta.label} ${same + 1}` : meta.label;
  projet.spaces.push({ id: 's' + Date.now().toString(36), type, ic: meta.ic, name });
  projet.paint.sel = projet.spaces.length - 1;
  projet.paint.mode = null;
  projet.suggested = null;
  render();
}
function selectEspace(idx) {
  projet.paint.mode = null;
  projet.paint.sel = (projet.paint.sel === idx ? null : idx);
  render();
}
function retirerEspace(idx) {
  terrainDropSpace(idx);
  projet.spaces.splice(idx, 1);
  if (projet.paint.sel === idx) projet.paint.sel = null;
  else if (projet.paint.sel > idx) projet.paint.sel--;
  render();
}
function gomme() { projet.paint.mode = (projet.paint.mode === 'erase' ? null : 'erase'); projet.paint.sel = null; render(); }
function selectDeco(k) { projet.paint.mode = (projet.paint.mode === k ? null : k); projet.paint.sel = null; projet.suggested = null; render(); }
function toutEffacer() { projet.terrainGrid = new Array(TER_CELLS).fill(-1); projet.spaces = []; projet.deco = []; projet.paint = { sel: null, mode: null }; render(); }

// Le décor se pose à l'unité, sur l'herbe uniquement
function terrainDecoClick(i) {
  const m = projet.paint.mode;
  if (!m || m === 'erase' || !MODEL_DECO[m]) return false;
  if (terrainGrid()[i] >= 0) { toast('Le décor se pose sur l\'herbe, pas sur un espace'); return true; }
  if (projet.deco.find(d => d.i === i)) { toast('Il y a déjà quelque chose ici'); return true; }
  projet.deco.push({ t: m, i }); render(); return true;
}

let TOAST_T = null;
function toast(msg) {
  let t = document.getElementById('esq-toast');
  if (!t) { t = document.createElement('div'); t.id = 'esq-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(TOAST_T); TOAST_T = setTimeout(() => t.classList.remove('show'), 2000);
}

function render() { renderPlateau(); }   // alias : rerendre toute la fenêtre d'esquisse

function plateauZoom(d) {
  const v = projet.vue;
  v.zoom = Math.round(Math.max(.6, Math.min(1.4, v.zoom + d * .15)) * 100) / 100;
  const gr = document.querySelector('.ter-grid.live'); if (gr) gr.style.setProperty('--zoom', v.zoom);
}

/* ── Peinture des blocs + orbite + zoom ── */
let TER_PAINTING = false, TER_DIRTY = false, ORB = null, TER_GLOBAL = false;
function terrainPaint(i) {
  if (i < 0 || i >= TER_CELLS) return;
  const p = projet.paint, g = terrainGrid();
  if (p.sel == null && p.mode !== 'erase') return;
  const v = p.sel != null ? p.sel : -1;
  if (v === -1) { const di = projet.deco.findIndex(d => d.i === i); if (di >= 0) { projet.deco.splice(di, 1); TER_DIRTY = true; } }
  if (g[i] === v) return;
  g[i] = v; TER_DIRTY = true;
  const cell = document.querySelector(`.ter-grid.live .ter-cell[data-i="${i}"]`);
  if (cell) {
    const sp = v >= 0 ? projet.spaces[v] : null;
    cell.classList.toggle('fill', !!sp);
    cell.classList.toggle('flat', !!(sp && sp.type === 'jardin'));
    if (sp) { cell.style.setProperty('--c', platColor(v)); cell.style.setProperty('--cd', platColor(v, 58)); cell.style.setProperty('--cd2', platColor(v, 48)); }
    else { cell.style.removeProperty('--c'); cell.style.removeProperty('--cd'); cell.style.removeProperty('--cd2'); }
    cell.textContent = '';
  }
}
function terrainStrokeEnd() {
  if (!TER_DIRTY) return;
  TER_DIRTY = false;
  render();
  devaPeutReagir();
}
function bindPlateau(grid) {
  if (!grid) return;
  const wrap = grid.closest('.ter-wrap');
  if (!TER_GLOBAL) {
    TER_GLOBAL = true;
    const end = () => { if (TER_PAINTING) { TER_PAINTING = false; terrainStrokeEnd(); } ORB = null; };
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
    const move = x => {
      if (ORB == null) return;
      projet.vue.rot = Math.round(Math.max(0, Math.min(48, ORB.base + (x - ORB.x) * 0.22)) * 10) / 10;
      const gr = document.querySelector('.ter-grid.live'); if (gr) gr.style.setProperty('--rot', projet.vue.rot + 'deg');
    };
    window.addEventListener('mousemove', e => { if (ORB != null && (e.buttons & 1)) move(e.clientX); });
    window.addEventListener('touchmove', e => { if (ORB != null && e.touches[0]) move(e.touches[0].clientX); }, { passive: true });
  }
  if (wrap) {
    const start = (t, x) => { if (t.closest('.ter-cell') || t.closest('.ter-zoom')) return false; ORB = { x, base: projet.vue.rot }; return true; };
    wrap.addEventListener('mousedown', e => { if (e.button === 0 && start(e.target, e.clientX)) e.preventDefault(); });
    wrap.addEventListener('touchstart', e => { const t = e.touches[0]; if (t) start(e.target, t.clientX); }, { passive: true });
    wrap.addEventListener('dblclick', e => { if (e.target.closest('.ter-cell')) return; projet.vue.rot = 24; projet.vue.zoom = 1; grid.style.setProperty('--rot', '24deg'); grid.style.setProperty('--zoom', '1'); });
  }
  const cellAt = t => { const c = (t && t.closest) ? t.closest('.ter-cell') : null; return c ? +c.dataset.i : -1; };
  grid.addEventListener('mousedown', e => { if (e.button !== 0) return; const i = cellAt(e.target); if (i < 0) return; e.preventDefault(); if (terrainDecoClick(i)) return; TER_PAINTING = true; terrainPaint(i); });
  grid.addEventListener('mousemove', e => { if (!TER_PAINTING || !(e.buttons & 1)) return; const i = cellAt(e.target); if (i >= 0) terrainPaint(i); });
  grid.addEventListener('touchstart', e => { const i = cellAt(e.target); if (i < 0) return; e.preventDefault(); if (terrainDecoClick(i)) return; TER_PAINTING = true; terrainPaint(i); }, { passive: false });
  grid.addEventListener('touchmove', e => { if (!TER_PAINTING) return; const t = e.touches[0]; if (!t) return; e.preventDefault(); const i = cellAt(document.elementFromPoint(t.clientX, t.clientY)); if (i >= 0) terrainPaint(i); }, { passive: false });
}

/* ── Go ─────────────────────────────────────────────────────── */
stepWelcome();
