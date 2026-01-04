# Utilisation du token GitHub

## ⚠️ Sécurité

**Ce token a été exposé dans notre conversation. Révoquez-le et créez-en un nouveau après utilisation !**

## 📝 Comment utiliser le token

### Option 1 : Utiliser lors d'un push (Git demandera les credentials)

```bash
git push
```

Quand Git demande :
- **Username** : `UnveiledShyMan`
- **Password** : Collez le token (pas votre mot de passe GitHub)

### Option 2 : Utiliser dans l'URL (temporairement)

```bash
# Pour un push unique
git remote set-url origin https://UnveiledShyMan:VOTRE_TOKEN@github.com/UnveiledShyMan/typingpvp.git
git push
git remote set-url origin https://github.com/UnveiledShyMan/typingpvp.git
```

(La dernière ligne nettoie l'URL pour ne pas exposer le token)

### Option 3 : Configurer Git Credential Helper (pour Windows)

```bash
git config --global credential.helper wincred
```

Puis lors du premier push, Git demandera les credentials et les stockera de manière sécurisée.

## 🔐 Après utilisation

**IMPORTANT : Révoquer ce token après utilisation !**

1. Aller sur : https://github.com/settings/tokens
2. Trouver le token
3. Cliquer sur "Revoke"
4. Créer un nouveau token si nécessaire

## 🚀 Solution recommandée pour le futur : SSH

Pour éviter d'exposer des tokens, configurez SSH :

1. **Générer une clé SSH** :
   ```bash
   ssh-keygen -t ed25519 -C "kriocod@gmail.com"
   ```
   (Appuyez sur Entrée pour utiliser les valeurs par défaut)

2. **Copier la clé publique** :
   ```bash
   cat C:\Users\hacki\.ssh\id_ed25519.pub
   ```
   (Ou ouvrir le fichier dans un éditeur)

3. **Ajouter à GitHub** :
   - Aller sur : https://github.com/settings/keys
   - "New SSH key"
   - Titre : `Laptop Windows`
   - Coller le contenu de `id_ed25519.pub`
   - "Add SSH key"

4. **Changer l'URL du remote** :
   ```bash
   git remote set-url origin git@github.com:UnveiledShyMan/typingpvp.git
   ```

5. **Tester** :
   ```bash
   git push
   ```
   (Plus besoin de token après ça !)

