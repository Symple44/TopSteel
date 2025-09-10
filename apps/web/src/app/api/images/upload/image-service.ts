// Fichier serveur uniquement pour l'upload d'images
import 'server-only'

// Import the ImageService type
type ImageService = import('@erp/domains/server').ImageService

let imageService: ImageService | null = null

export async function getImageService(): Promise<ImageService> {
  if (!imageService) {
    try {
      const domainsServer = await import('@erp/domains/server')
      const ImageService = domainsServer?.ImageService
      if (!ImageService) {
        throw new Error('ImageService is not exported from @erp/domains/server')
      }
      imageService = new ImageService()
    } catch (_error) {
      throw new Error('Image service is not available in this environment')
    }
  }
  return imageService
}
