import { join } from 'node:path'
import { config } from 'dotenv'

// Charger .env.local depuis la racine
const rootDir = join(__dirname, '../../../../')
const envLocalPath = join(rootDir, '.env.local')
const result = config({ path: envLocalPath })

if (result.error) {
} else {
}
