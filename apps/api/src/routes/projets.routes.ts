// apps/api/src/routes/projets.routes.ts
import { Router } from 'express'
import { ProjetsController } from '../controllers/projets.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { validatePermission } from '../middleware/permissions.middleware'

const router = Router()
const projetsController = new ProjetsController()

router.use(authMiddleware)

router.get('/', projetsController.getAll.bind(projetsController))
router.get('/:id', projetsController.getById.bind(projetsController))
router.post('/', 
  validatePermission('projets:create'),
  projetsController.create.bind(projetsController)
)
router.put('/:id', 
  validatePermission('projets:update'),
  projetsController.update.bind(projetsController)
)
router.delete('/:id', 
  validatePermission('projets:delete'),
  projetsController.delete.bind(projetsController)
)

export default router