#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 DIAGNOSTIC DE L'ENVIRONNEMENT DE DÉVELOPPEMENT\n");
console.log("=".repeat(60));

// Informations système
console.log("\n📋 INFORMATIONS SYSTÈME");
console.log("-".repeat(30));
console.log(`OS: ${process.platform} ${process.arch}`);
console.log(`Node.js: ${process.version}`);

try {
  const pnpmVersion = execSync("pnpm --version", { encoding: "utf8" }).trim();
  console.log(`pnpm: ${pnpmVersion}`);
} catch (e) {
  console.log("❌ pnpm: Non installé");
}

// Structure du projet
console.log("\n📁 STRUCTURE DU PROJET");
console.log("-".repeat(30));

const checkDirectory = (dir, label) => {
  const exists = fs.existsSync(dir);
  console.log(`${exists ? "✅" : "❌"} ${label}: ${dir}`);
  return exists;
};

checkDirectory("apps/web", "Application web");
checkDirectory("packages/ui", "Package UI");
checkDirectory("packages/types", "Package Types");
checkDirectory("packages/utils", "Package Utils");
checkDirectory("packages/config", "Package Config");

// Fichiers de configuration
console.log("\n⚙️ CONFIGURATION");
console.log("-".repeat(30));

const configFiles = [
  "package.json",
  "turbo.json",
  "apps/web/package.json",
  "apps/web/next.config.js",
  "apps/web/.env.local",
  ".vscode/settings.json",
  ".vscode/launch.json",
  ".vscode/tasks.json",
];

configFiles.forEach((file) => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? "✅" : "❌"} ${file}`);
});

// Dépendances
console.log("\n📦 DÉPENDANCES CRITIQUES");
console.log("-".repeat(30));

const checkPackage = (packagePath) => {
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    const criticalDeps = [
      "next",
      "react",
      "typescript",
      "eslint",
      "prettier",
      "tailwindcss",
    ];

    criticalDeps.forEach((dep) => {
      if (deps[dep]) {
        console.log(`✅ ${dep}: ${deps[dep]}`);
      } else {
        console.log(`❌ ${dep}: Non installé`);
      }
    });
  } catch (e) {
    console.log("❌ Impossible de lire package.json");
  }
};

if (fs.existsSync("apps/web/package.json")) {
  checkPackage("apps/web/package.json");
}

// Ports disponibles
console.log("\n🌐 PORTS");
console.log("-".repeat(30));

const checkPort = (port) => {
  try {
    execSync(`netstat -an | grep :${port}`, { stdio: "pipe" });
    console.log(`⚠️ Port ${port}: Occupé`);
  } catch (e) {
    console.log(`✅ Port ${port}: Disponible`);
  }
};

[3000, 3001, 5432].forEach(checkPort);

// Recommandations
console.log("\n💡 RECOMMANDATIONS");
console.log("-".repeat(30));

if (!fs.existsSync("apps/web/.env.local")) {
  console.log(
    "📝 Créer apps/web/.env.local avec vos variables d'environnement"
  );
}

if (!fs.existsSync(".vscode/extensions.json")) {
  console.log(
    "🔌 Créer .vscode/extensions.json pour les extensions recommandées"
  );
}

console.log("\n🎯 COMMANDES DE DÉMARRAGE RAPIDE");
console.log("-".repeat(30));
console.log("pnpm install           # Installer les dépendances");
console.log('pnpm build --filter="!@erp/web"  # Construire les packages');
console.log("pnpm dev               # Démarrer le serveur de développement");
console.log("code .                 # Ouvrir VS Code");
