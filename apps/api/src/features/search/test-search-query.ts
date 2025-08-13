import { generateSearchQuery } from './config/searchable-entities.config';
import { SEARCHABLE_ENTITIES } from './config/searchable-entities.config';

// Tester la génération de requête pour les menus
const menuEntity = SEARCHABLE_ENTITIES.find(e => e.type === 'menu');

if (menuEntity) {
  console.log('🔍 Test de génération de requête pour recherche "articles" dans les menus');
  console.log('==========================================================================\n');
  
  const searchTerm = 'articles';
  const { query, params } = generateSearchQuery(menuEntity, searchTerm, undefined);
  
  console.log('Entité:', menuEntity.type);
  console.log('Table:', menuEntity.tableName);
  console.log('Champs recherchables:');
  console.log('  - Primaires:', menuEntity.searchableFields.primary.map(f => f.name));
  console.log('  - Secondaires:', menuEntity.searchableFields.secondary.map(f => f.name));
  console.log('  - Metadata:', menuEntity.searchableFields.metadata.map(f => f.name));
  
  console.log('\nRequête SQL générée:');
  console.log(query);
  
  console.log('\nParamètres:');
  console.log(params);
  
  console.log('\n📝 Notes:');
  console.log('- La recherche utilise ILIKE pour une recherche insensible à la casse');
  console.log('- Le terme de recherche est entouré de % pour une recherche partielle');
  console.log('- Les champs title et programId sont recherchés');
  console.log('- Seuls les menus visibles (isVisible = true) sont retournés');
  
  // Tester avec différentes variantes
  console.log('\n🔄 Test avec différentes variantes:');
  const variants = ['article', 'Article', 'ARTICLES', 'articl'];
  
  variants.forEach(variant => {
    const { params: p } = generateSearchQuery(menuEntity, variant, undefined);
    console.log(`  "${variant}": paramètre = "${p[0]}"`);
  });
}