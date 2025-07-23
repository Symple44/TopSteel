-- Schema pour les préférences hiérarchiques des DataTables
-- Extension pour supporter la réorganisation hiérarchique des données

CREATE TABLE IF NOT EXISTS datatable_hierarchical_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    table_id VARCHAR(100) NOT NULL,
    
    -- Configuration hiérarchique
    hierarchy_config JSON NOT NULL DEFAULT JSON_OBJECT(
        'parentField', 'parent_id',
        'childrenField', 'children',
        'levelField', 'level',
        'orderField', 'display_order',
        'maxDepth', 10,
        'allowNesting', true,
        'defaultExpanded', true,
        'expandedNodes', JSON_ARRAY()
    ),
    
    -- Configuration de la réorganisation
    reorder_config JSON NOT NULL DEFAULT JSON_OBJECT(
        'enableDragDrop', true,
        'allowLevelChange', true,
        'preserveHierarchy', true,
        'autoExpand', true,
        'dragHandleVisible', true,
        'dropIndicatorStyle', 'line'
    ),
    
    -- Configuration d'affichage hiérarchique
    display_config JSON NOT NULL DEFAULT JSON_OBJECT(
        'showLevelIndicators', true,
        'showConnectionLines', true,
        'indentSize', 24,
        'levelColors', JSON_ARRAY(),
        'compactMode', false,
        'collapsibleGroups', true
    ),
    
    -- Filtrages spécifiques pour hiérarchie
    hierarchy_filters JSON NOT NULL DEFAULT JSON_OBJECT(
        'showOnlyLevels', JSON_ARRAY(),
        'hideEmptyParents', false,
        'filterPreservesHierarchy', true,
        'searchInChildren', true
    ),
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Index pour performance
    UNIQUE KEY unique_user_table (user_id, table_id),
    INDEX idx_user_id (user_id),
    INDEX idx_table_id (table_id),
    INDEX idx_updated_at (updated_at)
);

-- Table pour stocker les ordres hiérarchiques personnalisés
CREATE TABLE IF NOT EXISTS datatable_hierarchy_order (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    table_id VARCHAR(100) NOT NULL,
    item_id VARCHAR(100) NOT NULL,
    parent_id VARCHAR(100) DEFAULT NULL,
    display_order INT NOT NULL DEFAULT 0,
    level INT NOT NULL DEFAULT 0,
    path VARCHAR(1000) DEFAULT NULL, -- Chemin hiérarchique pour les requêtes efficaces
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Index pour performance et intégrité
    UNIQUE KEY unique_user_table_item (user_id, table_id, item_id),
    INDEX idx_user_table (user_id, table_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_display_order (display_order),
    INDEX idx_level (level),
    INDEX idx_path (path(255)),
    INDEX idx_updated_at (updated_at)
);

-- Exemples de configurations par défaut
INSERT IGNORE INTO datatable_hierarchical_preferences (
    id, 
    user_id, 
    table_id, 
    hierarchy_config, 
    reorder_config,
    display_config,
    hierarchy_filters
) VALUES 
(
    UUID(),
    'default-user',
    'quotation-items',
    JSON_OBJECT(
        'parentField', 'parent_id',
        'childrenField', 'children',
        'levelField', 'level',
        'orderField', 'display_order',
        'maxDepth', 3,
        'allowNesting', true,
        'defaultExpanded', true,
        'expandedNodes', JSON_ARRAY()
    ),
    JSON_OBJECT(
        'enableDragDrop', true,
        'allowLevelChange', true,
        'preserveHierarchy', true,
        'autoExpand', true,
        'dragHandleVisible', true,
        'dropIndicatorStyle', 'line'
    ),
    JSON_OBJECT(
        'showLevelIndicators', true,
        'showConnectionLines', true,
        'indentSize', 24,
        'levelColors', JSON_ARRAY('#3b82f6', '#10b981', '#f59e0b', '#ef4444'),
        'compactMode', false,
        'collapsibleGroups', true
    ),
    JSON_OBJECT(
        'showOnlyLevels', JSON_ARRAY(1, 2),
        'hideEmptyParents', false,
        'filterPreservesHierarchy', true,
        'searchInChildren', true
    )
),
(
    UUID(),
    'admin-user',
    'project-tasks',
    JSON_OBJECT(
        'parentField', 'parent_task_id',
        'childrenField', 'subtasks',
        'levelField', 'depth',
        'orderField', 'sort_order',
        'maxDepth', 5,
        'allowNesting', true,
        'defaultExpanded', false,
        'expandedNodes', JSON_ARRAY()
    ),
    JSON_OBJECT(
        'enableDragDrop', true,
        'allowLevelChange', true,
        'preserveHierarchy', false,
        'autoExpand', false,
        'dragHandleVisible', true,
        'dropIndicatorStyle', 'highlight'
    ),
    JSON_OBJECT(
        'showLevelIndicators', false,
        'showConnectionLines', false,
        'indentSize', 16,
        'levelColors', JSON_ARRAY(),
        'compactMode', true,
        'collapsibleGroups', true
    ),
    JSON_OBJECT(
        'showOnlyLevels', JSON_ARRAY(),
        'hideEmptyParents', true,
        'filterPreservesHierarchy', true,
        'searchInChildren', true
    )
);

-- Exemples d'ordre hiérarchique pour un devis
INSERT IGNORE INTO datatable_hierarchy_order (
    id,
    user_id,
    table_id,
    item_id,
    parent_id,
    display_order,
    level,
    path
) VALUES
(UUID(), 'default-user', 'quotation-items', 'item-1', NULL, 1, 0, '1'),
(UUID(), 'default-user', 'quotation-items', 'item-1-1', 'item-1', 1, 1, '1.1'),
(UUID(), 'default-user', 'quotation-items', 'item-1-2', 'item-1', 2, 1, '1.2'),
(UUID(), 'default-user', 'quotation-items', 'item-1-2-1', 'item-1-2', 1, 2, '1.2.1'),
(UUID(), 'default-user', 'quotation-items', 'item-2', NULL, 2, 0, '2'),
(UUID(), 'default-user', 'quotation-items', 'item-2-1', 'item-2', 1, 1, '2.1');