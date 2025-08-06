import { type MigrationInterface, type QueryRunner, TableColumn, TableForeignKey } from 'typeorm'

export class MigrateCompleteProduitsToArticles1738000002000 implements MigrationInterface {
  name = 'MigrateCompleteProduitsToArticles1738000002000'

  // Tables qui référencent produit_id
  private tablesWithProduitId = [
    { table: 'stocks', columnName: 'produit_id', fkName: 'FK_stocks_produit' },
    { table: 'ligne_devis', columnName: 'produit_id', fkName: 'FK_ligne_devis_produit' },
    {
      table: 'ordre_fabrication',
      columnName: 'produit_id',
      fkName: 'FK_ordre_fabrication_produit',
    },
  ]

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Vérifier les prérequis
    const produitsExists = await queryRunner.hasTable('produits')
    const articlesExists = await queryRunner.hasTable('articles')

    if (!produitsExists) {
      return
    }

    if (!articlesExists) {
      throw new Error(
        "Table articles n'existe pas. Exécutez d'abord la migration CreateArticlesTable"
      )
    }

    // 2. Migrer les données de produits vers articles (si pas déjà fait)
    const existingMigration = await queryRunner.query(
      `SELECT COUNT(*) as count FROM articles WHERE metadonnees->>'origine_migration' = 'produits'`
    )

    if (parseInt(existingMigration[0].count) === 0) {
      await this.migrateProduitsData(queryRunner)
    }

    // 3. Pour chaque table qui référence produit_id
    for (const tableInfo of this.tablesWithProduitId) {
      const tableExists = await queryRunner.hasTable(tableInfo.table)
      if (!tableExists) {
        continue
      }

      const hasColumn = await queryRunner.hasColumn(tableInfo.table, tableInfo.columnName)
      if (!hasColumn) {
        continue
      }

      // Ajouter la colonne article_id si elle n'existe pas
      const hasArticleId = await queryRunner.hasColumn(tableInfo.table, 'article_id')
      if (!hasArticleId) {
        await queryRunner.addColumn(
          tableInfo.table,
          new TableColumn({
            name: 'article_id',
            type: 'uuid',
            isNullable: true,
          })
        )
      }

      // Migrer les références produit_id vers article_id
      await queryRunner.query(`
        UPDATE ${tableInfo.table} t
        SET article_id = a.id
        FROM produits p
        JOIN articles a ON a.metadonnees->>'id_origine' = p.id::text
        WHERE t.${tableInfo.columnName} = p.id
          AND a.metadonnees->>'origine_migration' = 'produits'
      `)

      // Compter les références migrées
      const _migratedRefs = await queryRunner.query(`
        SELECT COUNT(*) as count 
        FROM ${tableInfo.table} 
        WHERE article_id IS NOT NULL 
          AND ${tableInfo.columnName} IS NOT NULL
      `)

      // Supprimer l'ancienne contrainte de clé étrangère
      try {
        await queryRunner.dropForeignKey(tableInfo.table, tableInfo.fkName)
      } catch {}

      // Créer la nouvelle contrainte sur article_id
      await queryRunner.createForeignKey(
        tableInfo.table,
        new TableForeignKey({
          name: tableInfo.fkName.replace('produit', 'article'),
          columnNames: ['article_id'],
          referencedTableName: 'articles',
          referencedColumnNames: ['id'],
          onDelete: tableInfo.table === 'ligne_devis' ? 'SET NULL' : 'CASCADE',
        })
      )

      // Rendre article_id non nullable pour les tables qui l'exigent
      if (tableInfo.table !== 'ligne_devis') {
        // D'abord gérer les NULL restants
        await queryRunner.query(`
          DELETE FROM ${tableInfo.table} 
          WHERE article_id IS NULL 
            AND ${tableInfo.columnName} IS NOT NULL
        `)

        // Puis rendre la colonne non nullable
        await queryRunner.changeColumn(
          tableInfo.table,
          'article_id',
          new TableColumn({
            name: 'article_id',
            type: 'uuid',
            isNullable: false,
          })
        )
      }

      // Supprimer l'ancienne colonne produit_id
      await queryRunner.dropColumn(tableInfo.table, tableInfo.columnName)
    }

    // 4. Créer des vues pour la compatibilité
    await this.createCompatibilityViews(queryRunner)

    // 5. Renommer la table produits en produits_legacy
    await queryRunner.renameTable('produits', 'produits_legacy')

