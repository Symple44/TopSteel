#!/bin/bash
# scripts/deploy.sh - Script de déploiement automatique TopSteel ERP

set -euo pipefail

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="topsteel-erp"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}🚀 TopSteel ERP - Déploiement Production${NC}"
echo "=================================================="

# Vérifications préliminaires
check_requirements() {
    echo -e "${BLUE}🔍 Vérification des prérequis...${NC}"
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker n'est pas installé${NC}"
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
        exit 1
    fi
    
    # Vérifier le fichier .env
    if [[ ! -f "$ENV_FILE" ]]; then
        echo -e "${RED}❌ Fichier $ENV_FILE manquant${NC}"
        echo -e "${YELLOW}💡 Copiez et configurez le fichier .env.production${NC}"
        exit 1
    fi
    
    # Vérifier l'espace disque (minimum 10GB)
    AVAILABLE_SPACE=$(df . | tail -1 | awk '{print $4}' | head -1)
    MIN_SPACE=10485760 # 10GB en KB
    
    if [[ $AVAILABLE_SPACE -lt $MIN_SPACE ]]; then
        echo -e "${RED}❌ Espace disque insuffisant (minimum 10GB requis)${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prérequis validés${NC}"
}

# Création du réseau Traefik
setup_traefik_network() {
    echo -e "${BLUE}🔧 Configuration du réseau Traefik...${NC}"
    
    if ! docker network ls | grep -q "traefik"; then
        docker network create traefik
        echo -e "${GREEN}✅ Réseau Traefik créé${NC}"
    else
        echo -e "${YELLOW}⚠️  Réseau Traefik déjà existant${NC}"
    fi
}

# Sauvegarde des données existantes
backup_data() {
    echo -e "${BLUE}💾 Sauvegarde des données...${NC}"
    
    if docker-compose -f $COMPOSE_FILE ps | grep -q "topsteel_postgres"; then
        mkdir -p "$BACKUP_DIR"
        
        # Sauvegarde PostgreSQL
        echo -e "${BLUE}📦 Sauvegarde PostgreSQL...${NC}"
        docker-compose -f $COMPOSE_FILE exec -T postgres pg_dumpall -U topsteel_prod > "$BACKUP_DIR/postgres_backup.sql"
        
        # Sauvegarde des volumes
        echo -e "${BLUE}📦 Sauvegarde des volumes...${NC}"
        docker run --rm -v topsteel_postgres_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
        docker run --rm -v topsteel_uploads_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/uploads_data.tar.gz -C /data .
        
        echo -e "${GREEN}✅ Sauvegarde terminée dans $BACKUP_DIR${NC}"
    else
        echo -e "${YELLOW}⚠️  Aucune donnée existante à sauvegarder${NC}"
    fi
}

# Déploiement
deploy() {
    echo -e "${BLUE}🚀 Déploiement en cours...${NC}"
    
    # Arrêt des services existants
    echo -e "${BLUE}⏹️  Arrêt des services...${NC}"
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE down
    
    # Construction des images
    echo -e "${BLUE}🏗️  Construction des images...${NC}"
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE build --parallel
    
    # Démarrage des services
    echo -e "${BLUE}🚀 Démarrage des services...${NC}"
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
    
    echo -e "${GREEN}✅ Services démarrés${NC}"
}

# Tests de santé
health_check() {
    echo -e "${BLUE}🏥 Vérification de l'état des services...${NC}"
    
    # Attendre que les services démarrent
    sleep 30
    
    # Vérifier PostgreSQL
    if docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE exec -T postgres pg_isready -U topsteel_prod; then
        echo -e "${GREEN}✅ PostgreSQL opérationnel${NC}"
    else
        echo -e "${RED}❌ PostgreSQL non accessible${NC}"
        return 1
    fi
    
    # Vérifier Redis
    if docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE exec -T redis redis-cli ping | grep -q "PONG"; then
        echo -e "${GREEN}✅ Redis opérationnel${NC}"
    else
        echo -e "${RED}❌ Redis non accessible${NC}"
        return 1
    fi
    
    # Vérifier l'API
    API_URL="http://localhost:3002/health"
    if curl -sf "$API_URL" > /dev/null; then
        echo -e "${GREEN}✅ API opérationnelle${NC}"
    else
        echo -e "${YELLOW}⚠️  API non accessible (peut nécessiter plus de temps)${NC}"
    fi
    
    # Vérifier le frontend
    WEB_URL="http://localhost:3005"
    if curl -sf "$WEB_URL" > /dev/null; then
        echo -e "${GREEN}✅ Frontend opérationnel${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend non accessible (peut nécessiter plus de temps)${NC}"
    fi
    
    echo -e "${GREEN}✅ Vérifications terminées${NC}"
}

# Affichage des informations finales
show_info() {
    echo -e "${GREEN}🎉 Déploiement terminé !${NC}"
    echo "=================================================="
    echo -e "${BLUE}📍 URLs d'accès :${NC}"
    echo "   🌐 Application principale: https://$(grep DOMAIN $ENV_FILE | cut -d'=' -f2)"
    echo "   🛒 Marketplace: https://marketplace.$(grep DOMAIN $ENV_FILE | cut -d'=' -f2)"
    echo "   🎛️  Portainer: https://portainer.$(grep DOMAIN $ENV_FILE | cut -d'=' -f2)"
    echo "   🔀 Traefik: https://traefik.$(grep DOMAIN $ENV_FILE | cut -d'=' -f2)"
    echo ""
    echo -e "${BLUE}📊 Commandes utiles :${NC}"
    echo "   📋 Logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "   📈 Status: docker-compose -f $COMPOSE_FILE ps"
    echo "   ⏹️  Stop: docker-compose -f $COMPOSE_FILE down"
    echo "   🔄 Restart: docker-compose -f $COMPOSE_FILE restart"
    echo ""
    echo -e "${YELLOW}⚠️  Important :${NC}"
    echo "   - Configurez votre DNS pour pointer vers cette IP"
    echo "   - Les certificats SSL seront générés automatiquement"
    echo "   - Sauvegardez régulièrement vos données"
}

# Fonction d'aide
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --no-backup    Ignorer la sauvegarde"
    echo "  --only-build   Construire les images uniquement"
    echo "  --help         Afficher cette aide"
    echo ""
}

# Parse les arguments
NO_BACKUP=false
ONLY_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-backup)
            NO_BACKUP=true
            shift
            ;;
        --only-build)
            ONLY_BUILD=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Option inconnue: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Exécution du script principal
main() {
    check_requirements
    setup_traefik_network
    
    if [[ "$NO_BACKUP" != true ]]; then
        backup_data
    fi
    
    if [[ "$ONLY_BUILD" == true ]]; then
        echo -e "${BLUE}🏗️  Construction des images uniquement...${NC}"
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE build --parallel
        echo -e "${GREEN}✅ Images construites${NC}"
        exit 0
    fi
    
    deploy
    health_check
    show_info
}

# Gestion des signaux
trap 'echo -e "\n${RED}❌ Déploiement interrompu${NC}"; exit 1' INT TERM

# Lancement du script principal
main