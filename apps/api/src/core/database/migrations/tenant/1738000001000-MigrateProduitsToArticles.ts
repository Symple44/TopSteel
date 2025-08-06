import type { MigrationInterface, QueryRunner } from 'typeorm'

export class MigrateProduitsToArticles1738000001000 implements MigrationInterface {
  name = 'MigrateProduitsToArticles1738000001000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier que la table produits existe et contient des données
    const produitsExists = await queryRunner.hasTable('produits')
    if (!produitsExists) {
      return
    }

    const articlesExists = await queryRunner.hasTable('articles')
    if (!articlesExists) {
      throw new Error(
        "Table articles n'existe pas. Exécutez d'abord la migration CreateArticlesTable"
      )
    }

    // Compter les produits existants
    const produitCount = await queryRunner.query(
      'SELECT COUNT(*) as count FROM produits WHERE deleted_at IS NULL'
    )

    if (parseInt(produitCount[0].count) === 0) {
      return
    }

    // Compter les articles existants
    const articleCount = await queryRunner.query('SELECT COUNT(*) as count FROM articles')

    if (parseInt(articleCount[0].count) > 0) {
    }

    // Migration des données
    await queryRunner.query(`
      INSERT INTO articles (
        -- Colonnes de base
        id,
        created_at,
        updated_at,
        deleted_at,
        version,
        created_by_id,
        updated_by_id,
        
        -- Colonnes tenant
        societe_id,
        site_id,
        
        -- Colonnes métier
        reference,
        designation,
        description,
        type,
        status,
        
        -- Classification
        famille,
        sous_famille,
        
        -- Prix et valorisation
        prix_vente_ht,
        prix_achat_standard,
        taux_marge,
        
        -- Caractéristiques techniques
        caracteristiques_techniques,
        
        -- Métadonnées
        metadonnees,
        
        -- Dates
        date_creation_fiche,
        date_derniere_modification
      )
      SELECT 
        -- Génération d'un nouvel UUID pour chaque article
        gen_random_uuid() as id,
        p.created_at,
        p.updated_at,
        p.deleted_at,
        p.version,
        p.created_by_id,
        p.updated_by_id,
        
        -- Tenant
        p.societe_id,
        p.site_id,
        
        -- Transformation des données métier
        CASE 
          WHEN p.reference IS NOT NULL AND p.reference != '' THEN p.reference
          ELSE 'PROD-' || LPAD(p.id::text, 6, '0')
        END as reference,
        p.nom as designation,
        p.description,
        
        -- Mapping du type produit vers type article
        CASE 
          WHEN UPPER(p.type) IN ('ACIER', 'INOX', 'ALUMINIUM', 'METAL', 'MATIERE') THEN 'MATIERE_PREMIERE'
          WHEN UPPER(p.type) IN ('PROFILE', 'POUTRE', 'TUBE', 'SEMI-FINI') THEN 'PRODUIT_SEMI_FINI'
          WHEN UPPER(p.type) IN ('STRUCTURE', 'ASSEMBLAGE', 'FINI') THEN 'PRODUIT_FINI'
          WHEN UPPER(p.type) IN ('VISSERIE', 'QUINCAILLERIE', 'FOURNITURE') THEN 'FOURNITURE'
          WHEN UPPER(p.type) IN ('ELECTRODE', 'CONSOMMABLE') THEN 'CONSOMMABLE'
          WHEN UPPER(p.type) = 'SERVICE' THEN 'SERVICE'
          ELSE 'MATIERE_PREMIERE'
        END::article_type as type,
        
        -- Status basé sur actif
        CASE 
          WHEN p.actif = true THEN 'ACTIF'
          ELSE 'INACTIF'
        END::article_status as status,
        
        -- Classification dérivée du type
        CASE 
          WHEN UPPER(p.type) IN ('ACIER', 'INOX', 'ALUMINIUM') THEN 'METAUX'
          WHEN UPPER(p.type) IN ('PROFILE', 'POUTRE') THEN 'PROFILES'
          WHEN UPPER(p.type) IN ('TUBE') THEN 'TUBES'
          WHEN UPPER(p.type) IN ('TOLE') THEN 'TOLES'
          WHEN UPPER(p.type) IN ('VISSERIE', 'QUINCAILLERIE') THEN 'QUINCAILLERIE'
          ELSE 'DIVERS'
        END as famille,
        
        p.type as sous_famille,
        
        -- Prix et marges
        p.prix_vente as prix_vente_ht,
        p.cout_production as prix_achat_standard,
        
        -- Calcul du taux de marge
        CASE 
          WHEN p.cout_production IS NOT NULL AND p.cout_production > 0 THEN
            ROUND(((p.prix_vente - p.cout_production) / p.cout_production) * 100, 2)
          ELSE NULL
        END as taux_marge,
        
        -- Caractéristiques techniques enrichies
        CASE 
          WHEN p.specifications IS NOT NULL AND p.specifications != '{}'::jsonb THEN
            jsonb_build_object(
              'specifications_origine', p.specifications,
              'temps_fabrication_minutes', p.temps_fabrication,
              'migre_depuis', 'table_produits',
              'date_migration', CURRENT_TIMESTAMP
            )
          ELSE 
            jsonb_build_object(
              'temps_fabrication_minutes', p.temps_fabrication,
              'migre_depuis', 'table_produits',
              'date_migration', CURRENT_TIMESTAMP
            )
        END as caracteristiques_techniques,
        
        -- Métadonnées enrichies
        CASE 
          WHEN p.metadata IS NOT NULL THEN
            p.metadata || jsonb_build_object(
              'origine_migration', 'produits',
              'id_origine', p.id,
              'reference_origine', p.reference,
              'migration_version', '1.0'
            )
          ELSE
            jsonb_build_object(
              'origine_migration', 'produits',
              'id_origine', p.id,
              'reference_origine', p.reference,
              'migration_version', '1.0'
            )
        END as metadonnees,
        
        -- Dates
        p.created_at::date as date_creation_fiche,
        p.updated_at::date as date_derniere_modification
        
      FROM produits p
      WHERE p.deleted_at IS NULL
      ON CONFLICT (reference) DO NOTHING
    `)

