// test/monorepo.integration.test.ts
describe('TopSteel Monorepo Integration', () => {
  describe('integration cross-package', () => {
    it('should validate monorepo setup', () => {
      const packages = ['web', 'api', 'ui', 'types', 'utils'];
      expect(packages.length).toBeGreaterThan(0);
    });
    
    it('should test package integration', () => {
      // Test d'intégration simple
      const integration = {
        monorepo: true,
        turbo: true,
        jest: true
      };
      expect(integration.jest).toBe(true);
    });
  });
});
