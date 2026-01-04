# ⚠️ IMPORTANT : Sécurité du token GitHub

## 🚨 Token exposé

Votre Personal Access Token GitHub a été exposé dans notre conversation. 

**ACTION REQUISE : Révoquer et régénérer le token immédiatement !**

## 🔐 Étapes pour sécuriser votre compte

### 1. Révoquer le token actuel

1. Aller sur : https://github.com/settings/tokens
2. Trouver le token `typingpvp-deploy` (ou celui que vous avez créé)
3. Cliquer sur "Revoke" (Révoquer)
4. Confirmer la révocation

### 2. Créer un nouveau token

1. Sur la même page : https://github.com/settings/tokens
2. "Generate new token (classic)"
3. Nom : `typingpvp-deploy-v2`
4. Scopes : Cocher `repo`
5. Générer et copier le nouveau token

### 3. Stocker le token de manière sécurisée

**⚠️ Ne JAMAIS :**
- Commiter le token dans le code
- Le partager publiquement
- L'envoyer dans des messages non sécurisés

**✅ Faire :**
- Utiliser un gestionnaire de mots de passe (1Password, Bitwarden, etc.)
- Utiliser les variables d'environnement système
- Utiliser GitHub Secrets pour CI/CD

## 🔄 Après avoir révoqué le token

Votre code est maintenant sur GitHub, mais pour les futurs pushes :

1. Utilisez le nouveau token quand Git le demande
2. Ou configurez SSH (plus sécurisé pour le long terme)

## 📝 Configuration SSH (Recommandé pour le futur)

Pour éviter d'avoir à utiliser des tokens à chaque fois :

1. Générer une clé SSH :
   ```bash
   ssh-keygen -t ed25519 -C "kriocod@gmail.com"
   ```

2. Ajouter la clé publique à GitHub :
   - Copier le contenu de `C:\Users\hacki\.ssh\id_ed25519.pub`
   - Aller sur : https://github.com/settings/keys
   - "New SSH key"
   - Coller la clé

3. Changer l'URL du remote :
   ```bash
   git remote set-url origin git@github.com:UnveiledShyMan/typingpvp.git
   ```

4. Tester :
   ```bash
   git push
   ```

## ✅ Vérification

Vérifiez que le code est bien sur GitHub :
https://github.com/UnveiledShyMan/typingpvp

