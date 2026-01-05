// Script de test pour vérifier la connexion MariaDB
import pool, { closePool } from './connection.js';

async function testConnection() {
  try {
    console.log('Testing MariaDB connection...');
    
    // Test simple de connexion
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Connection successful!');
    console.log('Current database time:', result.rows[0].current_time);
    
    // Vérifier si les tables existent
    // MariaDB utilise DATABASE() au lieu de 'public' pour le schéma
    const dbName = process.env.DB_NAME || 'typingpvp';
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
      ORDER BY table_name
    `, [dbName]);
    
    console.log('\n📋 Existing tables:');
    if (tablesResult.rows.length === 0) {
      console.log('  No tables found. Run: node server/db/init.js');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. Database credentials in environment variables');
    console.error('2. Database server is running');
    console.error('3. Database exists');
    await closePool();
    process.exit(1);
  }
}

testConnection();

