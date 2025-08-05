import { join } from 'node:path'
import { config } from 'dotenv'

// Charger .env.local depuis la racine
const rootDir = join(__dirname, '../../../../')
const envLocalPath = join(rootDir, '.env.local')

console.log('Loading from:', envLocalPath)
const result = config({ path: envLocalPath })

if (result.error) {
  console.error('Error:', result.error)
} else {
  console.log('✅ .env.local loaded successfully')
}

console.log('DEFAULT_TENANT_CODE:', process.env.DEFAULT_TENANT_CODE)
console.log(
  'Expected database name:',
  `erp_topsteel_${process.env.DEFAULT_TENANT_CODE || 'default'}`
)
