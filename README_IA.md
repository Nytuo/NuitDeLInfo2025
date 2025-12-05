# 🤖 Documentation IA - Nexus

## 📋 Table des matières
- [Vue d'ensemble](#vue-densemble)
- [Accès à l'application](#accès-à-lapplication)
- [Fonctionnalités IA](#fonctionnalités-ia)
- [Architecture technique](#architecture-technique)
- [Critères d'évaluation](#critères-dévaluation)
- [Démonstration des innovations](#démonstration-des-innovations)

---

## 🌐 Vue d'ensemble

Le projet **Nexus** intègre deux assistants conversationnels intelligents basés sur des algorithmes d'analyse sémantique et de détection d'intention en temps réel. Ces systèmes d'IA sont conçus pour offrir une expérience utilisateur intuitive tout en respectant les normes d'accessibilité et en intégrant le thème de l'année dans les formulaires de retour.

---

## 🔗 Accès à l'application

### URL de production
**[https://nytuo.github.io/NuitDeLInfo2025/](https://nytuo.github.io/NuitDeLInfo2025/)**

### Comment accéder aux fonctionnalités IA

1. **Assistant Nexus Clippy** (Principal)
   - Cliquez sur le chevalier animé en bas à droite de l'écran
   - Interface de terminal rétro avec analyse de sentiment en temps réel
   - Disponible sur toutes les pages du site

2. **ChatBot de Contact** (Secondaire)
   - Accessible via le bouton "Contact" sur la page d'accueil
   - Interface moderne avec suggestions intelligentes
   - Formulaires adaptatifs selon l'intention détectée

---

## 🧠 Fonctionnalités IA

### 1. Analyse de Sentiment en Temps Réel

#### Caractéristiques
- **Détection en temps réel** : Analyse à chaque saisie utilisateur
- **Feedback visuel** : Indicateur de sentiment coloré (vert/orange/rouge)
- **Adaptation contextuelle** : Les réponses du bot s'ajustent selon l'humeur détectée
- **Scoring dynamique** : Système de pondération par fréquence de mots-clés

### 2. Détection d'Intention Conversationnelle

#### Intentions supportées
- **Contact** : Envoi de message à l'équipe
- **Donation** : Soutien financier avec montants suggérés
- **Bénévolat** : Inscription comme volontaire
- **Information** : Demande de renseignements
- **Salutations** : Gestion des politesses (bonjour, merci, au revoir)

#### Fonctionnalités avancées
- **Multi-pattern matching** : Plusieurs mots-clés par intention
- **Synonymes contextuels** : "don", "donner", "soutenir" → même intention
- **Fallback intelligent** : Si intention non reconnue, propose toutes les options
- **Options dynamiques** : Boutons contextuels générés selon l'intention

### 3. Conversation Guidée Adaptative

#### Système de workflow conversationnel
- **Étapes séquentielles** : Collecte progressive des informations
- **Validation en temps réel** : Vérification des emails, détection de spam
- **Formulaires dynamiques** : Champs adaptatifs selon la mission choisie
- **Suggestions intelligentes** : Chips de réponses rapides contextuelles

#### Exemple de flux
```
Utilisateur: "Je veux aider"
    ↓
IA détecte intention: BÉNÉVOLAT
    ↓
Formulaire adaptatif: Compétences + Disponibilité
    ↓
Validation + Envoi EmailJS
    ↓
Confirmation avec référence thème 2025
```

### 4. Anti-spam et Validation Intelligente

#### Protection multicouche
- **Détection lexicale** : Liste de mots spam
- **Validation d'email** : Regex stricte
- **Vérification de complétude** : Tous les champs requis
- **Rate limiting côté client** : Prévention des soumissions multiples

### 5. Intégration EmailJS sans Backend

#### Avantages
- **Aucun backend nécessaire** : Solution serverless
- **Sécurité** : Clés API en variables d'environnement
- **Fiabilité** : Confirmation de réception
- **Traçabilité** : Logs des échanges

---

## 🏗️ Architecture technique

### Stack technologique IA
- **Framework** : Vue 3 Composition API avec TypeScript
- **Algorithmes** : NLP basique (pattern matching + scoring)
- **État réactif** : Refs et computed pour temps réel
- **Persistance** : Variables d'état locales (pas de stockage)
- **Intégration externe** : EmailJS pour envoi sans serveur

### Composants principaux

#### 1. `NexusClippy.vue` (1430 lignes)
- **Rôle** : Assistant principal inspiré de Clippy Microsoft
- **IA intégrée** :
  - Analyse de sentiment avec feedback visuel
  - Détection d'intention multi-pattern
  - Workflow conversationnel guidé
  - Validation anti-spam
- **Design** : Terminal DOS rétro avec sprite animé

#### 2. `ChatBot.vue` (966 lignes)
- **Rôle** : Chatbot de contact moderne
- **IA intégrée** :
  - Suggestions de réponses intelligentes
  - Formulaires adaptatifs par intention
  - Analyse de sentiment user
  - Système de scoring conversationnel
- **Design** : Interface chat moderne avec avatars

---

**Développé avec ❤️ pour la Nuit de l'Info 2025**
