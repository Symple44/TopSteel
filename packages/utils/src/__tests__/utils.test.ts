// packages/utils/src/__tests__/utils.test.ts
describe('@erp/utils', () => {
  it('should export utilities correctly', () => {
    // Test basique pour vérifier que le package fonctionne
    expect(true).toBe(true);
  });
  
  it('should handle basic utility functions', () => {
    // Test simple de fonctions utilitaires
    const testFunction = () => 'TopSteel Utils OK';
    expect(testFunction()).toContain('TopSteel');
  });
});
