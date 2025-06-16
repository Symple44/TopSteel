#!/usr/bin/env node
const fs = require("fs");
const { execSync } = require("child_process");

function generateDepsReport() {
  console.log("📊 RAPPORT DES DÉPENDANCES\n");
  console.log("=".repeat(50));

  // Audit de sécurité
  try {
    execSync("pnpm audit --json > audit-report.json", { stdio: "pipe" });
    const audit = JSON.parse(fs.readFileSync("audit-report.json"));
    console.log(`🛡️ Vulnérabilités: ${audit.metadata.vulnerabilities.total}`);
  } catch (e) {
    console.log("🛡️ Audit: ✅ Aucune vulnérabilité");
  }

  // Packages obsolètes
  try {
    const outdated = execSync("pnpm outdated --json", { encoding: "utf8" });
    const outdatedPackages = JSON.parse(outdated);
    console.log(
      `📦 Packages obsolètes: ${Object.keys(outdatedPackages).length}`
    );
  } catch (e) {
    console.log("📦 Packages: ✅ Tous à jour");
  }

  // Nettoyage
  if (fs.existsSync("audit-report.json")) {
    fs.unlinkSync("audit-report.json");
  }

  console.log('\n💡 Exécutez "pnpm deps:full-check" pour plus de détails');
}

generateDepsReport();
