/* ═══════════════════════════════════════════════════════════════
   EVAD · Onboarding Deva (MVP)
   Parcours : accueil → prénom → présentation EVAD (option / vidéo Vision)
              → « Qu'est-ce que tu veux faire ? » (4 portes)
              → pipeline Solutions → Modélisation → Gestion → Vérification
   Vanilla JS, sans build. Un seul choix à la fois, pensé pour un
   public peu à l'aise avec le numérique.
   ═══════════════════════════════════════════════════════════════ */

const AVATAR = 'img/deva.png';

// À remplacer par l'URL réelle de la vidéo "Vision" quand elle existera.
const VISION_VIDEO_URL = '';

const state = { prenom: '' };

const chat    = document.getElementById('chat');
const actions = document.getElementById('actions');
const foot    = document.getElementById('footnote');

/* ── Helpers d'affichage ────────────────────────────────────── */

function scrollDown() {
  requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
}

// Ajoute une bulle (who = 'deva' | 'me'). html = contenu.
function bubble(who, html) {
  const row = document.createElement('div');
  row.className = 'row ' + who;
  if (who === 'deva') {
    const av = document.createElement('img');
    av.className = 'avatar'; av.src = AVATAR; av.alt = 'Deva';
    row.appendChild(av);
  }
  const b = document.createElement('div');
  b.className = 'bubble';
  b.innerHTML = html;
  row.appendChild(b);
  chat.appendChild(row);
  scrollDown();
  return row;
}

// Deva "réfléchit" puis parle. Renvoie une promesse.
function devaSay(html, delay = 750) {
  clearActions();
  const row = document.createElement('div');
  row.className = 'row deva';
  row.innerHTML = `<img class="avatar" src="${AVATAR}" alt="Deva">
    <div class="bubble"><span class="typing"><span></span><span></span><span></span></span></div>`;
  chat.appendChild(row);
  scrollDown();
  return new Promise(resolve => {
    setTimeout(() => {
      row.querySelector('.bubble').innerHTML = html;
      scrollDown();
      resolve(row);
    }, delay);
  });
}

// Enchaîne plusieurs répliques de Deva.
async function devaSequence(lines) {
  for (const line of lines) {
    const [html, delay] = Array.isArray(line) ? line : [line, 750];
    await devaSay(html, delay);
  }
}

function clearActions() { actions.innerHTML = ''; actions.classList.add('hidden'); }

function showActions(build) {
  actions.innerHTML = '';
  build(actions);
  actions.classList.remove('hidden');
  scrollDown();
}

function makeButton(cls, ico, label, sub, onClick) {
  const btn = document.createElement('button');
  btn.className = 'btn ' + cls;
  btn.innerHTML = `<span class="ico">${ico}</span><span>${label}${sub ? `<span class="sub">${sub}</span>` : ''}</span>`;
  btn.addEventListener('click', onClick);
  return btn;
}

/* ── Étape 1 : accueil ──────────────────────────────────────── */

async function stepWelcome() {
  await devaSequence([
    ['Bonjour 🌿', 600],
    ['Je suis <strong>Deva</strong>, l\'esprit régénératif d\'EVAD. Je vais t\'accompagner pas à pas, tranquillement.', 900],
    'Pour commencer, comment tu t\'appelles ?'
  ]);
  stepAskName();
}

/* ── Étape 2 : prénom ───────────────────────────────────────── */

function stepAskName() {
  showActions(box => {
    const field = document.createElement('form');
    field.className = 'field';
    field.innerHTML = `
      <input type="text" id="prenom-input" placeholder="Ton prénom" autocomplete="given-name" aria-label="Ton prénom">
      <button class="send" type="submit" aria-label="Valider">→</button>`;
    field.addEventListener('submit', e => {
      e.preventDefault();
      const val = field.querySelector('input').value.trim();
      if (!val) return;
      state.prenom = val.charAt(0).toUpperCase() + val.slice(1);
      bubble('me', state.prenom);
      clearActions();
      stepPresentation();
    });
    box.appendChild(field);
    setTimeout(() => field.querySelector('input').focus(), 100);
  });
}

/* ── Étape 3 : présentation EVAD ? (option) ─────────────────── */

async function stepPresentation() {
  await devaSequence([
    [`Enchantée, <strong>${state.prenom}</strong> ! 🙌`, 700],
    'Avant d\'aller plus loin, tu veux une petite présentation d\'EVAD en vidéo ?'
  ]);
  showActions(box => {
    box.appendChild(makeButton('btn-gold', '🎬', 'Oui, montre-moi', 'La vidéo « Vision »', () => {
      bubble('me', 'Oui, montre-moi');
      stepVision();
    }));
    box.appendChild(makeButton('btn-ghost', '⏭', 'Non, plus tard', 'Aller directement au choix', () => {
      bubble('me', 'Non, plus tard');
      stepChoose();
    }));
  });
}

/* ── Étape 3b : vidéo Vision ────────────────────────────────── */

