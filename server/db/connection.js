// Configuration de la connexion PostgreSQL
import pkg from 'pg';
const { Pool } = pkg;

/**
 * Pool de connexions PostgreSQL
 * Utilise les variables d'environnement pour la configuration
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '', // S'assurer que c'est toujours une chaîne
  // SSL peut être nécessaire selon la configuration Plesk
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Configuration du pool
  max: 20, // Maximum de connexions dans le pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Gestion des erreurs de connexion
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;

