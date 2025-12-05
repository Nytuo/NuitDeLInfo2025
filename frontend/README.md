# NuitDeLInfo2025 - TempleOS2
   ███╗   ██╗██╗   ██╗██╗████████╗    ██████╗ ███████╗    ██╗     ██╗███╗   ██╗███████╗ ██████╗  
   ████╗  ██║██║   ██║██║╚══██╔══╝    ██╔══██╗██╔════╝    ██║     ██║████╗  ██║██╔════╝██╔═══██╗ 
   ██╔██╗ ██║██║   ██║██║   ██║       ██║  ██║█████╗      ██║     ██║██╔██╗ ██║█████╗  ██║   ██║ 
   ██║╚██╗██║██║   ██║██║   ██║       ██║  ██║██╔══╝      ██║     ██║██║╚██╗██║██╔══╝  ██║   ██║ 
   ██║ ╚████║╚██████╔╝██║   ██║       ██████╔╝███████╗    ███████╗██║██║ ╚████║██║     ╚██████╔╝ 
   ╚═╝  ╚═══╝ ╚═════╝ ╚═╝   ╚═╝       ╚═════╝ ╚══════╝    ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝  
> Un système d'exploitation rétro-futuriste dans le navigateur pour la Nuit de l'Info 2025

## Informations de Contact

**URL du site:** https://nytuo.github.io/NuitDeLInfo2025/

### Comment activer le Snake Game

Pour débloquer le jeu Snake caché, utilisez le **code Konami** :

```
↑ ↑ ↓ ↓ ← → ← → B A
```

Utilisez les touches fléchées de votre clavier, puis appuyez sur les touches `B` et `A`. Le terminal s'ouvrira automatiquement suivi du jeu Snake "TACTICAL_ESPIONAGE.exe" !

---

## Description du Projet

TempleOS2 est une interface de bureau rétro inspirée des années 90, recréant l'expérience d'un ancien système d'exploitation dans le navigateur. Le projet combine nostalgie et fonctionnalités modernes pour sensibiliser aux vulnérabilités des GAFAM et promouvoir un web libre.

### Features Réalisées

#### Interface Desktop
- **Système de fenêtres multiples** avec drag & drop
- **Redimensionnement dynamique** des fenêtres (8 directions)
- **Gestion du focus** et z-index automatique
- **Taskbar fonctionnelle** affichant toutes les applications
- **Effet scanlines CRT** pour un look authentique rétro
- **Icônes desktop** cliquables pour lancer les applications

### Applications Intégrées

1. **OpenWeb Navigator** 
   - Navigateur web intégré avec iframe
   - Barre d'URL fonctionnelle
   - Navigation vers des sites externes
   - Par défaut : https://nird.forge.apps.education.fr/

2. **GAFAM Vulnerability DB**  (CVE Explorer)
   - Base de données de vulnérabilités CVE
   - Recherche par ID CVE ou mots-clés
   - Autocomplétion intelligente
   - Affichage détaillé des vulnérabilités :
     - Score CVSS (Common Vulnerability Scoring System)
     - EPSS (Exploit Prediction Scoring System)
     - Statut KEV (Known Exploited Vulnerabilities)
     - CWE (Common Weakness Enumeration)
     - Produits affectés
     - Dates de publication et modification
   - Vue d'ensemble des menaces par période
   - Statistiques agrégées (moyenne CVSS, EPSS, top vulnérabilités)
   - Intégration avec l'API NIST NVD et CIRCL CVE-Search

3. **TempleOS2 Terminal** 
   - Terminal interactif avec commandes shell-like
   - Commandes disponibles :
     - `help` : Liste des commandes
     - `ls` : Liste les fichiers
     - `cat [file]` : Affiche le contenu d'un fichier
     - `clear` : Efface l'écran
     - `date` : Affiche la date
     - `echo [text]` : Affiche du texte
     - `neofetch` : Informations système stylisées
     - `snake` : Lance le jeu Snake
   - Easter egg : déblocage via code Konami

4. **TACTICAL_ESPIONAGE.exe**  (Snake Game)
   - Jeu Snake complet et jouable
   - Contrôles au clavier (flèches)
   - Score en temps réel
   - Game over et restart
   - Déblocable via code Konami ou commande terminal

