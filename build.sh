#!/bin/bash
# Script de build pour le client React
# À exécuter avant de démarrer le serveur en production

echo "Building le client React..."

# Aller dans le dossier client
cd "$(dirname "$0")/client"

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances client..."
    npm install
fi

# Builder le client
echo "Build en cours..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build réussi ! Le client est dans client/dist/"
else
    echo "❌ Erreur lors du build"
    exit 1
fi

