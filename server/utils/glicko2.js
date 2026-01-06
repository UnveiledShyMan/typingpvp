/**
 * Système de Rating Glicko-2
 * 
 * Amélioration du système ELO standard qui tient compte de :
 * - Rating Deviation (RD) : Incertitude du rating
 * - Volatilité : Consistance des performances du joueur
 * 
 * Avantages par rapport à ELO :
 * - Plus précis pour les nouveaux joueurs
 * - Tient compte de la fréquence des matchs
 * - Meilleure prédiction des résultats
 * - K-factor adaptatif
 * 
 * Référence : http://www.glicko.net/glicko/glicko2.pdf
 */

const TAU = 0.0833; // Constante de volatilité (tau) - peut être ajustée
const EPSILON = 0.000001; // Précision pour la convergence

/**
 * Classe Glicko-2 pour gérer les ratings d'un joueur
 */
export class Glicko2Rating {
  constructor(rating = 1500, ratingDeviation = 350, volatility = 0.06) {
    // Rating initial (1500 = équivalent ELO moyen)
    this.rating = rating;
    
    // Rating Deviation (RD) - incertitude du rating
    // 350 = nouveau joueur, diminue avec le temps
    this.ratingDeviation = Math.min(ratingDeviation, 350);
    
    // Volatilité - mesure de la consistance
    // Plus élevé = performances variables
    this.volatility = volatility;
  }

  /**
   * Convertit le rating Glicko-2 en valeur utilisable (équivalent ELO)
   */
  getDisplayRating() {
    return Math.round(this.rating);
  }

  /**
   * Retourne le rating avec son intervalle de confiance
   */
  getConfidenceInterval() {
    const lower = this.rating - 2 * this.ratingDeviation;
    const upper = this.rating + 2 * this.ratingDeviation;
    return {
      lower: Math.round(lower),
      upper: Math.round(upper),
      rating: Math.round(this.rating)
    };
  }
}

/**
 * Système Glicko-2 pour calculer les nouveaux ratings
 */
export class Glicko2System {
  /**
   * Calcule le nouveau rating après une série de matchs
   * @param {Glicko2Rating} playerRating - Rating actuel du joueur
   * @param {Array<{rating: Glicko2Rating, score: number}>} opponents - Liste des adversaires avec leur score (1=win, 0=loss, 0.5=draw)
   * @param {number} timeSinceLastMatch - Temps écoulé depuis le dernier match (en jours)
   * @returns {Glicko2Rating} Nouveau rating
   */
  static updateRating(playerRating, opponents, timeSinceLastMatch = 0) {
    if (opponents.length === 0) {
      // Si pas de matchs, seulement mettre à jour le RD selon le temps écoulé
      const newRD = Math.min(
        Math.sqrt(
          Math.pow(playerRating.ratingDeviation, 2) + 
          Math.pow(playerRating.volatility, 2) * timeSinceLastMatch
        ),
        350
      );
      return new Glicko2Rating(
        playerRating.rating,
        newRD,
        playerRating.volatility
      );
    }

    // Étape 1 : Convertir le rating et RD en échelle Glicko-2
    const mu = (playerRating.rating - 1500) / 173.7178;
    let phi = playerRating.ratingDeviation / 173.7178;
    let sigma = playerRating.volatility;

    // Étape 2 : Augmenter le RD selon le temps écoulé
    phi = Math.min(Math.sqrt(Math.pow(phi, 2) + Math.pow(sigma, 2) * timeSinceLastMatch), 350 / 173.7178);

    // Étape 3 : Calculer v (variance)
    let v = 0;
    for (const opponent of opponents) {
      const oppMu = (opponent.rating.rating - 1500) / 173.7178;
      const oppPhi = opponent.rating.ratingDeviation / 173.7178;
      const g = 1 / Math.sqrt(1 + 3 * Math.pow(oppPhi, 2) / Math.pow(Math.PI, 2));
      const E = 1 / (1 + Math.exp(-g * (mu - oppMu)));
      v += Math.pow(g, 2) * E * (1 - E);
    }
    v = 1 / v;

    // Étape 4 : Calculer Delta
    let delta = 0;
    for (const opponent of opponents) {
      const oppMu = (opponent.rating.rating - 1500) / 173.7178;
      const oppPhi = opponent.rating.ratingDeviation / 173.7178;
      const g = 1 / Math.sqrt(1 + 3 * Math.pow(oppPhi, 2) / Math.pow(Math.PI, 2));
      const E = 1 / (1 + Math.exp(-g * (mu - oppMu)));
      delta += g * (opponent.score - E);
    }
    delta *= v;

    // Étape 5 : Déterminer la nouvelle volatilité (algorithme de convergence)
    const a = Math.log(Math.pow(sigma, 2));
    let A = a;
    let B;
    if (Math.pow(delta, 2) > Math.pow(phi, 2) + v) {
      B = Math.log(Math.pow(delta, 2) - Math.pow(phi, 2) - v);
    } else {
      let k = 1;
      while (this.f(a - k * TAU, delta, phi, v, a) < 0) {
        k++;
      }
      B = a - k * TAU;
    }

    // Algorithme de convergence
    let fA = this.f(A, delta, phi, v, a);
    let fB = this.f(B, delta, phi, v, a);

    while (Math.abs(B - A) > EPSILON) {
      const C = A + (A - B) * fA / (fB - fA);
      const fC = this.f(C, delta, phi, v, a);
      
      if (fC * fB < 0) {
        A = B;
        fA = fB;
      } else {
        fA = fA / 2;
      }
      B = C;
      fB = fC;
    }

    const newSigma = Math.exp(A / 2);

    // Étape 6 : Mettre à jour le RD
    const phiStar = Math.sqrt(Math.pow(phi, 2) + Math.pow(newSigma, 2));

    // Étape 7 : Mettre à jour le rating et le RD
    const newPhi = 1 / Math.sqrt(1 / Math.pow(phiStar, 2) + 1 / v);
    const newMu = mu + Math.pow(newPhi, 2) * delta;

    // Convertir de l'échelle Glicko-2 à l'échelle de rating
    const newRating = 173.7178 * newMu + 1500;
    const newRD = 173.7178 * newPhi;

    return new Glicko2Rating(newRating, newRD, newSigma);
  }

