# Instructions pour pousser le code sur GitHub

## ❌ Problème actuel

Git utilise les credentials en cache d'un autre compte (SaltSour). Il faut les nettoyer manuellement.

## ✅ Solution manuelle (La plus fiable)

### Étape 1 : Nettoyer les credentials Windows

Ouvrez PowerShell en administrateur et exécutez :

```powershell
# Voir les credentials GitHub
cmdkey /list | findstr github

# Supprimer les credentials GitHub
cmdkey /delete:LegacyGeneric:target=git:https://github.com
```

### Étape 2 : Pousser avec le token

Dans votre terminal Git (PowerShell normal), exécutez :

```bash
git push -u origin main
```

Quand Git demande les credentials :
- **Username** : `UnveiledShyMan`
- **Password** : `github_pat_11BM6WE4I0AF0SA4rfd59z_ecLvb77oRIS3OpU1u7CwMinOMNIeXDJqNKFKqYNRSQkFT4COLR9nmRB6Ox`

### Option alternative : Utiliser l'URL avec le token

```bash
git remote set-url origin https://UnveiledShyMan:github_pat_11BM6WE4I0AF0SA4rfd59z_ecLvb77oRIS3OpU1u7CwMinOMNIeXDJqNKFKqYNRSQkFT4COLR9nmRB6Ox@github.com/UnveiledShyMan/typingpvp.git
git push -u origin main
git remote set-url origin https://github.com/UnveiledShyMan/typingpvp.git
```

(La dernière ligne nettoie l'URL pour ne pas exposer le token dans le futur)

## 🔐 Après le push réussi

**⚠️ IMPORTANT : Révoquez ce token car il a été exposé !**

1. Aller sur : https://github.com/settings/tokens
2. Trouver et révoquer le token utilisé
3. Créer un nouveau token pour les futurs pushes
4. Ou configurer SSH (plus sécurisé)

## 🚀 Solution alternative : GitHub Desktop

Si les commandes ne fonctionnent pas, utilisez GitHub Desktop :

1. Télécharger : https://desktop.github.com
2. Se connecter avec votre compte UnveiledShyMan
3. File → Add Local Repository
4. Sélectionner le dossier `C:\Users\hacki\lahaine`
5. Publish repository (ou Push origin)

