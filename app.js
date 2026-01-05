// Script principal pour Plesk Node.js
// Ce fichier est le point d'entrée que Plesk va exécuter
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SERVER_DIR = join(__dirname, 'server');
const CLIENT_DIST_DIR = join(__dirname, 'client', 'dist');

/**
 * Vérifie si la base de données est initialisée
 * IMPORTANT: Ne pas fermer le pool, il est partagé avec l'application
 */
async function checkDatabase() {
  try {
    const pool = (await import('./server/db/connection.js')).default;
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const tablesExist = result.rows[0].exists;
    // NE PAS fermer le pool, il est partagé avec l'application
    // Le pool sera fermé automatiquement à la fin du processus
    
    return tablesExist;
  } catch (error) {
    console.error('Erreur lors de la vérification de la base de données:', error.message);
    return false;
  }
}

/**
 * Initialise la base de données
 * IMPORTANT: Ne pas fermer le pool, il est partagé avec l'application
 */
async function initDatabase() {
  try {
    console.log('Initialisation de la base de données...');
    const { readFileSync } = await import('fs');
    const pool = (await import('./server/db/connection.js')).default;
    const { join } = await import('path');
    
    const schemaPath = join(__dirname, 'server', 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    // NE PAS fermer le pool, il est partagé avec l'application
    // Le pool sera fermé automatiquement à la fin du processus
    
    console.log('✅ Base de données initialisée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error.message);
    return false;
  }
}

/**
 * Vérifie si le client est buildé
 * (Non utilisé maintenant car on supprime toujours dist/ avant de builder)
 */
function checkClientBuild() {
  const indexHtml = join(CLIENT_DIST_DIR, 'index.html');
  return existsSync(indexHtml);
}

/**
 * Build le client si nécessaire
 * Supprime client/dist/ avant de builder pour forcer un rebuild propre
 */
async function buildClient() {
  try {
    console.log('Vérification du client...');
    const clientDir = join(__dirname, 'client');
    const clientDistDir = join(__dirname, 'client', 'dist');
    
    // Supprimer client/dist/ s'il existe pour forcer un rebuild propre
    if (existsSync(clientDistDir)) {
      console.log('Suppression de client/dist/ pour forcer un rebuild propre...');
      const { rmSync } = await import('fs');
      rmSync(clientDistDir, { recursive: true, force: true });
      console.log('✅ client/dist/ supprimé');
    }
    
    // Vérifier si node_modules existe
    if (!existsSync(join(clientDir, 'node_modules'))) {
      console.log('Installation des dépendances client...');
      try {
        const { stdout, stderr } = await execAsync('npm install', { 
          cwd: clientDir,
          shell: true,
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer pour les gros outputs
        });
        if (stdout) console.log(stdout);
        if (stderr) console.error('npm install stderr:', stderr);
        console.log('✅ Dépendances client installées');
      } catch (installError) {
        console.error('❌ Erreur lors de l\'installation des dépendances:', installError.message);
        if (installError.stdout) console.error('stdout:', installError.stdout);
        if (installError.stderr) console.error('stderr:', installError.stderr);
        throw installError;
      }
    } else {
      console.log('✅ node_modules existe déjà');
    }
    
    // Créer .env.production si il n'existe pas
    const envProdPath = join(clientDir, '.env.production');
    // VITE_API_URL doit pointer vers l'API (le serveur), pas vers le client
    // En production, si client et serveur sont sur le même domaine, utiliser l'URL du domaine
    const apiUrl = process.env.VITE_API_URL || process.env.CLIENT_URL || 'https://typingpvp.com';
    if (!existsSync(envProdPath)) {
      console.log('Création de .env.production avec URL de l\'API...');
      const envContent = `VITE_API_URL=${apiUrl}\n`;
      const { writeFileSync } = await import('fs');
      writeFileSync(envProdPath, envContent, 'utf8');
      console.log(`✅ .env.production créé avec VITE_API_URL=${apiUrl}`);
    } else {
      // Mettre à jour .env.production avec la bonne URL si nécessaire
      const { readFileSync, writeFileSync } = await import('fs');
      const envContent = `VITE_API_URL=${apiUrl}\n`;
      writeFileSync(envProdPath, envContent, 'utf8');
      console.log(`✅ .env.production mis à jour avec VITE_API_URL=${apiUrl}`);
    }
    
    // Builder
    console.log('Build du client en cours...');
    try {
      const { stdout, stderr } = await execAsync('npm run build', { 
        cwd: clientDir,
        shell: true,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      if (stdout) console.log(stdout);
      if (stderr) console.error('npm build stderr:', stderr);
      
      // Vérifier que le dossier dist a été créé
      if (!existsSync(clientDistDir)) {
        throw new Error('Le dossier client/dist n\'a pas été créé après le build');
      }
      
      // Vérifier que index.html existe
      const indexPath = join(clientDistDir, 'index.html');
      if (!existsSync(indexPath)) {
        throw new Error('index.html n\'existe pas dans client/dist après le build');
      }
      
      console.log('✅ Client buildé avec succès');
      return true;
    } catch (buildError) {
      console.error('❌ Erreur lors du build du client:', buildError.message);
      if (buildError.stdout) {
        console.error('Build stdout:', buildError.stdout);
      }
      if (buildError.stderr) {
        console.error('Build stderr:', buildError.stderr);
      }
      throw buildError;
    }
  } catch (error) {
    console.error('❌ Erreur lors du build du client:', error.message);
    console.error('⚠️ Le serveur va démarrer quand même, mais le client ne sera pas accessible');
    console.error('⚠️ Vérifiez les logs ci-dessus pour plus de détails');
    return false;
  }
}

/**
 * Vérifie et installe les dépendances du serveur si nécessaire
 */
async function checkServerDependencies() {
  const nodeModulesPath = join(SERVER_DIR, 'node_modules');
  
  if (!existsSync(nodeModulesPath)) {
    try {
      console.log('Installation des dépendances serveur...');
      const { stdout, stderr } = await execAsync('npm install', { 
        cwd: SERVER_DIR,
        shell: true,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      if (stdout) console.log(stdout);
      if (stderr) console.error('npm install stderr:', stderr);
      console.log('✅ Dépendances serveur installées');
    } catch (error) {
      console.error('❌ Erreur lors de l\'installation des dépendances serveur:', error.message);
      if (error.stdout) console.error('stdout:', error.stdout);
      if (error.stderr) console.error('stderr:', error.stderr);
      throw error;
    }
  } else {
    console.log('✅ Dépendances serveur déjà installées');
  }
}

/**
 * Démarre le serveur
 */
async function startServer() {
  // Importer et exécuter le serveur
  console.log('Démarrage du serveur...');
  // Pour Plesk, on sert aussi le client depuis le serveur
  process.env.SERVE_CLIENT = 'true';
  await import('./server/index.js');
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de TypingPVP...\n');
  
  try {
    // 1. Vérifier les dépendances serveur
    await checkServerDependencies();
    
    // 2. Builder le client (supprime client/dist/ et rebuild)
    // ATTENDRE que le build soit terminé avant de démarrer le serveur
    console.log('📦 Build du client en cours...');
    try {
      const clientBuilt = await buildClient();
      if (!clientBuilt) {
        console.error('❌ Le build du client a échoué.');
        console.error('⚠️ Le serveur va démarrer quand même, mais le client ne sera pas accessible.');
        console.error('⚠️ Vérifiez les logs ci-dessus pour voir l\'erreur de build.');
        
        // Vérifier si client/dist existe malgré l'échec
        const clientDistPath = join(__dirname, 'client', 'dist');
        if (existsSync(clientDistPath)) {
          console.log('✅ Le dossier client/dist existe malgré l\'erreur de build.');
        } else {
          console.error('❌ Le dossier client/dist n\'existe pas. Le client ne sera pas accessible.');
        }
      } else {
        // Vérifier que client/dist existe après le build réussi
        const clientDistPath = join(__dirname, 'client', 'dist');
        if (existsSync(clientDistPath)) {
          console.log('✅ Build du client réussi, dossier client/dist vérifié.');
        } else {
          console.error('⚠️ Build réussi mais client/dist n\'existe pas. Il y a peut-être un problème.');
        }
      }
    } catch (buildError) {
      console.error('❌ Erreur lors du build du client:', buildError);
      console.error('⚠️ Le serveur va démarrer quand même pour permettre le diagnostic.');
      
      // Vérifier si client/dist existe malgré l'erreur
      const clientDistPath = join(__dirname, 'client', 'dist');
      if (existsSync(clientDistPath)) {
        console.log('✅ Le dossier client/dist existe malgré l\'erreur.');
      } else {
        console.error('❌ Le dossier client/dist n\'existe pas.');
      }
    }
    
    // 3. Vérifier et initialiser la base de données
    const dbInitialized = await checkDatabase();
    if (!dbInitialized) {
      console.log('⚠️ Base de données non initialisée');
      const initialized = await initDatabase();
      if (!initialized) {
        console.error('❌ Impossible d\'initialiser la base de données. Vérifiez les variables d\'environnement DB_*');
        process.exit(1);
      }
    }
    
    // 4. Démarrer le serveur
    await startServer();
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Lancer l'application
main();