    // Compter les articles migrés
    const _migratedCount = await queryRunner.query(
      `SELECT COUNT(*) as count FROM articles WHERE metadonnees->>'origine_migration' = 'produits'`
    )

    // Créer une vue pour la compatibilité ascendante
    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_produits_legacy AS
      SELECT 
        COALESCE(
          (a.metadonnees->>'id_origine')::integer,
          ROW_NUMBER() OVER (ORDER BY a.created_at)::integer
        ) as id,
        a.societe_id,
        a.site_id,
        a.designation as nom,
        a.reference,
        a.description,
        COALESCE(a.sous_famille, a.famille) as type,
        a.prix_vente_ht as prix_vente,
        a.prix_achat_standard as cout_production,
        (a.caracteristiques_techniques->>'temps_fabrication_minutes')::integer as temps_fabrication,
        COALESCE(
          a.caracteristiques_techniques->'specifications_origine',
          '{}'::jsonb
        ) as specifications,
        CASE 
          WHEN a.status = 'ACTIF' THEN true
          ELSE false
        END as actif,
        a.metadonnees as metadata,
        a.created_at,
        a.updated_at,
        a.deleted_at,
        a.version,
        a.created_by_id,
        a.updated_by_id
      FROM articles a
      WHERE a.metadonnees->>'origine_migration' = 'produits'
    `)

    // Ajouter un commentaire sur la table produits
    await queryRunner.query(
      `COMMENT ON TABLE produits IS 'OBSOLÈTE - Données migrées vers la table articles. Utiliser la vue v_produits_legacy pour compatibilité.'`
    )

    // Log des statistiques de migration
    const _stats = await queryRunner.query(`
      SELECT 
        a.type,
        a.famille,
        COUNT(*) as nombre,
        ROUND(AVG(a.prix_vente_ht), 2) as prix_moyen
      FROM articles a
      WHERE a.metadonnees->>'origine_migration' = 'produits'
      GROUP BY a.type, a.famille
      ORDER BY nombre DESC
    `)
    // Stats are logged but not processed in this migration
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer la vue de compatibilité
    await queryRunner.query('DROP VIEW IF EXISTS v_produits_legacy')

    // Supprimer le commentaire sur la table produits
    await queryRunner.query('COMMENT ON TABLE produits IS NULL')

    // Supprimer les articles migrés depuis produits
    await queryRunner.query(`
      DELETE FROM articles 
      WHERE metadonnees->>'origine_migration' = 'produits'
    `)
  }
}
