#!/bin/bash
# Script d'installation automatique pour Plesk
# Configure tout : dépendances, base de données, schéma, migrations

set -e  # Arrêter en cas d'erreur

echo "🚀 Installation automatique TypingPVP pour Plesk"
echo "================================================"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js trouvé: $(node --version)${NC}"
echo ""

# Étape 1 : Installer les dépendances
echo "📦 Étape 1/4 : Installation des dépendances..."
echo ""

if [ -f "package.json" ]; then
    echo "   Installation des dépendances racine..."
    npm install
    echo ""
fi

if [ -d "server" ] && [ -f "server/package.json" ]; then
    echo "   Installation des dépendances serveur..."
    cd server
    npm install
    cd ..
    echo ""
fi

if [ -d "client" ] && [ -f "client/package.json" ]; then
    echo "   Installation des dépendances client..."
    cd client
    npm install
    cd ..
    echo ""
fi

echo -e "${GREEN}✅ Dépendances installées${NC}"
echo ""

# Étape 2 : Vérifier le fichier .env
echo "📋 Étape 2/4 : Vérification de la configuration..."
echo ""

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Fichier .env non trouvé${NC}"
    echo "   Création d'un fichier .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}   ⚠️  Veuillez configurer le fichier .env avec vos identifiants MariaDB${NC}"
    else
        echo -e "${RED}   ❌ Fichier .env.example non trouvé${NC}"
    fi
else
    echo -e "${GREEN}✅ Fichier .env trouvé${NC}"
fi

echo ""

# Étape 3 : Setup de la base de données
echo "🗄️  Étape 3/4 : Configuration de la base de données..."
echo ""

if [ -f "server/db/setup-database.js" ]; then
    node server/db/setup-database.js
    echo ""
else
    echo -e "${RED}❌ Script setup-database.js non trouvé${NC}"
    exit 1
fi

# Étape 4 : Build du client (optionnel)
echo "🏗️  Étape 4/4 : Build du client (optionnel)..."
echo ""

if [ -d "client" ] && [ -f "client/package.json" ]; then
    read -p "   Voulez-vous builder le client maintenant ? (o/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        cd client
        npm run build
        cd ..
        echo -e "${GREEN}✅ Client buildé${NC}"
    else
        echo -e "${YELLOW}⏭️  Build du client ignoré (vous pouvez le faire plus tard avec: cd client && npm run build)${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  Dossier client non trouvé, build ignoré${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Installation terminée avec succès !${NC}"
echo ""
echo "📝 Prochaines étapes :"
echo "   1. Vérifiez que votre fichier .env est correctement configuré"
echo "   2. Démarrez le serveur avec: npm run dev"
echo "   3. Ou configurez Plesk pour utiliser: npm start"
echo ""

