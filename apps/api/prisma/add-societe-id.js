#!/usr/bin/env node
/**
 * Script pour ajouter societeId aux tables Prisma
 * Usage: node add-societe-id.js
 */

const fs = require('fs')
const path = require('path')

const SCHEMA_PATH = path.join(__dirname, 'schema.prisma')
const BACKUP_PATH = path.join(__dirname, 'schema.prisma.backup')

// Lire le schéma
let schema = fs.readFileSync(SCHEMA_PATH, 'utf8')

// Backup du schéma original
fs.writeFileSync(BACKUP_PATH, schema, 'utf8')
console.log(`✅ Backup créé: ${BACKUP_PATH}`)

// ============================================
// 1. NOTIFICATION - Add societeId (required)
// ============================================
schema = schema.replace(
  /model Notification \{[\s\S]*?@@map\("notifications"\)\n\}/,
  (match) => {
    // Ajouter societeId après id
    let modified = match.replace(
      /(id\s+String\s+@id @default\(uuid\(\)\))\n/,
      '$1\n  societeId   String   @map("societe_id")\n'
    )

    // Ajouter relation societe
    modified = modified.replace(
      /(reads\s+NotificationRead\[\])\n/,
      '$1\n  societe     Societe  @relation(fields: [societeId], references: [id], onDelete: Cascade)\n'
    )

    // Ajouter index societeId
    modified = modified.replace(
      /(@@index\(\[userId\]\))\n/,
      '$1\n  @@index([societeId])\n  @@index([societeId, userId])\n  @@index([societeId, type])\n'
    )

    return modified
  }
)

// ============================================
// 2. NOTIFICATION_EVENT - Add societeId (required)
// ============================================
schema = schema.replace(
  /model NotificationEvent \{[\s\S]*?@@map\("notification_events"\)\n\}/,
  (match) => {
    let modified = match.replace(
      /(id\s+String\s+@id @default\(uuid\(\)\))\n/,
      '$1\n  societeId   String   @map("societe_id")\n'
    )

    modified = modified.replace(
      /(@@index\(\[type\]\))\n/,
      `$1
  societe     Societe  @relation(fields: [societeId], references: [id], onDelete: Cascade)

  @@index([societeId])
  @@index([societeId, type])
`
    )

    return modified
  }
)

// ============================================
// 3. NOTIFICATION_TEMPLATE - Add societeId (required)
// ============================================
schema = schema.replace(
  /model NotificationTemplate \{[\s\S]*?@@map\("notification_templates"\)\n\}/,
  (match) => {
    let modified = match.replace(
      /(id\s+String\s+@id @default\(uuid\(\)\))\n/,
      '$1\n  societeId   String   @map("societe_id")\n'
    )

    modified = modified.replace(
      /(@@index\(\[code\]\))\n/,
      `$1
  societe     Societe  @relation(fields: [societeId], references: [id], onDelete: Cascade)

  @@index([societeId])
  @@index([societeId, code])
`
    )

    return modified
  }
)

// ============================================
// 4. NOTIFICATION_RULE - Add societeId (required)
// ============================================
schema = schema.replace(
  /model NotificationRule \{[\s\S]*?@@map\("notification_rules"\)\n\}/,
  (match) => {
    let modified = match.replace(
      /(id\s+String\s+@id @default\(uuid\(\)\))\n/,
      '$1\n  societeId   String   @map("societe_id")\n'
    )

    modified = modified.replace(
      /(executions NotificationRuleExecution\[\])\n/,
      `$1
  societe     Societe  @relation(fields: [societeId], references: [id], onDelete: Cascade)
`
    )

    modified = modified.replace(
      /(@@index\(\[type\]\))\n/,
      '$1\n  @@index([societeId])\n  @@index([societeId, type])\n'
    )

    return modified
  }
)

// ============================================
// 5. QUERY_BUILDER - Add societeId (required)
// ============================================
schema = schema.replace(
  /model QueryBuilder \{[\s\S]*?@@map\("query_builders"\)\n\}/,
  (match) => {
    let modified = match.replace(
      /(id\s+String\s+@id @default\(uuid\(\)\))\n/,
      '$1\n  societeId   String   @map("societe_id")\n'
    )

    modified = modified.replace(
      /(creator\s+User[\s\S]*?@relation[\s\S]*?\))\n/,
      `$1
  societe          Societe                       @relation(fields: [societeId], references: [id], onDelete: Cascade)
`
    )

    modified = modified.replace(
      /(@@index\(\[createdBy\]\))\n/,
      '$1\n  @@index([societeId])\n  @@index([societeId, createdBy])\n'
    )

    return modified
  }
)

// ============================================
// 6. AUDIT_LOG - Add societeId (nullable)
// ============================================
schema = schema.replace(
  /model AuditLog \{[\s\S]*?@@map\("audit_logs"\)\n\}/,
  (match) => {
    let modified = match.replace(
      /(userId\s+String\?\s+@map\("user_id"\))\n/,
      '$1\n  societeId   String?  @map("societe_id")\n'
    )

    modified = modified.replace(
      /(user User\? @relation[\s\S]*?\))\n/,
      `$1
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)
`
    )

    modified = modified.replace(
      /(@@index\(\[userId\]\))\n/,
      '$1\n  @@index([societeId])\n  @@index([societeId, createdAt])\n'
    )

    return modified
  }
)

// ============================================
// 7. SYSTEM_SETTING - Add societeId (nullable)
// ============================================
schema = schema.replace(
  /model SystemSetting \{[\s\S]*?@@map\("system_settings"\)\n\}/,
  (match) => {
    let modified = match.replace(
      /(key\s+String\s+@unique[\s\S]*?@db\.VarChar\(255\))\n/,
      '$1\n  societeId   String?  @map("societe_id")\n'
    )

    modified = modified.replace(
      /(updatedByUser User\?[\s\S]*?\))\n/,
      `$1
  societe         Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)
`
    )

    modified = modified.replace(
      /(@@index\(\[key\]\))\n/,
      '$1\n  @@index([societeId])\n  @@index([societeId, category])\n'
    )

    return modified
  }
)

