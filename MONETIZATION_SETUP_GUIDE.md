# 💰 Guide de Configuration de la Monétisation - TypingPVP

## 📋 Vue d'ensemble

Ce guide vous accompagne étape par étape pour configurer la monétisation de TypingPVP avec Google AdSense et Google Analytics, en respectant le RGPD.

## 🎯 Étape 1 : Configuration Google Analytics 4

### 1.1 Créer une propriété GA4

1. Aller sur [Google Analytics](https://analytics.google.com)
2. Créer un compte (si pas déjà fait)
3. Créer une propriété GA4 pour `typingpvp.com`
4. Récupérer le **Measurement ID** (format: `G-XXXXXXXXXX`)

### 1.2 Configurer les variables d'environnement

Créer/modifier le fichier `.env` dans le dossier `client/` :

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 1.3 Configurer les événements importants

Dans GA4, créer des événements personnalisés pour :
- `battle_started` - Quand un utilisateur commence une battle
- `battle_completed` - Quand un utilisateur termine une battle
- `user_registered` - Nouvelle inscription
- `ranking_viewed` - Consultation des rankings
- `profile_viewed` - Consultation d'un profil

**Exemple d'utilisation dans le code** :

```javascript
import { trackEvent } from '../utils/analytics';

// Dans un composant
trackEvent('Battle', 'started', '1v1', null);
```

### 1.4 Vérifier l'installation

1. Ouvrir le site
2. Accepter les cookies analytiques
3. Aller dans GA4 → Realtime
4. Vérifier que les visites apparaissent

## 🎯 Étape 2 : Configuration Google AdSense

### 2.1 Créer un compte AdSense

1. Aller sur [Google AdSense](https://www.google.com/adsense)
2. S'inscrire avec votre compte Google
3. Ajouter le site `typingpvp.com`
4. Remplir les informations requises
5. **Important** : Attendre l'approbation (peut prendre plusieurs jours)

### 2.2 Créer des Ad Units

Une fois approuvé :

1. Aller dans **Ads** → **By ad unit**
2. Créer des ad units pour chaque emplacement :
   - **Banner Header** : Format horizontal
   - **Sidebar** : Format vertical
   - **In-Article** : Format fluid
   - **Footer** : Format horizontal

3. Pour chaque ad unit, récupérer :
   - **Ad unit ID** (format: `1234567890`)
   - **Client ID** (format: `ca-pub-XXXXXXXXXX`)

### 2.3 Configurer les variables d'environnement

Ajouter dans `.env` :

```env
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
```

### 2.4 Intégrer les publicités dans les pages

**Exemple dans MainPage.jsx** :

```jsx
import { BannerAd, SidebarAd } from '../components/AdContainer';

function MainPage() {
  return (
    <div>
      {/* Bannière en haut */}
      <BannerAd slot="1234567890" className="mb-4" />
      
      {/* Sidebar */}
      <SidebarAd slot="9876543210" />
    </div>
  );
}
```

### 2.5 Emplacements recommandés

1. **Page d'accueil** :
   - Bannière en haut (optionnel, peut nuire UX)
   - Sidebar si layout adapté
   - Entre sections de contenu

2. **Page Rankings** :
   - Header
   - Sidebar

3. **Page Profil** :
   - Sidebar
   - Après les statistiques

4. **Page Battle** :
   - ❌ **NE PAS** afficher pendant le jeu (UX critique)
   - ✅ Afficher sur la page de résultats

## 🎯 Étape 3 : Configuration Google Search Console

### 3.1 Ajouter une propriété

1. Aller sur [Google Search Console](https://search.google.com/search-console)
2. Ajouter une propriété : `typingpvp.com`
3. Vérifier la propriété (méthode recommandée : fichier HTML ou DNS)

### 3.2 Soumettre le sitemap

1. Une fois vérifié, aller dans **Sitemaps**
2. Ajouter : `https://typingpvp.com/sitemap.xml`
3. Soumettre et attendre l'indexation

### 3.3 Demander l'indexation des pages importantes

1. Aller dans **URL Inspection**
2. Tester les URLs importantes :
   - Page d'accueil
   - Page Rankings
   - Quelques profils populaires
3. Demander l'indexation pour chaque URL testée

## 🎯 Étape 4 : Optimisation des Revenus

### 4.1 Stratégie d'affichage

- **Balance UX/Revenus** :
  - Maximum 2-3 publicités par page
  - Éviter pendant le gameplay actif
  - Prioriser les espaces non-intrusifs

- **Format recommandé** :
  - Responsive ads (adaptation automatique)
  - Native ads (style intégré)

### 4.2 A/B Testing

Tester différents placements :
- Header vs Sidebar
- Avant vs Après contenu
- Modal après X actions vs Bannière fixe

### 4.3 Optimisation du consentement

- Expliquer clairement les bénéfices des cookies marketing
- Design attractif du banner de consentement
- Faciliter l'acceptation (1 clic)

## 📊 Monitoring et Analytics

### Métriques à suivre

1. **AdSense** :
   - RPM (Revenue per 1000 impressions)
   - CTR (Click-Through Rate)
   - Revenus journaliers/mensuels
   - Top pages par revenus

2. **Analytics** :
   - Taux de consentement cookies
   - Pages les plus visitées
   - Taux de rebond
   - Temps moyen sur site

3. **SEO** :
   - Position dans Google
   - Impressions et clics (Search Console)
   - Pages indexées

### Outils recommandés

- **Google AdSense Dashboard** : Revenus en temps réel
- **Google Analytics** : Comportement utilisateurs
- **Google Search Console** : Performance SEO
- **Google Tag Assistant** : Vérifier les tags

## ⚠️ Conformité RGPD

### Checklist

- [x] Bannière de consentement implémentée
- [x] Catégories de cookies expliquées
- [x] Possibilité de refuser les cookies non-essentiels
- [ ] Politique de cookies mise à jour
- [ ] Politique de confidentialité complète
- [ ] Mentions légales à jour

### Points importants

1. **Consentement explicite requis** pour :
   - Cookies marketing/publicitaires
   - Cookies analytiques (selon juridiction)

2. **Doit être** :
   - Facilement accessible
   - Modifiable à tout moment
   - Documenté dans politique de cookies

3. **Ne pas tracker** avant consentement :
   - ✅ Implémenté dans le code
   - Analytics ne charge que si consentement donné

## 🚀 Timeline Recommandée

### Semaine 1 : Setup initial
- Créer comptes Google (Analytics, AdSense, Search Console)
- Configurer les variables d'environnement
- Tester Analytics avec consentement

### Semaine 2 : AdSense
- Attendre approbation AdSense
- Créer ad units
- Intégrer dans les pages principales

### Semaine 3 : Optimisation
- Tester différents placements
- Monitorer les métriques
- Ajuster selon performance

### Semaine 4+ : Amélioration continue
- A/B testing placements
- Optimisation UX/Revenus
- Scaling avec plus de trafic

## 📝 Notes Importantes

1. **AdSense Approval** : Peut prendre 1-2 semaines, avoir du contenu unique et un trafic minimum
2. **RGPD** : Respecter strictement pour éviter les amendes
3. **UX First** : Trop de publicités = mauvais UX = moins de revenus long terme
4. **Testing** : Toujours tester en environnement de développement avant production

## 🔗 Ressources

- [Google Analytics Help](https://support.google.com/analytics)
- [Google AdSense Help](https://support.google.com/adsense)
- [Google Search Console Help](https://support.google.com/webmasters)
- [RGPD Guide](https://www.cnil.fr/fr/rgpd-de-quoi-parle-t-on)

## ✅ Checklist Finale

Avant de lancer la monétisation :

- [ ] Compte Google Analytics créé et configuré
- [ ] Compte AdSense créé et approuvé
- [ ] Variables d'environnement configurées
- [ ] Publicités intégrées dans les pages
- [ ] Consentement cookies fonctionnel
- [ ] Google Search Console configuré
- [ ] Sitemap soumis
- [ ] Tests effectués
- [ ] Politiques de confidentialité mises à jour

Une fois tous ces éléments en place, vous êtes prêt à monétiser ! 🎉

