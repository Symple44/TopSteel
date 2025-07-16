-- Create notification tables directly in PostgreSQL
-- This script creates the notification system tables

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table principale des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info',
  category VARCHAR(50) NOT NULL DEFAULT 'system',
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  source VARCHAR(100),
  "entityType" VARCHAR(50),
  "entityId" VARCHAR(36),
  data JSONB,
  "recipientType" VARCHAR(20) NOT NULL DEFAULT 'all',
  "recipientId" VARCHAR(36),
  "actionUrl" VARCHAR(500),
  "actionLabel" VARCHAR(100),
  "actionType" VARCHAR(20),
  "expiresAt" TIMESTAMP,
  persistent BOOLEAN DEFAULT true,
  "autoRead" BOOLEAN DEFAULT false,
  "isArchived" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  "deletedAt" TIMESTAMP,
  version INTEGER DEFAULT 1,
  "createdById" UUID,
  "updatedById" UUID
);

-- Indices pour notifications
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications (category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications (priority);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications ("recipientType", "recipientId");
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications ("createdAt");
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications ("expiresAt");
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications ("entityType", "entityId");
CREATE INDEX IF NOT EXISTS idx_notifications_source ON notifications (source);
CREATE INDEX IF NOT EXISTS idx_notifications_is_archived ON notifications ("isArchived");

-- Table des notifications lues par utilisateur
CREATE TABLE IF NOT EXISTS notification_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "notificationId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "readAt" TIMESTAMP DEFAULT now(),
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  "deletedAt" TIMESTAMP,
  version INTEGER DEFAULT 1,
  "createdById" UUID,
  "updatedById" UUID,
  UNIQUE("notificationId", "userId")
);

-- Indices pour notification_reads
CREATE INDEX IF NOT EXISTS idx_notification_reads_notification_id ON notification_reads ("notificationId");
CREATE INDEX IF NOT EXISTS idx_notification_reads_user_id ON notification_reads ("userId");
CREATE INDEX IF NOT EXISTS idx_notification_reads_read_at ON notification_reads ("readAt");

-- Table des paramètres de notification par utilisateur
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL UNIQUE,
  "enableSound" BOOLEAN DEFAULT true,
  "enableToast" BOOLEAN DEFAULT true,
  "enableBrowser" BOOLEAN DEFAULT true,
  "enableEmail" BOOLEAN DEFAULT false,
  categories JSONB DEFAULT '{
    "system": true,
    "stock": true,
    "projet": true,
    "production": true,
    "maintenance": true,
    "qualite": true,
    "facturation": true,
    "sauvegarde": false,
    "utilisateur": true
  }',
  priorities JSONB DEFAULT '{
    "low": false,
    "normal": true,
    "high": true,
    "urgent": true
  }',
  schedules JSONB DEFAULT '{
    "workingHours": {
      "enabled": false,
      "start": "09:00",
      "end": "18:00"
    },
    "weekdays": {
      "enabled": false,
      "days": [1, 2, 3, 4, 5]
    }
  }',
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  "deletedAt" TIMESTAMP,
  version INTEGER DEFAULT 1,
  "createdById" UUID,
  "updatedById" UUID
);

-- Index pour notification_settings
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings ("userId");

-- Table des templates de notifications
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL DEFAULT 'info',
  category VARCHAR(50) NOT NULL DEFAULT 'system',
  "titleTemplate" VARCHAR(255) NOT NULL,
  "messageTemplate" TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  persistent BOOLEAN DEFAULT true,
  "actionUrlTemplate" VARCHAR(500),
  "actionLabel" VARCHAR(100),
  variables JSONB,
  description TEXT,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  "deletedAt" TIMESTAMP,
  version INTEGER DEFAULT 1,
  "createdById" UUID,
  "updatedById" UUID
);

-- Indices pour notification_templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates (category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates (name);

-- Clés étrangères
ALTER TABLE notification_reads 
ADD CONSTRAINT IF NOT EXISTS fk_notification_reads_notification 
FOREIGN KEY ("notificationId") REFERENCES notifications(id) ON DELETE CASCADE;

-- Trigger pour mettre à jour automatiquement updatedAt
CREATE OR REPLACE FUNCTION update_notification_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE PROCEDURE update_notification_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE PROCEDURE update_notification_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE PROCEDURE update_notification_updated_at_column();

-- Insertion de quelques templates par défaut
INSERT INTO notification_templates (name, type, category, "titleTemplate", "messageTemplate", priority, "actionUrlTemplate", "actionLabel", variables) VALUES
('stock_low', 'warning', 'stock', 'Stock faible: {{material_name}}', 'Le stock de {{material_name}} est en dessous du seuil critique ({{current_quantity}} unités restantes)', 'HIGH', '/stock/materials/{{material_id}}', 'Voir le stock', '{"material_name": "string", "material_id": "string", "current_quantity": "number", "threshold": "number"}'),
('backup_success', 'success', 'sauvegarde', 'Sauvegarde réussie', 'La sauvegarde automatique des données a été effectuée avec succès le {{backup_date}}', 'NORMAL', '/admin/backups', 'Voir les sauvegardes', '{"backup_date": "datetime", "backup_size": "string"}'),
('backup_failed', 'error', 'sauvegarde', 'Échec de sauvegarde', 'La sauvegarde automatique a échoué: {{error_message}}', 'HIGH', '/admin/backups', 'Diagnostiquer', '{"error_message": "string", "retry_count": "number"}'),
('machine_error', 'error', 'production', 'Erreur machine: {{machine_name}}', 'La machine {{machine_name}} a signalé une erreur: {{error_code}} - {{error_description}}', 'URGENT', '/production/machines/{{machine_id}}/diagnostic', 'Diagnostic', '{"machine_name": "string", "machine_id": "string", "error_code": "string", "error_description": "string"}'),
('project_comment', 'info', 'utilisateur', 'Nouveau commentaire sur {{project_name}}', '{{user_name}} a ajouté un commentaire sur le projet {{project_name}}', 'NORMAL', '/projets/{{project_id}}', 'Voir le projet', '{"project_name": "string", "project_id": "string", "user_name": "string", "comment_preview": "string"}'),
('quality_check_required', 'info', 'qualite', 'Contrôle qualité requis: {{batch_number}}', 'Le lot {{batch_number}} nécessite un contrôle qualité avant expédition', 'HIGH', '/qualite/controles/nouveau?lot={{batch_id}}', 'Planifier contrôle', '{"batch_number": "string", "batch_id": "string", "deadline": "datetime"}'),
('system_update', 'info', 'system', 'Mise à jour système', 'Le système a été mis à jour vers la version {{version}}', 'NORMAL', '/changelog', 'Voir les notes', '{"version": "string", "changes": "array"}')
ON CONFLICT (name) DO NOTHING;

-- Créer quelques notifications de test
INSERT INTO notifications (title, message, type, category, priority, "recipientType") VALUES
('Système initialisé', 'Le système de notifications a été configuré avec succès', 'success', 'system', 'NORMAL', 'all'),
('Test de notification', 'Ceci est une notification de test pour vérifier le bon fonctionnement', 'info', 'system', 'LOW', 'all'),
('Notification archivée', 'Cette notification sera archivée par défaut', 'info', 'system', 'LOW', 'all')
ON CONFLICT DO NOTHING;

-- Marquer une notification comme archivée pour tester
UPDATE notifications SET "isArchived" = true WHERE title = 'Notification archivée';

-- Vérifier les tables créées
SELECT 'Tables créées avec succès:' as message;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'notification%';