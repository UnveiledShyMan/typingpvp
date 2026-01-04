# Guide de Déploiement Rapide

## Option 1 : Déploiement Simple (Recommandé pour commencer rapidement)

### Frontend sur Vercel (Gratuit, automatique)

1. **Créer un compte sur [Vercel](https://vercel.com)**

2. **Préparer le repository GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/VOTRE_USERNAME/typing-battle.git
   git push -u origin main
   ```

3. **Déployer sur Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Cliquer sur "New Project"
   - Importer votre repository GitHub
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - Cliquer sur "Deploy"

✅ Le frontend sera déployé en quelques secondes !

### Backend sur Railway (Gratuit jusqu'à 500h/mois)

1. **Créer un compte sur [Railway](https://railway.app)**

2. **Déployer le backend**
   - Cliquer sur "New Project"
   - Sélectionner "Deploy from GitHub repo"
   - Choisir votre repository
   - Dans les settings du service :
     - **Root Directory**: `server`
     - **Start Command**: `node index.js`
   - Railway détectera automatiquement Node.js

3. **Configurer les variables d'environnement**
   - Dans les settings du service → Variables
   - Ajouter `PORT` (Railway le définit automatiquement)

4. **Récupérer l'URL du backend**
   - Railway génère une URL (ex: `https://typing-battle-production.up.railway.app`)
   - Copier cette URL

5. **Configurer l'URL du backend dans le frontend**
   - Dans Vercel, aller dans les Settings → Environment Variables
   - Ajouter : `VITE_API_URL` = `https://votre-backend.railway.app`
   - Re-déployer sur Vercel (les fichiers utilisent déjà cette variable automatiquement)

### Backend sur Render (Alternative gratuite)

1. **Créer un compte sur [Render](https://render.com)**

2. **Nouveau Web Service**
   - Connecter votre repository GitHub
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment**: Node
   - Plan: Free

3. **Récupérer l'URL et mettre à jour le frontend comme ci-dessus**

---

## Option 2 : Déploiement Full-Stack sur Vercel (Plus complexe mais tout au même endroit)

Vercel supporte maintenant Socket.io avec leurs Serverless Functions, mais nécessite une configuration plus avancée. L'option 1 est recommandée pour commencer rapidement.

---

## Variables d'environnement

### Backend (Railway/Render)
- `PORT` : Automatiquement défini par la plateforme
- `CLIENT_URL` : URL de votre frontend Vercel (ex: `https://typing-battle.vercel.app`)
- `NODE_ENV` : `production` (automatique)

### Frontend (Vercel)
Dans les Environment Variables de Vercel (Settings → Environment Variables) :
- `VITE_API_URL` : URL de votre backend (ex: `https://typing-battle-production.up.railway.app`)

**Note** : Les fichiers utilisent déjà `import.meta.env.VITE_API_URL`, pas besoin de modifier le code !

---

## Coûts

- **Vercel (Frontend)** : Gratuit pour les projets personnels
- **Railway (Backend)** : Gratuit jusqu'à 500h/mois, puis ~$5/mois
- **Render (Backend)** : Gratuit mais avec limitations (spin down après inactivité)

---

## Après le déploiement

1. Tester le site en production
2. Configurer un nom de domaine personnalisé (optionnel)
3. Mettre en place la monétisation (voir MONETISATION.md)
