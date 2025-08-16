# Plan de Rollback d'Urgence - TopSteel Marketplace

## 🚨 Procédure de Rollback Rapide

### Décision de Rollback
Le rollback doit être initié si l'un des critères suivants est atteint :
- ❌ Taux d'erreur > 5% pendant 5 minutes
- ❌ Temps de réponse P95 > 2 secondes
- ❌ Disponibilité < 99.5%
- ❌ Erreurs critiques de paiement
- ❌ Perte de données détectée
- ❌ Faille de sécurité identifiée

## 📋 Checklist Pré-Rollback

```bash
# 1. Vérifier l'état actuel
kubectl get deployments -n topsteel-marketplace
kubectl get pods -n topsteel-marketplace
kubectl describe service marketplace-api-service -n topsteel-marketplace

# 2. Capturer les logs pour analyse post-mortem
kubectl logs -l app=marketplace-api --tail=1000 > api-logs-$(date +%Y%m%d-%H%M%S).log
kubectl logs -l app=marketplace-web --tail=1000 > web-logs-$(date +%Y%m%d-%H%M%S).log

# 3. Sauvegarder l'état actuel
kubectl get all -n topsteel-marketplace -o yaml > current-state-$(date +%Y%m%d-%H%M%S).yaml
```

## 🔄 Procédures de Rollback

### Option 1: Rollback Blue-Green (Recommandé - 30 secondes)

```bash
#!/bin/bash
# rollback-blue-green.sh

echo "🔄 Initiating Blue-Green Rollback..."

# Basculer le trafic vers Blue (version stable)
kubectl patch service marketplace-api-service -n topsteel-marketplace \
  -p '{"spec":{"selector":{"version":"blue"}}}'

kubectl patch service marketplace-web-service -n topsteel-marketplace \
  -p '{"spec":{"selector":{"version":"blue"}}}'

echo "✅ Traffic switched to Blue deployment"

# Vérifier le rollback
sleep 5
kubectl get endpoints -n topsteel-marketplace
curl -f https://api.topsteel.com/health || echo "⚠️ API health check failed"
curl -f https://marketplace.topsteel.com || echo "⚠️ Web health check failed"
```

### Option 2: Rollback Kubernetes Native (2-5 minutes)

```bash
#!/bin/bash
# rollback-deployment.sh

# Rollback API
kubectl rollout undo deployment/marketplace-api -n topsteel-marketplace
kubectl rollout status deployment/marketplace-api -n topsteel-marketplace

# Rollback Web
kubectl rollout undo deployment/marketplace-web -n topsteel-marketplace
kubectl rollout status deployment/marketplace-web -n topsteel-marketplace

echo "✅ Deployments rolled back to previous version"
```

### Option 3: Rollback avec Version Spécifique

```bash
#!/bin/bash
# rollback-to-version.sh

VERSION=${1:-"v1.2.3"} # Version stable connue

# Update deployments avec version spécifique
kubectl set image deployment/marketplace-api \
  api=ghcr.io/topsteel/marketplace-api:${VERSION} \
  -n topsteel-marketplace

kubectl set image deployment/marketplace-web \
  web=ghcr.io/topsteel/marketplace-web:${VERSION} \
  -n topsteel-marketplace

# Attendre la stabilisation
kubectl rollout status deployment/marketplace-api -n topsteel-marketplace
kubectl rollout status deployment/marketplace-web -n topsteel-marketplace
```

## 🗄️ Rollback Base de Données

### Restauration depuis Backup

```bash
#!/bin/bash
# db-rollback.sh

BACKUP_DATE=${1:-$(date -d "1 hour ago" +%Y%m%d-%H)}

# Arrêter les applications
kubectl scale deployment marketplace-api --replicas=0 -n topsteel-marketplace

# Restaurer la base de données
pg_restore \
  -h postgres.topsteel.com \
  -U topsteel_prod \
  -d topsteel_marketplace \
  --clean \
  --if-exists \
  /backups/marketplace_${BACKUP_DATE}.dump

# Exécuter les migrations inverses si nécessaire
kubectl run migration-rollback \
  --image=ghcr.io/topsteel/marketplace-api:stable \
  --rm -it --restart=Never \
  -- npm run migration:revert

# Redémarrer les applications
kubectl scale deployment marketplace-api --replicas=3 -n topsteel-marketplace
```

### Rollback des Migrations

```sql
-- Identifier la dernière migration
SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5;

-- Exécuter le rollback manuel si nécessaire
BEGIN;
-- Commandes SQL de rollback spécifiques
-- Ex: DROP TABLE IF EXISTS marketplace_new_feature;
-- Ex: ALTER TABLE marketplace_products DROP COLUMN new_field;
COMMIT;
```

## 🔍 Vérification Post-Rollback

```bash
#!/bin/bash
# verify-rollback.sh

echo "🔍 Verifying rollback..."

# 1. Santé des services
echo "Checking service health..."
curl -s https://api.topsteel.com/health | jq .
curl -s https://marketplace.topsteel.com/api/health | jq .

# 2. Métriques clés
echo "Checking metrics..."
curl -s https://api.topsteel.com/metrics | grep http_request_duration

# 3. Logs d'erreur
echo "Checking error logs..."
kubectl logs -l app=marketplace-api --tail=100 | grep ERROR || echo "No errors found"

# 4. Tests critiques
echo "Running critical path tests..."
npm run test:critical

# 5. Monitoring
echo "Dashboard: https://grafana.topsteel.com/d/marketplace"
echo "Sentry: https://sentry.io/organizations/topsteel/issues/"
```

