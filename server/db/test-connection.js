// Script de test pour vérifier la connexion PostgreSQL
import pool from './connection.js';

async function testConnection() {
  try {
    console.log('Testing PostgreSQL connection...');
    
    // Test simple de connexion
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful!');
    console.log('Current database time:', result.rows[0].now);
    
    // Vérifier si les tables existent
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Existing tables:');
    if (tablesResult.rows.length === 0) {
      console.log('  No tables found. Run: node db/init.js');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. Database credentials in environment variables');
    console.error('2. Database server is running');
    console.error('3. Database exists');
    await pool.end();
    process.exit(1);
  }
}

testConnection();

