# EVAD — MVP

Version **minimale** du prototype EVAD (Écosystème Vivant d'Action et de Développement), repartie de zéro pour illustrer le cœur de la proposition sans la complexité accumulée.

Front seul, **vanilla JS sans build** : il suffit d'ouvrir `index.html` (ou de servir le dossier).

## Parcours

L'expérience démarre par le chatbot **Deva** :

1. Deva accueille et demande le **prénom**
2. **Présentation d'EVAD ?** (option) → vidéo « Vision »
3. **« Qu'est-ce que tu veux faire ? »** — 4 portes :
   - 🌱 Créer un projet ou un lieu → Esquisse
   - 💡 Découvrir des solutions → le Commun
   - 🗺 Visiter le monde → Modélisation (Luanti)
   - 🤝 Rejoindre un projet → Carte des projets
4. Pipeline commun : **Solutions → Modélisation → Gestion → Vérification**

## Structure

```
index.html               page unique
js/deva-onboarding.js     moteur du parcours Deva
img/                       avatar Deva + logo EVAD
```

## Lancer en local

```bash
python3 -m http.server 8780
```
puis http://localhost:8780
