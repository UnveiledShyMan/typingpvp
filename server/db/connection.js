// Configuration de la connexion PostgreSQL
import pkg from 'pg';
const { Pool } = pkg;

// S'assurer que les variables d'environnement sont chargées
// (normalement fait dans index.js, mais on s'assure ici aussi)
if (typeof process.env.DB_PASSWORD === 'undefined') {
  console.warn('⚠️ DB_PASSWORD n\'est pas défini dans les variables d\'environnement');
}

/**
 * Pool de connexions PostgreSQL
 * Utilise les variables d'environnement pour la configuration
 */
// S'assurer que le mot de passe est toujours une chaîne valide
// PostgreSQL exige que password soit une chaîne si fourni
// Gérer les cas où DB_PASSWORD peut être null, undefined, ou un nombre
// Convertir explicitement en string pour éviter les erreurs de type
let dbPassword = '';
if (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== null) {
  // Convertir en string de manière explicite - même si c'est une chaîne vide
  // PostgreSQL accepte une chaîne vide comme mot de passe
  dbPassword = String(process.env.DB_PASSWORD);
  // Vérification supplémentaire : s'assurer que c'est bien une chaîne
  if (typeof dbPassword !== 'string') {
    console.warn('⚠️ DB_PASSWORD n\'est pas une chaîne, conversion forcée');
    dbPassword = String(dbPassword || '');
  }
}

// Log de diagnostic (sans afficher le mot de passe)
console.log('📊 Configuration base de données:');
console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  Port: ${process.env.DB_PORT || '5432'}`);
console.log(`  Database: ${process.env.DB_NAME || '(non défini)'}`);
console.log(`  User: ${process.env.DB_USER || '(non défini)'}`);
console.log(`  Password: ${process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== null ? '(défini)' : '(non défini)'}`);
console.log(`  Password type: ${typeof dbPassword}, length: ${dbPassword.length}`);
console.log(`  SSL: ${process.env.DB_SSL === 'true' ? 'activé' : 'désactivé'}`);

// Créer la configuration de connexion
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  // SSL peut être nécessaire selon la configuration Plesk
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Configuration du pool
  max: 20, // Maximum de connexions dans le pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Ajouter le mot de passe seulement s'il est défini et non vide
// PostgreSQL exige que password soit une chaîne si fourni
// S'assurer que le mot de passe est toujours une chaîne avant de l'ajouter
if (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== null && process.env.DB_PASSWORD !== '') {
  // Double vérification : s'assurer que dbPassword est bien une chaîne
  const finalPassword = typeof dbPassword === 'string' ? dbPassword : String(dbPassword || '');
  // Ne l'ajouter que si ce n'est pas une chaîne vide
  if (finalPassword && finalPassword.length > 0) {
    poolConfig.password = finalPassword;
  }
}

const pool = new Pool(poolConfig);

// Gestion des erreurs de connexion
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;

