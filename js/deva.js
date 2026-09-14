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
    // La bascule (Deva se décale à gauche, le plateau s'ouvre) arrive à l'étape 2.
    await devaSequence([
      ['Parfait. On va esquisser ton lieu ensemble.', 700],
      'La suite (le plateau s\'ouvre à droite pendant que je me décale) arrive à la prochaine étape.'
    ]);
  } else {
    await devaSay('Cette porte viendra plus tard. Pour cette démonstration, prenons plutôt <strong>Créer un projet</strong>.', 750);
    stepIntention();
  }
}

/* ── Go ─────────────────────────────────────────────────────── */
stepWelcome();
