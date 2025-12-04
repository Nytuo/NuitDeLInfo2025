import type { SentimentResult, MissionType, UserData } from '../models/FormTypes';

/**
 * Service d'Intelligence Artificielle simulé
 * En production, connecter à OpenAI/Mistral API
 */
export class AIService {
  
  // Mots-clés pour l'analyse de sentiment
  private static positiveWords = [
    'merci', 'super', 'génial', 'excellent', 'formidable', 'bravo', 'fantastique',
    'heureux', 'content', 'ravi', 'enchanté', 'parfait', 'magnifique', 'incroyable',
    'love', 'adore', 'aime', 'passion', 'enthousiaste', 'motivé', 'impatient'
  ];
  
  private static negativeWords = [
    'problème', 'erreur', 'bug', 'frustré', 'déçu', 'mécontent', 'colère',
    'horrible', 'nul', 'mauvais', 'pire', 'déteste', 'impossible', 'difficile',
    'urgent', 'plainte', 'remboursement', 'annuler'
  ];

  /**
   * Analyse le sentiment d'un texte
   */
  static analyzeSentiment(text: string): SentimentResult {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    let positiveCount = 0;
    let negativeCount = 0;
    const foundKeywords: string[] = [];
    
    words.forEach(word => {
      if (this.positiveWords.some(pw => word.indexOf(pw) !== -1)) {
        positiveCount++;
        foundKeywords.push(word);
      }
      if (this.negativeWords.some(nw => word.indexOf(nw) !== -1)) {
        negativeCount++;
        foundKeywords.push(word);
      }
    });
    
    const total = positiveCount + negativeCount;
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let confidence = 0.5;
    
    if (total > 0) {
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        confidence = positiveCount / total;
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        confidence = negativeCount / total;
      }
    }
    
    return { sentiment, confidence, keywords: foundKeywords };
  }

  /**
   * Détecte l'intention de l'utilisateur à partir de son message
   */
  static detectIntent(text: string): MissionType | null {
    const lowerText = text.toLowerCase();
    
    // Patterns pour chaque intention
    const patterns: Record<MissionType, string[]> = {
      donation: ['don', 'donner', 'contribuer', 'financer', 'soutenir financ', 'argent', 'euro', '€'],
      volunteer: ['bénévole', 'volontaire', 'aider', 'participer', 'rejoindre', 'équipe', 'temps'],
      contact: ['contacter', 'appeler', 'téléphone', 'joindre', 'parler', 'discuter'],
      information: ['information', 'savoir', 'question', 'comment', 'pourquoi', 'quoi', 'renseign']
    };
    
    const missions: MissionType[] = ['donation', 'volunteer', 'contact', 'information'];
    for (const mission of missions) {
      const keywords = patterns[mission];
      if (keywords.some(kw => lowerText.indexOf(kw) !== -1)) {
        return mission;
      }
    }
    
    return null;
  }

  /**
   * Génère un message de confirmation personnalisé
   */
  static generateConfirmationMessage(userData: UserData): string {
    const year = new Date().getFullYear();
    const name = userData.name || 'Voyageur';
    const hour = new Date().getHours();
    
    let greeting = '';
    if (hour < 12) greeting = 'Bonjour';
    else if (hour < 18) greeting = 'Bon après-midi';
    else greeting = 'Bonsoir';
    
    const templates: Record<MissionType, string[]> = {
      contact: [
        `${greeting} ${name} ! 👋 Ton message a été transmis avec succès à nos serveurs centraux. Nos Agents de Support te répondront dans les plus brefs délais.`,
        `Message reçu, ${name} ! 📡 L'équipe du Nexus a bien capté ton signal. Nous reviendrons vers toi très rapidement.`,
      ],
      donation: [
        `Un immense GG, ${name} ! 🏆 Ton Don de ${userData.donationAmount}€ est une bénédiction pour notre cause. En ${year}, chaque contribution compte pour faire avancer nos projets !`,
        `Héros du Nexus détecté ! 💎 Merci ${name} pour ta générosité. Ton soutien de ${userData.donationAmount}€ nous permet de poursuivre notre mission en ${year}.`,
      ],
      volunteer: [
        `Bienvenue dans la Guilde, ${name} ! 🛡️ Tes compétences sont précieuses pour notre communauté. En ${year}, ensemble, nous accomplirons de grandes choses !`,
        `Recrue d'élite acceptée ! ⚔️ ${name}, tu fais maintenant partie de notre équipe. Prépare-toi pour une aventure épique en ${year} !`,
      ],
      information: [
        `Requête enregistrée, ${name} ! 📚 Notre base de connaissances a bien reçu ta demande. Tu recevras une réponse détaillée très bientôt.`,
        `Curiosité validée ! 🔍 ${name}, nous aimons les esprits curieux. Notre équipe te contactera avec toutes les informations en ${year}.`,
      ],
    };
    
    const missionTemplates = templates[userData.mission || 'contact'];
    return missionTemplates[Math.floor(Math.random() * missionTemplates.length)] || '';
  }

  /**
   * Génère des suggestions de complétion
   */
  static generateSuggestions(partialText: string, _context: MissionType | null): string[] {
    if (!partialText || partialText.length < 3) return [];
    
    const suggestions: Record<string, string[]> = {
      'je voud': ['je voudrais faire un don', 'je voudrais devenir bénévole', 'je voudrais plus d\'informations'],
      'comment': ['comment puis-je aider ?', 'comment faire un don ?', 'comment rejoindre l\'équipe ?'],
      'je suis': ['je suis intéressé par le bénévolat', 'je suis disponible pour aider', 'je suis motivé pour contribuer'],
      'pouvez': ['pouvez-vous me contacter ?', 'pouvez-vous m\'envoyer plus de détails ?'],
    };
    
    const lowerText = partialText.toLowerCase();
    const keys = Object.keys(suggestions);
    for (const key of keys) {
      if (lowerText.indexOf(key) !== -1) {
        return suggestions[key] || [];
      }
    }
    
    return [];
  }

  /**
   * Vérifie si le message est du spam
   */
  static isSpam(text: string): boolean {
    const spamPatterns = [
      /http[s]?:\/\//i,
      /\b(viagra|casino|lottery|winner|click here|subscribe)\b/i,
      /(.)\1{5,}/,  // Caractères répétés
      /[A-Z]{10,}/, // Trop de majuscules
    ];
    
    return spamPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Calcule l'impact d'un don
   */
  static calculateDonationImpact(amount: number): string {
    if (amount < 10) return '☕ un café pour l\'équipe';
    if (amount < 25) return '📚 du matériel pédagogique';
    if (amount < 50) return '🍽️ 5 repas solidaires';
    if (amount < 100) return '💻 une heure de formation';
    if (amount < 250) return '🎓 une bourse d\'études partielle';
    return '🚀 un projet communautaire complet';
  }
}
