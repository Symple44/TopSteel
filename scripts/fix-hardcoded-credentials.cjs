#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Scripts à corriger avec connexions database en dur
const scriptsToFix = [
  'apps/api/src/scripts/check-parameters-system.ts',
  'apps/api/src/scripts/setup-default-pricing-rules.ts',
  'apps/api/src/scripts/analyze-menu-structure.ts',
  'apps/api/src/scripts/add-owner-role.ts',
  'apps/api/src/scripts/fix-tenant-id.ts',
  'apps/api/src/scripts/direct-elastic-test.ts',
  'apps/api/src/scripts/check-elasticsearch.ts',
  'apps/api/src/scripts/reset-admin-test-users.ts',
  'apps/api/src/scripts/test-api-login-real.ts',
  'apps/api/src/scripts/test-global-search.ts',
]

// Patterns à remplacer
const replacements = [
  // Database credentials
  {
    pattern: /host:\s*['"]localhost['"]/g,
    replacement: "host: process.env.DATABASE_HOST || 'localhost'",
  },
  {
    pattern: /port:\s*5432/g,
    replacement: "port: parseInt(process.env.DATABASE_PORT || '5432', 10)",
  },
  {
    pattern: /username:\s*['"]postgres['"]/g,
    replacement: "username: process.env.DATABASE_USERNAME || 'postgres'",
  },
  {
    pattern: /user:\s*['"]postgres['"]/g,
    replacement: "user: process.env.DATABASE_USERNAME || 'postgres'",
  },
  {
    pattern: /password:\s*['"]postgres['"]/g,
    replacement: 'password: process.env.DATABASE_PASSWORD',
  },
  {
    pattern: /database:\s*['"]erp_topsteel['"]/g,
    replacement: "database: process.env.DATABASE_NAME || 'erp_topsteel'",
  },
  {
    pattern: /database:\s*['"]erp_topsteel_auth['"]/g,
    replacement: "database: process.env.DATABASE_NAME || 'erp_topsteel_auth'",
  },
  // ElasticSearch credentials
  {
    pattern: /node:\s*['"]http:\/\/localhost:9200['"]/g,
    replacement: "node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200'",
  },
  {
    pattern: /auth:\s*{\s*username:\s*['"]elastic['"],\s*password:\s*['"][^'"]+['"]\s*}/g,
    replacement:
      "auth: { username: process.env.ELASTICSEARCH_USERNAME || 'elastic', password: process.env.ELASTICSEARCH_PASSWORD }",
  },
  // Hardcoded test passwords
  {
    pattern: /await bcrypt\.hash\(['"]TopSteel44!['"]/g,
    replacement: "await bcrypt.hash(process.env.INITIAL_ADMIN_PASSWORD || 'ChangeMe123!'",
  },
  {
    pattern: /await bcrypt\.hash\(['"]Admin@123!['"]/g,
    replacement: "await bcrypt.hash(process.env.TEST_ADMIN_PASSWORD || 'TestAdmin123!'",
  },
  {
    pattern: /await bcrypt\.hash\(['"]Test@123!['"]/g,
    replacement: "await bcrypt.hash(process.env.TEST_USER_PASSWORD || 'TestUser123!'",
  },
  {
    pattern: /password:\s*['"]Admin123!@#['"]/g,
    replacement: "password: process.env.TEST_LOGIN_PASSWORD || 'TestLogin123!'",
  },
  // JWT Secrets
  {
    pattern: /JWT_SECRET\s*=\s*['"]test-secret[^'"]*['"]/g,
    replacement: "JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key'",
  },
  // Stripe test keys
  {
    pattern: /['"]sk_test_[^'"]+['"]/g,
    replacement: "process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'",
  },
  {
    pattern: /['"]tok_visa_test['"]/g,
    replacement: "process.env.STRIPE_TEST_TOKEN || 'tok_visa'",
  },
]

let totalFixed = 0

scriptsToFix.forEach((scriptPath) => {
  const fullPath = path.join(process.cwd(), scriptPath)

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier non trouvé: ${scriptPath}`)
    return
  }

  let content = fs.readFileSync(fullPath, 'utf8')
  let modified = false

  replacements.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern)
    if (matches) {
      content = content.replace(pattern, replacement)
      modified = true
      console.log(`✅ Corrigé dans ${scriptPath}: ${matches.length} occurrence(s)`)
    }
  })

  if (modified) {
    // Ajouter l'import dotenv si nécessaire
    if (!content.includes('dotenv/config') && !content.includes('process.env')) {
      content = "import 'dotenv/config';\n" + content
    }

    fs.writeFileSync(fullPath, content)
    totalFixed++
  }
})

// Créer un fichier .env.security avec les instructions
const securityInstructions = `# ============================================================================
# SECURITY CONFIGURATION - CRITICAL
# ============================================================================
# 
# ⚠️ NEVER COMMIT THIS FILE TO VERSION CONTROL
# ⚠️ ADD TO .gitignore IMMEDIATELY
#
# This file contains sensitive security configurations that must be kept secret.
# Generate strong, unique values for each environment.
#
# ============================================================================

# Database Credentials (REQUIRED)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=CHANGE_THIS_PASSWORD_IMMEDIATELY
DATABASE_NAME=erp_topsteel

# Alternative: Full connection string
DATABASE_URL=postgresql://username:password@localhost:5432/erp_topsteel

# Admin User Initial Password (REQUIRED for first setup)
# Change immediately after first login
INITIAL_ADMIN_PASSWORD=GenerateSecurePassword123!

# JWT Secrets (REQUIRED - Generate with: openssl rand -base64 32)
JWT_SECRET=GENERATE_32_CHAR_MIN_SECRET_HERE
JWT_REFRESH_SECRET=GENERATE_ANOTHER_32_CHAR_SECRET_HERE

# ElasticSearch Credentials (if using ElasticSearch)
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=CHANGE_THIS_PASSWORD

# Test Credentials (Development only)
TEST_ADMIN_PASSWORD=TestAdmin123!
TEST_USER_PASSWORD=TestUser123!
TEST_LOGIN_PASSWORD=TestLogin123!

# Payment Services (Production keys required for production)
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_TEST_TOKEN=tok_visa

# ============================================================================
# GENERATION COMMANDS
# ============================================================================
#
# Generate secure passwords:
# openssl rand -base64 16
#
# Generate JWT secrets:
# openssl rand -base64 32
#
# Generate session secrets:
# openssl rand -hex 32
#
# ============================================================================
`

fs.writeFileSync('.env.security.example', securityInstructions)

console.log(`
✅ Correction des credentials terminée:
   - Fichiers corrigés: ${totalFixed}
   - Fichier .env.security.example créé
   
⚠️  Actions requises:
   1. Créer un fichier .env.security avec vos vrais credentials
   2. Ajouter .env.security à .gitignore
   3. Ne JAMAIS commiter de vrais mots de passe
`)
