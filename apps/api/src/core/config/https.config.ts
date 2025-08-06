import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface'

export function getHttpsOptions(): HttpsOptions | null {
  try {
    const keyPath = join(process.cwd(), 'certificates', 'private-key.pem')
    const certPath = join(process.cwd(), 'certificates', 'certificate.pem')
    const caPath = join(process.cwd(), 'certificates', 'ca-certificate.pem')

    // Vérification que les certificats existent
    const key = readFileSync(keyPath)
    const cert = readFileSync(certPath)

    // CA certificate est optionnel
    let ca: Buffer | undefined
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
  } catch (_error) {
    return null
  }
}
