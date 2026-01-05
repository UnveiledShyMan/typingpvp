// Configuration de la connexion PostgreSQL
import pkg from 'pg';
const { Pool } = pkg;

/**
 * Pool de connexions PostgreSQL
 * Utilise les variables d'environnement pour la configuration
 */
// S'assurer que le mot de passe est toujours une chaîne
// PostgreSQL exige que password soit une chaîne, même si vide
const dbPassword = process.env.DB_PASSWORD !== undefined 
  ? String(process.env.DB_PASSWORD) 
  : '';

// Log de diagnostic (sans afficher le mot de passe)
console.log('📊 Configuration base de données:');
console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  Port: ${process.env.DB_PORT || '5432'}`);
console.log(`  Database: ${process.env.DB_NAME || '(non défini)'}`);
console.log(`  User: ${process.env.DB_USER || '(non défini)'}`);
console.log(`  Password: ${process.env.DB_PASSWORD !== undefined ? '(défini)' : '(non défini)'}`);
console.log(`  SSL: ${process.env.DB_SSL === 'true' ? 'activé' : 'désactivé'}`);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: dbPassword, // Toujours une chaîne
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

