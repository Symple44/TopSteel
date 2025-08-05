# TopSteel ERP - Makefile pour déploiement Proxmox

.PHONY: help setup deploy start stop restart logs build clean backup status health

# Configuration
COMPOSE_FILE = docker-compose.prod.yml
ENV_FILE = .env.production

# Aide par défaut
help: ## 📋 Afficher cette aide
	@echo "🚀 TopSteel ERP - Commandes de déploiement"
	@echo "=========================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Installation et configuration
setup: ## 🏗️ Configuration initiale du serveur (root requis)
	@echo "🏗️ Configuration du serveur..."
	chmod +x scripts/setup-server.sh
	sudo ./scripts/setup-server.sh

# Déploiement
deploy: ## 🚀 Déploiement complet (avec sauvegarde)
	@echo "🚀 Déploiement de TopSteel ERP..."
	chmod +x scripts/deploy.sh
	./scripts/deploy.sh

deploy-fast: ## ⚡ Déploiement rapide (sans sauvegarde)
	@echo "⚡ Déploiement rapide..."
	chmod +x scripts/deploy.sh
	./scripts/deploy.sh --no-backup

build: ## 🏗️ Construction des images Docker uniquement
	@echo "🏗️ Construction des images..."
	chmod +x scripts/deploy.sh
	./scripts/deploy.sh --only-build

# Gestion des services
start: ## ▶️ Démarrer tous les services
	@echo "▶️ Démarrage des services..."
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) up -d

stop: ## ⏹️ Arrêter tous les services
	@echo "⏹️ Arrêt des services..."
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) down

restart: ## 🔄 Redémarrer tous les services
	@echo "🔄 Redémarrage des services..."
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) restart

restart-api: ## 🔄 Redémarrer l'API uniquement
	@echo "🔄 Redémarrage de l'API..."
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) restart api

restart-web: ## 🔄 Redémarrer le frontend uniquement
	@echo "🔄 Redémarrage du frontend..."
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) restart web

# Monitoring et logs
logs: ## 📜 Afficher tous les logs
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) logs -f

logs-api: ## 📜 Logs de l'API
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) logs -f api

logs-web: ## 📜 Logs du frontend
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) logs -f web

logs-db: ## 📜 Logs de la base de données
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) logs -f postgres

status: ## 📊 État des services
	@echo "📊 État des services:"
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) ps

health: ## 🏥 Vérification de santé des services
	@echo "🏥 Vérification de la santé des services..."
	@echo "📡 API Health Check:"
	@curl -sf http://localhost:3002/health || echo "❌ API non accessible"
	@echo "\n🌐 Web Health Check:"
	@curl -sf http://localhost:3005 || echo "❌ Web non accessible"
	@echo "\n🗄️ Database Health Check:"
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) exec postgres pg_isready -U topsteel_prod || echo "❌ Database non accessible"
	@echo "\n⚡ Redis Health Check:"
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) exec redis redis-cli ping || echo "❌ Redis non accessible"

# Sauvegarde et restauration
backup: ## 💾 Sauvegarde complète
	@echo "💾 Sauvegarde en cours..."
	mkdir -p backups/$(shell date +%Y%m%d_%H%M%S)
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) exec -T postgres pg_dumpall -U topsteel_prod > backups/$(shell date +%Y%m%d_%H%M%S)/postgres_backup.sql
	@echo "✅ Sauvegarde terminée dans backups/$(shell date +%Y%m%d_%H%M%S)/"

backup-data: ## 💾 Sauvegarde des volumes Docker
	@echo "💾 Sauvegarde des volumes..."
	mkdir -p backups/$(shell date +%Y%m%d_%H%M%S)
	docker run --rm -v topsteel_postgres_data:/data -v $(PWD)/backups/$(shell date +%Y%m%d_%H%M%S):/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
	docker run --rm -v topsteel_uploads_data:/data -v $(PWD)/backups/$(shell date +%Y%m%d_%H%M%S):/backup alpine tar czf /backup/uploads_data.tar.gz -C /data .