## 📊 Métriques de Surveillance

### Dashboards à Surveiller
- [Grafana Production](https://grafana.topsteel.com/d/marketplace)
- [Sentry Errors](https://sentry.io/organizations/topsteel/)
- [Cloudflare Analytics](https://dash.cloudflare.com/)
- [Stripe Dashboard](https://dashboard.stripe.com/)

### Alertes Critiques
```yaml
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 0.05"
    action: "Trigger rollback"
  
  - name: "Payment Failures"
    condition: "payment_failure_rate > 0.1"
    action: "Immediate rollback"
  
  - name: "Database Connection Lost"
    condition: "db_connections == 0"
    action: "Emergency rollback"
```

## 📞 Contacts d'Urgence

| Rôle | Nom | Téléphone | Email |
|------|-----|-----------|-------|
| CTO | Jean Dupont | +33 6 XX XX XX XX | cto@topsteel.com |
| Lead DevOps | Marie Martin | +33 6 XX XX XX XX | devops@topsteel.com |
| DBA | Pierre Bernard | +33 6 XX XX XX XX | dba@topsteel.com |
| Security | Sophie Durand | +33 6 XX XX XX XX | security@topsteel.com |
| On-Call | Rotation | +33 6 XX XX XX XX | oncall@topsteel.com |

### Escalade
1. **Niveau 1** (0-15min): DevOps On-Call
2. **Niveau 2** (15-30min): Lead DevOps + DBA
3. **Niveau 3** (30min+): CTO + Security

## 📝 Communication

### Template de Communication Interne

```
🚨 INCIDENT EN COURS - Marketplace

Statut: Rollback en cours
Début: [HEURE]
Impact: [Description de l'impact]
Action: Rollback vers version [VERSION]
ETA: [Estimation]

Suivi: [Lien Slack/Teams]
```

### Template Client

```
Maintenance en cours

Nous rencontrons actuellement des difficultés techniques.
Nos équipes travaillent activement à la résolution.

Temps estimé: 30 minutes
Statut: https://status.topsteel.com
```

## 🔧 Scripts Automatisés

### Rollback Complet Automatique

```bash
#!/bin/bash
# emergency-rollback.sh

set -e

echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo "Time: $(date)"

# 1. Notification
curl -X POST $SLACK_WEBHOOK -d '{"text":"🚨 Emergency rollback initiated"}'

# 2. Capture état actuel
./capture-state.sh

# 3. Rollback Blue-Green
./rollback-blue-green.sh

# 4. Vérification
sleep 10
./verify-rollback.sh

# 5. Notification de fin
if [ $? -eq 0 ]; then
  curl -X POST $SLACK_WEBHOOK -d '{"text":"✅ Rollback completed successfully"}'
else
  curl -X POST $SLACK_WEBHOOK -d '{"text":"❌ Rollback verification failed - manual intervention required"}'
  exit 1
fi
```

## 📈 Analyse Post-Incident

### Checklist Post-Mortem
- [ ] Timeline de l'incident
- [ ] Cause racine identifiée
- [ ] Impact business quantifié
- [ ] Actions correctives définies
- [ ] Documentation mise à jour
- [ ] Tests de non-régression ajoutés
- [ ] Monitoring amélioré
- [ ] Communication aux stakeholders

### Template Post-Mortem

```markdown
# Post-Mortem: [Date] [Incident]

## Résumé
- **Durée**: X minutes
- **Impact**: X utilisateurs affectés
- **Perte estimée**: X €

## Timeline
- HH:MM - Déploiement initié
- HH:MM - Premières alertes
- HH:MM - Décision de rollback
- HH:MM - Rollback complété
- HH:MM - Service restauré

## Cause Racine
[Description détaillée]

## Actions Correctives
1. [Action 1]
2. [Action 2]

## Leçons Apprises
[Points clés]
```

## ⚡ Commandes Rapides

```bash
# Rollback immédiat Blue-Green
alias rollback-now='kubectl patch service marketplace-api-service -n topsteel-marketplace -p "{\"spec\":{\"selector\":{\"version\":\"blue\"}}}" && kubectl patch service marketplace-web-service -n topsteel-marketplace -p "{\"spec\":{\"selector\":{\"version\":\"blue\"}}}"'

# Status rapide
alias status='kubectl get pods -n topsteel-marketplace && curl -s https://api.topsteel.com/health | jq .'

# Logs d'erreur
alias errors='kubectl logs -l app=marketplace-api --tail=100 -n topsteel-marketplace | grep ERROR'

# Métriques temps réel
alias metrics='watch -n 5 "curl -s https://api.topsteel.com/metrics | grep -E \"http_request_duration|error_rate\""'
```

## 🎯 Points de Contrôle

### Avant Rollback
- [ ] Incident confirmé et documenté
- [ ] Équipe notifiée
- [ ] Backup état actuel

### Pendant Rollback
- [ ] Script de rollback exécuté
- [ ] Monitoring en temps réel
- [ ] Communication continue

### Après Rollback
- [ ] Service vérifié fonctionnel
- [ ] Métriques revenues à la normale
- [ ] Post-mortem planifié
- [ ] Documentation mise à jour

---

**⚠️ IMPORTANT**: Ce document doit être accessible hors ligne et imprimé dans la salle serveur. 
Dernière mise à jour: 2024-01-15