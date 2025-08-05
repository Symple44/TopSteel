#!/bin/bash
# scripts/setup-server.sh - Configuration initiale du serveur Proxmox

set -euo pipefail

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏗️  TopSteel ERP - Configuration Serveur Proxmox${NC}"
echo "======================================================"

# Vérifier les privilèges root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}❌ Ce script doit être exécuté en tant que root${NC}"
        echo "Utilisation: sudo $0"
        exit 1
    fi
}

# Mise à jour du système
update_system() {
    echo -e "${BLUE}📦 Mise à jour du système...${NC}"
    apt update && apt upgrade -y
    apt install -y curl wget git vim htop tree unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    echo -e "${GREEN}✅ Système mis à jour${NC}"
}

# Installation de Docker
install_docker() {
    echo -e "${BLUE}🐳 Installation de Docker...${NC}"
    
    # Supprimer les anciennes versions
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Ajouter la clé GPG officielle de Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Ajouter le repository Docker
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Installer Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Démarrer et activer Docker
    systemctl start docker
    systemctl enable docker
    
    # Ajouter l'utilisateur au groupe docker
    usermod -aG docker $SUDO_USER 2>/dev/null || true
    
    echo -e "${GREEN}✅ Docker installé$(NC}"
}

# Installation de Docker Compose
install_docker_compose() {
    echo -e "${BLUE}🔧 Installation de Docker Compose...${NC}"
    
    # Télécharger la dernière version
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d '"' -f 4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Rendre exécutable
    chmod +x /usr/local/bin/docker-compose
    
    # Créer un lien symbolique
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    echo -e "${GREEN}✅ Docker Compose installé${NC}"
}

# Configuration du firewall
setup_firewall() {
    echo -e "${BLUE}🔥 Configuration du firewall...${NC}"
    
    # Installer UFW si pas déjà présent
    apt install -y ufw
    
    # Règles de base
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Autoriser SSH
    ufw allow 22/tcp
    
    # Autoriser HTTP et HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Autoriser les ports de l'application (pour debug/maintenance)
    ufw allow 3002/tcp comment "TopSteel API"
    ufw allow 3004/tcp comment "Marketplace API"
    ufw allow 3005/tcp comment "TopSteel Web"
    ufw allow 3007/tcp comment "Marketplace Web"
    
    # Autoriser Portainer et Traefik dashboard
    ufw allow 8080/tcp comment "Traefik Dashboard"
    ufw allow 9000/tcp comment "Portainer"
    
    # Activer le firewall
    ufw --force enable
    
    echo -e "${GREEN}✅ Firewall configuré${NC}"
}

# Configuration des limites système
configure_limits() {
    echo -e "${BLUE}⚙️  Configuration des limites système...${NC}"
    
    # Augmenter les limites pour Docker
    cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
* soft memlock unlimited
* hard memlock unlimited
EOF
    
    # Configuration sysctl pour Docker et PostgreSQL
    cat >> /etc/sysctl.conf << EOF

# Configuration TopSteel ERP
vm.max_map_count=262144
net.core.somaxconn=65535
net.ipv4.tcp_tw_reuse=1
net.ipv4.ip_local_port_range=1024 65535
fs.file-max=2097152
EOF
    
    # Appliquer les modifications
    sysctl -p
    
    echo -e "${GREEN}✅ Limites système configurées${NC}"
}

# Configuration des swap
setup_swap() {
    echo -e "${BLUE}💾 Configuration du swap...${NC}"
    
    # Vérifier si swap existe déjà
    if [[ $(swapon -s | wc -l) -gt 1 ]]; then
        echo -e "${YELLOW}⚠️  Swap déjà configuré${NC}"
        return
    fi
    
    # Créer un fichier de swap de 4GB
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    # Ajouter à fstab pour persistance
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    
    # Optimiser l'utilisation du swap
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    
    echo -e "${GREEN}✅ Swap configuré (4GB)${NC}"
}

# Installation des outils de monitoring
install_monitoring_tools() {
    echo -e "${BLUE}📊 Installation des outils de monitoring...${NC}"
    
    apt install -y htop iotop nethogs ncdu fail2ban logrotate
    
    # Configuration de fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
    
    # Configuration de logrotate pour Docker
    cat > /etc/logrotate.d/docker << EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF
    
    echo -e "${GREEN}✅ Outils de monitoring installés${NC}"
}

