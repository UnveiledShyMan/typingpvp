# Système de Liaison Discord et Synchronisation des Rôles

## 📋 Vue d'ensemble

Ce système permet de :
1. **Lier les comptes Discord aux comptes typingpvp.com** via un code de vérification
2. **Synchroniser automatiquement les rôles Discord** selon le MMR (rang) du joueur sur le site
3. **Mettre à jour les rôles en temps réel** toutes les 5 minutes

## 🔧 Configuration requise

### 1. Migration de la base de données

Exécutez la migration SQL pour créer la table `discord_links` :

```bash
cd server/db
node migrate.js migrations/add_discord_links.sql
```

### 2. Configuration du bot Discord

Dans le fichier `.env` du bot Discord, assurez-vous d'avoir :

```env
DISCORD_BOT_TOKEN=votre_token
GUILD_ID=l_id_du_serveur
CLIENT_ID=l_id_de_l_application
API_URL=http://localhost:3001
SITE_URL=https://typingpvp.com
LOGO_URL=https://typingpvp.com/logo.svg
```

### 3. Permissions du bot Discord

Le bot doit avoir les permissions suivantes :
- ✅ Gérer les rôles
- ✅ Voir les membres
- ✅ Envoyer des messages
- ✅ Utiliser les commandes slash

**Important** : Activez l'intent "SERVER MEMBERS INTENT" dans les paramètres du bot sur Discord Developer Portal.

## 🎮 Utilisation

### Pour les utilisateurs

#### 1. Lier son compte Discord

1. Connectez-vous sur typingpvp.com
2. Allez dans votre profil
3. Cliquez sur "Lier Discord"
4. Entrez votre ID Discord (ou utilisez le bouton pour le récupérer automatiquement)
5. Un code de vérification sera généré
6. Dans Discord, utilisez la commande `/link <code>`
7. Votre compte sera lié et votre rôle sera automatiquement attribué !

#### 2. Vérifier son lien

Utilisez la commande `/stats` dans Discord pour voir vos statistiques.

#### 3. Délier son compte

1. Allez dans votre profil sur typingpvp.com
2. Cliquez sur "Délier Discord"
3. Votre rôle Discord sera automatiquement retiré

### Commandes Discord disponibles

- `/link <code>` - Lier votre compte Discord avec un code de vérification
- `/unlink` - Voir les instructions pour délier votre compte
- `/stats [user]` - Voir les statistiques d'un utilisateur
- `/leaderboard [language] [limit]` - Voir le classement
- `/challenge <user> [language]` - Défier un utilisateur
- `/help` - Aide et commandes disponibles

## 🔄 Synchronisation automatique

Le bot synchronise automatiquement les rôles :
- ✅ Au démarrage du bot
- ✅ Toutes les 5 minutes
- ✅ Lorsqu'un compte est lié

## 🎨 Système de rangs

Les rôles Discord correspondent exactement aux rangs du site :

| Rang | MMR Minimum | Emoji | Couleur |
|------|-------------|-------|---------|
| 🔥 Keyboard Destroyer | 2800 | 🔥 | Or |
| ⚡ Speed Demon | 2600 | ⚡ | Rose |
| 👑 Type Master | 2400 | 👑 | Violet |
| ⚡ Lightning Fingers I | 2200 | ⚡ | Bleu |
| ⚡ Lightning Fingers II | 2000 | ⚡ | Bleu |
| ⚡ Lightning Fingers III | 1800 | ⚡ | Bleu |
| ⚡ Lightning Fingers IV | 1700 | ⚡ | Bleu |
| 🧙 Word Wizard I | 1600 | 🧙 | Turquoise |
| 🧙 Word Wizard II | 1500 | 🧙 | Turquoise |
| 🧙 Word Wizard III | 1400 | 🧙 | Turquoise |
| 🧙 Word Wizard IV | 1300 | 🧙 | Turquoise |
| 💥 Key Crusher I | 1200 | 💥 | Or |
| 💥 Key Crusher II | 1100 | 💥 | Or |
| 💥 Key Crusher III | 1000 | 💥 | Or |
| 💥 Key Crusher IV | 900 | 💥 | Or |
| ⌨️ Fast Typer I | 800 | ⌨️ | Argent |
| ⌨️ Fast Typer II | 700 | ⌨️ | Argent |
| ⌨️ Fast Typer III | 600 | ⌨️ | Argent |
| ⌨️ Fast Typer IV | 500 | ⌨️ | Argent |
| 🌱 Novice I | 400 | 🌱 | Bronze |
| 🌱 Novice II | 300 | 🌱 | Bronze |
| 🌱 Novice III | 200 | 🌱 | Bronze |
| 🌱 Novice IV | 0 | 🌱 | Bronze |

## 🔐 Sécurité

- Les codes de vérification expirent après 24 heures
- Un compte Discord ne peut être lié qu'à un seul compte typingpvp.com
- Les codes sont uniques et aléatoires (6 caractères)
- La liaison nécessite une authentification sur le site

## 🐛 Dépannage

### Le rôle n'apparaît pas

1. Vérifiez que le bot a les permissions nécessaires
2. Vérifiez que l'intent "SERVER MEMBERS INTENT" est activé
3. Attendez la prochaine synchronisation (5 minutes max)
4. Utilisez `/link` à nouveau avec un nouveau code

### Erreur "Code invalide"

- Le code a peut-être expiré (24h)
- Générez un nouveau code sur le site
- Vérifiez que vous utilisez le bon compte Discord

### Le bot ne synchronise pas les rôles

- Vérifiez les logs du bot
- Vérifiez que `GUILD_ID` est correct dans `.env`
- Vérifiez que l'API est accessible depuis le bot

## 📝 API Endpoints

### POST `/api/discord/generate-code`
Génère un code de vérification (authentification requise)

**Body:**
```json
{
  "discordId": "123456789",
  "discordUsername": "Username#1234"
}
```

**Response:**
```json
{
  "success": true,
  "verificationCode": "ABC123",
  "message": "Code de vérification généré..."
}
```

### POST `/api/discord/verify-code`
Vérifie un code et lie le compte (public, appelé depuis Discord)

**Body:**
```json
{
  "discordId": "123456789",
  "verificationCode": "ABC123"
}
```

### GET `/api/discord/user/:discordId`
Récupère les informations d'un utilisateur lié

### DELETE `/api/discord/unlink`
Délie un compte Discord (authentification requise)

### GET `/api/discord/linked-users`
Récupère tous les utilisateurs liés (pour la synchronisation)

## 🚀 Déploiement

1. Exécutez la migration SQL
2. Configurez les variables d'environnement
3. **Exécutez le setup du serveur Discord** :
   ```bash
   cd server/discord-bot
   npm run setup
   ```
   Ce script va créer :
   - Tous les channels organisés par catégories
   - **Tous les 24 rôles de rang** automatiquement
   - Les rôles spéciaux (Champion, VIP, Staff, etc.)
   - Des messages de bienvenue avec de beaux embeds
4. (Optionnel) Réorganisez les rôles pour un meilleur affichage :
   ```bash
   npm run organize-roles
   ```
5. Redémarrez le bot Discord
6. Les rôles seront synchronisés automatiquement toutes les 5 minutes

