import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";

@Injectable()
export class SeederService {
	private readonly logger = new Logger(SeederService.name);
	private readonly isDevelopment: boolean;

	constructor(
		private readonly dataSource: DataSource,
		private readonly configService: ConfigService,
	) {
		this.isDevelopment = this.configService.get("NODE_ENV") === "development";
	}

	/**
	 * Exécute tous les seeds si nécessaire
	 */
	async runSeeds(): Promise<void> {
		try {
			this.logger.log("🌱 Vérification des données d'initialisation...");

			// Vérifier si les seeds ont déjà été exécutés
			const seedsStatus = await this.checkSeedsStatus();

			if (seedsStatus.completed) {
				this.logger.log("✅ Données d'initialisation déjà présentes");
				return;
			}

			this.logger.log("🔄 Exécution des données d'initialisation...");

			// Exécuter les seeds dans l'ordre
			await this.dataSource.transaction(async (manager) => {
				await this.seedSystemParameters(manager);
				await this.seedDefaultUsers(manager);
				await this.seedMenuConfiguration(manager);
				await this.markSeedsAsCompleted(manager);
			});

			this.logger.log("✅ Données d'initialisation créées avec succès");
		} catch (error) {
			this.logger.error(
				"❌ Erreur lors de l'initialisation des données:",
				error,
			);
			throw error;
		}
	}

	/**
	 * Vérifie si les seeds ont été exécutés
	 */
	private async checkSeedsStatus(): Promise<{
		completed: boolean;
		lastRun?: Date;
	}> {
		try {
			// Créer la table de tracking des seeds si elle n'existe pas
			await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS seeds_status (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(name)
        )
      `);

			const result = await this.dataSource.query(`
        SELECT executed_at FROM seeds_status 
        WHERE name = 'initial_seed' 
        ORDER BY executed_at DESC 
        LIMIT 1
      `);

			return {
				completed: result.length > 0,
				lastRun: result[0]?.executed_at,
			};
		} catch (error) {
			this.logger.error("Erreur lors de la vérification des seeds:", error);
			return { completed: false };
		}
	}

	/**
	 * Marque les seeds comme complétés
	 */
	private async markSeedsAsCompleted(manager: any): Promise<void> {
		await manager.query(`
      INSERT INTO seeds_status (name, executed_at) 
      VALUES ('initial_seed', CURRENT_TIMESTAMP)
      ON CONFLICT (name) DO UPDATE SET executed_at = CURRENT_TIMESTAMP
    `);
	}

	/**
	 * Seed des paramètres système
	 */
	private async seedSystemParameters(manager: any): Promise<void> {
		this.logger.log("📋 Initialisation des paramètres système...");

		const systemParameters = [
			{
				key: "app_name",
				value: "TopSteel ERP",
				description: "Nom de l'application",
				type: "string",
				category: "general",
			},
			{
				key: "app_version",
				value: "1.0.0",
				description: "Version de l'application",
				type: "string",
				category: "general",
			},
			{
				key: "maintenance_mode",
				value: "false",
				description: "Mode maintenance",
				type: "boolean",
				category: "system",
			},
			{
				key: "max_file_size",
				value: "10485760",
				description: "Taille max des fichiers (bytes)",
				type: "number",
				category: "files",
			},
		];

		for (const param of systemParameters) {
			await manager.query(
				`
        INSERT INTO system_parameters (key, value, description, type, category, "created_at", "updated_at")
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO NOTHING
      `,
				[param.key, param.value, param.description, param.type, param.category],
			);
		}
	}

	/**
	 * Seed des utilisateurs par défaut
	 */
	private async seedDefaultUsers(manager: any): Promise<void> {
		this.logger.log("👥 Initialisation des utilisateurs par défaut...");

		// Vérifier si des utilisateurs existent déjà
		const userCount = await manager.query(
			"SELECT COUNT(*) as count FROM users",
		);

		if (parseInt(userCount[0].count) > 0) {
			this.logger.log("👥 Utilisateurs déjà présents, passage");
			return;
		}

		// Créer l'utilisateur admin par défaut
		const bcrypt = require("bcrypt");
		const hashedPassword = await bcrypt.hash("TopSteel44!", 10);

		await manager.query(
			`
      INSERT INTO users (nom, prenom, email, password, role, actif, acronyme, "created_at", "updated_at")
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO NOTHING
    `,
			[
				"Admin",
				"System",
				"admin@topsteel.tech",
				hashedPassword,
				"ADMIN",
				true,
				"TOP",
			],
		);

		this.logger.log(
			"👥 Utilisateur admin créé: admin@topsteel.tech / TopSteel44! (acronyme: TOP)",
		);
		
		this.logger.warn("⚠️  Changez le mot de passe admin en production!");
	}

	/**
	 * Seed de la configuration des menus (temporairement désactivé)
	 */
	private async seedMenuConfiguration(manager: any): Promise<void> {
		this.logger.log("🎛️  Initialisation de la configuration des menus...");

		// Temporairement désactivé - les tables menu_configurations et menu_items
		// ne sont pas encore créées dans la migration
		this.logger.log("⏭️  Configuration des menus temporairement désactivée");

		// TODO: Ajouter les tables menu_configurations et menu_items dans une prochaine migration
		// puis réactiver ce code
	}

	/**
	 * Reset des seeds (développement uniquement)
	 */
	async resetSeeds(): Promise<void> {
		if (!this.isDevelopment) {
			throw new Error("Reset des seeds interdit en production");
		}

		try {
			this.logger.warn("🔄 Reset des données d'initialisation...");

			await this.dataSource.query(
				"DELETE FROM seeds_status WHERE name = 'initial_seed'",
			);

			this.logger.log("✅ Données d'initialisation reset");
		} catch (error) {
			this.logger.error("❌ Erreur lors du reset des seeds:", error);
			throw error;
		}
	}

	/**
	 * Seed spécifique pour les tests
	 */
	async seedTestData(): Promise<void> {
		if (!this.isDevelopment) {
			throw new Error("Seed de test interdit en production");
		}

		try {
			this.logger.log("🧪 Initialisation des données de test...");

			// Ajouter des données de test ici
			// Par exemple: clients fictifs, projets de test, etc.

			this.logger.log("✅ Données de test créées");
		} catch (error) {
			this.logger.error(
				"❌ Erreur lors de la création des données de test:",
				error,
			);
			throw error;
		}
	}
}
