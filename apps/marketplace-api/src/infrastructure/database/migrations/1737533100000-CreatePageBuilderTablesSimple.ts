import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CreatePageBuilderTablesSimple1737533100000 implements MigrationInterface {
  name = 'CreatePageBuilderTablesSimple1737533100000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Table marketplace_page_templates
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS marketplace_page_templates (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        societe_id uuid NOT NULL,
        name varchar(255) NOT NULL,
        slug varchar(255) NOT NULL,
        page_type varchar(50) DEFAULT 'custom' CHECK (page_type IN ('home', 'category', 'product', 'custom', 'landing', 'about', 'contact')),
        status varchar(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
        description text,
        metadata jsonb DEFAULT '{}',
        settings jsonb DEFAULT '{}',
        published_at timestamp,
        scheduled_at timestamp,
        version integer DEFAULT 0,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
        created_by uuid,
        updated_by uuid,
        UNIQUE(societe_id, slug)
      );
    `)

    // Indexes pour page_templates
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_page_templates_societe_type ON marketplace_page_templates(societe_id, page_type);
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_page_templates_status ON marketplace_page_templates(status);
    `)

    // Table marketplace_page_sections
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS marketplace_page_sections (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        page_template_id uuid NOT NULL,
        type varchar(50) NOT NULL CHECK (type IN (
          'hero', 'banner', 'products_grid', 'products_carousel', 'categories',
          'text_block', 'image_gallery', 'video', 'testimonials', 'features',
          'cta', 'newsletter', 'faq', 'contact_form', 'map', 'custom_html',
          'spacer', 'divider', 'tabs', 'accordion', 'countdown', 'pricing_table',
          'team', 'brands', 'blog_posts', 'statistics'
        )),
        name varchar(255) NOT NULL,
        "order" integer NOT NULL,
        is_visible boolean DEFAULT true,
        content jsonb DEFAULT '{}',
        styles jsonb DEFAULT '{}',
        responsive jsonb DEFAULT '{}',
        settings jsonb DEFAULT '{}',
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (page_template_id) REFERENCES marketplace_page_templates(id) ON DELETE CASCADE
      );
    `)

    // Index pour page_sections
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_page_sections_template_order ON marketplace_page_sections(page_template_id, "order");
    `)

    // Table marketplace_section_presets
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS marketplace_section_presets (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        name varchar(255) NOT NULL,
        description text,
        type varchar(50) NOT NULL CHECK (type IN (
          'hero', 'banner', 'products_grid', 'products_carousel', 'categories',
          'text_block', 'image_gallery', 'video', 'testimonials', 'features',
          'cta', 'newsletter', 'faq', 'contact_form', 'map', 'custom_html',
          'spacer', 'divider', 'tabs', 'accordion', 'countdown', 'pricing_table',
          'team', 'brands', 'blog_posts', 'statistics'
        )),
        category varchar(50) CHECK (category IN ('headers', 'heroes', 'products', 'content', 'features', 'testimonials', 'cta', 'contact', 'footers', 'custom')),
        thumbnail varchar(500),
        is_public boolean DEFAULT false,
        societe_id uuid,
        content jsonb DEFAULT '{}',
        styles jsonb DEFAULT '{}',
        default_settings jsonb DEFAULT '{}',
        tags text[],
        usage_count integer DEFAULT 0,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Indexes pour section_presets
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_section_presets_type_category ON marketplace_section_presets(type, category);
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_section_presets_public ON marketplace_section_presets(is_public);
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS marketplace_section_presets;`)
    await queryRunner.query(`DROP TABLE IF EXISTS marketplace_page_sections;`)
    await queryRunner.query(`DROP TABLE IF EXISTS marketplace_page_templates;`)
  }
}
