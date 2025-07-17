import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateUserMenuPreferences1752530700000 implements MigrationInterface {
  name = 'CreateUserMenuPreferences1752530700000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table user_menu_preferences
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_menu_preferences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL UNIQUE,
        base_config_id UUID,
        use_custom_layout BOOLEAN NOT NULL DEFAULT false,
        layout_type VARCHAR(20) NOT NULL DEFAULT 'standard',
        show_icons BOOLEAN NOT NULL DEFAULT true,
        show_badges BOOLEAN NOT NULL DEFAULT false,
        allow_collapse BOOLEAN NOT NULL DEFAULT true,
        theme VARCHAR(20) NOT NULL DEFAULT 'auto',
        custom_colors JSONB,
        favorite_items JSONB,
        hidden_items JSONB,
        pinned_items JSONB,
        custom_order JSONB,
        shortcuts JSONB,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY (base_config_id) REFERENCES menu_configurations(id) ON DELETE SET NULL
      )
    `)

    // Créer la table user_menu_item_preferences
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_menu_item_preferences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_preferences_id UUID NOT NULL,
        menu_item_id UUID NOT NULL,
        is_visible BOOLEAN NOT NULL DEFAULT true,
        is_favorite BOOLEAN NOT NULL DEFAULT false,
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        custom_order INTEGER,
        custom_title VARCHAR(100),
        custom_icon VARCHAR(50),
        custom_color VARCHAR(100),
        custom_badge VARCHAR(50),
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        FOREIGN KEY (user_preferences_id) REFERENCES user_menu_preferences(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
        UNIQUE(user_preferences_id, menu_item_id)
      )
    `)

    // Créer les index
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_menu_preferences_user_id ON user_menu_preferences(user_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_menu_preferences_base_config_id ON user_menu_preferences(base_config_id)`)
    
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_menu_item_preferences_user_preferences_id ON user_menu_item_preferences(user_preferences_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_menu_item_preferences_menu_item_id ON user_menu_item_preferences(menu_item_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_menu_item_preferences_is_favorite ON user_menu_item_preferences(is_favorite)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_menu_item_preferences_is_pinned ON user_menu_item_preferences(is_pinned)`)

    // Insérer des préférences par défaut pour les utilisateurs existants (si applicable)
    // Cette partie sera exécutée seulement s'il y a des utilisateurs dans le système
    const activeConfigResult = await queryRunner.query(`
      SELECT id FROM menu_configurations WHERE is_active = true LIMIT 1
    `)
    
    if (activeConfigResult.length > 0) {
      const activeConfigId = activeConfigResult[0].id
      
      // Note: Dans un vrai système, vous voudriez probablement référencer une table users
      // Pour l'instant, nous préparons juste la structure
      await queryRunner.query(`
        -- Cette requête sera à adapter selon votre table users existante
        -- INSERT INTO user_menu_preferences (user_id, base_config_id)
        -- SELECT id, '${activeConfigId}' FROM users WHERE id NOT IN (
        --   SELECT user_id FROM user_menu_preferences
        -- )
      `)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les tables dans l'ordre inverse
    await queryRunner.query(`DROP TABLE IF EXISTS user_menu_item_preferences`)
    await queryRunner.query(`DROP TABLE IF EXISTS user_menu_preferences`)
  }
}