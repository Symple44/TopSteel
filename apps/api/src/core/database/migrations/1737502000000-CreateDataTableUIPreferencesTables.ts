import { QueryRunner } from 'typeorm'
import type { MigrationInterface } from 'typeorm'

export class CreateDataTableUIPreferencesTables1737502000000 implements MigrationInterface {
  name = 'CreateDataTableUIPreferencesTables1737502000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Table pour les préférences hiérarchiques des DataTables
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS datatable_hierarchical_preferences (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID NOT NULL,
                table_id VARCHAR(100) NOT NULL,
                
                -- Configuration hiérarchique
                hierarchy_config JSONB NOT NULL DEFAULT '{
                    "parentField": "parent_id",
                    "childrenField": "children",
                    "levelField": "level",
                    "orderField": "display_order",
                    "maxDepth": 10,
                    "allowNesting": true,
                    "defaultExpanded": true,
                    "expandedNodes": []
                }'::jsonb,
                
                -- Configuration de la réorganisation
                reorder_config JSONB NOT NULL DEFAULT '{
                    "enableDragDrop": true,
                    "allowLevelChange": true,
                    "preserveHierarchy": true,
                    "autoExpand": true,
                    "dragHandleVisible": true,
                    "dropIndicatorStyle": "line"
                }'::jsonb,
                
                -- Configuration d'affichage hiérarchique
                display_config JSONB NOT NULL DEFAULT '{
                    "showLevelIndicators": true,
                    "showConnectionLines": true,
                    "indentSize": 24,
                    "levelColors": [],
                    "compactMode": false,
                    "collapsibleGroups": true
                }'::jsonb,
                
                -- Filtrages spécifiques pour hiérarchie
                hierarchy_filters JSONB NOT NULL DEFAULT '{
                    "showOnlyLevels": [],
                    "hideEmptyParents": false,
                    "filterPreservesHierarchy": true,
                    "searchInChildren": true
                }'::jsonb,
                
                -- Métadonnées
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Contraintes d'intégrité
                CONSTRAINT unique_user_table UNIQUE (user_id, table_id),
                CONSTRAINT fk_hierarchical_preferences_user 
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT check_table_id_format 
                    CHECK (table_id ~ '^[a-zA-Z0-9_-]+$' AND length(table_id) >= 3),
                CONSTRAINT check_max_depth 
                    CHECK ((hierarchy_config->>'maxDepth')::int BETWEEN 1 AND 20),
                CONSTRAINT check_indent_size 
                    CHECK ((display_config->>'indentSize')::int BETWEEN 8 AND 64)
            )
        `)

    // Index pour performance
    await queryRunner.query(`
            CREATE INDEX idx_datatable_hierarchical_user_id ON datatable_hierarchical_preferences(user_id)
        `)
    await queryRunner.query(`
            CREATE INDEX idx_datatable_hierarchical_table_id ON datatable_hierarchical_preferences(table_id)
        `)
    await queryRunner.query(`
            CREATE INDEX idx_datatable_hierarchical_updated_at ON datatable_hierarchical_preferences(updated_at)
        `)

    // Table pour stocker les ordres hiérarchiques personnalisés
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS datatable_hierarchy_order (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID NOT NULL,
                table_id VARCHAR(100) NOT NULL,
                item_id VARCHAR(100) NOT NULL,
                parent_id VARCHAR(100) DEFAULT NULL,
                display_order INT NOT NULL DEFAULT 0,
                level INT NOT NULL DEFAULT 0,
                path VARCHAR(1000) DEFAULT NULL, -- Chemin hiérarchique pour les requêtes efficaces
                
                -- Métadonnées
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Contraintes d'intégrité
                CONSTRAINT unique_user_table_item UNIQUE (user_id, table_id, item_id),
                CONSTRAINT fk_hierarchy_order_user 
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_hierarchy_order_preferences 
                    FOREIGN KEY (user_id, table_id) REFERENCES datatable_hierarchical_preferences(user_id, table_id) 
                    ON DELETE CASCADE,
                CONSTRAINT check_item_id_format 
                    CHECK (item_id ~ '^[a-zA-Z0-9_-]+$' AND length(item_id) >= 1),
                CONSTRAINT check_parent_id_format 
                    CHECK (parent_id IS NULL OR (parent_id ~ '^[a-zA-Z0-9_-]+$' AND length(parent_id) >= 1)),
                CONSTRAINT check_level_range 
                    CHECK (level BETWEEN 0 AND 19),
                CONSTRAINT check_display_order_positive 
                    CHECK (display_order >= 0),
                CONSTRAINT check_path_format 
                    CHECK (path IS NULL OR length(path) <= 1000),
                CONSTRAINT check_parent_not_self 
                    CHECK (parent_id IS NULL OR parent_id != item_id)
            )
        `)

    // Index pour performance et intégrité
    await queryRunner.query(`
            CREATE INDEX idx_datatable_hierarchy_user_table ON datatable_hierarchy_order(user_id, table_id)
        `)
    await queryRunner.query(`
            CREATE INDEX idx_datatable_hierarchy_parent_id ON datatable_hierarchy_order(parent_id)
        `)
    await queryRunner.query(`
            CREATE INDEX idx_datatable_hierarchy_display_order ON datatable_hierarchy_order(display_order)
        `)
    await queryRunner.query(`
            CREATE INDEX idx_datatable_hierarchy_level ON datatable_hierarchy_order(level)
        `)
    await queryRunner.query(`
            CREATE INDEX idx_datatable_hierarchy_path ON datatable_hierarchy_order(path)
        `)
    await queryRunner.query(`
            CREATE INDEX idx_datatable_hierarchy_updated_at ON datatable_hierarchy_order(updated_at)
        `)

    // Table pour les préférences UI des composants ReorderableList
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS ui_preferences_reorderable_list (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID NOT NULL,
                component_id VARCHAR(100) NOT NULL,
                
                -- Configuration du thème
                theme VARCHAR(50) NOT NULL DEFAULT 'default',
                
                -- Préférences utilisateur (JSONB)
                preferences JSONB NOT NULL DEFAULT '{
                    "defaultExpanded": true,
                    "showLevelIndicators": true,
                    "showConnectionLines": true,
                    "enableAnimations": true,
                    "compactMode": false,
                    "customColors": {}
                }'::jsonb,
                
                -- Configuration du layout (JSONB)
                layout JSONB NOT NULL DEFAULT '{
                    "maxDepth": 10,
                    "allowNesting": true,
                    "dragHandlePosition": "left",
                    "expandButtonPosition": "left"
                }'::jsonb,
                
                -- Métadonnées
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Contraintes d'intégrité
                CONSTRAINT unique_user_component UNIQUE (user_id, component_id),
                CONSTRAINT fk_reorderable_preferences_user 
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT check_component_id_format 
                    CHECK (component_id ~ '^[a-zA-Z0-9_-]+$' AND length(component_id) >= 3),
                CONSTRAINT check_theme_values 
                    CHECK (theme IN ('default', 'compact', 'modern', 'minimal', 'colorful')),
                CONSTRAINT check_max_depth_layout 
                    CHECK ((layout->>'maxDepth')::int BETWEEN 1 AND 20),
                CONSTRAINT check_drag_handle_position 
                    CHECK ((layout->>'dragHandlePosition') IN ('left', 'right')),
                CONSTRAINT check_expand_button_position 
                    CHECK ((layout->>'expandButtonPosition') IN ('left', 'right'))
            )
        `)

    // Index pour performance
    await queryRunner.query(`
            CREATE INDEX idx_reorderable_preferences_user_id ON ui_preferences_reorderable_list(user_id)
        `)
    await queryRunner.query(`
            CREATE INDEX idx_reorderable_preferences_component_id ON ui_preferences_reorderable_list(component_id)
        `)
    await queryRunner.query(`
            CREATE INDEX idx_reorderable_preferences_updated_at ON ui_preferences_reorderable_list(updated_at)
        `)

    // Trigger pour updated_at automatique
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `)

    await queryRunner.query(`
            CREATE TRIGGER update_datatable_hierarchical_preferences_updated_at
                BEFORE UPDATE ON datatable_hierarchical_preferences
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `)

    await queryRunner.query(`
            CREATE TRIGGER update_datatable_hierarchy_order_updated_at
                BEFORE UPDATE ON datatable_hierarchy_order
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `)

    await queryRunner.query(`
            CREATE TRIGGER update_ui_preferences_reorderable_list_updated_at
                BEFORE UPDATE ON ui_preferences_reorderable_list
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `)

    // Données d'exemple pour les préférences hiérarchiques
    await queryRunner.query(`
            INSERT INTO datatable_hierarchical_preferences (
                user_id, 
                table_id, 
                hierarchy_config, 
                reorder_config,
                display_config,
                hierarchy_filters
            ) 
            SELECT 
                u.id,
                'quotation-items',
                '{
                    "parentField": "parent_id",
                    "childrenField": "children",
                    "levelField": "level",
                    "orderField": "display_order",
                    "maxDepth": 3,
                    "allowNesting": true,
                    "defaultExpanded": true,
                    "expandedNodes": []
                }'::jsonb,
                '{
                    "enableDragDrop": true,
                    "allowLevelChange": true,
                    "preserveHierarchy": true,
                    "autoExpand": true,
                    "dragHandleVisible": true,
                    "dropIndicatorStyle": "line"
                }'::jsonb,
                '{
                    "showLevelIndicators": true,
                    "showConnectionLines": true,
                    "indentSize": 24,
                    "levelColors": ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
                    "compactMode": false,
                    "collapsibleGroups": true
                }'::jsonb,
                '{
                    "showOnlyLevels": [1, 2],
                    "hideEmptyParents": false,
                    "filterPreservesHierarchy": true,
                    "searchInChildren": true
                }'::jsonb
            FROM users u 
            WHERE u.role = 'admin' 
            LIMIT 1
            ON CONFLICT (user_id, table_id) DO NOTHING
        `)

    // Données d'exemple pour les préférences reorderable list
    await queryRunner.query(`
            INSERT INTO ui_preferences_reorderable_list (
                user_id, 
                component_id, 
                theme, 
                preferences, 
                layout
            ) 
            SELECT 
                u.id,
                'menu-settings',
                'default',
                '{
                    "defaultExpanded": true,
                    "showLevelIndicators": true,
                    "showConnectionLines": true,
                    "enableAnimations": true,
                    "compactMode": false
                }'::jsonb,
                '{
                    "maxDepth": 10,
                    "allowNesting": true,
                    "dragHandlePosition": "left",
                    "expandButtonPosition": "left"
                }'::jsonb
            FROM users u 
            WHERE u.role IN ('admin', 'user')
            LIMIT 5
            ON CONFLICT (user_id, component_id) DO NOTHING
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les triggers
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS update_ui_preferences_reorderable_list_updated_at ON ui_preferences_reorderable_list'
    )
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS update_datatable_hierarchy_order_updated_at ON datatable_hierarchy_order'
    )
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS update_datatable_hierarchical_preferences_updated_at ON datatable_hierarchical_preferences'
    )

    // Supprimer les tables (ordre inverse des dépendances)
    await queryRunner.query('DROP TABLE IF EXISTS ui_preferences_reorderable_list')
    await queryRunner.query('DROP TABLE IF EXISTS datatable_hierarchy_order')
    await queryRunner.query('DROP TABLE IF EXISTS datatable_hierarchical_preferences')

    // Supprimer la fonction trigger si plus utilisée
    await queryRunner.query('DROP FUNCTION IF EXISTS update_updated_at_column()')
  }
}
