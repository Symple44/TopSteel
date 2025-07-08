// scripts/validate-exports.mjs - Validation des exports
async function validateExports() {
  try {
    const { cn } = await import('../dist/index.mjs')

    if (typeof cn !== 'function') {
      throw new Error('cn utility not exported correctly')
    }

    console.log('✅ Exports validés')
  } catch (error) {
    console.error('❌ Erreur validation exports:', error.message)
    process.exit(1)
  }
}

validateExports()
