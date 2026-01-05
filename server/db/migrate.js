/**
 * Script de migration pour exécuter les migrations SQL
 * Usage: node server/db/migrate.js [migration_name]
 * 
 * Exemple: node server/db/migrate.js add_oauth
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pool from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Exécute une migration SQL
 */
async function runMigration(migrationName) {
  const migrationFile = join(__dirname, 'migrations', `${migrationName}.sql`);
  
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
    
    // Vérifier que les colonnes ont été ajoutées
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
    
    // Vérifier l'index
    const indexResult = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'users'
      AND indexname = 'idx_users_provider_provider_id';
    `);
    
    if (indexResult.rows.length > 0) {
      console.log('\n📇 Index vérifié:');
      console.log(`  - ${indexResult.rows[0].indexname}`);
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution de la migration ${migrationName}:`);
    console.error(error.message);
    
    // Si c'est une erreur "already exists", c'est OK
    if (error.message.includes('already exists') || error.code === '42P07') {
      console.log('\n⚠️  La migration semble déjà avoir été exécutée (colonne/index déjà existants)');
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
    await listMigrations();
    process.exit(0);
  }
  
  if (args[0] === 'list') {
    await listMigrations();
    process.exit(0);
  }
  
  const migrationName = args[0];
  
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