async function stepVision() {
  clearActions();
  const row = document.createElement('div');
  row.className = 'row deva';
  row.style.maxWidth = '100%';
  row.innerHTML = `<img class="avatar" src="${AVATAR}" alt="Deva">`;
  const card = document.createElement('div');
  card.className = 'video-card';
  card.style.flex = '1';
  if (VISION_VIDEO_URL) {
    card.innerHTML = `<div class="video-frame" style="padding:0">
        <iframe src="${VISION_VIDEO_URL}" style="width:100%;height:100%;border:0" allow="autoplay; fullscreen" allowfullscreen></iframe>
      </div>`;
  } else {
    card.innerHTML = `
      <div class="video-frame">
        <div class="play">▶</div>
        <strong>La Vision d'EVAD</strong>
        <small>Emplacement vidéo — l'URL sera ajoutée ici</small>
      </div>
      <div class="cap">🌍 EVAD relie les lieux, les gens et leurs projets pour régénérer les territoires.</div>`;
  }
  row.appendChild(card);
  chat.appendChild(row);
  scrollDown();

  await devaSay('Voilà l\'esprit 🌱 On y va ?', 1400);
  showActions(box => {
    box.appendChild(makeButton('btn-primary', '👉', 'C\'est parti', '', () => {
      bubble('me', 'C\'est parti');
      stepChoose();
    }));
  });
}

/* ── Étape 4 : Qu'est-ce que tu veux faire ? ────────────────── */

async function stepChoose() {
  await devaSay(`Alors <strong>${state.prenom}</strong>, qu'est-ce que tu veux faire ?`, 800);
  showActions(box => {
    box.appendChild(makeButton('btn-primary', '🌱', 'Créer un projet ou un lieu', 'On part d\'une esquisse', () => choose('creer')));
    box.appendChild(makeButton('btn-primary', '💡', 'Découvrir des solutions', 'Le Commun', () => choose('decouvrir')));
    box.appendChild(makeButton('btn-primary', '🗺', 'Visiter le monde', 'Modélisation (Luanti)', () => choose('visiter')));
    box.appendChild(makeButton('btn-primary', '🤝', 'Rejoindre un projet', 'La carte des projets', () => choose('rejoindre')));
  });
}

function choose(key) {
  const labels = {
    creer: 'Créer un projet ou un lieu',
    decouvrir: 'Découvrir des solutions',
    visiter: 'Visiter le monde',
    rejoindre: 'Rejoindre un projet'
  };
  bubble('me', labels[key]);
  stepDestination(key);
}

/* ── Étape 5 : destination (stub, à développer) ─────────────── */

// Le pipeline commun : Solutions → Modélisation → Gestion → Vérification
const PIPELINE = ['Solutions', 'Modélisation', 'Gestion', 'Vérification'];

const DESTINATIONS = {
  creer: {
    intro: 'Génial ! On va commencer par une <strong>esquisse</strong> de ton projet, puis chercher des solutions dans le Commun.',
    active: 'Solutions',
    title: '🌱 Créer un projet ou un lieu',
    body: 'Tu esquisses ton idée, Deva t\'aide à la préciser, puis on pioche dans les solutions partagées.'
  },
  decouvrir: {
    intro: 'Parfait, explorons ensemble le <strong>Commun</strong> : la bibliothèque des solutions partagées.',
    active: 'Solutions',
    title: '💡 Découvrir des solutions',
    body: 'Parcours les solutions déjà éprouvées par d\'autres lieux, et récupère celles qui t\'inspirent.'
  },
  visiter: {
    intro: 'Super ! On passe dans la <strong>Modélisation</strong> pour visiter le monde EVAD.',
    active: 'Modélisation',
    title: '🗺 Visiter le monde',
    body: 'Explore les lieux modélisés (Luanti) : du virtuel au réel, tu vois les projets prendre forme.'
  },
  rejoindre: {
    intro: 'Avec plaisir ! Je t\'emmène sur la <strong>carte des projets</strong> pour en rejoindre un.',
    active: 'Modélisation',
    title: '🤝 Rejoindre un projet',
    body: 'Trouve un lieu près de chez toi sur la carte, découvre ses besoins et rejoins l\'aventure.'
  }
};

async function stepDestination(key) {
  const d = DESTINATIONS[key];
  await devaSay(d.intro, 800);

  clearActions();
  const dest = document.createElement('div');
  dest.className = 'dest';
  const steps = PIPELINE.map(s => {
    const on = s === d.active;
    const proof = s === 'Vérification';
    return `<span class="step${on ? ' on' : ''}${proof ? ' proof' : ''}">${s}</span>`;
  }).join('');
  dest.innerHTML = `
    <h2>${d.title}</h2>
    <p>${d.body}</p>
    <div class="pipeline">${steps}</div>
    <button class="btn btn-ghost" id="restart">↩ Recommencer le parcours</button>`;
  chat.appendChild(dest);
  scrollDown();
  dest.querySelector('#restart').addEventListener('click', restart);

  foot.textContent = 'MVP — étape « ' + d.active + ' » du pipeline (Solutions → Modélisation → Gestion → Vérification).';
}

/* ── Redémarrage ────────────────────────────────────────────── */

function restart() {
  chat.innerHTML = '';
  clearActions();
  foot.textContent = '';
  state.prenom = '';
  stepWelcome();
}

/* ── Go ─────────────────────────────────────────────────────── */
stepWelcome();