# Maintenance
update: ## 🔄 Mise à jour du code depuis Git
	@echo "🔄 Mise à jour depuis Git..."
	git pull origin main
	$(MAKE) deploy-fast

clean: ## 🧹 Nettoyage (images, volumes orphelins)
	@echo "🧹 Nettoyage..."
	docker system prune -f
	docker volume prune -f

clean-all: ## 🧹 Nettoyage complet (ATTENTION: supprime tout)
	@echo "⚠️ Nettoyage complet (ATTENTION: cela supprime toutes les données)"
	@read -p "Êtes-vous sûr? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) down -v; \
		docker system prune -af; \
		docker volume prune -f; \
		echo "✅ Nettoyage complet terminé"; \
	else \
		echo "❌ Nettoyage annulé"; \
	fi

# Base de données
db-shell: ## 🗄️ Se connecter à PostgreSQL
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) exec postgres psql -U topsteel_prod -d erp_topsteel

db-backup: ## 🗄️ Sauvegarde PostgreSQL uniquement
	@echo "🗄️ Sauvegarde PostgreSQL..."
	mkdir -p backups
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) exec -T postgres pg_dumpall -U topsteel_prod > backups/postgres_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Sauvegarde PostgreSQL terminée"

# Développement
dev: ## 🛠️ Mode développement local
	@echo "🛠️ Démarrage en mode développement..."
	pnpm dev

test: ## 🧪 Lancer les tests
	@echo "🧪 Lancement des tests..."
	pnpm test

lint: ## 🔍 Linter le code
	@echo "🔍 Linting du code..."
	pnpm lint

type-check: ## 📝 Vérification TypeScript
	@echo "📝 Vérification TypeScript..."
	pnpm type-check

# Sécurité
ssl-renew: ## 🔒 Forcer le renouvellement SSL
	@echo "🔒 Renouvellement des certificats SSL..."
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) restart traefik

security-check: ## 🛡️ Vérification de sécurité
	@echo "🛡️ Vérification de sécurité..."
	@echo "🔍 Ports ouverts:"
	@ss -tlnp | grep -E ":(80|443|3002|3004|3005|3007|5432|6379|8080|9000)" || echo "Aucun port détecté"
	@echo "\n🔐 Certificats SSL:"
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) exec traefik ls -la /letsencrypt/ || echo "Certificats non accessibles"

# Informations
info: ## ℹ️ Informations système
	@echo "ℹ️ Informations système TopSteel ERP"
	@echo "=================================="
	@echo "🐳 Docker: $(shell docker --version 2>/dev/null || echo 'Non installé')"
	@echo "🔧 Docker Compose: $(shell docker-compose --version 2>/dev/null || echo 'Non installé')"
	@echo "💾 Espace disque: $(shell df -h . | tail -1 | awk '{print $$4}' | head -1) disponible"
	@echo "🧠 Mémoire: $(shell free -h | grep Mem | awk '{print $$7}') disponible"
	@echo "⏰ Uptime: $(shell uptime -p 2>/dev/null || echo 'Non disponible')"
	@echo "🔌 Services actifs:"
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) ps --services --filter "status=running" | wc -l | awk '{print "   " $$1 " services démarrés"}'

# URL d'accès
urls: ## 🌐 Afficher les URLs d'accès
	@echo "🌐 URLs d'accès TopSteel ERP"
	@echo "============================"
	@echo "🏠 Application: https://$(shell grep DOMAIN $(ENV_FILE) | cut -d'=' -f2)"
	@echo "🛒 Marketplace: https://marketplace.$(shell grep DOMAIN $(ENV_FILE) | cut -d'=' -f2)"
	@echo "🎛️ Portainer: https://portainer.$(shell grep DOMAIN $(ENV_FILE) | cut -d'=' -f2)"
	@echo "🔀 Traefik: https://traefik.$(shell grep DOMAIN $(ENV_FILE) | cut -d'=' -f2)"
	@echo ""
	@echo "📡 APIs locales (pour debug):"
	@echo "   API: http://localhost:3002"
	@echo "   Web: http://localhost:3005"
	@echo "   Marketplace: http://localhost:3007"