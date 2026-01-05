# TypingPVP Discord Bot

Bot Discord officiel pour typingpvp.com

## 🚀 Installation

1. **Installer les dépendances**
```bash
cd server/discord-bot
npm install
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Puis éditez `.env` avec vos informations :
- `DISCORD_BOT_TOKEN` : Token du bot (obtenu sur https://discord.com/developers/applications)
- `GUILD_ID` : ID du serveur Discord (clic droit sur le serveur → Copier l'ID)
- `CLIENT_ID` : ID de l'application Discord (Client ID)
- `API_URL` : URL de l'API (optionnel, par défaut: http://localhost:3001)
- `SITE_URL` : URL du site web (optionnel, par défaut: https://typingpvp.com)
- `LOGO_URL` : URL du logo (optionnel, par défaut: https://typingpvp.com/logo.svg)

## 📋 Configuration du bot Discord

1. Aller sur https://discord.com/developers/applications
2. Créer une nouvelle application
3. Aller dans "Bot" → "Add Bot"
4. Copier le token et l'ajouter dans `.env`
5. Activer les intents nécessaires :
   - MESSAGE CONTENT INTENT
   - SERVER MEMBERS INTENT
6. Aller dans "OAuth2" → "URL Generator"
7. Sélectionner "bot" et "administrator"
8. Copier l'URL et l'ouvrir pour inviter le bot sur votre serveur

## 🛠️ Utilisation

### Setup initial du serveur (création des channels)
```bash
npm run setup
```

Ce script va créer automatiquement :
- Toutes les catégories
- Tous les channels
- **Tous les rôles de rang** (24 rôles selon le système MMR)
- Les rôles spéciaux (Champion, VIP, Staff, etc.)
- Les messages de bienvenue et règles avec de beaux embeds
- Des messages dans plusieurs channels (annonces, victoires, aide)

### Réorganiser les rôles (optionnel)
```bash
npm run organize-roles
```

Ce script réorganise les rôles dans le bon ordre pour un meilleur affichage dans Discord.

### Lancer le bot
```bash
npm start
```

### Mode développement (avec watch)
```bash
npm run dev
```

## 📝 Commandes disponibles

- `/stats [user]` - Affiche les statistiques détaillées d'un utilisateur (WPM, MMR, rang, etc.)
- `/leaderboard [language] [limit]` - Affiche le classement des meilleurs joueurs
- `/challenge <user> [language]` - Défie un utilisateur en 1v1 avec création de room
- `/help` - Affiche l'aide et toutes les commandes disponibles

## 🎨 Fonctionnalités

- **Embeds stylisés** : Tous les messages utilisent des embeds Discord avec le logo du site
- **Couleurs cohérentes** : Utilisation des couleurs du site (violet #8b5cf6)
- **Boutons interactifs** : Liens directs vers le site et les fonctionnalités
- **Système de rangs** : Affichage automatique du rang selon le MMR
- **Intégration API** : Connexion avec l'API de typingpvp.com pour les données en temps réel

## 📁 Structure

```
discord-bot/
├── commands/          # Commandes slash
│   ├── stats.js
│   ├── leaderboard.js
│   └── challenge.js
├── index.js         # Point d'entrée du bot
├── setup-server.js  # Script de configuration du serveur
├── package.json
└── .env             # Variables d'environnement (non commité)
```

## 🔧 Développement

Pour ajouter une nouvelle commande :

1. Créer un fichier dans `commands/`
2. Exporter un objet avec `data` (SlashCommandBuilder) et `execute` (fonction)
3. Le bot chargera automatiquement la commande au démarrage

Exemple :
```javascript
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ma-commande')
    .setDescription('Description de la commande'),
  
  async execute(interaction) {
    await interaction.reply('Réponse !');
  }
};
```

## 🔗 Intégration API

Le bot peut se connecter à l'API de typingpvp.com pour :
- Récupérer les statistiques des utilisateurs
- Afficher les classements
- Créer des rooms de battle
- Gérer les tournois

Assurez-vous que `API_URL` est correctement configuré dans `.env`.

## 📚 Ressources

- [Discord.js Documentation](https://discord.js.org/)
- [Discord Developer Portal](https://discord.com/developers/docs/intro)

