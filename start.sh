#!/bin/bash
# Script de démarrage pour Plesk
# Ce script démarre le serveur Node.js qui sert aussi le client

# Aller dans le dossier server
cd "$(dirname "$0")/server"

# Vérifier si node_modules existe, sinon installer les dépendances
if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances..."
    npm install
fi

# Démarrer le serveur Node.js
echo "Démarrage du serveur..."
node index.js

