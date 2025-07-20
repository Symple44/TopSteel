// Fichier serveur uniquement pour l'upload d'images
let imageService: any = null

export async function getImageService() {
  if (!imageService) {
    const { imageService: service } = await import('@erp/domains/server')
    imageService = service
  }
  return imageService
}