5. **Audio Visualizer** 
   - Visualiseur audio 3D avec Three.js
   - Capture de l'audio système (Display Media API)
   - Analyse en temps réel :
     - Domaine temporel (waveform)
     - Domaine fréquentiel (spectrum)
     - Métriques : RMS, Bass, Mid, Treble
   - Rendu 3D réactif au son
   - Support de YouTube, Spotify Web, etc.

---

## Audio Visualizer - Instructions

### Prérequis
- Navigateur moderne (Chrome)
- Onglet jouant de l'audio (YouTube, Spotify Web, SoundCloud, etc.)

### Mode d'emploi

1. **Ouvrir l'application** : Cliquez sur l'icône "Audio Visualizer" sur le desktop

2. **Démarrer la capture** :
   - Cliquez sur le bouton "Start Capture"
   - Votre navigateur vous demandera de sélectionner un onglet, une fenêtre ou un écran
   - **Important** : Cochez la case "Partager l'audio" dans la popup
   - Sélectionnez l'onglet contenant votre musique (ex: YouTube)

3. **Profiter de la visualisation** :
   - Le visualiseur 3D réagira en temps réel à la musique

### Troubleshooting
- Si aucun son n'est détecté, vérifiez que vous avez bien coché "Partager l'audio"
- La capture d'onglet n'est pas supportée sur tous les navigateurs mobiles

---

## CVE Explorer - Documentation Technique

### Prérequis

- Navigateur moderne avec support ES6+
- Connexion internet pour accéder aux APIs de vulnérabilités
- Aucune installation supplémentaire requise

### Sources de Données / APIs

L'explorateur de CVE utilise deux sources de données principales :

1. **NIST NVD API** (National Vulnerability Database)
   - URL : `https://services.nvd.nist.gov/rest/json/cves/2.0`
   - Fournit les détails complets des CVE
   - Données incluses : CVSS, CWE, CPE, dates, descriptions
   - Limitation : Requêtes limitées par heure (rate limiting)

2. **CIRCL CVE-Search API**
   - URL : `https://cve.circl.lu/api/search/`
   - API de recherche par mots-clés
   - Permet la recherche full-text dans les descriptions
   - Plus flexible pour les recherches thématiques

#### Métriques Utilisées

**CVSS (Common Vulnerability Scoring System)**
- Score 0.0 - 10.0 indiquant la sévérité
- Composants : Exploitabilité + Impact
- Classification :
  - 0.0 : None
  - 0.1-3.9 : Low (vert)
  - 4.0-6.9 : Medium (jaune)
  - 7.0-8.9 : High (orange)
  - 9.0-10.0 : Critical (rouge)

**EPSS (Exploit Prediction Scoring System)**
- Probabilité (0-100%) qu'un exploit soit utilisé
- Basé sur machine learning et threat intelligence
- Aide à prioriser les patches

**KEV (Known Exploited Vulnerabilities)**
- Liste CISA des CVE activement exploitées
- Indicateur booléen (exploited: true/false)

**CWE (Common Weakness Enumeration)**
- Classification du type de faiblesse
- Ex: CWE-79 (XSS), CWE-89 (SQL Injection)

### Architecture de l'Application

#### Stack Technique

- **Framework** : Vue.js 3 (Composition API)
- **Langage** : TypeScript
- **Build Tool** : Vite (avec Rolldown)
- **Styling** : CSS vanilla avec classes utilitaires
- **3D Engine** : Three.js (pour le visualiseur audio)
- **Router** : Vue Router 4

### 🎮 Easter Eggs

- **Code Konami** : ↑↑↓↓←→←→BA → Débloque Terminal + Snake
- **Commande snake** dans le terminal
- **Effet scanlines CRT** sur toute l'interface

---

## Installation et Lancement

### Prérequis

- Node.js >= 16.x
- npm >= 8.x

### Installation

```bash
cd frontend
npm install
```

### Développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Build de Production

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `dist/`

### Preview du Build

```bash
npm run preview
```

---

##  Contribution

Projet réalisé pour la **Nuit de l'Info 2025**

---

**Made with ❤️ during Nuit de l'Info 2025**
