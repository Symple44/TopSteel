import { Injectable, NotFoundException } from '@nestjs/common'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import type { Site, Prisma } from '@prisma/client'

/**
 * Service de gestion des sites
 * Migrated from TypeORM to Prisma
 */
@Injectable()
export class SitesService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Récupère tous les sites actifs
   */
  async findAll(): Promise<Site[]> {
    return this.prisma.site.findMany({
      where: { isActive: true },
      include: { societe: true },
    })
  }

  /**
   * Récupère tous les sites d'une société
   */
  async findBySociete(societeId: string): Promise<Site[]> {
    return this.prisma.site.findMany({
      where: {
        societeId,
        isActive: true,
      },
      include: { societe: true },
    })
  }

  /**
   * Trouve un site par son ID
   */
  async findById(id: string): Promise<Site | null> {
    return this.prisma.site.findUnique({
      where: { id },
      include: { societe: true },
    })
  }

  /**
   * Trouve le site principal d'une société
   * Note: Uses metadata field to track principal status
   */
  async findPrincipal(societeId: string): Promise<Site | null> {
    const sites = await this.prisma.site.findMany({
      where: {
        societeId,
        isActive: true,
      },
      include: { societe: true },
    })

    // Check metadata for isPrincipal flag
    return sites.find(s => (s.metadata as any)?.isPrincipal === true) || sites[0] || null
  }

  /**
   * Crée un nouveau site
   */
  async create(siteData: Prisma.SiteCreateInput): Promise<Site> {
    return this.prisma.site.create({
      data: siteData,
      include: { societe: true },
    })
  }

  /**
   * Met à jour un site
   */
  async update(id: string, siteData: Prisma.SiteUpdateInput): Promise<Site> {
    const site = await this.prisma.site.update({
      where: { id },
      data: siteData,
      include: { societe: true },
    })

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`)
    }

    return site
  }

  /**
   * Supprime un site (soft delete via isActive)
   */
  async delete(id: string): Promise<void> {
    await this.prisma.site.update({
      where: { id },
      data: { isActive: false },
    })
  }

  /**
   * Définit un site comme principal pour sa société
   * Note: Uses metadata field to track principal status
   */
  async setPrincipal(id: string, societeId: string): Promise<Site> {
    // Get all sites for the societe
    const sites = await this.prisma.site.findMany({
      where: { societeId },
    })

    // Update all sites to remove isPrincipal flag from metadata
    for (const site of sites) {
      const metadata = (site.metadata as any) || {}
      if (site.id === id) {
        metadata.isPrincipal = true
      } else {
        metadata.isPrincipal = false
      }
      await this.prisma.site.update({
        where: { id: site.id },
        data: { metadata: metadata as any },
      })
    }

    // Return the newly principal site
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: { societe: true },
    })

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`)
    }

    return site
  }

  /**
   * Vérifie si un code de site existe déjà pour une société
   */
  async codeExists(code: string, societeId: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.site.count({
      where: {
        code,
        societeId,
        isActive: true,
        ...(excludeId && { id: { not: excludeId } }),
      },
    })

    return count > 0
  }
}
