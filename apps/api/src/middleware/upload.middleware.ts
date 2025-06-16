// apps/api/src/middleware/upload.middleware.ts
import multer from 'multer'
import path from 'path'
import { fileTypeFromBuffer } from 'file-type'

const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
}

const storage = multer.memoryStorage()

export const uploadSecurise = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5, // 5 fichiers max
  },
  fileFilter: async (req, file, cb) => {
    try {
      // Vérifier l'extension
      const ext = path.extname(file.originalname).toLowerCase()
      if (!Object.values(ALLOWED_TYPES).includes(ext)) {
        return cb(new Error('Type de fichier non autorisé'))
      }

      // Vérifier le MIME type réel du fichier
      const fileType = await fileTypeFromBuffer(file.buffer)
      if (!fileType || !ALLOWED_TYPES[fileType.mime]) {
        return cb(new Error('Type de fichier invalide'))
      }

      // Scanner antivirus (en production)
      if (process.env.NODE_ENV === 'production') {
        const isSafe = await scannerAntivirus(file.buffer)
        if (!isSafe) {
          return cb(new Error('Fichier potentiellement dangereux'))
        }
      }

      cb(null, true)
    } catch (error) {
      cb(new Error('Erreur lors de la validation du fichier'))
    }
  },
})