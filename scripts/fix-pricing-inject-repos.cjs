const fs = require('node:fs')
const _path = require('node:path')

const files = [
  'apps/api/src/features/pricing/services/pricing-analytics.service.ts',
  'apps/api/src/features/pricing/services/pricing-webhooks.service.ts',
  'apps/api/src/features/pricing/services/pricing-ml.service.ts',
]

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8')

  // Fix @InjectRepository without connection name
  // Match: @InjectRepository(EntityName) - not followed by a comma
  const regex = /@InjectRepository\(([^,)]+)\)(?!\s*,)/g

  const newContent = content.replace(regex, (_match, entity) => {
    return `@InjectRepository(${entity}, 'tenant')`
  })

  if (content !== newContent) {
    fs.writeFileSync(file, newContent)
  }
})
