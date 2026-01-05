// Configuration de la connexion MariaDB/MySQL
import mysql from 'mysql2/promise';

// Charger les variables d'environnement si elles ne sont pas déjà chargées
// (utile pour les scripts comme migrate.js qui s'exécutent directement)
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Si les variables ne sont pas chargées, charger le .env depuis la racine
if (typeof process.env.DB_PASSWORD === 'undefined' || !process.env.DB_NAME) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = resolve(__dirname, '..', '..');
  dotenv.config({ path: join(projectRoot, '.env') });
  
  if (typeof process.env.DB_PASSWORD === 'undefined') {
    console.warn('⚠️ DB_PASSWORD n\'est pas défini dans les variables d\'environnement');
  }
}

/**
 * Pool de connexions MariaDB/MySQL
 * Utilise les variables d'environnement pour la configuration
 */
// S'assurer que le mot de passe est toujours une chaîne valide
let dbPassword = '';
if (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== null) {
  dbPassword = String(process.env.DB_PASSWORD);
  if (typeof dbPassword !== 'string') {
    console.warn('⚠️ DB_PASSWORD n\'est pas une chaîne, conversion forcée');
    dbPassword = String(dbPassword || '');
  }
}

// Log de diagnostic (sans afficher le mot de passe)
console.log('📊 Configuration base de données MariaDB:');
console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  Port: ${process.env.DB_PORT || '3306'}`);
console.log(`  Database: ${process.env.DB_NAME || '(non défini)'}`);
console.log(`  User: ${process.env.DB_USER || '(non défini)'}`);
console.log(`  Password: ${process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== null ? '(défini)' : '(non défini)'}`);
console.log(`  SSL: ${process.env.DB_SSL === 'true' ? 'activé' : 'désactivé'}`);

// Créer la configuration de connexion
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: dbPassword || undefined,
  // SSL peut être nécessaire selon la configuration
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  // Configuration du pool
  waitForConnections: true,
  connectionLimit: 20, // Maximum de connexions dans le pool
  queueLimit: 0,
  // Support des requêtes multiples (utile pour les transactions)
  multipleStatements: false,
  // Timezone
  timezone: 'Z', // UTC
  // Charset
  charset: 'utf8mb4',
  // Support JSON natif
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      const value = field.string();
      return value ? JSON.parse(value) : null;
    }
    return next();
  }
};

// Créer le pool de connexions
const pool = mysql.createPool(poolConfig);

// Gestion des erreurs de connexion
pool.on('connection', (connection) => {
  console.log('✅ Nouvelle connexion MariaDB établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur de connexion MariaDB:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Connexion à la base de données perdue');
    // Ne pas faire planter le serveur, juste logger
  } else if (err.fatal) {
    console.error('Erreur fatale de connexion MariaDB:', err.message);
    // En production, ne pas faire planter le serveur immédiatement
    // Le serveur pourra continuer et réessayer plus tard
    if (process.env.NODE_ENV !== 'production') {
      console.error('⚠️ En développement, arrêt du processus');
      process.exit(-1);
    } else {
      console.error('⚠️ En production, le serveur continue de fonctionner');
    }
  }
});

/**
 * Wrapper pour pool.query qui retourne un format compatible avec PostgreSQL
 * (result.rows au lieu de result[0])
 */
export async function query(sql, params) {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    // Retourner un format compatible avec PostgreSQL (result.rows)
    return { rows: Array.isArray(rows) ? rows : [rows], fields };
  } catch (error) {
    // Adapter les codes d'erreur MariaDB pour compatibilité
    if (error.code === 'ER_DUP_ENTRY' || error.code === 1062) {
      // Duplicate entry - similaire à PostgreSQL 23505
      error.code = '23505';
      // Extraire le nom de la contrainte si possible
      const match = error.message.match(/for key '(.+?)'/);
      if (match) {
        error.constraint = match[1];
      }
    }
    throw error;
  }
}

/**
 * Obtenir une connexion pour les transactions
 * Retourne un wrapper qui expose toutes les méthodes nécessaires pour les transactions
 */
export async function getConnection() {
  const conn = await pool.getConnection();
  // Wrapper pour compatibilité avec PostgreSQL et MariaDB
  return {
    // Méthode query pour compatibilité avec l'ancien code
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
    },
    // Méthodes directes pour les transactions (utilisées par db.js)
    beginTransaction: async () => {
      await conn.beginTransaction();
    },
    commit: async () => {
      await conn.commit();
    },
    rollback: async () => {
      await conn.rollback();
    },
    execute: async (sql, params) => {
      const [rows] = await conn.execute(sql, params);
      return [rows];
    },
    release: () => conn.release()
  };
}

/**
 * Fermer le pool (utile pour les tests ou l'arrêt propre)
 */
export async function closePool() {
  await pool.end();
}

// Wrapper pour compatibilité avec l'ancien code (pool.query)
const poolWrapper = {
  query,
  connect: getConnection
};

export default poolWrapper;
