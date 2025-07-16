-- Schema pour le système de notifications
-- Tables pour gérer les notifications avec paramètres utilisateur

-- Table principale des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    type ENUM('info', 'success', 'warning', 'error') NOT NULL,
    category ENUM('system', 'stock', 'projet', 'production', 'maintenance', 'qualite', 'facturation', 'sauvegarde', 'utilisateur') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    
    -- Métadonnées
    source VARCHAR(100), -- Source de la notification (auto-update, inventory-check, etc.)
    entity_type VARCHAR(50), -- Type d'entité liée (material, project, machine, etc.)
    entity_id VARCHAR(36), -- ID de l'entité liée
    data JSON, -- Données additionnelles
    
    -- Gestion des destinataires
    recipient_type ENUM('all', 'role', 'user', 'group') NOT NULL DEFAULT 'all',
    recipient_id VARCHAR(36), -- ID utilisateur, rôle ou groupe (NULL si 'all')
    
    -- Actions possibles
    action_url VARCHAR(500), -- URL vers laquelle rediriger
    action_label VARCHAR(100), -- Texte du bouton d'action
    action_type ENUM('primary', 'secondary') DEFAULT 'primary',
    
    -- Gestion temporelle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL, -- Date d'expiration (NULL = jamais)
    
    -- Paramètres d'affichage
    persistent BOOLEAN DEFAULT TRUE, -- Reste visible jusqu'à suppression manuelle
    auto_read BOOLEAN DEFAULT FALSE, -- Marquer automatiquement comme lue après affichage
    
    -- Index pour performance
    INDEX idx_category (category),
    INDEX idx_priority (priority),
    INDEX idx_recipient (recipient_type, recipient_id),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_source (source)
);

-- Table des notifications lues par utilisateur
CREATE TABLE IF NOT EXISTS notification_reads (
    id VARCHAR(36) PRIMARY KEY,
    notification_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_notification (notification_id, user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_notification_id (notification_id),
    INDEX idx_read_at (read_at)
);

-- Table des paramètres de notification par utilisateur
CREATE TABLE IF NOT EXISTS notification_settings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    
    -- Paramètres généraux
    enable_sound BOOLEAN DEFAULT TRUE,
    enable_toast BOOLEAN DEFAULT TRUE,
    enable_browser BOOLEAN DEFAULT TRUE,
    enable_email BOOLEAN DEFAULT FALSE,
    
    -- Paramètres par catégorie (JSON pour flexibilité)
    categories JSON DEFAULT '{"system": true, "stock": true, "projet": true, "production": true, "maintenance": true, "qualite": true, "facturation": true, "sauvegarde": false, "utilisateur": true}',
    
    -- Paramètres par priorité
    priorities JSON DEFAULT '{"low": false, "normal": true, "high": true, "urgent": true}',
    
    -- Paramètres d'horaires
    schedules JSON DEFAULT '{"workingHours": {"enabled": false, "start": "09:00", "end": "18:00"}, "weekdays": {"enabled": false, "days": [1,2,3,4,5]}}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id)
);

-- Table des templates de notifications (pour réutilisation)
CREATE TABLE IF NOT EXISTS notification_templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('info', 'success', 'warning', 'error') NOT NULL,
    category ENUM('system', 'stock', 'projet', 'production', 'maintenance', 'qualite', 'facturation', 'sauvegarde', 'utilisateur') NOT NULL,
    
    -- Template avec variables
    title_template VARCHAR(255) NOT NULL, -- Ex: "Stock bas: {{material_name}}"
    message_template TEXT NOT NULL, -- Ex: "Le stock de {{material_name}} est de {{quantity}} unités"
    
    priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    persistent BOOLEAN DEFAULT TRUE,
    action_url_template VARCHAR(500), -- Ex: "/stock/materials/{{material_id}}"
    action_label VARCHAR(100),
    
    -- Métadonnées
    variables JSON, -- Liste des variables disponibles et leurs types
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_name (name)
);

-- Vue pour les notifications non lues par utilisateur
CREATE VIEW IF NOT EXISTS user_unread_notifications AS
SELECT 
    n.*,
    nr.read_at,
    CASE WHEN nr.id IS NULL THEN TRUE ELSE FALSE END as is_unread
FROM notifications n
LEFT JOIN notification_reads nr ON n.id = nr.notification_id
WHERE (n.expires_at IS NULL OR n.expires_at > NOW())
  AND (nr.id IS NULL OR nr.read_at IS NULL);

-- Vue pour les statistiques de notifications par utilisateur
CREATE VIEW IF NOT EXISTS user_notification_stats AS
SELECT 
    nr.user_id,
    COUNT(DISTINCT n.id) as total_notifications,
    COUNT(DISTINCT CASE WHEN nr.read_at IS NULL THEN n.id END) as unread_count,
    COUNT(DISTINCT CASE WHEN n.category = 'system' THEN n.id END) as system_count,
    COUNT(DISTINCT CASE WHEN n.category = 'stock' THEN n.id END) as stock_count,
    COUNT(DISTINCT CASE WHEN n.category = 'projet' THEN n.id END) as projet_count,
    COUNT(DISTINCT CASE WHEN n.category = 'production' THEN n.id END) as production_count,
    COUNT(DISTINCT CASE WHEN n.category = 'maintenance' THEN n.id END) as maintenance_count,
    COUNT(DISTINCT CASE WHEN n.category = 'qualite' THEN n.id END) as qualite_count,
    COUNT(DISTINCT CASE WHEN n.category = 'facturation' THEN n.id END) as facturation_count,
    COUNT(DISTINCT CASE WHEN n.category = 'sauvegarde' THEN n.id END) as sauvegarde_count,
    COUNT(DISTINCT CASE WHEN n.category = 'utilisateur' THEN n.id END) as utilisateur_count,
    COUNT(DISTINCT CASE WHEN n.priority = 'URGENT' AND nr.read_at IS NULL THEN n.id END) as urgent_unread_count
