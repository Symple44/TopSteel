import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { AppController } from './app/app.controller'
import { AppService } from './app/app.service'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    it('should return the correct message', () => {
      const result = appController.getHello()
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      // Vérifier que c'est le bon message TopSteel
      expect(result).toBe('TopSteel ERP API v1.0.0 - Système de gestion métallurgique')
    })
  })
})
