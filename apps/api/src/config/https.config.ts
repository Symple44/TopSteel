import type { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface'
import { readFileSync } from 'fs'
import { join } from 'path'

export function getHttpsOptions(): HttpsOptions | null {
  try {
    const keyPath = join(process.cwd(), 'certificates', 'private-key.pem')
    const certPath = join(process.cwd(), 'certificates', 'certificate.pem')
    const caPath = join(process.cwd(), 'certificates', 'ca-certificate.pem')

    // Vérification que les certificats existent
    const key = readFileSync(keyPath)
    const cert = readFileSync(certPath)

    // CA certificate est optionnel
    let ca
    try {
      ca = readFileSync(caPath)
    } catch {
      ca = undefined
    }

    const httpsOptions: HttpsOptions = {
      key,
      cert,
    }

    // Ajout du CA seulement s'il existe
    if (ca) {
      httpsOptions.ca = ca
    }

    return httpsOptions
  } catch (error) {
    console.warn('HTTPS certificates not found, using HTTP', error)
    return null
  }
}
