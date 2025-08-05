import { NestFactory } from '@nestjs/core'
import * as bcrypt from 'bcrypt'
import { DataSource } from 'typeorm'
import { AppModule } from '../app.module'

async function checkAdminUser() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const dataSource = app.get(DataSource)

  try {
    // Vérifier si l'utilisateur existe
    const result = await dataSource.query(`
      SELECT id, email, password, role, actif, nom, prenom, acronyme
      FROM users 
      WHERE email = 'admin@topsteel.tech'
    `)

    if (result.length === 0) {
    } else {
      const user = result[0]
      const passwords = ['TopSteel44!', 'admin123', 'Admin123!', 'admin']

      for (const pwd of passwords) {
        try {
          const _isValid = await bcrypt.compare(pwd, user.password)
        } catch (_err) {}
      }
    }
    const superAdmins = await dataSource.query(`
      SELECT id, email, nom, prenom, actif
      FROM users 
      WHERE role = 'SUPER_ADMIN'
    `)

    if (superAdmins.length === 0) {
    } else {
      superAdmins.forEach((_admin: any) => {})
    }
  } catch (_error) {
  } finally {
    await app.close()
  }
}

checkAdminUser().catch(console.error)
