import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateSearchIndexes1740300000000 implements MigrationInterface {
  name = 'CreateSearchIndexes1740300000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========== Extensions PostgreSQL ==========
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE EXTENSION IF NOT EXISTS unaccent;
    `)

    // ========== PARTNERS (Clients/Fournisseurs) ==========
    await queryRunner.query(`
      -- Index GIN pour recherche full-text sur partners
      CREATE INDEX IF NOT EXISTS idx_partners_search 
      ON partners USING gin(
        to_tsvector('french', 
          coalesce(denomination, '') || ' ' || 
          coalesce(denomination_commerciale, '') || ' ' || 
          coalesce(code, '') || ' ' ||
          coalesce(email, '') || ' ' ||
          coalesce(ville, '')
        )
      );

      -- Index trigram pour recherche fuzzy
      CREATE INDEX IF NOT EXISTS idx_partners_trigram
      ON partners USING gin(
        (coalesce(denomination, '') || ' ' || coalesce(code, '')) gin_trgm_ops
      );

      -- Index sur les champs fréquemment recherchés
      CREATE INDEX IF NOT EXISTS idx_partners_code ON partners(code);
      CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
      CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(partner_type);
      CREATE INDEX IF NOT EXISTS idx_partners_tenant ON partners(tenant_id);
    `)

    // ========== ARTICLES ==========
    await queryRunner.query(`
      -- Index GIN pour recherche full-text sur articles
      CREATE INDEX IF NOT EXISTS idx_articles_search
      ON articles USING gin(
        to_tsvector('french',
          coalesce(designation, '') || ' ' ||
          coalesce(reference, '') || ' ' ||
          coalesce(description, '') || ' ' ||
          coalesce(famille, '') || ' ' ||
          coalesce(marque, '')
        )
      );

      -- Index trigram pour recherche fuzzy
      CREATE INDEX IF NOT EXISTS idx_articles_trigram
      ON articles USING gin(
        (coalesce(designation, '') || ' ' || coalesce(reference, '')) gin_trgm_ops
      );

      -- Index sur les champs fréquemment recherchés
      CREATE INDEX IF NOT EXISTS idx_articles_reference ON articles(reference);
      CREATE INDEX IF NOT EXISTS idx_articles_code_ean ON articles(code_ean);
      CREATE INDEX IF NOT EXISTS idx_articles_famille ON articles(famille);
      CREATE INDEX IF NOT EXISTS idx_articles_societe ON articles(societe_id);
    `)

    // ========== MATERIALS ==========
    await queryRunner.query(`
      -- Index GIN pour recherche full-text sur materials
      CREATE INDEX IF NOT EXISTS idx_materials_search
      ON materials USING gin(
        to_tsvector('french',
          coalesce(nom, '') || ' ' ||
          coalesce(reference, '') || ' ' ||
          coalesce(description, '') || ' ' ||
          coalesce(type, '') || ' ' ||
          coalesce(forme, '') || ' ' ||
          coalesce(nuance, '')
        )
      );

      -- Index trigram pour recherche fuzzy
      CREATE INDEX IF NOT EXISTS idx_materials_trigram
      ON materials USING gin(
        (coalesce(nom, '') || ' ' || coalesce(reference, '')) gin_trgm_ops
      );

      -- Index sur les champs fréquemment recherchés
      CREATE INDEX IF NOT EXISTS idx_materials_reference ON materials(reference);
      CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(type);
      CREATE INDEX IF NOT EXISTS idx_materials_forme ON materials(forme);
      CREATE INDEX IF NOT EXISTS idx_materials_tenant ON materials(tenant_id);
    `)

    // ========== PROJETS ==========
    await queryRunner.query(`
      -- Index GIN pour recherche full-text sur projets
      CREATE INDEX IF NOT EXISTS idx_projets_search
      ON projets USING gin(
        to_tsvector('french',
          coalesce(nom, '') || ' ' ||
          coalesce(code, '') || ' ' ||
          coalesce(description, '')
        )
      );

      -- Index trigram pour recherche fuzzy
      CREATE INDEX IF NOT EXISTS idx_projets_trigram
      ON projets USING gin(
        (coalesce(nom, '') || ' ' || coalesce(code, '')) gin_trgm_ops
      );

      -- Index sur les champs fréquemment recherchés
      CREATE INDEX IF NOT EXISTS idx_projets_code ON projets(code);
      CREATE INDEX IF NOT EXISTS idx_projets_statut ON projets(statut);
      CREATE INDEX IF NOT EXISTS idx_projets_societe ON projets(societe_id);
    `)

    // ========== DEVIS ==========
    await queryRunner.query(`
      -- Index GIN pour recherche full-text sur devis
      CREATE INDEX IF NOT EXISTS idx_devis_search
      ON devis USING gin(
        to_tsvector('french',
          coalesce(numero, '') || ' ' ||
          coalesce(objet, '')
        )
      );

      -- Index sur les champs fréquemment recherchés
      CREATE INDEX IF NOT EXISTS idx_devis_numero ON devis(numero);
      CREATE INDEX IF NOT EXISTS idx_devis_statut ON devis(statut);
      CREATE INDEX IF NOT EXISTS idx_devis_client ON devis(client_id);
      CREATE INDEX IF NOT EXISTS idx_devis_societe ON devis(societe_id);
    `)

    // ========== FACTURES ==========
    await queryRunner.query(`
      -- Index GIN pour recherche full-text sur factures
      CREATE INDEX IF NOT EXISTS idx_factures_search
      ON factures USING gin(
        to_tsvector('french',
          coalesce(numero, '') || ' ' ||
          coalesce(objet, '')
        )
      );

      -- Index sur les champs fréquemment recherchés
      CREATE INDEX IF NOT EXISTS idx_factures_numero ON factures(numero);
      CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);
      CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id);
      CREATE INDEX IF NOT EXISTS idx_factures_societe ON factures(societe_id);
    `)

    // ========== COMMANDES ==========
    await queryRunner.query(`
      -- Index GIN pour recherche full-text sur commandes
      CREATE INDEX IF NOT EXISTS idx_commandes_search
      ON commandes USING gin(
        to_tsvector('french',
          coalesce(numero, '') || ' ' ||
          coalesce(objet, '')
        )
      );

      -- Index sur les champs fréquemment recherchés
      CREATE INDEX IF NOT EXISTS idx_commandes_numero ON commandes(numero);
      CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);
      CREATE INDEX IF NOT EXISTS idx_commandes_fournisseur ON commandes(fournisseur_id);
      CREATE INDEX IF NOT EXISTS idx_commandes_societe ON commandes(societe_id);
    `)

    // ========== MENU_ITEMS ==========
    await queryRunner.query(`
      -- Index GIN pour recherche full-text sur menu_items
      CREATE INDEX IF NOT EXISTS idx_menu_items_search
      ON menu_items USING gin(
        to_tsvector('french',
          coalesce(title, '') || ' ' ||
          coalesce("programId", '')
        )
      );

      -- Index trigram pour recherche fuzzy
      CREATE INDEX IF NOT EXISTS idx_menu_items_trigram
      ON menu_items USING gin(
        title gin_trgm_ops
      );

      -- Index sur les champs fréquemment recherchés
      CREATE INDEX IF NOT EXISTS idx_menu_items_visible ON menu_items("isVisible");
      CREATE INDEX IF NOT EXISTS idx_menu_items_type ON menu_items(type);
      CREATE INDEX IF NOT EXISTS idx_menu_items_config ON menu_items("configId");
    `)

    // ========== USERS ==========
    await queryRunner.query(`
      -- Index GIN pour recherche full-text sur users
      CREATE INDEX IF NOT EXISTS idx_users_search
      ON users USING gin(
        to_tsvector('french',
          coalesce(nom, '') || ' ' ||
          coalesce(prenom, '') || ' ' ||
          coalesce(email, '') || ' ' ||
          coalesce(acronyme, '')
        )
      );

      -- Index trigram pour recherche fuzzy
      CREATE INDEX IF NOT EXISTS idx_users_trigram
      ON users USING gin(
        (coalesce(nom, '') || ' ' || coalesce(prenom, '') || ' ' || coalesce(email, '')) gin_trgm_ops
      );

      -- Index sur les champs fréquemment recherchés
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_acronyme ON users(acronyme);
    `)

    // ========== SOCIETES ==========
    await queryRunner.query(`
      -- Index GIN pour recherche full-text sur societes
      CREATE INDEX IF NOT EXISTS idx_societes_search
      ON societes USING gin(
        to_tsvector('french',
          coalesce(nom, '') || ' ' ||
          coalesce(code, '') || ' ' ||
          coalesce(siret, '') || ' ' ||
          coalesce(ville, '')
        )
      );

      -- Index trigram pour recherche fuzzy
      CREATE INDEX IF NOT EXISTS idx_societes_trigram
      ON societes USING gin(
        (coalesce(nom, '') || ' ' || coalesce(code, '')) gin_trgm_ops
      );

      -- Index sur les champs fréquemment recherchés
      CREATE INDEX IF NOT EXISTS idx_societes_code ON societes(code);
      CREATE INDEX IF NOT EXISTS idx_societes_siret ON societes(siret);
    `)

    // ========== SHARED_MATERIALS ==========
    await queryRunner.query(`
      -- Index GIN pour recherche full-text sur shared_materials
      CREATE INDEX IF NOT EXISTS idx_shared_materials_search
      ON shared_materials USING gin(
        to_tsvector('french',
          coalesce(nom, '') || ' ' ||
          coalesce(code, '') || ' ' ||
          coalesce(description, '') || ' ' ||
          coalesce(type, '') || ' ' ||
          coalesce(forme, '')
        )
      );

      -- Index trigram pour recherche fuzzy
      CREATE INDEX IF NOT EXISTS idx_shared_materials_trigram
      ON shared_materials USING gin(
        (coalesce(nom, '') || ' ' || coalesce(code, '')) gin_trgm_ops
      );

      -- Index sur les champs fréquemment recherchés
      CREATE INDEX IF NOT EXISTS idx_shared_materials_code ON shared_materials(code);
      CREATE INDEX IF NOT EXISTS idx_shared_materials_type ON shared_materials(type);
    `)

    // ========== PRICE_RULES ==========
    await queryRunner.query(`
      -- Index GIN pour recherche full-text sur price_rules
      CREATE INDEX IF NOT EXISTS idx_price_rules_search
      ON price_rules USING gin(
        to_tsvector('french',
          coalesce("ruleName", '') || ' ' ||
          coalesce(description, '') || ' ' ||
          coalesce("articleFamily", '')
        )
      );

      -- Index sur les champs fréquemment recherchés
      CREATE INDEX IF NOT EXISTS idx_price_rules_name ON price_rules("ruleName");
      CREATE INDEX IF NOT EXISTS idx_price_rules_family ON price_rules("articleFamily");
      CREATE INDEX IF NOT EXISTS idx_price_rules_tenant ON price_rules("tenantId");
    `)

    // ========== NOTIFICATIONS ==========
    await queryRunner.query(`
      -- Index GIN pour recherche full-text sur notifications
      CREATE INDEX IF NOT EXISTS idx_notifications_search
      ON notifications USING gin(
        to_tsvector('french',
          coalesce(title, '') || ' ' ||
          coalesce(message, '')
        )
      );

      -- Index sur les champs fréquemment recherchés
      CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    `)

    // ========== QUERY_BUILDERS ==========
    await queryRunner.query(`
      -- Index GIN pour recherche full-text sur query_builders
      CREATE INDEX IF NOT EXISTS idx_query_builders_search
      ON query_builders USING gin(
        to_tsvector('french',
          coalesce(name, '') || ' ' ||
          coalesce(description, '') || ' ' ||
          coalesce("mainTable", '')
        )
      );

      -- Index sur les champs fréquemment recherchés
      CREATE INDEX IF NOT EXISTS idx_query_builders_name ON query_builders(name);
      CREATE INDEX IF NOT EXISTS idx_query_builders_table ON query_builders("mainTable");
      CREATE INDEX IF NOT EXISTS idx_query_builders_tenant ON query_builders("tenantId");
    `)

    // ========== Fonction de recherche générique ==========
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION search_global(
        search_term TEXT,
        search_types TEXT[],
        tenant_id UUID DEFAULT NULL,
        limit_results INTEGER DEFAULT 20
      )
      RETURNS TABLE (
        type TEXT,
        id UUID,
        title TEXT,
        description TEXT,
        score REAL
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        WITH search_results AS (
          -- Partners (Clients)
          SELECT 
            'client'::TEXT as type,
            p.id,
            p.denomination as title,
            p.code || ' - ' || coalesce(p.email, '') as description,
            ts_rank(
              to_tsvector('french', 
                coalesce(p.denomination, '') || ' ' || 
                coalesce(p.code, '') || ' ' ||
                coalesce(p.email, '')
              ),
              plainto_tsquery('french', search_term)
            ) as score
          FROM partners p
          WHERE 
            p.partner_type = 'CLIENT' AND
            ('client' = ANY(search_types) OR search_types IS NULL) AND
            (p.tenant_id = tenant_id OR tenant_id IS NULL) AND
            to_tsvector('french', 
              coalesce(p.denomination, '') || ' ' || 
              coalesce(p.code, '') || ' ' ||
              coalesce(p.email, '')
            ) @@ plainto_tsquery('french', search_term)
          
          UNION ALL
          
          -- Partners (Fournisseurs)
          SELECT 
            'fournisseur'::TEXT as type,
            p.id,
            p.denomination as title,
            p.code || ' - ' || coalesce(p.email, '') as description,
            ts_rank(
              to_tsvector('french', 
                coalesce(p.denomination, '') || ' ' || 
                coalesce(p.code, '') || ' ' ||
                coalesce(p.email, '')
              ),
              plainto_tsquery('french', search_term)
            ) as score
          FROM partners p
          WHERE 
            p.partner_type = 'SUPPLIER' AND
            ('fournisseur' = ANY(search_types) OR search_types IS NULL) AND
            (p.tenant_id = tenant_id OR tenant_id IS NULL) AND
            to_tsvector('french', 
              coalesce(p.denomination, '') || ' ' || 
              coalesce(p.code, '') || ' ' ||
              coalesce(p.email, '')
            ) @@ plainto_tsquery('french', search_term)
          
          UNION ALL
          
          -- Articles
          SELECT 
            'article'::TEXT as type,
            a.id,
            a.designation as title,
            a.reference || ' - ' || coalesce(a.description, '') as description,
            ts_rank(
              to_tsvector('french',
                coalesce(a.designation, '') || ' ' ||
                coalesce(a.reference, '') || ' ' ||
                coalesce(a.description, '')
              ),
              plainto_tsquery('french', search_term)
            ) as score
          FROM articles a
          WHERE 
            ('article' = ANY(search_types) OR search_types IS NULL) AND
            (a.societe_id = tenant_id OR tenant_id IS NULL) AND
            to_tsvector('french',
              coalesce(a.designation, '') || ' ' ||
              coalesce(a.reference, '') || ' ' ||
              coalesce(a.description, '')
            ) @@ plainto_tsquery('french', search_term)
          
          UNION ALL
          
          -- Projets
          SELECT 
            'projet'::TEXT as type,
            p.id,
            p.nom as title,
            p.code || ' - ' || coalesce(p.description, '') as description,
            ts_rank(
              to_tsvector('french',
                coalesce(p.nom, '') || ' ' ||
                coalesce(p.code, '') || ' ' ||
                coalesce(p.description, '')
              ),
              plainto_tsquery('french', search_term)
            ) as score
          FROM projets p
          WHERE 
            ('projet' = ANY(search_types) OR search_types IS NULL) AND
            (p.societe_id = tenant_id OR tenant_id IS NULL) AND
            to_tsvector('french',
              coalesce(p.nom, '') || ' ' ||
              coalesce(p.code, '') || ' ' ||
              coalesce(p.description, '')
            ) @@ plainto_tsquery('french', search_term)
        )
        SELECT * FROM search_results
        ORDER BY score DESC
        LIMIT limit_results;
      END;
      $$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer la fonction de recherche
    await queryRunner.query(`DROP FUNCTION IF EXISTS search_global`)

    // Supprimer tous les index créés
    const tables = [
      'partners',
      'articles',
      'materials',
      'projets',
      'devis',
      'factures',
      'commandes',
      'menu_items',
      'users',
      'societes',
      'shared_materials',
      'price_rules',
      'notifications',
      'query_builders',
    ]

    for (const table of tables) {
      await queryRunner.query(`
        DROP INDEX IF EXISTS idx_${table}_search;
        DROP INDEX IF EXISTS idx_${table}_trigram;
      `)
    }

    // Supprimer les index spécifiques
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_partners_code;
      DROP INDEX IF EXISTS idx_partners_email;
      DROP INDEX IF EXISTS idx_partners_type;
      DROP INDEX IF EXISTS idx_partners_tenant;
      
      DROP INDEX IF EXISTS idx_articles_reference;
      DROP INDEX IF EXISTS idx_articles_code_ean;
      DROP INDEX IF EXISTS idx_articles_famille;
      DROP INDEX IF EXISTS idx_articles_societe;
      
      DROP INDEX IF EXISTS idx_materials_reference;
      DROP INDEX IF EXISTS idx_materials_type;
      DROP INDEX IF EXISTS idx_materials_forme;
      DROP INDEX IF EXISTS idx_materials_tenant;
      
      DROP INDEX IF EXISTS idx_projets_code;
      DROP INDEX IF EXISTS idx_projets_statut;
      DROP INDEX IF EXISTS idx_projets_societe;
      
      DROP INDEX IF EXISTS idx_devis_numero;
      DROP INDEX IF EXISTS idx_devis_statut;
      DROP INDEX IF EXISTS idx_devis_client;
      DROP INDEX IF EXISTS idx_devis_societe;
      
      DROP INDEX IF EXISTS idx_factures_numero;
      DROP INDEX IF EXISTS idx_factures_statut;
      DROP INDEX IF EXISTS idx_factures_client;
      DROP INDEX IF EXISTS idx_factures_societe;
      
      DROP INDEX IF EXISTS idx_commandes_numero;
      DROP INDEX IF EXISTS idx_commandes_statut;
      DROP INDEX IF EXISTS idx_commandes_fournisseur;
      DROP INDEX IF EXISTS idx_commandes_societe;
      
      DROP INDEX IF EXISTS idx_menu_items_visible;
      DROP INDEX IF EXISTS idx_menu_items_type;
      DROP INDEX IF EXISTS idx_menu_items_config;
      
      DROP INDEX IF EXISTS idx_users_email;
      DROP INDEX IF EXISTS idx_users_acronyme;
      
      DROP INDEX IF EXISTS idx_societes_code;
      DROP INDEX IF EXISTS idx_societes_siret;
      
      DROP INDEX IF EXISTS idx_shared_materials_code;
      DROP INDEX IF EXISTS idx_shared_materials_type;
      
      DROP INDEX IF EXISTS idx_price_rules_name;
      DROP INDEX IF EXISTS idx_price_rules_family;
      DROP INDEX IF EXISTS idx_price_rules_tenant;
      
      DROP INDEX IF EXISTS idx_notifications_category;
      DROP INDEX IF EXISTS idx_notifications_user;
      DROP INDEX IF EXISTS idx_notifications_read;
      
      DROP INDEX IF EXISTS idx_query_builders_name;
      DROP INDEX IF EXISTS idx_query_builders_table;
      DROP INDEX IF EXISTS idx_query_builders_tenant;
    `)
  }
}
