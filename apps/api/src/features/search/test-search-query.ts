import { generateSearchQuery, SEARCHABLE_ENTITIES } from './config/searchable-entities.config'

// Tester la génération de requête pour les menus
const menuEntity = SEARCHABLE_ENTITIES.find((e) => e.type === 'menu')

if (menuEntity) {
  const searchTerm = 'articles'
  const { query: _query, params: _params } = generateSearchQuery(menuEntity, searchTerm, undefined)

  const variants = ['article', 'Article', 'ARTICLES', 'articl']

  variants.forEach((variant) => {
    const { query: _variantQuery, params: _variantParams } = generateSearchQuery(
      menuEntity,
      variant,
      undefined
    )
  })
}
