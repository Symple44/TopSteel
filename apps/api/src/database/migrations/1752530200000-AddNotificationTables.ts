import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddNotificationTables1752530200000 implements MigrationInterface {
  name = 'AddNotificationTables1752530200000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)

    // Table principale des notifications
    await queryRunner.query(`
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
        "updatedAt" TIMESTAMP DEFAULT now()
      );
    `)

    // Indices pour notifications
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications (category);`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications (priority);`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications ("recipientType", "recipientId");`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications ("createdAt");`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications ("expiresAt");`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications ("entityType", "entityId");`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notifications_source ON notifications (source);`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notifications_is_archived ON notifications ("isArchived");`)

    // Table des notifications lues par utilisateur
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_reads (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "notificationId" UUID NOT NULL,
        "userId" UUID NOT NULL,
        "readAt" TIMESTAMP DEFAULT now(),
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        UNIQUE("notificationId", "userId")
      );
    `)

    // Indices pour notification_reads
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_reads_notification_id ON notification_reads ("notificationId");`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_reads_user_id ON notification_reads ("userId");`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_reads_read_at ON notification_reads ("readAt");`)

    // Table des paramètres de notification par utilisateur
    await queryRunner.query(`
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
        "updatedAt" TIMESTAMP DEFAULT now()
      );
    `)

    // Index pour notification_settings
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings ("userId");`)

    // Table des templates de notifications
    await queryRunner.query(`
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
        "updatedAt" TIMESTAMP DEFAULT now()
      );
    `)

    // Indices pour notification_templates
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates (category);`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates (name);`)

    // Clés étrangères
    await queryRunner.query(`
      ALTER TABLE notification_reads 
      ADD CONSTRAINT fk_notification_reads_notification 
      FOREIGN KEY ("notificationId") REFERENCES notifications(id) ON DELETE CASCADE;
    `)

    // Vérifier si la table users existe avant d'ajouter la clé étrangère
    const userTableExists = await queryRunner.hasTable('users')
    if (userTableExists) {
      await queryRunner.query(`
        ALTER TABLE notification_settings 
        ADD CONSTRAINT fk_notification_settings_user 
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;
      `)
    }

    // Trigger pour mettre à jour automatiquement updatedAt
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_notification_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `)

    await queryRunner.query(`
      CREATE TRIGGER update_notifications_updated_at
        BEFORE UPDATE ON notifications
        FOR EACH ROW
        EXECUTE PROCEDURE update_notification_updated_at_column();
    `)

    await queryRunner.query(`
      CREATE TRIGGER update_notification_settings_updated_at
        BEFORE UPDATE ON notification_settings
        FOR EACH ROW
        EXECUTE PROCEDURE update_notification_updated_at_column();
    `)

    await queryRunner.query(`
      CREATE TRIGGER update_notification_templates_updated_at
        BEFORE UPDATE ON notification_templates
        FOR EACH ROW
        EXECUTE PROCEDURE update_notification_updated_at_column();
    `)

    // Insertion de quelques templates par défaut
    await queryRunner.query(`
      INSERT INTO notification_templates (name, type, category, "titleTemplate", "messageTemplate", priority, "actionUrlTemplate", "actionLabel", variables) VALUES
      ('stock_low', 'warning', 'stock', 'Stock faible: {{material_name}}', 'Le stock de {{material_name}} est en dessous du seuil critique ({{current_quantity}} unités restantes)', 'HIGH', '/stock/materials/{{material_id}}', 'Voir le stock', '{"material_name": "string", "material_id": "string", "current_quantity": "number", "threshold": "number"}'),
      ('backup_success', 'success', 'sauvegarde', 'Sauvegarde réussie', 'La sauvegarde automatique des données a été effectuée avec succès le {{backup_date}}', 'NORMAL', '/admin/backups', 'Voir les sauvegardes', '{"backup_date": "datetime", "backup_size": "string"}'),
      ('backup_failed', 'error', 'sauvegarde', 'Échec de sauvegarde', 'La sauvegarde automatique a échoué: {{error_message}}', 'HIGH', '/admin/backups', 'Diagnostiquer', '{"error_message": "string", "retry_count": "number"}'),
      ('machine_error', 'error', 'production', 'Erreur machine: {{machine_name}}', 'La machine {{machine_name}} a signalé une erreur: {{error_code}} - {{error_description}}', 'URGENT', '/production/machines/{{machine_id}}/diagnostic', 'Diagnostic', '{"machine_name": "string", "machine_id": "string", "error_code": "string", "error_description": "string"}'),
      ('project_comment', 'info', 'utilisateur', 'Nouveau commentaire sur {{project_name}}', '{{user_name}} a ajouté un commentaire sur le projet {{project_name}}', 'NORMAL', '/projets/{{project_id}}', 'Voir le projet', '{"project_name": "string", "project_id": "string", "user_name": "string", "comment_preview": "string"}'),
      ('quality_check_required', 'info', 'qualite', 'Contrôle qualité requis: {{batch_number}}', 'Le lot {{batch_number}} nécessite un contrôle qualité avant expédition', 'HIGH', '/qualite/controles/nouveau?lot={{batch_id}}', 'Planifier contrôle', '{"batch_number": "string", "batch_id": "string", "deadline": "datetime"}'),
      ('system_update', 'info', 'system', 'Mise à jour système', 'Le système a été mis à jour vers la version {{version}}', 'NORMAL', '/changelog', 'Voir les notes', '{"version": "string", "changes": "array"}')
      ON CONFLICT (name) DO NOTHING;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications`)
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings`)
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates`)
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_notification_updated_at_column()`)
    
    await queryRunner.query(`DROP TABLE IF EXISTS notification_templates`)
    await queryRunner.query(`DROP TABLE IF EXISTS notification_settings`)
    await queryRunner.query(`DROP TABLE IF EXISTS notification_reads`)
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`)
  }
}