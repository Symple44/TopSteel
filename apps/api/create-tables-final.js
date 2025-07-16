const { Client } = require('pg');

// Configuration de la base de données
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_topsteel',
});

async function createNotificationTables() {
  try {
    // Connexion à la base de données
    await client.connect();
    console.log('Connecté à PostgreSQL');

    // Create UUID extension
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('Extension UUID créée');

    // Create notifications table
    await client.query(`
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
      )
    `);
    console.log('Table notifications créée');

    // Create notification_reads table
    await client.query(`
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
        "updatedById" UUID
      )
    `);
    console.log('Table notification_reads créée');

    // Add unique constraint for notification_reads
    try {
      await client.query(`
        ALTER TABLE notification_reads 
        ADD CONSTRAINT unique_user_notification UNIQUE("notificationId", "userId")
      `);
      console.log('Contrainte unique ajoutée à notification_reads');
    } catch (error) {
      console.log('Contrainte unique déjà existante');
    }

    // Create notification_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" UUID NOT NULL UNIQUE,
        "enableSound" BOOLEAN DEFAULT true,
        "enableToast" BOOLEAN DEFAULT true,
        "enableBrowser" BOOLEAN DEFAULT true,
        "enableEmail" BOOLEAN DEFAULT false,
        categories JSONB DEFAULT '{"system": true, "stock": true, "projet": true, "production": true, "maintenance": true, "qualite": true, "facturation": true, "sauvegarde": false, "utilisateur": true}',
        priorities JSONB DEFAULT '{"low": false, "normal": true, "high": true, "urgent": true}',
        schedules JSONB DEFAULT '{"workingHours": {"enabled": false, "start": "09:00", "end": "18:00"}, "weekdays": {"enabled": false, "days": [1, 2, 3, 4, 5]}}',
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        "deletedAt" TIMESTAMP,
        version INTEGER DEFAULT 1,
        "createdById" UUID,
        "updatedById" UUID
      )
    `);
    console.log('Table notification_settings créée');

    // Create notification_templates table
    await client.query(`
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
      )
    `);
    console.log('Table notification_templates créée');

    // Create indices safely
    const indices = [
      'CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications (category)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications (priority)', 
      'CREATE INDEX IF NOT EXISTS idx_notifications_is_archived ON notifications ("isArchived")',
      'CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications ("recipientType", "recipientId")',
      'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications ("createdAt")',
      'CREATE INDEX IF NOT EXISTS idx_notification_reads_notification_id ON notification_reads ("notificationId")',
      'CREATE INDEX IF NOT EXISTS idx_notification_reads_user_id ON notification_reads ("userId")',
      'CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings ("userId")',
      'CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates (category)',
      'CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates (name)'
    ];

    for (const indexQuery of indices) {
      try {
        await client.query(indexQuery);
      } catch (error) {
        console.log(`Index déjà existant: ${error.message}`);
      }
    }
    console.log('Indices créés');

    // Add foreign key constraint
    try {
      await client.query(`
        ALTER TABLE notification_reads 
        ADD CONSTRAINT fk_notification_reads_notification 
        FOREIGN KEY ("notificationId") REFERENCES notifications(id) ON DELETE CASCADE
      `);
      console.log('Contrainte de clé étrangère créée');
    } catch (error) {
      console.log('Contrainte déjà existante');
    }

    // Insert some test data
    await client.query(`
      INSERT INTO notifications (title, message, type, category, priority, "recipientType") 
      VALUES 
        ('Système initialisé', 'Le système de notifications a été configuré avec succès', 'success', 'system', 'NORMAL', 'all'),
        ('Test de notification', 'Ceci est une notification de test pour vérifier le bon fonctionnement', 'info', 'system', 'LOW', 'all'),
        ('Notification archivée', 'Cette notification sera archivée par défaut', 'info', 'system', 'LOW', 'all')
      ON CONFLICT DO NOTHING
    `);
    console.log('Données de test insérées');

    // Update one notification as archived
    await client.query(`UPDATE notifications SET "isArchived" = true WHERE title = 'Notification archivée'`);

    // Check tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'notification%'
    `);
    
    console.log('\nTables de notification créées:');
    tables.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Count notifications
    const notificationCount = await client.query('SELECT COUNT(*) FROM notifications');
    console.log(`\nNombre de notifications: ${notificationCount.rows[0].count}`);
    
    // Show some notifications
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

createNotificationTables();