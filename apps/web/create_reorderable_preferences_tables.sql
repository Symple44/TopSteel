-- Schema pour les préférences UI des composants ReorderableList
-- Table pour sauvegarder les configurations utilisateur par composant

CREATE TABLE IF NOT EXISTS ui_preferences_reorderable_list (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    component_id VARCHAR(100) NOT NULL,
    
    -- Configuration du thème
    theme VARCHAR(50) NOT NULL DEFAULT 'default',
    
    -- Préférences utilisateur (JSON)
    preferences JSON NOT NULL DEFAULT JSON_OBJECT(
        'defaultExpanded', true,
        'showLevelIndicators', true,
        'showConnectionLines', true,
        'enableAnimations', true,
        'compactMode', false,
        'customColors', JSON_OBJECT()
    ),
    
    -- Configuration du layout (JSON)
    layout JSON NOT NULL DEFAULT JSON_OBJECT(
        'maxDepth', 10,
        'allowNesting', true,
        'dragHandlePosition', 'left',
        'expandButtonPosition', 'left'
    ),
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Index pour performance
    UNIQUE KEY unique_user_component (user_id, component_id),
    INDEX idx_user_id (user_id),
    INDEX idx_component_id (component_id),
    INDEX idx_updated_at (updated_at)
);

-- Exemples de données par défaut pour différents composants
INSERT IGNORE INTO ui_preferences_reorderable_list (
    id, 
    user_id, 
    component_id, 
    theme, 
    preferences, 
    layout
) VALUES 
(
    UUID(),
    'default-user',
    'menu-settings',
    'default',
    JSON_OBJECT(
        'defaultExpanded', true,
        'showLevelIndicators', true,
        'showConnectionLines', true,
        'enableAnimations', true,
        'compactMode', false
    ),
    JSON_OBJECT(
        'maxDepth', 10,
        'allowNesting', true,
        'dragHandlePosition', 'left',
        'expandButtonPosition', 'left'
    )
),
(
    UUID(),
    'admin-user',
    'admin-navigation',
    'compact',
    JSON_OBJECT(
        'defaultExpanded', false,
        'showLevelIndicators', false,
        'showConnectionLines', false,
        'enableAnimations', true,
        'compactMode', true
    ),
    JSON_OBJECT(
        'maxDepth', 5,
        'allowNesting', true,
        'dragHandlePosition', 'right',
        'expandButtonPosition', 'left'
    )
);