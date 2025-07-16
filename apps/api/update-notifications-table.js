const { Client } = require('pg');

// Configuration de la base de données
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_topsteel',
});

async function updateNotificationsTable() {
  try {
    // Connexion à la base de données
    await client.connect();
    console.log('Connecté à PostgreSQL');

    // Drop the existing notifications table and recreate it
    await client.query('DROP TABLE IF EXISTS notifications CASCADE');
    console.log('Ancienne table notifications supprimée');

    // Create the new notifications table with proper structure
    await client.query(`
      CREATE TABLE notifications (
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
      )
    `);
    console.log('Nouvelle table notifications créée');

    // Recreate notification_reads table with proper foreign key
    await client.query('DROP TABLE IF EXISTS notification_reads CASCADE');
    await client.query(`
      CREATE TABLE notification_reads (
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
        CONSTRAINT unique_user_notification UNIQUE("notificationId", "userId"),
        CONSTRAINT fk_notification_reads_notification 
          FOREIGN KEY ("notificationId") REFERENCES notifications(id) ON DELETE CASCADE
      )
    `);
    console.log('Table notification_reads recréée');

    // Create indices
    const indices = [
      'CREATE INDEX idx_notifications_category ON notifications (category)',
      'CREATE INDEX idx_notifications_priority ON notifications (priority)', 
      'CREATE INDEX idx_notifications_is_archived ON notifications ("isArchived")',
      'CREATE INDEX idx_notifications_recipient ON notifications ("recipientType", "recipientId")',
      'CREATE INDEX idx_notifications_created_at ON notifications ("createdAt")',
      'CREATE INDEX idx_notification_reads_notification_id ON notification_reads ("notificationId")',
      'CREATE INDEX idx_notification_reads_user_id ON notification_reads ("userId")',
      'CREATE INDEX idx_notification_settings_user_id ON notification_settings ("userId")',
      'CREATE INDEX idx_notification_templates_category ON notification_templates (category)',
      'CREATE INDEX idx_notification_templates_name ON notification_templates (name)'
    ];

    for (const indexQuery of indices) {
      try {
        await client.query(indexQuery);
      } catch (error) {
        console.log(`Erreur index: ${error.message}`);
      }
    }
    console.log('Indices créés');

    // Insert some test data
    await client.query(`
      INSERT INTO notifications (title, message, type, category, priority, "recipientType") 
      VALUES 
        ('Système initialisé', 'Le système de notifications a été configuré avec succès', 'success', 'system', 'NORMAL', 'all'),
        ('Test de notification', 'Ceci est une notification de test pour vérifier le bon fonctionnement', 'info', 'system', 'LOW', 'all'),
        ('Notification archivée', 'Cette notification sera archivée par défaut', 'info', 'system', 'LOW', 'all'),
        ('Stock faible', 'Le stock de vis M8 est faible (10 unités restantes)', 'warning', 'stock', 'HIGH', 'all'),
        ('Maintenance machine', 'La machine CNC-001 nécessite une maintenance préventive', 'warning', 'maintenance', 'HIGH', 'all')
    `);
    console.log('Données de test insérées');

    // Update one notification as archived
    await client.query(`UPDATE notifications SET "isArchived" = true WHERE title = 'Notification archivée'`);

    // Insert some templates
    await client.query(`
      INSERT INTO notification_templates (name, type, category, "titleTemplate", "messageTemplate", priority, "actionUrlTemplate", "actionLabel", variables) 
      VALUES 
        ('stock_low', 'warning', 'stock', 'Stock faible: {{material_name}}', 'Le stock de {{material_name}} est en dessous du seuil critique ({{current_quantity}} unités restantes)', 'HIGH', '/stock/materials/{{material_id}}', 'Voir le stock', '{"material_name": "string", "material_id": "string", "current_quantity": "number", "threshold": "number"}'),
        ('backup_success', 'success', 'sauvegarde', 'Sauvegarde réussie', 'La sauvegarde automatique des données a été effectuée avec succès le {{backup_date}}', 'NORMAL', '/admin/backups', 'Voir les sauvegardes', '{"backup_date": "datetime", "backup_size": "string"}'),
        ('project_comment', 'info', 'utilisateur', 'Nouveau commentaire sur {{project_name}}', '{{user_name}} a ajouté un commentaire sur le projet {{project_name}}', 'NORMAL', '/projets/{{project_id}}', 'Voir le projet', '{"project_name": "string", "project_id": "string", "user_name": "string", "comment_preview": "string"}')
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('Templates insérés');

    // Check final result
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'notification%'
    `);
    
    console.log('\nTables de notification:');
    tables.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    const notificationCount = await client.query('SELECT COUNT(*) FROM notifications');
    console.log(`\nNombre de notifications: ${notificationCount.rows[0].count}`);

    const templateCount = await client.query('SELECT COUNT(*) FROM notification_templates');
    console.log(`Nombre de templates: ${templateCount.rows[0].count}`);
    
    // Show sample data
    const notifications = await client.query('SELECT title, type, category, priority, "isArchived" FROM notifications ORDER BY "createdAt" DESC LIMIT 5');
    console.log('\nNotifications dans la base:');
    notifications.rows.forEach(row => {
      console.log(`- ${row.title} (${row.type}, ${row.category}, ${row.priority}, archived: ${row.isArchived})`);
    });
    
    console.log('\n✅ Système de notifications configuré avec succès !');
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await client.end();
  }
}

updateNotificationsTable();