import { config } from 'dotenv'
import { join } from 'path'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
config({ path: join(__dirname, '../../.env') })

async function fixTopSteelCompany() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'erp_topsteel_auth',
    logging: true,
  })

  try {
    await dataSource.initialize()
    console.log('✅ Connexion à la base de données établie')

    // Chercher l'utilisateur admin
    const adminUser = await dataSource.query(`
      SELECT id, email, nom, prenom FROM users 
      WHERE email = 'admin@topsteel.tech'
    `)

    if (adminUser.length === 0) {
      console.error('❌ Utilisateur admin@topsteel.tech non trouvé')
      return
    }

    console.log('👤 Utilisateur admin trouvé:', adminUser[0])

    // Vérifier les sociétés existantes
    const societes = await dataSource.query(`
      SELECT id, nom, code FROM societes
    `)

    console.log('🏢 Sociétés existantes:', societes)

    // Chercher la société TopSteel ou la première société
    let topsteelSociete = societes.find(
      (s: any) => s.nom.toLowerCase().includes('topsteel') || s.code === 'TOPSTEEL'
    )

    if (!topsteelSociete && societes.length > 0) {
      // Si pas de société TopSteel, mettre à jour la première société
      topsteelSociete = societes[0]

      console.log('📝 Mise à jour de la société:', topsteelSociete.id)
      await dataSource.query(
        `
        UPDATE societes 
        SET nom = 'TopSteel SAS', 
            code = 'TOPSTEEL',
            updated_at = NOW()
        WHERE id = $1
      `,
        [topsteelSociete.id]
      )

      console.log('✅ Société mise à jour avec le nom TopSteel SAS')
    }

    // Vérifier la relation user_societe_roles
    const userRoles = await dataSource.query(
      `
      SELECT * FROM user_societe_roles 
      WHERE "userId" = $1
    `,
      [adminUser[0].id]
    )

    console.log('👥 Rôles utilisateur-société:', userRoles)

    if (userRoles.length === 0 && topsteelSociete) {
      // Créer la relation si elle n'existe pas
      await dataSource.query(
        `
        INSERT INTO user_societe_roles ("userId", "societeId", role, "isDefault", "isActive")
        VALUES ($1, $2, 'SUPER_ADMIN', true, true)
      `,
        [adminUser[0].id, topsteelSociete.id]
      )

      console.log('✅ Relation utilisateur-société créée')
    }

    // Vérifier le résultat final
    const finalCheck = await dataSource.query(
      `
      SELECT 
        s.id,
        s.nom,
        s.code,
        usr.role,
        usr."isDefault"
      FROM societes s
      JOIN user_societe_roles usr ON usr."societeId" = s.id
      WHERE usr."userId" = $1
    `,
      [adminUser[0].id]
    )

    console.log('\n✅ Configuration finale:')
    console.log(finalCheck)
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await dataSource.destroy()
  }
}

fixTopSteelCompany()
