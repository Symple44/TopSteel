import { AdjustmentType, PriceRule, PriceRuleChannel } from '@erp/entities'
import { DataSource } from 'typeorm'

/**
 * Script pour créer des règles de prix par défaut
 * Notamment pour le marketplace et les calculs par unité
 */
async function setupDefaultPricingRules() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'erp_topsteel_topsteel',
    entities: [PriceRule],
    synchronize: false,
    logging: true,
  })

  try {
    await dataSource.initialize()
    console.log('✅ Connexion à la base de données établie\n')

    const priceRuleRepo = dataSource.getRepository(PriceRule)

    // Récupérer la société TopSteel
    const societeResult = await dataSource.query(`
      SELECT id FROM societes WHERE denomination = 'TOPSTEEL' LIMIT 1
    `)

    if (!societeResult || societeResult.length === 0) {
      throw new Error('Société TOPSTEEL non trouvée')
    }

    const societeId = societeResult[0].id
    console.log(`📦 Société TOPSTEEL trouvée: ${societeId}\n`)

    // Vérifier les règles existantes
    const existingRules = await priceRuleRepo.find({
      where: { societeId },
    })

    console.log(`📋 ${existingRules.length} règles existantes trouvées\n`)

    const rulesToCreate = []

    // 1. Règle marketplace par défaut - Marge de 15% sur tous les articles
    const marketplaceDefaultRule = priceRuleRepo.create({
      societeId,
      ruleName: 'Marge Marketplace Standard',
      description: 'Applique une marge de 15% sur tous les articles vendus sur le marketplace',
      channel: PriceRuleChannel.MARKETPLACE,
      adjustmentType: AdjustmentType.PERCENTAGE,
      adjustmentValue: 15, // +15% de marge
      conditions: [], // Pas de condition - s'applique à tous
      priority: 1, // Priorité basse (règles spécifiques passeront avant)
      combinable: true,
      isActive: true,
      metadata: {
        createdBy: 'system',
        notes: 'Règle par défaut pour le marketplace',
        tags: ['marketplace', 'default'],
      },
    })
    rulesToCreate.push(marketplaceDefaultRule)

    // 2. Règle pour les profilés IPE - Prix au kg
    const ipeWeightRule = priceRuleRepo.create({
      societeId,
      ruleName: 'Profilés IPE - Prix au poids',
      description: 'Prix au kilogramme pour les profilés IPE',
      channel: PriceRuleChannel.ALL,
      adjustmentType: AdjustmentType.PRICE_PER_WEIGHT,
      adjustmentValue: 1.85, // 1.85€/kg
      adjustmentUnit: 'KG',
      conditions: [
        {
          type: 'article_reference',
          operator: 'starts_with',
          value: 'IPE',
        },
      ],
      priority: 10,
      combinable: false, // Ne pas combiner avec d'autres règles
      isActive: true,
      metadata: {
        createdBy: 'system',
        notes: 'Prix au poids pour profilés IPE',
      },
    })
    rulesToCreate.push(ipeWeightRule)

    // 3. Règle pour les tôles - Prix au m²
    const sheetSurfaceRule = priceRuleRepo.create({
      societeId,
      ruleName: 'Tôles - Prix à la surface',
      description: 'Prix au mètre carré pour les tôles',
      channel: PriceRuleChannel.ALL,
      adjustmentType: AdjustmentType.PRICE_PER_SURFACE,
      adjustmentValue: 45, // 45€/m²
      adjustmentUnit: 'M2',
      conditions: [
        {
          type: 'article_family',
          operator: 'equals',
          value: 'TOLES',
        },
      ],
      priority: 10,
      combinable: false,
      isActive: true,
      metadata: {
        createdBy: 'system',
        notes: 'Prix à la surface pour les tôles',
      },
    })
    rulesToCreate.push(sheetSurfaceRule)

    // 4. Règle pour les tubes - Prix au mètre linéaire
    const tubeLengthRule = priceRuleRepo.create({
      societeId,
      ruleName: 'Tubes - Prix au mètre',
      description: 'Prix au mètre linéaire pour les tubes',
      channel: PriceRuleChannel.ALL,
      adjustmentType: AdjustmentType.PRICE_PER_LENGTH,
      adjustmentValue: 12.5, // 12.5€/m
      adjustmentUnit: 'M',
      conditions: [
        {
          type: 'article_reference',
          operator: 'starts_with',
          value: 'TUB',
        },
      ],
      priority: 10,
      combinable: false,
      isActive: true,
      metadata: {
        createdBy: 'system',
        notes: 'Prix au mètre pour les tubes',
      },
    })
    rulesToCreate.push(tubeLengthRule)

    // 5. Remise quantité - Plus de 100 unités
    const quantityDiscountRule = priceRuleRepo.create({
      societeId,
      ruleName: 'Remise Quantité > 100',
      description: 'Remise de 5% pour les commandes de plus de 100 unités',
      channel: PriceRuleChannel.ALL,
      adjustmentType: AdjustmentType.PERCENTAGE,
      adjustmentValue: -5, // -5% de remise
      conditions: [
        {
          type: 'quantity',
          operator: 'greater_than',
          value: 100,
        },
      ],
      priority: 5,
      combinable: true, // Peut se combiner avec d'autres règles
      isActive: true,
      metadata: {
        createdBy: 'system',
        notes: 'Remise automatique pour grandes quantités',
      },
    })
    rulesToCreate.push(quantityDiscountRule)

    // 6. Prix fixe pour certains articles spéciaux
    const fixedPriceRule = priceRuleRepo.create({
      societeId,
      ruleName: 'Prix Promotionnel HEA200',
      description: 'Prix promotionnel fixe pour HEA200',
      channel: PriceRuleChannel.MARKETPLACE,
      adjustmentType: AdjustmentType.FIXED_PRICE,
      adjustmentValue: 89.99, // Prix fixe à 89.99€
      conditions: [
        {
          type: 'article_reference',
          operator: 'equals',
          value: 'HEA200-S275JR',
        },
      ],
      priority: 20, // Haute priorité
      combinable: false,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valable 30 jours
      metadata: {
        createdBy: 'system',
        notes: 'Promotion spéciale HEA200',
        tags: ['promo', 'featured'],
      },
    })
    rulesToCreate.push(fixedPriceRule)

    // 7. Règle avec formule pour les profilés complexes
    const formulaRule = priceRuleRepo.create({
      societeId,
      ruleName: 'Calcul Complexe RHS',
      description: 'Calcul de prix basé sur une formule pour les profilés RHS',
      channel: PriceRuleChannel.ALL,
      adjustmentType: AdjustmentType.FORMULA,
      adjustmentValue: 0, // Non utilisé pour FORMULA
      formula: '(weight * 1.95) + (length * 2.5) + 15', // Prix = (poids * 1.95) + (longueur * 2.5) + 15€ fixe
      conditions: [
        {
          type: 'article_reference',
          operator: 'starts_with',
          value: 'RHS',
        },
      ],
      priority: 15,
      combinable: false,
      isActive: true,
      metadata: {
        createdBy: 'system',
        notes: 'Formule complexe pour RHS incluant poids et longueur',
        tags: ['formula', 'complex'],
      },
    })
    rulesToCreate.push(formulaRule)

    // Sauvegarder toutes les règles
    console.log('💾 Création des règles de prix...\n')

    for (const rule of rulesToCreate) {
      try {
        // Vérifier si une règle similaire existe déjà
        const existing = existingRules.find((r) => r.ruleName === rule.ruleName)

        if (existing) {
          console.log(`⏭️  Règle "${rule.ruleName}" existe déjà, mise à jour...`)
          Object.assign(existing, rule)
          await priceRuleRepo.save(existing)
          console.log(`✅ Règle "${rule.ruleName}" mise à jour`)
        } else {
          await priceRuleRepo.save(rule)
          console.log(`✅ Règle "${rule.ruleName}" créée`)
        }
      } catch (error) {
        console.error(
          `❌ Erreur lors de la création de la règle "${rule.ruleName}":`,
          error.message
        )
      }
    }

    // Afficher un résumé
    console.log('\n📊 Résumé des règles de prix:')
    const allRules = await priceRuleRepo.find({
      where: { societeId, isActive: true },
      order: { priority: 'DESC', ruleName: 'ASC' },
    })

    console.log(`\nTotal: ${allRules.length} règles actives\n`)

    allRules.forEach((rule) => {
      const unit = rule.adjustmentUnit ? ` ${rule.adjustmentUnit}` : ''
      const value =
        rule.adjustmentType === AdjustmentType.PERCENTAGE
          ? `${rule.adjustmentValue}%`
          : rule.adjustmentType === AdjustmentType.FORMULA
            ? 'Formule'
            : `${rule.adjustmentValue}€${unit}`

      console.log(`  [${rule.priority}] ${rule.ruleName}`)
      console.log(`      Type: ${rule.adjustmentType} | Valeur: ${value}`)
      console.log(`      Canal: ${rule.channel} | Combinable: ${rule.combinable ? 'Oui' : 'Non'}`)
      if (rule.conditions && rule.conditions.length > 0) {
        console.log(`      Conditions: ${JSON.stringify(rule.conditions)}`)
      } else {
        console.log(`      Conditions: Aucune (s'applique à tous)`)
      }
      console.log('')
    })

    // Test rapide d'une règle
    console.log('🧪 Test rapide de calcul de prix...\n')

    const testArticle = await dataSource.query(`
      SELECT id, reference, designation, prix_vente_ht, poids, longueur
      FROM articles
      WHERE reference = 'IPE140-S275JR'
      LIMIT 1
    `)

    if (testArticle && testArticle.length > 0) {
      const article = testArticle[0]
      console.log(`Article test: ${article.reference}`)
      console.log(`  Prix de base: ${article.prix_vente_ht}€`)
      console.log(`  Poids: ${article.poids} kg`)

      // La règle IPE au poids devrait s'appliquer
      const expectedPrice = article.poids * 1.85
      console.log(`  Prix attendu (poids * 1.85€/kg): ${expectedPrice.toFixed(2)}€`)
    }
  } catch (error) {
    console.error('\n❌ Erreur:', error)
    throw error
  } finally {
    await dataSource.destroy()
  }
}

// Exécution
setupDefaultPricingRules()
  .then(() => {
    console.log('\n✅ Configuration des règles de prix terminée avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
