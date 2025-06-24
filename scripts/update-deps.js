#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");

const packages = [
  "./package.json",
  "./apps/web/package.json",
  "./packages/ui/package.json",
  "./packages/types/package.json",
  "./packages/utils/package.json",
  "./packages/config/package.json",
];

console.log("🔍 Vérification des mises à jour disponibles...\n");

packages.forEach((pkg) => {
  if (fs.existsSync(pkg)) {
    console.log(`📦 ${pkg}`);
    try {
      execSync(`npx ncu --target minor --packageFile ${pkg}`, {
        stdio: "inherit",
      });
    } catch (error) {
      console.log(`⚠️ Erreur pour ${pkg}`);
    }
    console.log("");
  }
});

console.log("💡 Pour appliquer les mises à jour : npx ncu -u");
