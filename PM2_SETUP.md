# Installation et Configuration PM2 pour TypingPVP

## Pourquoi PM2 au lieu de Passenger ?

PM2 est un process manager spécialement conçu pour Node.js qui :
- ✅ Maintient l'application en vie (redémarre automatiquement si crash)
- ✅ Ne tue pas les processus par idle timeout
- ✅ Gère mieux les applications avec Socket.IO
- ✅ Permet le reload sans downtime
- ✅ Meilleure gestion des logs

## Installation

### 1. Installation Globale de PM2

```bash
npm install -g pm2
```

### 2. Vérifier l'Installation

```bash
pm2 --version
```

## Configuration PM2 pour TypingPVP

### Option 1 : Configuration via Fichier `ecosystem.config.js` (RECOMMANDÉ)

Créez un fichier `ecosystem.config.js` à la racine du projet :

```javascript
export default {
  apps: [{
    name: 'typingpvp',
    script: './app.js',
    instances: 1, // Une seule instance pour Socket.IO (les sessions sont en mémoire)
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      // Ajoutez ici vos autres variables d'environnement
      // Elles peuvent aussi être lues depuis .env
    },
    // Auto-restart si crash
    autorestart: true,
    // Watch pour le développement (désactivé en production)
    watch: false,
    // Gestion des logs
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Merge logs de tous les instances
    merge_logs: true,
    // Max memory avant restart (optionnel)
    max_memory_restart: '500M',
    // Garder l'app vivante même après logout
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
```

### Option 2 : Lancer Directement avec PM2

```bash
pm2 start app.js --name typingpvp --instances 1
```

## Commandes PM2 Utiles

### Démarrer l'Application

```bash
pm2 start ecosystem.config.js
# ou
pm2 start app.js --name typingpvp
```

### Voir l'État des Applications

```bash
pm2 status
pm2 list
```

### Voir les Logs

```bash
pm2 logs typingpvp
pm2 logs typingpvp --lines 100  # Dernières 100 lignes
```

### Redémarrer l'Application

```bash
pm2 restart typingpvp
pm2 reload typingpvp  # Reload sans downtime (graceful)
```

### Arrêter l'Application

```bash
pm2 stop typingpvp
pm2 delete typingpvp  # Supprimer de PM2
```

### Monitoring en Temps Réel

```bash
pm2 monit
```

## Configuration pour Démarrage Automatique

### Sauvegarder la Configuration PM2

```bash
pm2 save
```

### Configurer le Démarrage Automatique au Boot

```bash
# Pour Linux (systemd)
pm2 startup

# Suivez les instructions affichées
# Cela créera un service systemd pour démarrer PM2 au boot
```

## Configuration avec Plesk

Si vous utilisez Plesk, vous pouvez :

1. **Désactiver Passenger** pour cette application Node.js dans Plesk
2. **Créer un script de démarrage** qui lance PM2
3. **Configurer un cron** pour s'assurer que PM2 est lancé (si nécessaire)

### Script de Démarrage pour Plesk

Créez un fichier `start.sh` :

```bash
#!/bin/bash
cd /path/to/your/app
source ~/.bashrc
pm2 start ecosystem.config.js
```

Rendez-le exécutable :
```bash
chmod +x start.sh
```

## Variables d'Environnement

PM2 peut lire les variables depuis :
1. Le fichier `ecosystem.config.js` (dans `env`)
2. Un fichier `.env` (avec `pm2 install pm2-dotenv`)
3. Les variables d'environnement système

### Utiliser .env avec PM2

```bash
npm install -g pm2-dotenv
pm2 install pm2-dotenv
```

Puis dans `ecosystem.config.js` :
```javascript
{
  name: 'typingpvp',
  script: './app.js',
  dotenv: './server/.env'  // Chemin vers votre .env
}
```

## Avantages pour Socket.IO

Avec PM2 :
- ✅ Pas d'idle timeout qui tue l'application
- ✅ Redémarrage contrôlé (peut utiliser `pm2 reload` pour un reload graceful)
- ✅ Meilleure gestion de la mémoire
- ✅ Logs centralisés et faciles à consulter
- ✅ Monitoring intégré

## Migration depuis Passenger

1. **Arrêtez l'application dans Plesk** (désactivez Passenger)
2. **Installez PM2** globalement
3. **Créez `ecosystem.config.js`** avec votre configuration
4. **Démarrez avec PM2** : `pm2 start ecosystem.config.js`
5. **Configurez le démarrage automatique** : `pm2 startup && pm2 save`
6. **Vérifiez que ça fonctionne** : `pm2 logs typingpvp`

## Vérification

Après avoir démarré avec PM2, vérifiez :
- `pm2 status` - doit montrer l'app comme "online"
- `pm2 logs typingpvp` - doit montrer "✅ Serveur démarré"
- Testez Socket.IO - les erreurs 400 devraient diminuer drastiquement

