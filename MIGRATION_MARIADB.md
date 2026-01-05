# Guide de Migration PostgreSQL → MariaDB

Ce guide explique comment migrer votre application de PostgreSQL vers MariaDB.

## 📋 Prérequis

1. **MariaDB installé** (version 10.3 ou supérieure recommandée)
2. **Base de données créée** : `CREATE DATABASE typingpvp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
3. **Sauvegarde de votre base PostgreSQL** (si vous avez des données existantes)

## 🔧 Étapes de Migration

### 1. Installer mysql2

```bash
cd server
npm install mysql2
npm uninstall pg  # Optionnel : supprimer pg si vous ne l'utilisez plus
```

### 2. Mettre à jour les variables d'environnement

Dans votre fichier `.env`, changez :

```env
# Avant (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=typingpvp
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_SSL=false

# Après (MariaDB)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=typingpvp
DB_USER=root
DB_PASSWORD=votre_mot_de_passe 
DB_SSL=false
```

### 3. Créer le schéma MariaDB

```bash
# Option 1 : Via la ligne de commande MariaDB
mysql -u root -p typingpvp < server/db/schema-mariadb.sql

# Option 2 : Via le script Node.js (après avoir modifié connection.js)
node server/db/init-mariadb.js
```

### 4. Migrer les données existantes (si nécessaire)

Si vous avez des données PostgreSQL à migrer :

1. **Exporter les données PostgreSQL** :
```bash
pg_dump -U postgres -d typingpvp --data-only --column-inserts > data_export.sql
```

2. **Adapter le fichier SQL** pour MariaDB :
   - Remplacer `$1, $2, $3` par des valeurs directes
   - Adapter les types JSONB → JSON
   - Adapter les tableaux TEXT[] → JSON

3. **Importer dans MariaDB** :
```bash
mysql -u root -p typingpvp < data_export_adapted.sql
```

### 5. Modifier les fichiers de code

#### 5.1. Modifier `server/db/connection.js`

Remplacer le contenu par `server/db/connection-mariadb.js` ou renommer :

```bash
mv server/db/connection.js server/db/connection-postgres.js
mv server/db/connection-mariadb.js server/db/connection.js
```

#### 5.2. Adapter `server/db.js`

Les principales modifications nécessaires :

1. **Paramètres de requête** : `$1, $2, $3` → `?`
2. **RETURNING** : Remplacer par une requête SELECT séparée
3. **ON CONFLICT** : Remplacer par `INSERT IGNORE` ou `ON DUPLICATE KEY UPDATE`
4. **Transactions** : `pool.connect()` → `pool.getConnection()`
5. **Codes d'erreur** : `23505` → `1062` (déjà géré dans connection-mariadb.js)

#### 5.3. Adapter les migrations

Utiliser les fichiers `-mariadb.sql` au lieu des fichiers PostgreSQL.

### 6. Tester la migration

```bash
# Tester la connexion
node -e "import('./server/db/connection.js').then(m => m.default.query('SELECT 1').then(r => console.log('✅ Connexion OK', r)))"

# Exécuter les migrations
npm run migrate
```

## 🔄 Différences principales PostgreSQL vs MariaDB

| PostgreSQL | MariaDB |
|------------|---------|
| `$1, $2, $3` | `?` |
| `JSONB` | `JSON` |
| `TEXT[]` | `JSON` |
| `RETURNING *` | `SELECT` séparé ou `LAST_INSERT_ID()` |
| `ON CONFLICT` | `INSERT IGNORE` ou `ON DUPLICATE KEY UPDATE` |
| Code erreur `23505` | Code erreur `1062` |
| `pool.connect()` | `pool.getConnection()` |
| `result.rows` | `result[0]` (déjà adapté dans connection-mariadb.js) |

## ⚠️ Points d'attention

1. **JSON vs JSONB** : MariaDB utilise `JSON` (pas de JSONB). Les performances peuvent être légèrement différentes.

2. **Tableaux** : PostgreSQL `TEXT[]` doit être converti en `JSON` dans MariaDB.

3. **Transactions** : La syntaxe est similaire mais l'API est différente.

4. **Index partiels** : MariaDB ne supporte pas les index partiels avec `WHERE` de la même manière que PostgreSQL.

5. **Codes d'erreur** : Les codes d'erreur sont différents, mais le wrapper dans `connection-mariadb.js` les adapte automatiquement.

## 📝 Checklist de migration

- [ ] MariaDB installé et base de données créée
- [ ] `mysql2` installé
- [ ] Variables d'environnement mises à jour
- [ ] Schéma MariaDB créé
- [ ] `connection.js` remplacé par la version MariaDB
- [ ] `db.js` adapté pour MariaDB (paramètres `?` au lieu de `$1, $2, $3`)
- [ ] Migrations adaptées
- [ ] Tests effectués
- [ ] Données migrées (si nécessaire)

## 🆘 Dépannage

### Erreur de connexion

Vérifiez que :
- MariaDB est démarré : `sudo systemctl status mariadb`
- Les identifiants dans `.env` sont corrects
- Le port 3306 est accessible

### Erreur de syntaxe SQL

Vérifiez que toutes les requêtes utilisent `?` au lieu de `$1, $2, $3`.

### Erreur de type JSON

Assurez-vous que les colonnes JSON sont bien définies comme `JSON` et non `TEXT` dans le schéma.

## 📚 Ressources

- [Documentation MariaDB](https://mariadb.com/kb/en/)
- [mysql2 npm package](https://www.npmjs.com/package/mysql2)
- [Guide de migration PostgreSQL vers MySQL/MariaDB](https://mariadb.com/kb/en/migrating-from-postgresql-to-mariadb/)

