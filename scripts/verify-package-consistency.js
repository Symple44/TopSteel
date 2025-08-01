#!/usr/bin/env node

/**
 * Package Consistency Verification Script for TopSteel ERP
 *
 * This script verifies that important packages in pnpm-lock.yaml are properly
 * declared in package.json files across the workspace. It uses intelligent
 * filtering to focus on likely direct dependencies and reduce false positives
 * from transitive dependencies and hoisted packages.
 *
 * Usage:
 *   node scripts/verify-package-consistency.js
 *   pnpm verify:packages
 *
 * Exit codes:
 *   0 - No inconsistencies found
 *   1 - Inconsistencies detected or script error
 */

import fs from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Define workspace root
const WORKSPACE_ROOT = path.resolve(__dirname, '..')

// Define workspace package locations
const WORKSPACE_PACKAGES = [
  { name: 'root', path: path.join(WORKSPACE_ROOT, 'package.json') },
  { name: 'apps/api', path: path.join(WORKSPACE_ROOT, 'apps', 'api', 'package.json') },
  { name: 'apps/web', path: path.join(WORKSPACE_ROOT, 'apps', 'web', 'package.json') },
  {
    name: 'packages/api-client',
    path: path.join(WORKSPACE_ROOT, 'packages', 'api-client', 'package.json'),
  },
  {
    name: 'packages/config',
    path: path.join(WORKSPACE_ROOT, 'packages', 'config', 'package.json'),
  },
  {
    name: 'packages/domains',
    path: path.join(WORKSPACE_ROOT, 'packages', 'domains', 'package.json'),
  },
  { name: 'packages/types', path: path.join(WORKSPACE_ROOT, 'packages', 'types', 'package.json') },
  { name: 'packages/ui', path: path.join(WORKSPACE_ROOT, 'packages', 'ui', 'package.json') },
  { name: 'packages/utils', path: path.join(WORKSPACE_ROOT, 'packages', 'utils', 'package.json') },
]

const PNPM_LOCK_PATH = path.join(WORKSPACE_ROOT, 'pnpm-lock.yaml')

/**
 * Parse YAML manually (simple implementation for pnpm-lock.yaml structure)
 */
function parseYaml(content) {
  const lines = content.split('\n')
  const result = {}
  let currentSection = null
  let currentImporter = null
  let currentDepType = null
  const _indentLevel = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) continue

    const indent = line.length - line.trimStart().length

    // Top-level sections
    if (indent === 0 && trimmed.endsWith(':')) {
      currentSection = trimmed.slice(0, -1)
      result[currentSection] = {}
      currentImporter = null
      currentDepType = null
      continue
    }

    if (currentSection === 'importers') {
      // Importer sections (workspace packages)
      if (indent === 2 && trimmed.endsWith(':')) {
        currentImporter = trimmed.slice(0, -1)
        result[currentSection][currentImporter] = {}
        currentDepType = null
        continue
      }

      // Dependency type sections (dependencies, devDependencies, etc.)
      if (currentImporter && indent === 4 && trimmed.endsWith(':')) {
        currentDepType = trimmed.slice(0, -1)
        if (!result[currentSection][currentImporter][currentDepType]) {
          result[currentSection][currentImporter][currentDepType] = {}
        }
        continue
      }

      // Individual packages
      if (currentImporter && currentDepType && indent === 6) {
        const colonIndex = trimmed.indexOf(':')
        if (colonIndex > 0) {
          const packageName = trimmed.substring(0, colonIndex)
          result[currentSection][currentImporter][currentDepType][packageName] = true
        }
      }
    }
  }

  return result
}

/**
 * Read and parse package.json file
 */
function readPackageJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null
    }
    const content = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(content)
  } catch (_error) {
    return null
  }
}

/**
 * Read and parse pnpm-lock.yaml file
 */
function readPnpmLock() {
  try {
    if (!fs.existsSync(PNPM_LOCK_PATH)) {
      return null
    }
    const content = fs.readFileSync(PNPM_LOCK_PATH, 'utf8')
    const parsed = parseYaml(content)

    if (!parsed || !parsed.importers) {
      return null
    }

    return parsed
  } catch (_error) {
    return null
  }
}

