// apps/api/src/controllers/projets.controller.ts
import { Request, Response } from 'express'
import { ProjetsService } from '../services/projets.service'
import { CreateProjetDto, UpdateProjetDto } from '../dto/projet.dto'
import { validateDto } from '../middleware/validation'

export class ProjetsController {
  constructor(private projetsService: ProjetsService) {}

  async getAll(req: Request, res: Response) {
    const { page, limit, search, status } = req.query
    const projets = await this.projetsService.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search: search as string,
      status: status as string,
    })
    res.json({ success: true, data: projets })
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params
    const projet = await this.projetsService.findById(id)
    if (!projet) {
      return res.status(404).json({ success: false, message: 'Projet non trouvé' })
    }
    res.json({ success: true, data: projet })
  }

  async create(req: Request, res: Response) {
    const dto = await validateDto(CreateProjetDto, req.body)
    const projet = await this.projetsService.create(dto, req.user.id)
    res.status(201).json({ success: true, data: projet })
  }
}