    // 6. Créer une vue produits pour la compatibilité totale
    await queryRunner.query(`
      CREATE OR REPLACE VIEW produits AS
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
          a.caracteristiques_techniques
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
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Supprimer la vue produits
    await queryRunner.query('DROP VIEW IF EXISTS produits')

    // 2. Renommer produits_legacy en produits
    const legacyExists = await queryRunner.hasTable('produits_legacy')
    if (legacyExists) {
      await queryRunner.renameTable('produits_legacy', 'produits')
    }

    // 3. Pour chaque table, restaurer produit_id
    for (const tableInfo of this.tablesWithProduitId) {
      const tableExists = await queryRunner.hasTable(tableInfo.table)
      if (!tableExists) continue

      const hasArticleId = await queryRunner.hasColumn(tableInfo.table, 'article_id')
      if (!hasArticleId) continue

      // Ajouter la colonne produit_id
      await queryRunner.addColumn(
        tableInfo.table,
        new TableColumn({
          name: tableInfo.columnName,
          type: 'uuid',
          isNullable: true,
        })
      )

      // Restaurer les références
      await queryRunner.query(`
        UPDATE ${tableInfo.table} t
        SET ${tableInfo.columnName} = (a.metadonnees->>'id_origine')::uuid
        FROM articles a
        WHERE t.article_id = a.id
          AND a.metadonnees->>'origine_migration' = 'produits'
      `)

      // Supprimer la contrainte sur article_id
      const fkName = tableInfo.fkName.replace('produit', 'article')
      try {
        await queryRunner.dropForeignKey(tableInfo.table, fkName)
      } catch {}

      // Recréer la contrainte sur produit_id
      await queryRunner.createForeignKey(
        tableInfo.table,
        new TableForeignKey({
          name: tableInfo.fkName,
          columnNames: [tableInfo.columnName],
          referencedTableName: 'produits',
          referencedColumnNames: ['id'],
          onDelete: tableInfo.table === 'ligne_devis' ? 'SET NULL' : 'CASCADE',
        })
      )

      // Supprimer article_id
      await queryRunner.dropColumn(tableInfo.table, 'article_id')
    }

    // 4. Supprimer les vues de compatibilité
    await queryRunner.query('DROP VIEW IF EXISTS v_produits_legacy')
    await queryRunner.query('DROP VIEW IF EXISTS v_stocks_with_articles')
    await queryRunner.query('DROP VIEW IF EXISTS v_ligne_devis_with_articles')
    await queryRunner.query('DROP VIEW IF EXISTS v_ordre_fabrication_with_articles')

    // 5. Supprimer les articles migrés
    await queryRunner.query(`
      DELETE FROM articles 
      WHERE metadonnees->>'origine_migration' = 'produits'
    `)
  }

  private async migrateProduitsData(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO articles (
        id, created_at, updated_at, deleted_at, version,
        created_by_id, updated_by_id,
        societe_id, site_id,
        reference, designation, description, type, status,
        famille, sous_famille,
        prix_vente_ht, prix_achat_standard, taux_marge,
        caracteristiques_techniques, metadonnees,
        date_creation_fiche, date_derniere_modification
      )
      SELECT 
        gen_random_uuid(),
        p.created_at, p.updated_at, p.deleted_at, p.version,
        p.created_by_id, p.updated_by_id,
        p.societe_id, p.site_id,
        COALESCE(p.reference, 'PROD-' || LPAD(p.id::text, 6, '0')),
        p.nom,
        p.description,
        CASE 
          WHEN UPPER(p.type) IN ('ACIER', 'INOX', 'ALUMINIUM', 'METAL') THEN 'MATIERE_PREMIERE'
          WHEN UPPER(p.type) IN ('PROFILE', 'POUTRE', 'TUBE') THEN 'PRODUIT_SEMI_FINI'
          WHEN UPPER(p.type) IN ('STRUCTURE', 'ASSEMBLAGE') THEN 'PRODUIT_FINI'
          ELSE 'MATIERE_PREMIERE'
        END::article_type,
        CASE WHEN p.actif = true THEN 'ACTIF' ELSE 'INACTIF' END::article_status,
        CASE 
          WHEN UPPER(p.type) IN ('ACIER', 'INOX', 'ALUMINIUM') THEN 'METAUX'
          WHEN UPPER(p.type) IN ('PROFILE', 'POUTRE') THEN 'PROFILES'
          WHEN UPPER(p.type) IN ('TUBE') THEN 'TUBES'
          ELSE 'DIVERS'
        END,
        p.type,
        p.prix_vente,
        p.cout_production,
        CASE 
          WHEN p.cout_production > 0 THEN
            ROUND(((p.prix_vente - p.cout_production) / p.cout_production) * 100, 2)
          ELSE NULL
        END,
        jsonb_build_object(
          'specifications_origine', p.specifications,
          'temps_fabrication_minutes', p.temps_fabrication,
          'migre_depuis', 'table_produits',
          'date_migration', CURRENT_TIMESTAMP
        ),
        jsonb_build_object(
          'origine_migration', 'produits',
          'id_origine', p.id,
          'reference_origine', p.reference,
          'metadata_origine', p.metadata
        ),
        p.created_at::date,
        p.updated_at::date
      FROM produits p
      WHERE p.deleted_at IS NULL
      ON CONFLICT (reference) DO NOTHING
    `)

    const _count = await queryRunner.query(
      `SELECT COUNT(*) as count FROM articles WHERE metadonnees->>'origine_migration' = 'produits'`
    )
  }

  private async createCompatibilityViews(queryRunner: QueryRunner): Promise<void> {
    // Vue pour stocks avec articles
    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_stocks_with_articles AS
      SELECT 
        s.*,
        s.article_id as produit_id,
        a.reference as article_reference,
        a.designation as article_designation,
        a.famille as article_famille,
        a.prix_vente_ht as article_prix
      FROM stocks s
      LEFT JOIN articles a ON s.article_id = a.id
    `)

    // Vue pour ligne_devis avec articles
    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_ligne_devis_with_articles AS
      SELECT 
        ld.*,
        ld.article_id as produit_id,
        a.reference as article_reference,
        a.designation as article_designation,
        a.prix_vente_ht as prix_unitaire_article
      FROM ligne_devis ld
      LEFT JOIN articles a ON ld.article_id = a.id
    `)

    // Vue pour ordre_fabrication avec articles
    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_ordre_fabrication_with_articles AS
      SELECT 
        of.*,
        of.article_id as produit_id,
        a.reference as article_reference,
        a.designation as article_designation,
        a.caracteristiques_techniques->>'temps_fabrication_minutes' as temps_fabrication
      FROM ordre_fabrication of
      LEFT JOIN articles a ON of.article_id = a.id
    `)
  }
}
