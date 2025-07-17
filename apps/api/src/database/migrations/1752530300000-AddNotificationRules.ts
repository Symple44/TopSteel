import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddNotificationRules1752530300000 implements MigrationInterface {
  name = 'AddNotificationRules1752530300000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create notification_rules table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        "isActive" BOOLEAN DEFAULT true,
        trigger JSONB NOT NULL,
        conditions JSONB DEFAULT '[]',
        notification JSONB NOT NULL,
        "triggerCount" INTEGER DEFAULT 0,
        "lastTriggered" TIMESTAMP,
        "lastModified" TIMESTAMP,
        "createdBy" UUID,
        "modifiedBy" UUID,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        "deletedAt" TIMESTAMP,
        version INTEGER DEFAULT 1,
        "createdById" UUID,
        "updatedById" UUID
      )
    `)

    // Create notification_rule_executions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_rule_executions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ruleId" UUID NOT NULL,
        "notificationId" UUID,
        status VARCHAR(20) NOT NULL,
        result VARCHAR(50) NOT NULL,
        "eventData" JSONB NOT NULL,
        "conditionResults" JSONB,
        "templateVariables" JSONB,
        "errorMessage" TEXT,
        "errorDetails" JSONB,
        "executionTimeMs" INTEGER DEFAULT 0,
        "executedAt" TIMESTAMP DEFAULT now(),
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        "deletedAt" TIMESTAMP,
        version INTEGER DEFAULT 1,
        "createdById" UUID,
        "updatedById" UUID
      )
    `)

    // Create notification_events table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type VARCHAR(20) NOT NULL,
        event VARCHAR(100) NOT NULL,
        source VARCHAR(100),
        data JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        "occurredAt" TIMESTAMP DEFAULT now(),
        "processedAt" TIMESTAMP,
        "rulesTriggered" INTEGER DEFAULT 0,
        "notificationsCreated" INTEGER DEFAULT 0,
        "processingError" TEXT,
        "processingDetails" JSONB,
        "userId" UUID,
        "entityType" VARCHAR(255),
        "entityId" VARCHAR(36),
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        "deletedAt" TIMESTAMP,
        version INTEGER DEFAULT 1,
        "createdById" UUID,
        "updatedById" UUID
      )
    `)

    // Create indices for notification_rules
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_rules_name ON notification_rules (name)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_rules_is_active ON notification_rules ("isActive")`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_rules_created_by ON notification_rules ("createdBy")`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_rules_modified_by ON notification_rules ("modifiedBy")`)

    // Create indices for notification_rule_executions
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_rule_executions_rule_id ON notification_rule_executions ("ruleId")`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_rule_executions_notification_id ON notification_rule_executions ("notificationId")`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_rule_executions_status ON notification_rule_executions (status)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_rule_executions_executed_at ON notification_rule_executions ("executedAt")`)

    // Create indices for notification_events
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_events_type ON notification_events (type)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_events_event ON notification_events (event)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_events_source ON notification_events (source)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_events_status ON notification_events (status)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_events_occurred_at ON notification_events ("occurredAt")`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_events_user_id ON notification_events ("userId")`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notification_events_entity ON notification_events ("entityType", "entityId")`)

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE notification_rule_executions 
      ADD CONSTRAINT IF NOT EXISTS fk_notification_rule_executions_rule 
      FOREIGN KEY ("ruleId") REFERENCES notification_rules(id) ON DELETE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE notification_rule_executions 
      ADD CONSTRAINT IF NOT EXISTS fk_notification_rule_executions_notification 
      FOREIGN KEY ("notificationId") REFERENCES notifications(id) ON DELETE SET NULL
    `)

    // Create some default notification rules
    await queryRunner.query(`
      INSERT INTO notification_rules (name, description, "isActive", trigger, conditions, notification) VALUES 
      (
        'Alerte Stock Critique',
        'Notification automatique quand un stock passe sous le seuil critique',
        true,
        '{"type": "stock", "event": "stock_low", "source": "inventory-service"}',
        '[{"id": "1", "field": "quantity", "operator": "less_than", "value": 10, "type": "number"}]',
        '{
          "type": "warning",
          "category": "stock",
          "titleTemplate": "Stock critique: {{material_name}}",
          "messageTemplate": "Le stock de {{material_name}} est maintenant de {{quantity}} unités (seuil: {{threshold}})",
          "priority": "HIGH",
          "recipientType": "role",
          "recipientIds": ["stock_manager", "admin"],
          "actionUrl": "/stock/materials/{{material_id}}",
          "actionLabel": "Voir le stock",
          "persistent": true,
          "expiresIn": 24
        }'
      ),
      (
        'Nouveau Projet Prioritaire',
        'Notification lors de la création d\'un projet à haute priorité',
        true,
        '{"type": "project", "event": "project_created", "source": "project-service"}',
        '[{"id": "1", "field": "priority", "operator": "in", "value": ["HIGH", "URGENT"], "type": "string"}]',
        '{
          "type": "info",
          "category": "projet",
          "titleTemplate": "Nouveau projet prioritaire: {{project_name}}",
          "messageTemplate": "Un nouveau projet \"{{project_name}}\" ({{priority}}) a été créé par {{created_by}}",
          "priority": "NORMAL",
          "recipientType": "role",
          "recipientIds": ["project_manager", "team_lead"],
          "actionUrl": "/projets/{{project_id}}",
          "actionLabel": "Voir le projet",
          "persistent": true,
          "expiresIn": 48
        }'
      ),
      (
        'Erreur Machine Critique',
        'Notification immédiate en cas d\'erreur machine critique',
        true,
        '{"type": "production", "event": "machine_error", "source": "production-service"}',
        '[{"id": "1", "field": "severity", "operator": "equals", "value": "CRITICAL", "type": "string"}]',
        '{
          "type": "error",
          "category": "production",
          "titleTemplate": "Erreur critique machine: {{machine_name}}",
          "messageTemplate": "La machine {{machine_name}} a signalé une erreur critique: {{error_message}}",
          "priority": "URGENT",
          "recipientType": "role",
          "recipientIds": ["production_manager", "maintenance_team", "admin"],
          "actionUrl": "/production/machines/{{machine_id}}/diagnostic",
          "actionLabel": "Diagnostic",
          "persistent": true,
          "expiresIn": 12
        }'
      )
      ON CONFLICT DO NOTHING
    `)

    // Create triggers for updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_notification_rule_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `)

    await queryRunner.query(`
      CREATE TRIGGER update_notification_rules_updated_at
        BEFORE UPDATE ON notification_rules
        FOR EACH ROW
        EXECUTE PROCEDURE update_notification_rule_updated_at_column();
    `)

    await queryRunner.query(`
      CREATE TRIGGER update_notification_rule_executions_updated_at
        BEFORE UPDATE ON notification_rule_executions
        FOR EACH ROW
        EXECUTE PROCEDURE update_notification_rule_updated_at_column();
    `)

    await queryRunner.query(`
      CREATE TRIGGER update_notification_events_updated_at
        BEFORE UPDATE ON notification_events
        FOR EACH ROW
        EXECUTE PROCEDURE update_notification_rule_updated_at_column();
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_notification_rules_updated_at ON notification_rules`)
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_notification_rule_executions_updated_at ON notification_rule_executions`)
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_notification_events_updated_at ON notification_events`)
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_notification_rule_updated_at_column()`)
    
    await queryRunner.query(`DROP TABLE IF EXISTS notification_rule_executions`)
    await queryRunner.query(`DROP TABLE IF EXISTS notification_events`)
    await queryRunner.query(`DROP TABLE IF EXISTS notification_rules`)
  }
}