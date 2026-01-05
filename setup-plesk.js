#!/usr/bin/env node
/**
 * Script d'installation automatique pour Plesk (Node.js)
 * Configure tout : dépendances, base de données, schéma, migrations
 * 
 * Usage: node setup-plesk.js
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname);

// Charger .env si disponible
if (existsSync(join(projectRoot, '.env'))) {
  dotenv.config({ path: join(projectRoot, '.env') });
}

console.log('🚀 Installation automatique TypingPVP pour Plesk');
console.log('================================================\n');

/**
 * Exécute une commande et affiche le résultat
 */
function runCommand(command, cwd = projectRoot, description = '') {
  try {
    if (description) {
      console.log(`📦 ${description}...`);
    }
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      shell: true
    });
    if (description) {
      console.log(`   ✅ ${description} terminé\n`);
    }
    return true;
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}\n`);
    return false;
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // Étape 1 : Installer les dépendances
    console.log('📦 Étape 1/4 : Installation des dépendances\n');
    
    if (existsSync(join(projectRoot, 'package.json'))) {
      runCommand('npm install', projectRoot, 'Installation des dépendances racine');
    }
    
    if (existsSync(join(projectRoot, 'server', 'package.json'))) {
      runCommand('npm install', join(projectRoot, 'server'), 'Installation des dépendances serveur');
    }
    
    if (existsSync(join(projectRoot, 'client', 'package.json'))) {
      runCommand('npm install', join(projectRoot, 'client'), 'Installation des dépendances client');
    }
    
    // Étape 2 : Vérifier le fichier .env
    console.log('📋 Étape 2/4 : Vérification de la configuration\n');
    
    const envPath = join(projectRoot, '.env');
    const envExamplePath = join(projectRoot, '.env.example');
    
    if (!existsSync(envPath)) {
      console.log('⚠️  Fichier .env non trouvé');
      if (existsSync(envExamplePath)) {
        console.log('   Création d\'un fichier .env depuis .env.example...');
        const envExample = readFileSync(envExamplePath, 'utf-8');
        // Ne pas écraser si .env existe déjà
        if (!existsSync(envPath)) {
          writeFileSync(envPath, envExample);
          console.log('   ⚠️  Veuillez configurer le fichier .env avec vos identifiants MariaDB\n');
        }
      } else {
        console.log('   ❌ Fichier .env.example non trouvé\n');
      }
    } else {
      console.log('✅ Fichier .env trouvé\n');
    }
    
    // Étape 3 : Setup de la base de données
    console.log('🗄️  Étape 3/4 : Configuration de la base de données\n');
    
    const setupDbPath = join(projectRoot, 'server', 'db', 'setup-database.js');
    if (existsSync(setupDbPath)) {
      // Exécuter le script de setup de la base de données
      runCommand(`node ${setupDbPath}`, projectRoot, 'Configuration de la base de données');
    } else {
      console.log('❌ Script setup-database.js non trouvé');
      process.exit(1);
    }
    
    // Étape 4 : Build du client (optionnel)
    console.log('🏗️  Étape 4/4 : Build du client (optionnel)\n');
    
    if (existsSync(join(projectRoot, 'client', 'package.json'))) {
      // En mode automatique, on build toujours (pour Plesk)
      // Mais on peut ajouter une option pour skip
      const skipBuild = process.argv.includes('--skip-build');
      
      if (!skipBuild) {
        const buildSuccess = runCommand('npm run build', join(projectRoot, 'client'), 'Build du client');
        if (!buildSuccess) {
          console.log('⚠️  Le build du client a échoué, mais vous pouvez continuer\n');
        }
      } else {
        console.log('⏭️  Build du client ignoré (--skip-build)\n');
      }
    } else {
      console.log('⏭️  Dossier client non trouvé, build ignoré\n');
    }
    
    console.log('🎉 Installation terminée avec succès !\n');
    console.log('📝 Prochaines étapes :');
    console.log('   1. Vérifiez que votre fichier .env est correctement configuré');
    console.log('   2. Démarrez le serveur avec: npm run dev');
    console.log('   3. Ou configurez Plesk pour utiliser: npm start\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erreur fatale lors de l\'installation:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter l'installation
main();

