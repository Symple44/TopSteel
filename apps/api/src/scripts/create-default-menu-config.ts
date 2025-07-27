import { DataSource } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

// Configuration de la connexion à la base de données AUTH
const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'erp_topsteel_auth',
  synchronize: false,
  logging: true,
})

async function createDefaultMenuConfiguration() {
  try {
    await dataSource.initialize()
    console.log('✅ Connexion à la base de données établie')

    // Vérifier s'il existe déjà une configuration
    const existingConfigs = await dataSource.query(`
      SELECT id, name FROM menu_configurations WHERE name = 'Configuration par défaut'
    `)

    if (existingConfigs.length > 0) {
      console.log('⚠️  Une configuration par défaut existe déjà')
      await dataSource.destroy()
      return
    }

    // Créer la configuration de menu
    const configId = uuidv4()
    const now = new Date()

    await dataSource.query(`
      INSERT INTO menu_configurations (id, name, description, isactive, issystem, createdat, updatedat)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      configId,
      'Configuration par défaut',
      'Configuration de menu standard avec toutes les pages principales',
      true,
      true,
      now,
      now
    ])

    console.log('✅ Configuration de menu créée:', configId)

    // Créer les items de menu
    const menuItems = [
      // Accueil
      {
        id: uuidv4(),
        parentId: null,
        title: 'Accueil',
        type: 'P', // Programme
        programId: '/',
        orderIndex: 0,
        icon: 'Home',
      },
      
      // Dashboard
      {
        id: uuidv4(),
        parentId: null,
        title: 'Tableau de bord',
        type: 'P',
        programId: '/dashboard',
        orderIndex: 1,
        icon: 'LayoutDashboard',
      },
      
      // Administration (Dossier)
      {
        id: uuidv4(),
        parentId: null,
        title: 'Administration',
        type: 'M', // Menu/Dossier
        orderIndex: 2,
        icon: 'Shield',
      },
      
      // Query Builder
      {
        id: uuidv4(),
        parentId: null,
        title: 'Query Builder',
        type: 'P',
        programId: '/query-builder',
        orderIndex: 3,
        icon: 'Database',
      },
      
      // Settings (Dossier)
      {
        id: uuidv4(),
        parentId: null,
        title: 'Paramètres',
        type: 'M',
        orderIndex: 4,
        icon: 'Settings',
      },
      
      // Lien externe
      {
        id: uuidv4(),
        parentId: null,
        title: 'OWEO Consulting',
        type: 'L', // Lien externe
        externalUrl: 'https://www.oweo-consulting.fr',
        orderIndex: 5,
        icon: 'ExternalLink',
      },
    ]

    // ID du dossier Administration
    const adminFolderId = menuItems[2].id
    const settingsFolderId = menuItems[4].id

    // Pages d'administration
    const adminPages = [
      { title: 'Utilisateurs', programId: '/admin/users', icon: 'Users', orderIndex: 0 },
      { title: 'Rôles', programId: '/admin/roles', icon: 'Shield', orderIndex: 1 },
      { title: 'Sociétés', programId: '/admin/societes', icon: 'Building', orderIndex: 2 },
      { title: 'Configuration des menus', programId: '/admin/menus', icon: 'Menu', orderIndex: 3 },
      { title: 'Paramètres système', programId: '/admin/system-parameters', icon: 'Sliders', orderIndex: 4 },
      { title: 'Intégrité DB', programId: '/admin/database/integrity', icon: 'Database', orderIndex: 5 },
      { title: 'Sauvegarde DB', programId: '/admin/database/backup', icon: 'HardDrive', orderIndex: 6 },
      { title: 'Statistiques DB', programId: '/admin/database/stats', icon: 'BarChart', orderIndex: 7 },
      { title: 'Sessions', programId: '/admin/sessions', icon: 'Clock', orderIndex: 8 },
      { title: 'Logs', programId: '/admin/logs', icon: 'FileText', orderIndex: 9 },
      { title: 'Traductions', programId: '/admin/translations', icon: 'Globe', orderIndex: 10 },
    ]

    // Pages de paramètres
    const settingsPages = [
      { title: 'Mon profil', programId: '/settings/profile', icon: 'User', orderIndex: 0 },
      { title: 'Sécurité', programId: '/settings/security', icon: 'Lock', orderIndex: 1 },
      { title: 'Notifications', programId: '/settings/notifications', icon: 'Bell', orderIndex: 2 },
      { title: 'Préférences', programId: '/settings/preferences', icon: 'Sliders', orderIndex: 3 },
      { title: 'Personnalisation du menu', programId: '/settings/menu', icon: 'Layout', orderIndex: 4 },
      { title: 'Thème', programId: '/settings/theme', icon: 'Palette', orderIndex: 5 },
    ]

    // Ajouter les sous-menus admin
    for (const page of adminPages) {
      menuItems.push({
        id: uuidv4(),
        parentId: adminFolderId,
        title: page.title,
        type: 'P',
        programId: page.programId,
        orderIndex: page.orderIndex,
        icon: page.icon,
      })
    }

    // Ajouter les sous-menus settings
    for (const page of settingsPages) {
      menuItems.push({
        id: uuidv4(),
        parentId: settingsFolderId,
        title: page.title,
        type: 'P',
        programId: page.programId,
        orderIndex: page.orderIndex,
        icon: page.icon,
      })
    }

    // Insérer tous les items de menu
    for (const item of menuItems) {
      await dataSource.query(`
        INSERT INTO menu_items (
          id, "configId", "parentId", title, type, 
          "programId", "externalUrl", "orderIndex", "isVisible", 
          metadata, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        item.id,
        configId,
        item.parentId,
        item.title,
        item.type,
        item.programId || null,
        item.externalUrl || null,
        item.orderIndex,
        true, // isVisible
        JSON.stringify({ icon: item.icon }),
        now,
        now
      ])
    }

    console.log(`✅ ${menuItems.length} items de menu créés`)

    // Désactiver les autres configurations
    await dataSource.query(`
      UPDATE menu_configurations 
      SET isactive = false 
      WHERE id != $1
    `, [configId])

    console.log('✅ Configuration par défaut activée')

    await dataSource.destroy()
    console.log('✅ Script terminé avec succès')

  } catch (error) {
    console.error('❌ Erreur:', error)
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
    process.exit(1)
  }
}

// Exécuter le script
createDefaultMenuConfiguration()