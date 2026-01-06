# Configuration Reverse Proxy pour Socket.io - Plesk/Apache

## Problème Actuel

Les erreurs "xhr poll error" et "xhr post error" persistent, indiquant que le reverse proxy (Plesk/Apache) bloque ou timeout les requêtes polling Socket.io.

## ⚠️ Problème Critique : Plusieurs Applications Node.js

**Si vous avez plusieurs applications Node.js sur le même serveur Plesk**, cela peut causer des conflits :

1. **Conflits de ports** : Les deux applications peuvent essayer d'utiliser le même port
2. **Ressources partagées** : Plesk limite les ressources (CPU, mémoire) par application
3. **Process killer plus agressif** : Plesk tue les connexions long-running plus agressivement avec plusieurs applications
4. **Configuration Apache** : Le reverse proxy peut router les requêtes vers la mauvaise application

### Solutions

1. **Vérifier les ports** : Assurez-vous que chaque application Node.js utilise un port différent
   - Dans Plesk → Domaines → [votre-domaine] → Node.js
   - Vérifiez la variable d'environnement `PORT` pour chaque application
   - Les ports doivent être différents (ex: 3001 pour app1, 3002 pour app2)

2. **Vérifier la configuration Apache** : Assurez-vous que le reverse proxy route vers le bon port
   - Dans Plesk → Domaines → typingpvp.com → Apache & nginx Settings
   - Vérifiez que `ProxyPass /socket.io/` pointe vers le bon port

3. **Tester avec une seule application** : Désactivez temporairement l'autre application pour tester
   - Dans Plesk → Domaines → [autre-domaine] → Node.js → Désactiver
   - Testez si Socket.io fonctionne mieux avec une seule application active

4. **Augmenter les ressources** : Si possible, augmentez les limites de ressources dans Plesk

## Diagnostic

### Vérifications à faire

1. **Vérifier les logs du serveur Node.js**
   - Dans Plesk → Logs → Node.js Application Logs
   - Rechercher les messages "📡 Requête polling Socket.io"
   - Vérifier si les requêtes arrivent au serveur

2. **Vérifier les logs Apache**
   - Dans Plesk → Logs → Apache Error Log
   - Rechercher les erreurs liées à `/socket.io/`
   - Vérifier les timeouts

3. **Tester directement le serveur**
   - Accéder à `https://typingpvp.com:3001/socket.io/` (si le port est accessible)
   - Vérifier si le serveur répond

## Trouver le Port Node.js dans Plesk

**IMPORTANT** : Le port 3001 n'est probablement pas le bon. Plesk assigne automatiquement un port à votre application Node.js.

### Comment trouver le port dans Plesk :

1. **Dans Plesk** → Domaines → typingpvp.com → **Node.js**
2. **Regardez la section "Application Root"** ou **"Application URL"**
3. **Le port est généralement affiché** dans l'URL ou dans les logs
4. **Alternative** : Dans les logs Node.js (Plesk → Logs → Node.js Application Logs), cherchez :
   ```
   ✅ Serveur démarré avec succès sur 0.0.0.0:XXXXX
   ```
   Le `XXXXX` est votre port.

5. **Ou vérifiez les variables d'environnement** dans Plesk → Node.js → Environment Variables
   - Cherchez `PORT` - c'est le port utilisé

### Port par défaut Plesk

Si aucun port n'est spécifié, Plesk utilise généralement un port aléatoire ou un port dans la plage 30000-65535.

## Configuration Apache/Plesk Requise

### Option 1: Configuration Apache pour Socket.io (Recommandé)

**Remplacez `PORT` par le port réel de votre application Node.js trouvé ci-dessus.**

Ajoutez cette configuration dans votre fichier `.htaccess` ou dans la configuration Apache de Plesk :

```apache
# Configuration pour Socket.io polling
# REMPLACEZ PORT par le port réel de votre application Node.js
<LocationMatch "^/socket\.io/">
    ProxyPass http://localhost:PORT/socket.io/
    ProxyPassReverse http://localhost:PORT/socket.io/
    
    # Timeouts augmentés pour polling
    ProxyTimeout 60
    Timeout 60
    
    # Headers nécessaires
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}e"
    
    # CORS headers (si nécessaire)
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
</LocationMatch>
```

### Option 2: Configuration dans Plesk

