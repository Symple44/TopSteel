const { execSync } = require("child_process");

console.log("🔍 Vérification des dépendances...");

try {
  // Audit de sécurité
  execSync("pnpm audit --audit-level moderate", { stdio: "inherit" });

  // Vérification des versions obsolètes
  execSync("pnpm outdated", { stdio: "inherit" });

  console.log("✅ Audit terminé");
} catch (error) {
  console.error("❌ Problèmes détectés");
  process.exit(1);
}
