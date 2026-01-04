# Résolution du problème d'authentification GitHub

## ❌ Problème détecté

L'erreur indique que Git utilise les credentials d'un autre compte (SaltSour) au lieu de UnveiledShyMan.

## ✅ Solutions

### Option 1 : Utiliser un Personal Access Token (Recommandé)

1. **Créer un token GitHub** :
   - Aller sur : https://github.com/settings/tokens
   - Cliquer sur "Generate new token (classic)"
   - Nom : `typingpvp-deploy`
   - Scopes : Cocher `repo` (toutes les permissions)
   - Cliquer sur "Generate token"
   - **⚠️ IMPORTANT : Copier le token immédiatement** (ex: `ghp_xxxxxxxxxxxxxxxxxxxx`)

2. **Utiliser le token lors du push** :
   ```bash
   git push -u origin main
   ```
   
   Quand Git demande :
   - **Username** : `UnveiledShyMan`
   - **Password** : Coller le token (pas votre mot de passe GitHub)

### Option 2 : Nettoyer les credentials Windows et utiliser le token

```powershell
# Supprimer les credentials en cache
git credential-manager-core erase
# ou
cmdkey /list | findstr github
cmdkey /delete:git:https://github.com
```

Puis refaire le push avec le token.

### Option 3 : Utiliser SSH (Alternative)

1. **Générer une clé SSH** (si vous n'en avez pas) :
   ```bash
   ssh-keygen -t ed25519 -C "kriocod@gmail.com"
   ```

2. **Ajouter la clé à GitHub** :
   - Copier le contenu de `C:\Users\hacki\.ssh\id_ed25519.pub`
   - Aller sur : https://github.com/settings/keys
   - "New SSH key"
   - Coller la clé

3. **Changer l'URL du remote** :
   ```bash
   git remote set-url origin git@github.com:UnveiledShyMan/typingpvp.git
   ```

4. **Pousser** :
   ```bash
   git push -u origin main
   ```

### Option 4 : Utiliser GitHub Desktop (Le plus simple)

1. Télécharger GitHub Desktop : https://desktop.github.com
2. Se connecter avec votre compte UnveiledShyMan
3. Ajouter le repository local
4. Commit et Push via l'interface

## 🚀 Commandes rapides (Option 1 - Token)

```bash
# Le commit est déjà fait, il suffit de pousser
git push -u origin main

# Utiliser le token quand demandé (pas le mot de passe)
```

## 🔐 Après avoir créé le token

Une fois que vous avez le token GitHub, vous pouvez soit :
- L'utiliser directement lors du `git push` (il vous le demandera)
- Ou le configurer dans l'URL (moins sécurisé) :
  ```bash
  git remote set-url origin https://UnveiledShyMan:VOTRE_TOKEN@github.com/UnveiledShyMan/typingpvp.git
  ```

**⚠️ Attention** : Ne commitez JAMAIS le token dans votre code !

## 📝 Vérification

Après le push réussi, vérifiez sur :
https://github.com/UnveiledShyMan/typingpvp

Vous devriez voir tous vos fichiers !