1. **Trouvez d'abord le port** (voir section "Trouver le Port Node.js dans Plesk" ci-dessus)
2. **Aller dans Plesk → Domaines → typingpvp.com → Apache & nginx Settings**
3. **Ajouter dans "Additional directives for Apache"** (remplacez PORT par le port réel) :

```apache
ProxyPass /socket.io/ http://localhost:PORT/socket.io/
ProxyPassReverse /socket.io/ http://localhost:PORT/socket.io/
ProxyTimeout 60
```

4. **Dans "Additional nginx directives"** (si vous utilisez nginx) (remplacez PORT par le port réel) :

```nginx
location /socket.io/ {
    proxy_pass http://localhost:PORT/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
}
```

### Option 3: Configuration via fichier de configuration Apache

Si vous avez accès aux fichiers de configuration Apache directement :

1. **Trouvez d'abord le port** (voir section "Trouver le Port Node.js dans Plesk" ci-dessus)
2. **Créer/modifier** `/etc/apache2/sites-available/typingpvp.com.conf` (ou équivalent)
3. **Ajouter** (remplacez PORT par le port réel) :

```apache
<VirtualHost *:443>
    ServerName typingpvp.com
    
    # ... autres configurations ...
    
    # Socket.io configuration
    ProxyPreserveHost On
    ProxyPass /socket.io/ http://localhost:PORT/socket.io/ retry=0
    ProxyPassReverse /socket.io/ http://localhost:PORT/socket.io/
    
    # Timeouts pour polling
    ProxyTimeout 60
    Timeout 60
    
    # Headers
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}e"
</VirtualHost>
```

3. **Redémarrer Apache** :
   ```bash
   sudo systemctl restart apache2
   # ou
   sudo service apache2 restart
   ```

## Vérifications Post-Configuration

1. **Redémarrer Apache** après les modifications
2. **Redémarrer le serveur Node.js** dans Plesk
3. **Tester la connexion Socket.io** :
   - Ouvrir la console du navigateur
   - Vérifier qu'il n'y a plus d'erreurs "xhr poll error"
   - Vérifier que le socket se connecte et reste connecté

## Problèmes Courants

### 1. Timeout trop court
**Symptôme** : Les requêtes polling timeout immédiatement
**Solution** : Augmenter `ProxyTimeout` et `Timeout` à 60 secondes minimum

### 2. Proxy ne route pas correctement
**Symptôme** : Erreurs 404 ou 502
**Solution** : 
- Vérifier que `ProxyPass` pointe vers le bon port (voir section "Trouver le Port Node.js dans Plesk")
- Le port doit correspondre à celui affiché dans les logs Node.js de Plesk
- Vérifier que le serveur Node.js écoute bien sur `0.0.0.0` (pas `127.0.0.1`)

### 3. CORS bloqué
**Symptôme** : Erreurs CORS dans la console
**Solution** : Ajouter les headers CORS dans la configuration Apache

### 4. Connexions multiples bloquées
**Symptôme** : Seulement quelques connexions fonctionnent
**Solution** : Vérifier les limites de connexions dans Apache

## Logs à Surveiller

### Logs Serveur Node.js
```
📡 Requête polling Socket.io: { method: 'GET', url: '/socket.io/?EIO=4&transport=polling&...' }
✅ User connected: [socket-id]
```

### Logs Apache
```
[error] proxy: HTTP: disabled connection for (localhost)
[error] (70007)The timeout specified has expired: proxy: error reading status line from remote server
```

## Alternative: Utiliser un sous-domaine direct

Si la configuration du reverse proxy est trop complexe, vous pouvez :

1. **Créer un sous-domaine** `socket.typingpvp.com`
2. **Pointer directement vers le port Node.js** (sans reverse proxy)
   - Trouvez d'abord le port (voir section "Trouver le Port Node.js dans Plesk")
3. **Modifier `VITE_API_URL`** pour utiliser `https://socket.typingpvp.com:PORT`
   - Remplacez PORT par le port réel

**Note** : Cette approche nécessite que le port soit accessible publiquement, ce qui peut nécessiter une configuration de pare-feu.

## Support

Si les problèmes persistent après ces configurations :
1. Vérifier les logs du serveur Node.js (Plesk → Logs)
2. Vérifier les logs Apache (Plesk → Logs)
3. Tester avec `curl` directement le serveur :
   ```bash
   curl -v https://typingpvp.com/socket.io/?EIO=4&transport=polling
   ```

