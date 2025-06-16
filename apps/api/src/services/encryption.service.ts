// apps/api/src/services/encryption.service.ts
import crypto from 'crypto'
import bcrypt from 'bcrypt'

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32)

  static chiffrer(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(this.ALGORITHM, this.KEY, { iv })
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex')
    }
  }

  static dechiffrer(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(
      this.ALGORITHM, 
      this.KEY, 
      { iv: Buffer.from(encryptedData.iv, 'hex') }
    )
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  static async hasherMotDePasse(motDePasse: string): Promise<string> {
    return bcrypt.hash(motDePasse, 12)
  }

  static async verifierMotDePasse(motDePasse: string, hash: string): Promise<boolean> {
    return bcrypt.compare(motDePasse, hash)
  }
}