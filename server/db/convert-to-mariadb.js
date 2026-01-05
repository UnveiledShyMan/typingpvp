/**
 * Script de conversion automatique de db.js pour MariaDB
 * 
 * Ce script convertit les requêtes PostgreSQL en requêtes MariaDB :
 * - $1, $2, $3 → ?
 * - RETURNING * → requête SELECT séparée
 * - ON CONFLICT → INSERT IGNORE ou ON DUPLICATE KEY UPDATE
 * 
 * Usage: node server/db/convert-to-mariadb.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbJsPath = join(__dirname, '..', 'db.js');
const dbMariadbPath = join(__dirname, '..', 'db-mariadb.js');

console.log('🔄 Conversion de db.js pour MariaDB...');

let content = readFileSync(dbJsPath, 'utf-8');

// 1. Remplacer l'import de connection.js
content = content.replace(
  /import pool from '\.\/db\/connection\.js';/,
  "import { query, getConnection } from './db/connection.js';"
);

// 2. Créer un wrapper pool.query compatible
const poolWrapper = `
// Wrapper pour compatibilité avec l'ancien code
const pool = {
  query: query,
  connect: async () => {
    const conn = await getConnection();
    return {
      query: async (sql, params) => {
        const result = await conn.query(sql, params);
        return { rows: Array.isArray(result) ? result : [result] };
      },
      release: () => conn.release(),
      query: async (sql, params) => {
        if (sql === 'BEGIN') {
          await conn.beginTransaction();
          return { rows: [] };
        }
        if (sql === 'COMMIT') {
          await conn.commit();
          return { rows: [] };
        }
        if (sql === 'ROLLBACK') {
          await conn.rollback();
          return { rows: [] };
        }
        const [rows] = await conn.execute(sql, params);
        return { rows: Array.isArray(rows) ? rows : [rows] };
      }
    };
  }
};
`;

content = content.replace(
  /\/\/ Base de données PostgreSQL\nimport pool from '\.\/db\/connection\.js';/,
  `// Base de données MariaDB\nimport { query, getConnection } from './db/connection.js';\n${poolWrapper}`
);

// 3. Remplacer tous les paramètres $1, $2, $3, etc. par ?
// Cette regex trouve tous les $ suivi d'un nombre
content = content.replace(/\$(\d+)/g, '?');

// 4. Adapter RETURNING * (nécessite une logique plus complexe)
// Pour l'instant, on laisse un commentaire pour adaptation manuelle
content = content.replace(
  /RETURNING \*/g,
  '-- RETURNING * (remplacer par SELECT séparé)'
);

// 5. Adapter ON CONFLICT
content = content.replace(
  /ON CONFLICT \(([^)]+)\) DO NOTHING/g,
  'ON DUPLICATE KEY UPDATE $1 = $1'
);

// 6. Adapter les opérateurs JSON PostgreSQL vers MariaDB
// mmr->>$1 → JSON_EXTRACT(mmr, ?) ou JSON_UNQUOTE(JSON_EXTRACT(mmr, ?))
content = content.replace(
  /\(mmr->>([^)]+)\)::INTEGER/g,
  'CAST(JSON_UNQUOTE(JSON_EXTRACT(mmr, $1)) AS UNSIGNED)'
);

// 7. Adapter COALESCE avec JSON
content = content.replace(
  /COALESCE\(\(mmr->>[^)]+\)::INTEGER, (\d+)\)/g,
  'COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(mmr, CONCAT("$.\"", ?, "\""))) AS UNSIGNED), $1)'
);

// 8. Adapter information_schema pour MariaDB
// PostgreSQL: table_name, MariaDB: TABLE_NAME (mais généralement compatible)

console.log('✅ Conversion terminée !');
console.log('⚠️  Vérifiez manuellement les requêtes avec RETURNING *');
console.log('⚠️  Vérifiez les requêtes JSON (->> opérateur)');

writeFileSync(dbMariadbPath, content, 'utf-8');
console.log(`📝 Fichier créé: ${dbMariadbPath}`);

