#!/usr/bin/env node

/**
 * 🔍 Script de vérification des dépendances
 * Vérifie les dépendances circulaires et la cohérence des packages
 */

const fs = require('node:fs')
const path = require('node:path')

const packages = ['domains', 'ui', 'utils', 'api-client', 'types', 'config']
const packagesDir = path.join(__dirname, '..', 'packages')

// Fonction pour lire le package.json
function readPackageJson(packageName) {
  const packagePath = path.join(packagesDir, packageName, 'package.json')
  if (!fs.existsSync(packagePath)) {
    return null
  }
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'))
}

// Construire le graphe de dépendances
const dependencyGraph = {}
const allDependencies = new Set()

packages.forEach((pkg) => {
  const packageJson = readPackageJson(pkg)
  if (!packageJson) return

  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
  }

  dependencyGraph[pkg] = Object.keys(deps)
    .filter((dep) => dep.startsWith('@erp/'))
    .map((dep) => dep.replace('@erp/', ''))

  Object.keys(deps).forEach((dep) => {
    if (dep.startsWith('@erp/')) {
      allDependencies.add(dep.replace('@erp/', ''))
    }
  })
})

Object.entries(dependencyGraph).forEach(([pkg, deps]) => {
  if (deps.length === 0) {
  } else {
    deps.forEach((dep) => {
      // Vérifier la dépendance circulaire directe
      if (dependencyGraph[dep]?.includes(pkg)) {
      }
    })
  }
})

packages.forEach((pkg) => {
  if (!allDependencies.has(pkg) && pkg !== 'config') {
  }
})

// Vérifier que domains ne dépend pas de ui
if (dependencyGraph.domains?.includes('ui')) {
} else {
}

// Vérifier que utils ne dépend de rien
if (dependencyGraph.utils?.length === 0 || !dependencyGraph.utils) {
} else {
}
