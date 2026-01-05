/**
 * Script de migration pour exécuter les migrations SQL
 * Usage: node server/db/migrate.js [migration_name]
 * 
 * Exemple: node server/db/migrate.js add_oauth
 *          node server/db/migrate.js add_discord_links
 */

// Charger les variables d'environnement depuis le .env à la racine du projet
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Trouver le chemin de la racine du projet (2 niveaux au-dessus de ce fichier)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..', '..');

// Charger le .env depuis la racine
dotenv.config({ path: join(projectRoot, '.env') });

import { readFileSync, readdirSync } from 'fs';
import pool from './connection.js';

/**
 * Exécute une migration SQL
 */
async function runMigration(migrationName) {
  // Extraire le nom de la migration si un chemin complet ou une extension est fourni
  let cleanMigrationName = migrationName;
  if (cleanMigrationName.includes('/') || cleanMigrationName.includes('\\')) {
    cleanMigrationName = cleanMigrationName.split(/[/\\]/).pop();
  }
  if (cleanMigrationName.endsWith('.sql')) {
    cleanMigrationName = cleanMigrationName.replace('.sql', '');
  }
  
  // Chercher le fichier de migration (MariaDB uniquement maintenant)
  const migrationFile = join(__dirname, 'migrations', `${cleanMigrationName}.sql`);
  
  try {
    console.log(`📄 Lecture de la migration: ${migrationFile}`);
    const sql = readFileSync(migrationFile, 'utf-8');
    
    console.log(`🚀 Exécution de la migration: ${migrationName}`);
    console.log('SQL à exécuter:');
    console.log('---');
    console.log(sql);
    console.log('---\n');
    
    // Exécuter le SQL
    await pool.query(sql);
    
    console.log(`✅ Migration ${migrationName} exécutée avec succès!`);
    
    // Vérifier que les tables/colonnes ont été créées selon la migration
    if (migrationName === 'add_discord_links') {
      const checkResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'discord_links'
        ORDER BY column_name;
      `);
      
      if (checkResult.rows.length > 0) {
        console.log('\n📊 Table discord_links vérifiée:');
        checkResult.rows.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });
      }
    } else if (cleanMigrationName === 'add_oauth') {
      const checkResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name IN ('provider', 'provider_id')
        ORDER BY column_name;
      `);
      
      if (checkResult.rows.length > 0) {
        console.log('\n📊 Colonnes vérifiées:');
        checkResult.rows.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });
      }
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution de la migration ${cleanMigrationName}:`);
    console.error(error.message);
    
    // Si c'est une erreur "already exists", c'est OK
    if (error.message.includes('already exists') || error.code === '42P07' || error.code === '23505') {
      console.log('\n⚠️  La migration semble déjà avoir été exécutée (table/colonne/index déjà existants)');
      console.log('   C\'est normal, vous pouvez continuer.');
    } else {
      process.exit(1);
    }
  }
}

/**
 * Liste toutes les migrations disponibles
 */
function listMigrations() {
  const migrationsDir = join(__dirname, 'migrations');
  
  try {
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => file.replace('.sql', ''));
    
    if (files.length === 0) {
      console.log('⚠️  Aucune migration trouvée dans le dossier migrations/');
    } else {
      console.log('📋 Migrations disponibles:');
      files.forEach(migration => {
        console.log(`  - ${migration}`);
      });
    }
  } catch (error) {
    console.error('Erreur lors de la lecture du dossier migrations:', error);
  }
}

// Point d'entrée
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔧 Script de migration SQL\n');
    console.log('Usage: node server/db/migrate.js [migration_name]');
    console.log('       node server/db/migrate.js list\n');
    console.log('Exemples:');
    console.log('  node server/db/migrate.js add_discord_links');
    console.log('  node server/db/migrate.js add_oauth');
    console.log('  node server/db/migrate.js list\n');
    await listMigrations();
    process.exit(0);
  }
  
  if (args[0] === 'list') {
    await listMigrations();
    process.exit(0);
  }
  
  // Extraire le nom de la migration (sans chemin ni extension)
  let migrationName = args[0];
  
  // Si l'utilisateur a passé un chemin, extraire juste le nom
  if (migrationName.includes('/') || migrationName.includes('\\')) {
    const parts = migrationName.split(/[/\\]/);
    migrationName = parts[parts.length - 1];
  }
  
  // Enlever l'extension .sql si présente
  if (migrationName.endsWith('.sql')) {
    migrationName = migrationName.replace('.sql', '');
  }
  
  console.log('🔧 Script de migration SQL');
  console.log('==========================\n');
  
  try {
    await runMigration(migrationName);
  } catch (error) {
    console.error('Erreur fatale:', error);
    process.exit(1);
  } finally {
    // Ne pas fermer le pool, il est partagé
    process.exit(0);
  }
}

main();