/**
 * Extract package names from lockfile
 */
function extractPackagesFromLockfile(lockData) {
  const packages = new Map()

  if (!lockData.importers) {
    return packages
  }

  for (const [importerPath, importerData] of Object.entries(lockData.importers)) {
    const importerPackages = {
      dependencies: new Set(),
      devDependencies: new Set(),
      peerDependencies: new Set(),
      optionalDependencies: new Set(),
    }

    // Process each dependency type
    for (const depType of [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ]) {
      if (importerData[depType]) {
        for (const packageName of Object.keys(importerData[depType])) {
          importerPackages[depType].add(packageName)
        }
      }
    }

    packages.set(importerPath, importerPackages)
  }

  return packages
}

/**
 * Extract package names from package.json
 */
function extractPackagesFromPackageJson(packageJson) {
  const packages = {
    dependencies: new Set(),
    devDependencies: new Set(),
    peerDependencies: new Set(),
    optionalDependencies: new Set(),
  }

  if (!packageJson) return packages

  for (const depType of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    if (packageJson[depType]) {
      for (const packageName of Object.keys(packageJson[depType])) {
        packages[depType].add(packageName)
      }
    }
  }

  return packages
}

/**
 * Map workspace package paths to lockfile importer paths
 */
function mapWorkspaceToImporter(workspaceName) {
  const mapping = {
    root: '.',
    'apps/api': 'apps/api',
    'apps/web': 'apps/web',
    'packages/api-client': 'packages/api-client',
    'packages/config': 'packages/config',
    'packages/domains': 'packages/domains',
    'packages/types': 'packages/types',
    'packages/ui': 'packages/ui',
    'packages/utils': 'packages/utils',
  }
  return mapping[workspaceName] || workspaceName
}

/**
 * Check if a package should be ignored (internal packages, etc.)
 */
function shouldIgnorePackage(packageName) {
  const ignoredPatterns = [
    /^@erp\//, // Internal workspace packages
    /^workspace:/, // Workspace protocol packages
  ]

  return ignoredPatterns.some((pattern) => pattern.test(packageName))
}

/**
 * Check if a package is likely a direct dependency vs hoisted transitive dependency
 * This uses heuristics to reduce false positives
 */
function isLikelyDirectDependency(packageName, _workspace) {
  // Common patterns that suggest a package should be explicitly declared
  const directDependencyPatterns = [
    // Build tools and dev dependencies that should be explicit
    /^@types\//,
    /^eslint/,
    /^typescript$/,
    /^@typescript-eslint\//,
    /^vitest$/,
    /^@vitest\//,
    /^jest$/,
    /^@jest\//,
    /^prettier$/,
    /^@biomejs\//,
    /^rimraf$/,
    /^tsup$/,
    /^@nestjs\//,
    /^@storybook\//,
    /^@testing-library\//,
    /^@playwright\//,

    // UI libraries that are commonly used directly
    /^@radix-ui\/react-(?!primitive|slot|portal|presence|use-|visually-hidden|collection|compose-refs|context|direction|dismissable-layer|focus-|id|arrow|popper)/,
    /^@tanstack\//,
    /^@dnd-kit\//,
    /^@hookform\//,

    // Framework and core dependencies
    /^next$/,
    /^react$/,
    /^react-dom$/,
    /^axios$/,
    /^zod$/,
  ]

  // Packages that are commonly hoisted and shouldn't be reported
  const transitiveDependencyPatterns = [
    // React ecosystem transitive dependencies
    /^@radix-ui\/react-primitive$/,
    /^@radix-ui\/react-slot$/,
    /^@radix-ui\/react-portal$/,
    /^@radix-ui\/react-presence$/,
    /^@radix-ui\/react-use-/,
    /^@radix-ui\/react-visually-hidden$/,
    /^@radix-ui\/react-collection$/,
    /^@radix-ui\/react-compose-refs$/,
    /^@radix-ui\/react-context$/,
    /^@radix-ui\/react-direction$/,
    /^@radix-ui\/react-dismissable-layer$/,
    /^@radix-ui\/react-focus-/,
    /^@radix-ui\/react-id$/,
    /^@radix-ui\/react-arrow$/,
    /^@radix-ui\/react-popper$/,
    /^@radix-ui\/number$/,
    /^@radix-ui\/primitive$/,
    /^@floating-ui\//,

    // Build tool internals
    /^@swc\//,
    /^@babel\//,
    /^@types\/node$/,

    // Other common transitive dependencies
    /^scheduler$/,
    /^tslib$/,
    /^aria-hidden$/,
    /^detect-node-es$/,
    /^get-nonce$/,
    /^use-callback-ref$/,
    /^use-sidecar$/,
    /^use-sync-external-store$/,
    /^react-remove-scroll/,
    /^react-style-singleton$/,
    /^@tailwindcss\/postcss$/,
  ]

  // Check if it's likely a transitive dependency (should be ignored)
  if (transitiveDependencyPatterns.some((pattern) => pattern.test(packageName))) {
    return false
  }

  // Check if it matches direct dependency patterns
  return directDependencyPatterns.some((pattern) => pattern.test(packageName))
}

