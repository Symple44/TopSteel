import 'reflect-metadata'
import type { MockedObject } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppController } from './app/app.controller'
import type { AppService } from './app/app.service'

describe('AppController', () => {
  let appController: AppController
  let appService: MockedObject<AppService>

  beforeEach(() => {
    // Créer un mock du service avec le bon typage
    appService = {
      getHello: vi
        .fn()
        .mockReturnValue('TopSteel ERP API v1.0.0 - Système de gestion métallurgique'),
      getVersion: vi.fn().mockReturnValue({
        name: 'TopSteel ERP API',
        version: '1.0.0',
        description: "API de gestion ERP pour l'industrie métallurgique",
        timestamp: new Date().toISOString(),
      }),
    } as unknown as MockedObject<AppService>

    // Créer directement une instance du controller avec le service mocké
    appController = new AppController(appService as unknown as AppService)
  })

  describe('root', () => {
    it('should return the correct message', () => {
      const result = appController.getHello()
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toBe('TopSteel ERP API v1.0.0 - Système de gestion métallurgique')
      expect(appService.getHello).toHaveBeenCalled()
    })

    it('should return version information', () => {
      const result = appController.getVersion()
      expect(result).toBeDefined()
      expect(result.name).toBe('TopSteel ERP API')
      expect(result.version).toBe('1.0.0')
      expect(result.description).toBe("API de gestion ERP pour l'industrie métallurgique")
      expect(result.timestamp).toBeDefined()
      expect(appService.getVersion).toHaveBeenCalled()
    })
  })
})
