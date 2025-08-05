import { NestFactory } from '@nestjs/core'
import * as bcrypt from 'bcrypt'
import { DataSource } from 'typeorm'
import { AppModule } from '../app.module'

async function checkAdminUser() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const dataSource = app.get(DataSource)

  try {
    console.log('🔍 Vérification du compte admin...\n')

    // Vérifier si l'utilisateur existe
    const result = await dataSource.query(`
      SELECT id, email, password, role, actif, nom, prenom, acronyme
      FROM users 
      WHERE email = 'admin@topsteel.tech'
    `)

    if (result.length === 0) {
      console.log("❌ Aucun utilisateur trouvé avec l'email admin@topsteel.tech")
    } else {
      const user = result[0]
      console.log('✅ Utilisateur trouvé:')
      console.log(`   - ID: ${user.id}`)
      console.log(`   - Email: ${user.email}`)
      console.log(`   - Nom: ${user.nom} ${user.prenom}`)
      console.log(`   - Role: ${user.role}`)
      console.log(`   - Actif: ${user.actif}`)
      console.log(`   - Acronyme: ${user.acronyme}`)
      console.log(`   - Hash du mot de passe: ${user.password?.substring(0, 20)}...`)

      // Tester le mot de passe
      console.log('\n🔐 Test du mot de passe...')
      const passwords = ['TopSteel44!', 'admin123', 'Admin123!', 'admin']

      for (const pwd of passwords) {
        try {
          const isValid = await bcrypt.compare(pwd, user.password)
          console.log(`   - "${pwd}": ${isValid ? '✅ VALIDE' : '❌ Invalide'}`)
        } catch (err) {
          console.log(`   - "${pwd}": ❌ Erreur: ${err.message}`)
        }
      }
    }

    // Vérifier tous les utilisateurs avec role SUPER_ADMIN
    console.log('\n👥 Tous les utilisateurs SUPER_ADMIN:')
    const superAdmins = await dataSource.query(`
      SELECT id, email, nom, prenom, actif
      FROM users 
      WHERE role = 'SUPER_ADMIN'
    `)

    if (superAdmins.length === 0) {
      console.log('   ❌ Aucun SUPER_ADMIN trouvé')
    } else {
      superAdmins.forEach((admin: any) => {
        console.log(`   - ${admin.email} (${admin.nom} ${admin.prenom}) - Actif: ${admin.actif}`)
      })
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await app.close()
  }
}

checkAdminUser().catch(console.error)
