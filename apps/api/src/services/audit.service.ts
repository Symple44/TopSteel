// apps/api/src/services/audit.service.ts
export class AuditService {
  static async enregistrerAction(
    userId: string,
    action: string,
    ressource: string,
    ressourceId: string,
    detailsAvant?: any,
    detailsApres?: any
  ) {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        ressource,
        ressourceId,
        detailsAvant: detailsAvant ? JSON.stringify(detailsAvant) : null,
        detailsApres: detailsApres ? JSON.stringify(detailsApres) : null,
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent(),
        timestamp: new Date(),
      }
    })
  }

  static async obtenirHistorique(ressourceId: string, limite = 50) {
    return prisma.auditLog.findMany({
      where: { ressourceId },
      include: { user: { select: { nom: true, prenom: true } } },
      orderBy: { timestamp: 'desc' },
      take: limite,
    })
  }
}