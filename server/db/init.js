// Script d'initialisation de la base de données MariaDB
// Exécute le schéma SQL pour créer les tables
import pool, { closePool } from './connection.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initialise la base de données en exécutant le schéma SQL MariaDB
 */
async function initDatabase() {
  try {
    console.log('Connecting to MariaDB database...');
    
    // Lire le fichier schema-mariadb.sql
    const schemaPath = join(__dirname, 'schema-mariadb.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Exécuter le schéma
    await pool.query(schema);
    
    console.log('✅ Database schema created successfully');
    console.log('Tables created: users, matches, user_matches, discord_links');
    
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    await closePool();
    process.exit(1);
  }
}

// Exécuter l'initialisation
initDatabase();

