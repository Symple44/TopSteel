import { DataSource } from 'typeorm'
import { User } from '../modules/users/entities/user.entity'
import { Societe } from '../modules/societes/entities/societe.entity'
import { SocieteUser, UserSocieteRole } from '../modules/societes/entities/societe-user.entity'

async function initializeUserRightsData() {
  console.log('🚀 Initialisation des données de droits utilisateurs...')
  
  // Configuration de la base de données AUTH
  const authDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.AUTH_DB_NAME || 'erp_topsteel_auth',
    entities: [User, Societe, SocieteUser],
    synchronize: false,
    logging: false,
  })

  try {
    await authDataSource.initialize()
    console.log('✅ Connexion à la base de données AUTH établie')

    const userRepository = authDataSource.getRepository(User)
    const societeRepository = authDataSource.getRepository(Societe)
    const societeUserRepository = authDataSource.getRepository(SocieteUser)

    // Récupérer tous les utilisateurs
    const users = await userRepository.find()
    console.log(`📊 ${users.length} utilisateurs trouvés`)

    // Récupérer toutes les sociétés
    const societes = await societeRepository.find()
    console.log(`🏢 ${societes.length} sociétés trouvées`)

    if (users.length === 0 || societes.length === 0) {
      console.log('⚠️  Pas assez de données pour initialiser les droits')
      return
    }

    // Vérifier les associations existantes
    const existingAssociations = await societeUserRepository.find()
    console.log(`🔗 ${existingAssociations.length} associations existantes`)

    // Créer des associations par défaut pour les utilisateurs qui n'en ont pas
    let createdAssociations = 0

    for (const user of users) {
      const userAssociations = existingAssociations.filter(a => a.userId === user.id)
      
      if (userAssociations.length === 0) {
        // L'utilisateur n'a accès à aucune société, créons des accès par défaut
        console.log(`👤 Initialisation des droits pour ${user.email}`)
        
        for (const societe of societes) {
          // Déterminer le rôle basé sur le rôle global de l'utilisateur
          let role: UserSocieteRole = UserSocieteRole.USER
          let permissions: string[] = []
          
          switch (user.role) {
            case 'ADMIN':
            case 'SUPER_ADMIN':
              role = UserSocieteRole.ADMIN
              permissions = [
                'COMPANY_VIEW', 'COMPANY_EDIT', 'COMPANY_DELETE',
                'USER_VIEW', 'USER_EDIT', 'USER_DELETE',
                'PROJECT_VIEW', 'PROJECT_EDIT', 'PROJECT_DELETE',
                'INVOICE_VIEW', 'INVOICE_EDIT', 'INVOICE_DELETE'
              ]
              break
              
            case 'MANAGER':
              role = UserSocieteRole.MANAGER
              permissions = [
                'COMPANY_VIEW', 'COMPANY_EDIT',
                'USER_VIEW', 'USER_EDIT',
                'PROJECT_VIEW', 'PROJECT_EDIT',
                'INVOICE_VIEW', 'INVOICE_EDIT'
              ]
              break
              
            default:
              role = UserSocieteRole.USER
              permissions = [
                'COMPANY_VIEW',
                'PROJECT_VIEW',
                'INVOICE_VIEW'
              ]
          }

          const newAssociation = societeUserRepository.create({
            userId: user.id,
            societeId: societe.id,
            role,
            permissions,
            actif: true,
            // Première société devient par défaut
            isDefault: societes.indexOf(societe) === 0
          })

          await societeUserRepository.save(newAssociation)
          createdAssociations++
          
          console.log(`  ✅ Accès créé pour ${societe.nom} (${role})`)
        }
      } else {
        // L'utilisateur a déjà des accès, vérifier s'il a une société par défaut
        const hasDefault = userAssociations.some(a => a.isDefault)
        
        if (!hasDefault && userAssociations.length > 0) {
          // Définir la première société active comme par défaut
          const firstActive = userAssociations.find(a => a.actif)
          if (firstActive) {
            await societeUserRepository.update(firstActive.id, { isDefault: true })
            console.log(`📌 Société par défaut définie pour ${user.email}`)
          }
        }
      }
    }

    console.log(`\n🎉 Initialisation terminée !`)
    console.log(`📈 ${createdAssociations} nouvelles associations créées`)
    console.log(`👥 ${users.length} utilisateurs traités`)
    console.log(`🏢 ${societes.length} sociétés configurées`)

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
  } finally {
    await authDataSource.destroy()
    console.log('🔌 Connexion fermée')
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  initializeUserRightsData()
    .then(() => {
      console.log('✅ Script terminé avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error)
      process.exit(1)
    })
}

export { initializeUserRightsData }