# Création de l'utilisateur de déploiement
create_deploy_user() {
    echo -e "${BLUE}👤 Création de l'utilisateur de déploiement...${NC}"
    
    # Créer l'utilisateur topsteel
    if ! id "topsteel" &>/dev/null; then
        useradd -m -s /bin/bash topsteel
        usermod -aG docker topsteel
        usermod -aG sudo topsteel
        
        # Créer le répertoire de déploiement
        mkdir -p /home/topsteel/app
        chown topsteel:topsteel /home/topsteel/app
        
        echo -e "${GREEN}✅ Utilisateur 'topsteel' créé${NC}"
        echo -e "${YELLOW}💡 Pensez à configurer l'authentification SSH pour cet utilisateur${NC}"
    else
        echo -e "${YELLOW}⚠️  Utilisateur 'topsteel' déjà existant${NC}"
    fi
}

# Configuration des logs
setup_logging() {
    echo -e "${BLUE}📝 Configuration des logs...${NC}"
    
    # Créer le répertoire de logs
    mkdir -p /var/log/topsteel
    chown topsteel:topsteel /var/log/topsteel
    
    # Configuration rsyslog pour TopSteel
    cat > /etc/rsyslog.d/50-topsteel.conf << EOF
# TopSteel ERP logs
:programname,isequal,"topsteel" /var/log/topsteel/app.log
& stop
EOF
    
    # Redémarrer rsyslog
    systemctl restart rsyslog
    
    echo -e "${GREEN}✅ Configuration des logs terminée${NC}"
}

# Tests de configuration
run_tests() {
    echo -e "${BLUE}🧪 Vérification de la configuration...${NC}"
    
    # Test Docker
    if docker --version > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker opérationnel${NC}"
    else
        echo -e "${RED}❌ Docker non opérationnel${NC}"
        return 1
    fi
    
    # Test Docker Compose
    if docker-compose --version > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker Compose opérationnel${NC}"
    else
        echo -e "${RED}❌ Docker Compose non opérationnel${NC}"
        return 1
    fi
    
    # Test réseau
    if docker network create test-network > /dev/null 2>&1; then
        docker network rm test-network
        echo -e "${GREEN}✅ Réseau Docker opérationnel${NC}"
    else
        echo -e "${RED}❌ Réseau Docker non opérationnel${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Tous les tests passés${NC}"
}

# Affichage des informations finales
show_final_info() {
    echo -e "${GREEN}🎉 Configuration du serveur terminée !${NC}"
    echo "=================================================="
    echo -e "${BLUE}📋 Prochaines étapes :${NC}"
    echo ""
    echo "1. 🔑 Configurez l'authentification SSH pour l'utilisateur 'topsteel'"
    echo "2. 📁 Clonez le repository TopSteel dans /home/topsteel/app"
    echo "3. ⚙️  Configurez le fichier .env.production"
    echo "4. 🚀 Lancez le déploiement avec ./scripts/deploy.sh"
    echo ""
    echo -e "${BLUE}🔧 Informations système :${NC}"
    echo "   - Docker: $(docker --version)"
    echo "   - Docker Compose: $(docker-compose --version)"
    echo "   - Utilisateur de déploiement: topsteel"
    echo "   - Répertoire de l'app: /home/topsteel/app"
    echo "   - Swap: $(free -h | grep Swap | awk '{print $2}')"
    echo ""
    echo -e "${YELLOW}⚠️  N'oubliez pas de :${NC}"
    echo "   - Configurer votre DNS"
    echo "   - Ouvrir les ports sur votre routeur/firewall"
    echo "   - Sauvegarder régulièrement vos données"
    echo ""
    echo -e "${BLUE}🔄 Redémarrage recommandé pour appliquer toutes les modifications${NC}"
}

# Fonction principale
main() {
    check_root
    update_system
    install_docker
    install_docker_compose
    setup_firewall
    configure_limits
    setup_swap
    install_monitoring_tools
    create_deploy_user
    setup_logging
    run_tests
    show_final_info
}

# Gestion des erreurs
trap 'echo -e "\n${RED}❌ Configuration interrompue${NC}"; exit 1' INT TERM

# Lancement
main

echo -e "${GREEN}✨ Serveur prêt pour TopSteel ERP !${NC}"