FROM notifications n
LEFT JOIN notification_reads nr ON n.id = nr.notification_id
WHERE (n.expires_at IS NULL OR n.expires_at > NOW())
  AND (n.recipient_type = 'all' OR 
       (n.recipient_type = 'user' AND n.recipient_id = nr.user_id))
GROUP BY nr.user_id;

-- Procédure pour nettoyer les notifications expirées
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CleanExpiredNotifications()
BEGIN
    -- Supprimer les notifications expirées non persistantes
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW() 
      AND persistent = FALSE;
      
    -- Supprimer les notifications lues anciennes (plus de 30 jours)
    DELETE n FROM notifications n
    INNER JOIN notification_reads nr ON n.id = nr.notification_id
    WHERE nr.read_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND n.persistent = FALSE;
      
    SELECT ROW_COUNT() as deleted_count;
END //
DELIMITER ;

-- Event pour nettoyer automatiquement les notifications expirées (tous les jours à 2h)
-- CREATE EVENT IF NOT EXISTS CleanExpiredNotificationsEvent
-- ON SCHEDULE EVERY 1 DAY STARTS '2024-01-01 02:00:00'
-- DO CALL CleanExpiredNotifications();

-- Fonction pour créer une notification depuis un template
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CreateNotificationFromTemplate(
    IN template_name VARCHAR(100),
    IN variables JSON,
    IN recipient_type ENUM('all', 'role', 'user', 'group'),
    IN recipient_id VARCHAR(36)
)
BEGIN
    DECLARE notification_id VARCHAR(36);
    DECLARE template_title VARCHAR(255);
    DECLARE template_message TEXT;
    DECLARE template_type ENUM('info', 'success', 'warning', 'error');
    DECLARE template_category ENUM('system', 'stock', 'projet', 'production', 'maintenance', 'qualite', 'facturation', 'sauvegarde', 'utilisateur');
    DECLARE template_priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');
    DECLARE template_persistent BOOLEAN;
    DECLARE template_action_url VARCHAR(500);
    DECLARE template_action_label VARCHAR(100);
    
    -- Générer un UUID pour la notification
    SET notification_id = UUID();
    
    -- Récupérer le template
    SELECT title_template, message_template, type, category, priority, persistent, action_url_template, action_label
    INTO template_title, template_message, template_type, template_category, template_priority, template_persistent, template_action_url, template_action_label
    FROM notification_templates 
    WHERE name = template_name;
    
    -- Insérer la notification (le remplacement des variables se fera côté application)
    INSERT INTO notifications (
        id, type, category, title, message, priority, 
        recipient_type, recipient_id, action_url, action_label, 
        persistent, data, source
    ) VALUES (
        notification_id, template_type, template_category, template_title, template_message, template_priority,
        recipient_type, recipient_id, template_action_url, template_action_label,
        template_persistent, variables, CONCAT('template:', template_name)
    );
    
    SELECT notification_id as id;
END //
DELIMITER ;

-- Insertion de quelques templates par défaut
INSERT IGNORE INTO notification_templates (id, name, type, category, title_template, message_template, priority, action_url_template, action_label, variables) VALUES
(UUID(), 'stock_low', 'warning', 'stock', 'Stock faible: {{material_name}}', 'Le stock de {{material_name}} est en dessous du seuil critique ({{current_quantity}} unités restantes)', 'HIGH', '/stock/materials/{{material_id}}', 'Voir le stock', '{"material_name": "string", "material_id": "string", "current_quantity": "number", "threshold": "number"}'),

(UUID(), 'backup_success', 'success', 'sauvegarde', 'Sauvegarde réussie', 'La sauvegarde automatique des données a été effectuée avec succès le {{backup_date}}', 'NORMAL', '/admin/backups', 'Voir les sauvegardes', '{"backup_date": "datetime", "backup_size": "string"}'),

(UUID(), 'backup_failed', 'error', 'sauvegarde', 'Échec de sauvegarde', 'La sauvegarde automatique a échoué: {{error_message}}', 'HIGH', '/admin/backups', 'Diagnostiquer', '{"error_message": "string", "retry_count": "number"}'),

(UUID(), 'machine_error', 'error', 'production', 'Erreur machine: {{machine_name}}', 'La machine {{machine_name}} a signalé une erreur: {{error_code}} - {{error_description}}', 'URGENT', '/production/machines/{{machine_id}}/diagnostic', 'Diagnostic', '{"machine_name": "string", "machine_id": "string", "error_code": "string", "error_description": "string"}'),

(UUID(), 'project_comment', 'info', 'utilisateur', 'Nouveau commentaire sur {{project_name}}', '{{user_name}} a ajouté un commentaire sur le projet {{project_name}}', 'NORMAL', '/projets/{{project_id}}', 'Voir le projet', '{"project_name": "string", "project_id": "string", "user_name": "string", "comment_preview": "string"}'),

(UUID(), 'quality_check_required', 'info', 'qualite', 'Contrôle qualité requis: {{batch_number}}', 'Le lot {{batch_number}} nécessite un contrôle qualité avant expédition', 'HIGH', '/qualite/controles/nouveau?lot={{batch_id}}', 'Planifier contrôle', '{"batch_number": "string", "batch_id": "string", "deadline": "datetime"}'),

(UUID(), 'system_update', 'info', 'system', 'Mise à jour système', 'Le système a été mis à jour vers la version {{version}}', 'NORMAL', '/changelog', 'Voir les notes', '{"version": "string", "changes": "array"}');