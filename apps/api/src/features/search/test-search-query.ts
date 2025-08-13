import { generateSearchQuery, SEARCHABLE_ENTITIES } from './config/searchable-entities.config'

// Tester la génération de requête pour les menus
const menuEntity = SEARCHABLE_ENTITIES.find((e) => e.type === 'menu')

if (menuEntity) {
  const searchTerm = 'articles'
  const { query, params } = generateSearchQuery(menuEntity, searchTerm, undefined)
  const variants = ['article', 'Article', 'ARTICLES', 'articl']

  variants.forEach((variant) => {
    const { params: p } = generateSearchQuery(menuEntity, variant, undefined)
  })
}