/**
 * Main verification function
 */
function verifyPackageConsistency() {
  // Read pnpm-lock.yaml
  const lockData = readPnpmLock()
  if (!lockData) {
    process.exit(1)
  }

  // Extract packages from lockfile
  const lockfilePackages = extractPackagesFromLockfile(lockData)

  let hasInconsistencies = false
  const results = []

  // Check each workspace package
  for (const workspace of WORKSPACE_PACKAGES) {
    const packageJson = readPackageJson(workspace.path)
    if (!packageJson) {
      continue
    }

    const importerPath = mapWorkspaceToImporter(workspace.name)
    const lockfilePackagesForWorkspace = lockfilePackages.get(importerPath)

    if (!lockfilePackagesForWorkspace) {
      continue
    }

    const packageJsonPackages = extractPackagesFromPackageJson(packageJson)

    const workspaceResult = {
      workspace: workspace.name,
      inconsistencies: [],
      stats: {
        lockfileDeps: 0,
        packageJsonDeps: 0,
        missing: 0,
      },
    }

    // Check each dependency type
    for (const depType of [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ]) {
      const lockfileDeps = lockfilePackagesForWorkspace[depType] || new Set()
      const packageJsonDeps = packageJsonPackages[depType] || new Set()

      workspaceResult.stats.lockfileDeps += lockfileDeps.size
      workspaceResult.stats.packageJsonDeps += packageJsonDeps.size

      // Find packages in lockfile but not in package.json (check across all dependency types)
      const missingFromPackageJson = []
      for (const packageName of lockfileDeps) {
        // Check if package is declared in ANY dependency type in package.json
        const isDeclaredInAnyType = [
          'dependencies',
          'devDependencies',
          'peerDependencies',
          'optionalDependencies',
        ].some((type) => packageJsonPackages[type]?.has(packageName))

        if (
          !shouldIgnorePackage(packageName) &&
          !isDeclaredInAnyType &&
          isLikelyDirectDependency(packageName, workspace.name)
        ) {
          missingFromPackageJson.push(packageName)
        }
      }

      if (missingFromPackageJson.length > 0) {
        workspaceResult.inconsistencies.push({
          type: depType,
          missing: missingFromPackageJson,
        })
        workspaceResult.stats.missing += missingFromPackageJson.length
        hasInconsistencies = true
      }
    }

    results.push(workspaceResult)
  }

  for (const result of results) {
    if (result.inconsistencies.length === 0) {
    } else {
      for (const inconsistency of result.inconsistencies) {
        for (const _packageName of inconsistency.missing) {
        }
      }
    }
  }

  // Summary
  const _totalWorkspaces = results.length
  const _inconsistentWorkspaces = results.filter((r) => r.inconsistencies.length > 0).length
  const _totalMissing = results.reduce((sum, r) => sum + r.stats.missing, 0)

  if (hasInconsistencies) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

// Run the verification
const scriptPath = path.resolve(process.argv[1])
const currentPath = path.resolve(fileURLToPath(import.meta.url))

if (currentPath === scriptPath) {
  verifyPackageConsistency()
}

export { verifyPackageConsistency }
