// Fichier serveur uniquement pour l'upload d'images
import 'server-only'

let imageService: unknown = null

export async function getImageService() {
  if (!imageService) {
    try {
      const domainsServer = await import('@erp/domains/server')
      const ImageService = domainsServer.ImageService
      imageService = new ImageService()
    } catch (_error) {
      throw new Error('Image service is not available in this environment')
    }
  }
  return imageService
}
