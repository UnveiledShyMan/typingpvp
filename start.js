// Script Node.js pour démarrer le serveur et le client séparément
// Utilise child_process pour lancer les deux processus en parallèle
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SERVER_DIR = join(__dirname, 'server');
const CLIENT_DIR = join(__dirname, 'client');

// Ports configurés
const SERVER_PORT = process.env.PORT || 3001;
const CLIENT_PORT = process.env.CLIENT_PORT || 5173;

console.log('🚀 Démarrage de TypingPVP...\n');
console.log(`📡 Serveur API: http://localhost:${SERVER_PORT}`);
console.log(`🌐 Client: http://localhost:${CLIENT_PORT}\n`);

// Vérifier que les dépendances sont installées
if (!existsSync(join(SERVER_DIR, 'node_modules'))) {
  console.error('❌ Dépendances serveur non installées. Exécutez: npm run install:all');
  process.exit(1);
}

if (!existsSync(join(CLIENT_DIR, 'node_modules'))) {
  console.error('❌ Dépendances client non installées. Exécutez: npm run install:all');
  process.exit(1);
}

// Démarrer le serveur
console.log('📡 Démarrage du serveur...');
const serverProcess = spawn('node', ['index.js'], {
  cwd: SERVER_DIR,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: SERVER_PORT,
    HOST: process.env.HOST || '0.0.0.0',
    CLIENT_URL: `http://localhost:${CLIENT_PORT}`
  }
});

// Démarrer le client
console.log('🌐 Démarrage du client...');
// Sur Windows, utiliser shell: true pour exécuter npm
const clientProcess = spawn('npm', ['run', 'dev'], {
  cwd: CLIENT_DIR,
  stdio: 'inherit',
  shell: process.platform === 'win32', // Nécessaire sur Windows pour npm
  env: {
    ...process.env,
    PORT: CLIENT_PORT,
    VITE_API_URL: `http://localhost:${SERVER_PORT}`
  }
});

// Gestion des erreurs
serverProcess.on('error', (error) => {
  console.error('❌ Erreur serveur:', error);
  process.exit(1);
});

clientProcess.on('error', (error) => {
  console.error('❌ Erreur client:', error);
  process.exit(1);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n\n🛑 Arrêt en cours...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Arrêt en cours...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
});

