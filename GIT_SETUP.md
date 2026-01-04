# Configuration Git pour UnveiledShyMan

## ✅ Configuration Git effectuée

Votre nom d'utilisateur Git est maintenant configuré : **UnveiledShyMan**

## 📋 Prochaines étapes pour mettre en ligne sur GitHub

### 1. Configurer votre email Git (si pas déjà fait)

```bash
git config --global user.email "votre-email@example.com"
```

**Important :** Utilisez l'email associé à votre compte GitHub (UnveiledShyMan) pour que vos commits soient liés à votre profil.

### 2. Vérifier la configuration

```bash
git config --global --list
```

Vous devriez voir :
- `user.name=UnveiledShyMan`
- `user.email=votre-email@example.com`

### 3. Initialiser le repository Git (si pas déjà fait)

```bash
git init
```

### 4. Ajouter tous les fichiers au staging

```bash
git add .
```

### 5. Faire le premier commit

```bash
git commit -m "Initial commit: Typing Battle game"
```

Ou un message plus détaillé :
```bash
git commit -m "Initial commit: Typing Battle game with React, Node.js, Socket.io

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + Socket.io
- Features: Solo mode, 1v1 battles, matchmaking, competitions, rankings, friends system
- Real-time multiplayer typing battles
- ELO system and match history"
```

### 6. Créer le repository sur GitHub

1. **Aller sur GitHub** : https://github.com/new
2. **Nom du repository** : Par exemple `typing-battle` ou `typingpvp`
3. **Description** : "Competitive typing battles - Test your typing speed, compete with friends"
4. **Visibilité** :
   - ✅ Public (gratuit, visible par tous)
   - 🔒 Private (gratuit, visible uniquement par vous)
5. **NE PAS** cocher "Initialize this repository with a README" (vous avez déjà des fichiers)
6. **Cliquer sur "Create repository"**

### 7. Connecter votre repository local à GitHub

GitHub vous donnera les commandes, mais voici les étapes :

```bash
git remote add origin https://github.com/UnveiledShyMan/nom-de-votre-repo.git
```

Remplacez `nom-de-votre-repo` par le nom que vous avez choisi.

### 8. Pousser le code sur GitHub

```bash
git branch -M main
git push -u origin main
```

Si vous êtes sur Windows et que GitHub demande l'authentification :
- Utilisez un **Personal Access Token** au lieu de votre mot de passe
- Ou utilisez **GitHub Desktop** pour une interface graphique

## 🔐 Authentification GitHub

### Option 1 : Personal Access Token (Recommandé)

1. **Créer un token** :
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - "Generate new token (classic)"
   - Nom : `typing-battle-deploy`
   - Scopes : Cocher `repo` (toutes les permissions)
   - "Generate token"
   - **⚠️ Copier le token immédiatement** (il ne sera plus visible après)

2. **Utiliser le token** :
   - Quand Git vous demande le mot de passe, utilisez le token au lieu du mot de passe

### Option 2 : GitHub Desktop (Plus simple)

1. Télécharger GitHub Desktop : https://desktop.github.com
2. Se connecter avec votre compte GitHub
3. Ajouter le repository local
4. Commit et Push via l'interface graphique

### Option 3 : SSH (Pour les utilisateurs avancés)

Si vous préférez SSH :
```bash
git remote set-url origin git@github.com:UnveiledShyMan/nom-de-votre-repo.git
```

## 📝 Commandes Git utiles

```bash
# Voir le statut
git status

# Ajouter des fichiers
git add .
git add fichier.js

# Commit
git commit -m "Message du commit"

# Voir l'historique
git log

# Voir les branches
git branch

# Pousser sur GitHub
git push

# Récupérer les changements
git pull
```

## 🎯 Workflow recommandé

### Pour chaque changement :

```bash
# 1. Vérifier ce qui a changé
git status

# 2. Ajouter les fichiers modifiés
git add .

# 3. Commit avec un message descriptif
git commit -m "Description du changement"

# 4. Pousser sur GitHub
git push
```

### Exemples de messages de commit :

```
git commit -m "Add solo match recording and BEST WPM tracking"
git commit -m "Fix chart alignment on results page"
git commit -m "Update deployment documentation"
git commit -m "Improve language selector UI"
```

## ⚠️ Fichiers ignorés (déjà dans .gitignore)

Votre `.gitignore` ignore déjà :
- `node_modules/`
- `dist/`
- `.env`
- `*.log`

Ces fichiers ne seront **pas** envoyés sur GitHub (c'est bien !).

## 🚀 Après le push sur GitHub

Une fois votre code sur GitHub, vous pourrez :

1. **Déployer sur Railway** :
   - Railway peut se connecter directement à votre repo GitHub
   - Déploiement automatique à chaque push

2. **Partager votre code** :
   - Si le repo est public, d'autres peuvent voir votre code
   - Vous pouvez ajouter des collaborateurs

3. **Travailler sur plusieurs machines** :
   - Cloner le repo sur une autre machine
   - `git clone https://github.com/UnveiledShyMan/nom-de-votre-repo.git`

## 📚 Ressources

- **Documentation Git** : https://git-scm.com/doc
- **GitHub Docs** : https://docs.github.com
- **GitHub Desktop** : https://desktop.github.com
- **Personal Access Tokens** : https://github.com/settings/tokens

## ❓ Problèmes courants

### "Authentication failed"
→ Utilisez un Personal Access Token au lieu du mot de passe

### "Permission denied"
→ Vérifiez que vous êtes connecté avec le bon compte GitHub

### "Repository not found"
→ Vérifiez que le nom du repo est correct et que vous avez les permissions

### "Large files"
→ GitHub a une limite de 100MB par fichier. Si vous avez des fichiers volumineux, ajoutez-les au `.gitignore`

