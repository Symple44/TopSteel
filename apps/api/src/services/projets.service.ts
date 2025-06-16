// apps/api/src/services/projets.service.ts
import { PrismaService } from './prisma.service'
import { CreateProjetDto, UpdateProjetDto } from '../dto/projet.dto'
import { generateReference } from '@erp/utils'

export class ProjetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: {
    page: number
    limit: number
    search?: string
    status?: string
  }) {
    const { page, limit, search, status } = filters
    const skip = (page - 1) * limit

    const where = {
      ...(search && {
        OR: [
          { reference: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { client: { nom: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(status && { statut: status }),
    }

    const [projets, total] = await Promise.all([
      this.prisma.projet.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: true,
          responsable: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.projet.count({ where }),
    ])

    return {
      data: projets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async create(dto: CreateProjetDto, userId: string) {
    const reference = await this.generateProjetReference()
    
    return this.prisma.projet.create({
      data: {
        ...dto,
        reference,
        createdBy: userId,
        statut: 'BROUILLON',
        avancement: 0,
      },
      include: {
        client: true,
        responsable: true,
      },
    })
  }

  private async generateProjetReference(): Promise<string> {
    const year = new Date().getFullYear()
    const count = await this.prisma.projet.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    })
    return generateReference('PRJ', year, count + 1)
  }
}
