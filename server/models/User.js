// Modèle User (pour l'instant en mémoire, facilement migrable vers MongoDB/PostgreSQL)
export class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.avatar = data.avatar || null; // URL de l'avatar
    this.bio = data.bio || '';
    this.gear = data.gear || ''; // Clavier/équipement utilisé (optionnel, affiché dans les rankings)
    this.socialMedia = data.socialMedia || {
      twitter: '',
      github: '',
      discord: '',
      website: ''
    };
    this.friends = data.friends || []; // Array of user IDs
    this.friendRequests = data.friendRequests || {
      sent: [], // Array of user IDs to whom requests were sent
      received: [] // Array of user IDs from whom requests were received
    };
    this.createdAt = data.createdAt || new Date();
    this.mmr = data.mmr || {}; // { en: 1000, fr: 1000, es: 1000, ... } - ELO par langue, démarre à 1000
    this.stats = data.stats || {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      totalWPM: 0,
      bestWPM: 0,
      averageAccuracy: 0
    };
    this.preferences = data.preferences || {
      defaultMode: 'solo' // 'solo' ou 'sandbox'
    };
  }

  getMMR(language = 'en') {
    return this.mmr[language] || 1000; // ELO de départ : 1000
  }

  updateMMR(language, newMMR) {
    this.mmr[language] = newMMR;
  }

  updateStats(matchResult) {
    // Mettre à jour bestWPM même pour les matchs solo
    if (matchResult.wpm > this.stats.bestWPM) {
      this.stats.bestWPM = matchResult.wpm;
    }
    
    // Pour les matchs multijoueurs uniquement, mettre à jour wins/losses/totalMatches
    if (matchResult.type !== 'solo') {
      this.stats.totalMatches++;
      if (matchResult.won) this.stats.wins++;
      else this.stats.losses++;
      
      // Mise à jour moyenne accuracy et WPM pour les matchs multijoueurs
      const totalAccuracy = this.stats.averageAccuracy * (this.stats.totalMatches - 1) + matchResult.accuracy;
      this.stats.averageAccuracy = totalAccuracy / this.stats.totalMatches;
      
      const totalWPM = this.stats.totalWPM + matchResult.wpm;
      this.stats.totalWPM = totalWPM;
    }
  }
}