// ============================================
// 8. SYSTEM_PARAMETER - Add societeId (nullable)
// ============================================
schema = schema.replace(
  /model SystemParameter \{[\s\S]*?@@map\("system_parameters"\)\n\}/,
  (match) => {
    let modified = match.replace(
      /(key\s+String\s+@unique[\s\S]*?@db\.VarChar\(255\))\n/,
      '$1\n  societeId   String?  @map("societe_id")\n'
    )

    modified = modified.replace(
      /(@@index\(\[key\]\))\n/,
      `$1
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)

  @@index([societeId])
`
    )

    return modified
  }
)

// ============================================
// 9-11. PARAMETERS (System/Application/Client) - Add societeId (nullable)
// ============================================
const parameterModels = ['ParameterSystem', 'ParameterApplication', 'ParameterClient']
const parameterTables = ['parameter_system', 'parameter_application', 'parameter_client']

parameterModels.forEach((modelName, idx) => {
  const tableName = parameterTables[idx]
  const regex = new RegExp(`model ${modelName} \\{[\\s\\S]*?@@map\\("${tableName}"\\)\\n\\}`, '')

  schema = schema.replace(regex, (match) => {
    let modified = match.replace(
      /(code\s+String\s+@unique[\s\S]*?@db\.VarChar\(100\))\n/,
      '$1\n  societeId   String?  @map("societe_id")\n'
    )

    modified = modified.replace(
      /(@@index\(\[code\]\))\n/,
      `$1
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)

  @@index([societeId])
  @@index([societeId, category])
`
    )

    return modified
  })
})

// ============================================
// 12-14. MENU MODELS - Add societeId (nullable)
// ============================================
schema = schema.replace(
  /model MenuConfiguration \{[\s\S]*?@@map\("menu_configurations"\)\n\}/,
  (match) => {
    let modified = match.replace(
      /(name\s+String\s+@unique[\s\S]*?@db\.VarChar\(255\))\n/,
      '$1\n  societeId   String?  @map("societe_id")\n'
    )

    modified = modified.replace(
      /(menuItems MenuItem\[\])\n/,
      `$1
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)
`
    )

    modified = modified.replace(
      /(@@index\(\[isActive\]\))\n/,
      '$1\n  @@index([societeId])\n  @@index([societeId, isActive])\n'
    )

    return modified
  }
)

schema = schema.replace(
  /model MenuConfigurationSimple \{[\s\S]*?@@map\("menu_configurations_simple"\)\n\}/,
  (match) => {
    let modified = match.replace(
      /(name\s+String\s+@unique[\s\S]*?@db\.VarChar\(255\))\n/,
      '$1\n  societeId   String?  @map("societe_id")\n'
    )

    modified = modified.replace(
      /(@@map\("menu_configurations_simple"\))\n/,
      `  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)

  @@index([societeId])
  $1\n`
    )

    return modified
  }
)

schema = schema.replace(
  /model UserMenuPreference \{[\s\S]*?@@map\("user_menu_preference"\)\n\}/,
  (match) => {
    let modified = match.replace(
      /(userId\s+String\s+@map\("user_id"\))\n/,
      '$1\n  societeId   String?  @map("societe_id")\n'
    )

    modified = modified.replace(
      /(@@unique\(\[userId\]\))\n/,
      `  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)

  @@index([societeId, userId])
  $1\n`
    )

    return modified
  }
)

schema = schema.replace(
  /model UserMenuPreferences \{[\s\S]*?@@map\("user_menu_preferences"\)\n\}/,
  (match) => {
    let modified = match.replace(
      /(userId\s+String\s+@map\("user_id"\))\n/,
      '$1\n  societeId   String?  @map("societe_id")\n'
    )

    modified = modified.replace(
      /(items UserMenuItemPreference\[\])\n/,
      `$1
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)
`
    )

    return modified
  }
)

// ============================================
// 15. ADD RELATIONS TO SOCIETE MODEL
// ============================================
schema = schema.replace(
  /(model Societe \{[\s\S]*?permissions\s+Permission\[\])\n/,
  `$1

  // Multi-tenant relations
  systemSettings        SystemSetting[]
  systemParameters      SystemParameter[]
  menuConfigurations    MenuConfiguration[]
  menuConfigSimples     MenuConfigurationSimple[]
  userMenuPrefs         UserMenuPreferences[]
  userMenuPreferences   UserMenuPreference[]
  parameterSystems      ParameterSystem[]
  parameterApps         ParameterApplication[]
  parameterClients      ParameterClient[]
  notifications         Notification[]
  notificationEvents    NotificationEvent[]
  notificationTemplates NotificationTemplate[]
  notificationRules     NotificationRule[]
  queryBuilders         QueryBuilder[]
  auditLogs             AuditLog[]
\n`
)

// Écrire le schéma modifié
fs.writeFileSync(SCHEMA_PATH, schema, 'utf8')

console.log('\n✅ Modifications appliquées avec succès!')
console.log('\nRésumé des modifications:')
console.log('  ✅ 15 modèles modifiés')
console.log('  ✅ societeId ajouté aux tables critiques')
console.log('  ✅ Relations et index ajoutés')
console.log('  ✅ Societe model mis à jour')
console.log(`\n📝 Backup disponible: ${BACKUP_PATH}`)
console.log('\nProchaine étape: pnpm prisma format && pnpm prisma validate')