  /**
   * Fonction auxiliaire pour le calcul de volatilité
   */
  static f(x, delta, phi, v, a) {
    const ex = Math.exp(x);
    const num = ex * (Math.pow(delta, 2) - Math.pow(phi, 2) - v - ex);
    const den = 2 * Math.pow(Math.pow(phi, 2) + v + ex, 2);
    return (num / den) - ((x - a) / Math.pow(TAU, 2));
  }

  /**
   * Version simplifiée pour un match 1v1 (plus rapide que la version complète)
   * @param {Glicko2Rating} playerRating - Rating du joueur
   * @param {Glicko2Rating} opponentRating - Rating de l'adversaire
   * @param {number} score - Score du joueur (1 = win, 0 = loss, 0.5 = draw)
   * @param {number} timeSinceLastMatch - Temps écoulé depuis le dernier match (en jours)
   * @returns {Glicko2Rating} Nouveau rating
   */
  static updateRating1v1(playerRating, opponentRating, score, timeSinceLastMatch = 0) {
    return this.updateRating(
      playerRating,
      [{ rating: opponentRating, score }],
      timeSinceLastMatch
    );
  }

  /**
   * Calcule la probabilité de victoire d'un joueur contre un adversaire
   * @param {Glicko2Rating} playerRating - Rating du joueur
   * @param {Glicko2Rating} opponentRating - Rating de l'adversaire
   * @returns {number} Probabilité entre 0 et 1
   */
  static expectedScore(playerRating, opponentRating) {
    const mu1 = (playerRating.rating - 1500) / 173.7178;
    const mu2 = (opponentRating.rating - 1500) / 173.7178;
    const phi2 = opponentRating.ratingDeviation / 173.7178;
    
    const g = 1 / Math.sqrt(1 + 3 * Math.pow(phi2, 2) / Math.pow(Math.PI, 2));
    return 1 / (1 + Math.exp(-g * (mu1 - mu2)));
  }
}

/**
 * Fonction helper pour convertir un MMR ELO en Glicko2Rating
 * @param {number} mmr - MMR ELO actuel
 * @returns {Glicko2Rating}
 */
export function eloToGlicko2(mmr) {
  // Conversion approximative
  // ELO standard → Glicko-2 avec RD initial basé sur le nombre de matchs supposé
  return new Glicko2Rating(mmr, 350, 0.06); // RD élevé = nouveau joueur
}

/**
 * Fonction helper pour les joueurs avec historique (RD plus bas)
 * @param {number} mmr - MMR actuel
 * @param {number} matchCount - Nombre de matchs joués
 * @returns {Glicko2Rating}
 */
export function eloToGlicko2WithHistory(mmr, matchCount = 0) {
  // RD diminue avec le nombre de matchs
  // Formule : RD initial = 350, après ~30 matchs = ~50
  const rd = Math.max(50, 350 - (matchCount * 10));
  const volatility = matchCount < 10 ? 0.06 : 0.03; // Plus stable avec l'expérience
  
  return new Glicko2Rating(mmr, rd, volatility);
}

