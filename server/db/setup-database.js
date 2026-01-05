/**
 * Script de setup automatique de la base de données MariaDB
 * Crée la base de données, initialise le schéma et exécute les migrations
 * 
 * Usage: node server/db/setup-database.js
 */

import mysql from 'mysql2/promise';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import dotenv from 'dotenv';

// Charger les variables d'environnement
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..', '..');
dotenv.config({ path: join(projectRoot, '.env') });

// Configuration de connexion
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true // Permet d'exécuter plusieurs requêtes SQL
};

const dbName = process.env.DB_NAME || 'typingpvp';

console.log('🚀 Setup automatique de la base de données MariaDB');
console.log('================================================\n');
console.log(`📊 Configuration:`);
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbName}`);
console.log(`   User: ${dbConfig.user}\n`);

/**
 * Crée la base de données si elle n'existe pas
 */
async function createDatabase() {
  let connection;
  try {
    console.log('📦 Étape 1/4 : Création de la base de données...');
    
    // Se connecter sans spécifier la base de données
    connection = await mysql.createConnection({
      ...dbConfig,
      database: undefined
    });
    
    // Créer la base de données si elle n'existe pas
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    console.log(`   ✅ Base de données '${dbName}' créée ou déjà existante\n`);
    
    await connection.end();
  } catch (error) {
    console.error('   ❌ Erreur lors de la création de la base de données:', error.message);
    if (connection) await connection.end();
    throw error;
  }
}

/**
 * Initialise le schéma de base
 */
async function initSchema() {
  let connection;
  try {
    console.log('📋 Étape 2/4 : Initialisation du schéma...');
    
    const schemaPath = join(__dirname, 'schema-mariadb.sql');
    
    if (!existsSync(schemaPath)) {
      throw new Error(`Fichier schema-mariadb.sql non trouvé: ${schemaPath}`);
    }
    
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Se connecter à la base de données
    connection = await mysql.createConnection({
      ...dbConfig,
      database: dbName
    });
    
    // Exécuter le schéma
    await connection.query(schema);
    
    console.log('   ✅ Schéma initialisé avec succès\n');
    
    await connection.end();
  } catch (error) {
    console.error('   ❌ Erreur lors de l\'initialisation du schéma:', error.message);
    if (connection) await connection.end();
    throw error;
  }
}

/**
 * Exécute une migration
 */
async function runMigration(migrationName) {
  let connection;
  try {
    // Essayer d'abord la version MariaDB, puis PostgreSQL en fallback
    let migrationFile = join(__dirname, 'migrations', `${migrationName}-mariadb.sql`);
    if (!existsSync(migrationFile)) {
      migrationFile = join(__dirname, 'migrations', `${migrationName}.sql`);
    }
    
    if (!existsSync(migrationFile)) {
      console.log(`   ⚠️  Migration ${migrationName} non trouvée, ignorée`);
      return;
    }
    
    const sql = readFileSync(migrationFile, 'utf-8');
    
    connection = await mysql.createConnection({
      ...dbConfig,
      database: dbName
    });
    
    // Exécuter la migration
    await connection.query(sql);
    
    console.log(`   ✅ Migration '${migrationName}' exécutée`);
    
    await connection.end();
  } catch (error) {
    // Si c'est une erreur "already exists", c'est OK
    if (error.message.includes('already exists') || 
        error.code === 1050 || // ER_DUP_TABLE
        error.code === 1060 || // ER_DUP_FIELDNAME
        error.code === 1061 || // ER_DUP_KEYNAME
        error.code === 'ER_DUP_TABLE' ||
        error.code === 'ER_DUP_FIELDNAME' ||
        error.code === 'ER_DUP_KEYNAME') {
      console.log(`   ⏭️  Migration '${migrationName}' déjà exécutée`);
    } else {
      console.error(`   ❌ Erreur lors de la migration '${migrationName}':`, error.message);
      if (connection) await connection.end();
      throw error;
    }
    if (connection) await connection.end();
  }
}

/**
 * Exécute toutes les migrations nécessaires
 */
async function runMigrations() {
  console.log('🔄 Étape 3/4 : Exécution des migrations...');
  
  const migrations = [
    'add_oauth',
    'add_preferences',
    'add_discord_links'
  ];
  
  for (const migration of migrations) {
    await runMigration(migration);
  }
  
  console.log('   ✅ Toutes les migrations exécutées\n');
}

/**
 * Vérifie que tout fonctionne
 */
async function verifySetup() {
  let connection;
  try {
    console.log('✅ Étape 4/4 : Vérification du setup...');
    
    connection = await mysql.createConnection({
      ...dbConfig,
      database: dbName
    });
    
    // Vérifier que les tables existent
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME IN ('users', 'matches', 'user_matches', 'discord_links')
      ORDER BY TABLE_NAME
    `, [dbName]);
    
    const tableNames = tables.map(t => t.TABLE_NAME);
    const expectedTables = ['users', 'matches', 'user_matches'];
    const optionalTables = ['discord_links'];
    
    let allOk = true;
    
    for (const table of expectedTables) {
      if (tableNames.includes(table)) {
        console.log(`   ✅ Table '${table}' existe`);
      } else {
        console.log(`   ❌ Table '${table}' manquante`);
        allOk = false;
      }
    }
    
    for (const table of optionalTables) {
      if (tableNames.includes(table)) {
        console.log(`   ✅ Table '${table}' existe (optionnelle)`);
      } else {
        console.log(`   ⚠️  Table '${table}' manquante (optionnelle, exécutez la migration si nécessaire)`);
      }
    }
    
    // Vérifier les colonnes importantes
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME IN ('provider', 'preferences')
    `, [dbName]);
    
    const columnNames = columns.map(c => c.COLUMN_NAME);
    
    if (columnNames.includes('provider')) {
      console.log(`   ✅ Colonne 'users.provider' existe`);
    } else {
      console.log(`   ⚠️  Colonne 'users.provider' manquante (exécutez la migration add_oauth)`);
    }
    
    if (columnNames.includes('preferences')) {
      console.log(`   ✅ Colonne 'users.preferences' existe`);
    } else {
      console.log(`   ⚠️  Colonne 'users.preferences' manquante (exécutez la migration add_preferences)`);
    }
    
    await connection.end();
    
    if (allOk) {
      console.log('\n🎉 Setup terminé avec succès !');
      console.log('✅ La base de données est prête à être utilisée.\n');
    } else {
      console.log('\n⚠️  Setup terminé avec des avertissements.');
      console.log('   Vérifiez les messages ci-dessus.\n');
    }
    
  } catch (error) {
    console.error('   ❌ Erreur lors de la vérification:', error.message);
    if (connection) await connection.end();
    throw error;
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // Étape 1 : Créer la base de données
    await createDatabase();
    
    // Étape 2 : Initialiser le schéma
    await initSchema();
    
    // Étape 3 : Exécuter les migrations
    await runMigrations();
    
    // Étape 4 : Vérifier que tout fonctionne
    await verifySetup();
    
    console.log('✨ Tout est prêt ! Vous pouvez maintenant démarrer l\'application.');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erreur fatale lors du setup:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le setup
main();

