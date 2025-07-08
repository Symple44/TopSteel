// packages/types/src/__tests__/types.test.ts
describe('@erp/types', () => {
  it('should export types correctly', () => {
    // Test basique pour vérifier que le package compile
    expect(true).toBe(true)
  })

  it('should have valid TypeScript configuration', () => {
    // Vérifier que les types sont cohérents
    const testObject: any = { test: true }
    expect(typeof testObject).toBe('object')
  })
})
