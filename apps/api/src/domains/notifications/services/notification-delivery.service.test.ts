import { EventEmitter2 } from '@nestjs/event-emitter'
import { Test, type TestingModule } from '@nestjs/testing'
import type { MockedFunction } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type NotificationDeliveryOptions,
  NotificationDeliveryService,
} from './notification-delivery.service'

describe('NotificationDeliveryService', () => {
  let service: NotificationDeliveryService
  let eventEmitter: { emit: MockedFunction<EventEmitter2['emit']> }

  const mockDeliveryOptions: NotificationDeliveryOptions = {
    title: 'Test Notification',
    body: 'This is a test notification',
    channels: ['email', 'in_app'],
    recipients: ['user1@example.com', 'user2@example.com'],
    priority: 'normal',
    metadata: { source: 'test' },
    data: { actionUrl: '/dashboard' },
  }

  beforeEach(async () => {
    const mockEventEmitter = {
      emit: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationDeliveryService,
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile()

    service = module.get<NotificationDeliveryService>(NotificationDeliveryService)
    eventEmitter = module.get<{ emit: MockedFunction<EventEmitter2['emit']> }>(EventEmitter2)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('sendNotification', () => {
    it('should successfully send notification through all channels', async () => {
      const options: NotificationDeliveryOptions = {
        ...mockDeliveryOptions,
        channels: ['email', 'sms', 'push', 'in_app'],
      }

      const result = await service.sendNotification(options)

      expect(result).toEqual({
        delivered: 8, // 2 recipients * 4 channels
        failed: 0,
        channels: ['email', 'sms', 'push', 'in_app'],
        errors: [],
      })

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'notification.sent',
        expect.objectContaining({
          options,
          result: expect.any(Object),
          timestamp: expect.any(Date),
        })
      )
    })

    it('should handle single channel notification', async () => {
      const options: NotificationDeliveryOptions = {
        ...mockDeliveryOptions,
        channels: ['email'],
        recipients: ['test@example.com'],
      }

      const result = await service.sendNotification(options)

      expect(result).toEqual({
        delivered: 1,
        failed: 0,
        channels: ['email'],
        errors: [],
      })
    })

    it('should handle notification with no recipients', async () => {
      const options: NotificationDeliveryOptions = {
        ...mockDeliveryOptions,
        recipients: [],
      }

      const result = await service.sendNotification(options)

      expect(result).toEqual({
        delivered: 0,
        failed: 0,
        channels: ['email', 'in_app'],
        errors: [],
      })
    })

    it('should handle mixed success and failure scenarios', async () => {
      // Mock email to fail
      vi.spyOn(service as unknown as Record<string, unknown>, 'sendEmail').mockRejectedValue(
        new Error('Email service down')
      )

      const options: NotificationDeliveryOptions = {
        ...mockDeliveryOptions,
        channels: ['email', 'in_app'],
      }

      const result = await service.sendNotification(options)

      expect(result).toEqual({
        delivered: 2, // in_app succeeded for 2 recipients
        failed: 2, // email failed for 2 recipients
        channels: ['in_app'], // only successful channel
        errors: ['email: Email service down'],
      })
    })

    it('should handle all channels failing', async () => {
      // Mock all channels to fail
      vi.spyOn(service as unknown as Record<string, unknown>, 'sendEmail').mockRejectedValue(
        new Error('Email failed')
      )
      vi.spyOn(
        service as unknown as Record<string, unknown>,
        'sendInAppNotification'
      ).mockRejectedValue(new Error('In-app failed'))

      const result = await service.sendNotification(mockDeliveryOptions)

      expect(result).toEqual({
        delivered: 0,
        failed: 4, // 2 channels * 2 recipients
        channels: [],
        errors: ['email: Email failed', 'in_app: In-app failed'],
      })
    })

    it('should emit tracking event after sending', async () => {
      await service.sendNotification(mockDeliveryOptions)

      expect(eventEmitter.emit).toHaveBeenCalledWith('notification.sent', {
        options: mockDeliveryOptions,
        result: expect.any(Object),
        timestamp: expect.any(Date),
      })
    })

    it('should handle notifications with template ID', async () => {
      const optionsWithTemplate: NotificationDeliveryOptions = {
        ...mockDeliveryOptions,
        templateId: 'welcome-template',
      }

      const result = await service.sendNotification(optionsWithTemplate)

      expect(result.delivered).toBeGreaterThan(0)
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'notification.sent',
        expect.objectContaining({
          options: expect.objectContaining({
            templateId: 'welcome-template',
          }),
        })
      )
    })
  })

  describe('Channel-specific delivery methods', () => {
    it('should handle email delivery', async () => {
      const emailSpy = vi.spyOn(service as unknown as Record<string, unknown>, 'sendEmail')

      const options: NotificationDeliveryOptions = {
        ...mockDeliveryOptions,
        channels: ['email'],
      }

      await service.sendNotification(options)

      expect(emailSpy).toHaveBeenCalledWith(options)
    })

    it('should handle SMS delivery', async () => {
      const smsSpy = vi.spyOn(service as unknown as Record<string, unknown>, 'sendSMS')

      const options: NotificationDeliveryOptions = {
        ...mockDeliveryOptions,
        channels: ['sms'],
      }

      await service.sendNotification(options)

      expect(smsSpy).toHaveBeenCalledWith(options)
    })

    it('should handle push notification delivery', async () => {
      const pushSpy = vi.spyOn(
        service as unknown as Record<string, unknown>,
        'sendPushNotification'
      )

      const options: NotificationDeliveryOptions = {
        ...mockDeliveryOptions,
        channels: ['push'],
      }

      await service.sendNotification(options)

      expect(pushSpy).toHaveBeenCalledWith(options)
    })

    it('should handle in-app notification delivery', async () => {
      const inAppSpy = vi.spyOn(
        service as unknown as Record<string, unknown>,
        'sendInAppNotification'
      )

      const options: NotificationDeliveryOptions = {
        ...mockDeliveryOptions,
        channels: ['in_app'],
      }

      await service.sendNotification(options)

      expect(inAppSpy).toHaveBeenCalledWith(options)
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'notification.in-app',
        expect.objectContaining({
          recipients: options.recipients,
          title: options.title,
          body: options.body,
          data: options.data,
          priority: options.priority,
          timestamp: expect.any(Date),
        })
      )
    })
  })

  describe('sendBatch', () => {
    it('should process batch notifications successfully', async () => {
      const batchNotifications: NotificationDeliveryOptions[] = [
        {
          title: 'Notification 1',
          body: 'Body 1',
          channels: ['email'],
          recipients: ['user1@example.com'],
        },
        {
          title: 'Notification 2',
          body: 'Body 2',
          channels: ['in_app'],
          recipients: ['user2@example.com'],
        },
        {
          title: 'Notification 3',
          body: 'Body 3',
          channels: ['sms'],
          recipients: ['user3@example.com'],
        },
      ]

      const results = await service.sendBatch(batchNotifications)

      expect(results).toHaveLength(3)
      expect(results[0].delivered).toBe(1)
      expect(results[1].delivered).toBe(1)
      expect(results[2].delivered).toBe(1)

      // Should emit 3 notification.sent events
      expect(eventEmitter.emit).toHaveBeenCalledTimes(6) // 3 sent + 3 in-app events
    })

    it('should process large batches in chunks', async () => {
      // Create a large batch (15 notifications)
      const largeBatch: NotificationDeliveryOptions[] = Array.from({ length: 15 }, (_, i) => ({
        title: `Notification ${i + 1}`,
        body: `Body ${i + 1}`,
        channels: ['email'],
        recipients: [`user${i + 1}@example.com`],
      }))

      const results = await service.sendBatch(largeBatch)

      expect(results).toHaveLength(15)

      // All should be processed successfully
      results.forEach((result) => {
        expect(result.delivered).toBe(1)
        expect(result.failed).toBe(0)
      })
    })

    it('should handle partial batch failures', async () => {
      // Mock email to fail for specific conditions
      vi.spyOn(service as unknown as Record<string, unknown>, 'sendEmail').mockImplementation(
        (options) => {
          if (options.title.includes('fail')) {
            throw new Error('Intentional failure')
          }
          return Promise.resolve()
        }
      )

      const batchNotifications: NotificationDeliveryOptions[] = [
        {
          title: 'Success notification',
          body: 'Success body',
          channels: ['email'],
          recipients: ['success@example.com'],
        },
        {
          title: 'Should fail notification',
          body: 'Fail body',
          channels: ['email'],
          recipients: ['fail@example.com'],
        },
      ]

      const results = await service.sendBatch(batchNotifications)

      expect(results[0].delivered).toBe(1)
      expect(results[0].failed).toBe(0)

      expect(results[1].delivered).toBe(0)
      expect(results[1].failed).toBe(1)
    })

    it('should handle empty batch', async () => {
      const results = await service.sendBatch([])
      expect(results).toEqual([])
    })
  })

  describe('getDeliveryStatus', () => {
    it('should return delivery status', async () => {
      const status = await service.getDeliveryStatus('message-123')

      expect(status).toEqual({
        status: 'delivered',
        channel: 'email',
        timestamp: expect.any(Date),
      })
    })

    it('should handle different message IDs', async () => {
      const status1 = await service.getDeliveryStatus('msg-1')
      const status2 = await service.getDeliveryStatus('msg-2')

      expect(status1.status).toBeDefined()
      expect(status2.status).toBeDefined()
      expect(status1.timestamp).toBeInstanceOf(Date)
      expect(status2.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle unknown channel gracefully', async () => {
      const options = {
        ...mockDeliveryOptions,
        channels: ['unknown_channel' as unknown],
      }

      // Should not throw, but channel should be silently skipped
      const result = await service.sendNotification(options)

      expect(result.delivered).toBe(0)
      expect(result.failed).toBe(0)
      expect(result.channels).toEqual([])
    })

    it('should handle network timeout scenarios', async () => {
      // Mock a timeout scenario
      vi.spyOn(service as unknown as Record<string, unknown>, 'sendEmail').mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            setTimeout(() => reject(new Error('Network timeout')), 50)
          })
      )

      const result = await service.sendNotification({
        ...mockDeliveryOptions,
        channels: ['email'],
      })

      expect(result.failed).toBeGreaterThan(0)
      expect(result.errors).toContain('email: Network timeout')
    })

    it('should handle service unavailable scenarios', async () => {
      vi.spyOn(service as unknown as Record<string, unknown>, 'sendSMS').mockRejectedValue(
        new Error('SMS service unavailable')
      )
      vi.spyOn(
        service as unknown as Record<string, unknown>,
        'sendPushNotification'
      ).mockRejectedValue(new Error('Push service unavailable'))

      const options: NotificationDeliveryOptions = {
        ...mockDeliveryOptions,
        channels: ['sms', 'push'],
      }

      const result = await service.sendNotification(options)

      expect(result.failed).toBe(4) // 2 channels * 2 recipients
      expect(result.errors).toContain('sms: SMS service unavailable')
      expect(result.errors).toContain('push: Push service unavailable')
    })

    it('should handle malformed recipient data', async () => {
      const options: NotificationDeliveryOptions = {
        ...mockDeliveryOptions,
        recipients: [null as unknown, undefined as unknown, '', 'valid@example.com'],
      }

      // Should not throw and should handle valid recipients
      const result = await service.sendNotification(options)

      expect(result.delivered).toBeGreaterThan(0) // Should process valid recipients
    })

    it('should handle very large recipient lists', async () => {
      const largeRecipientList = Array.from({ length: 1000 }, (_, i) => `user${i}@example.com`)

      const options: NotificationDeliveryOptions = {
        ...mockDeliveryOptions,
        recipients: largeRecipientList,
        channels: ['email'],
      }

      const result = await service.sendNotification(options)

      expect(result.delivered).toBe(1000)
      expect(result.failed).toBe(0)
    })
  })

  describe('Performance and Concurrency', () => {
    it('should handle concurrent notification sending', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        service.sendNotification({
          ...mockDeliveryOptions,
          title: `Concurrent notification ${i}`,
        })
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(10)
      results.forEach((result) => {
        expect(result.delivered).toBeGreaterThan(0)
      })

      // Should emit 10 sent events + 10 in-app events
      expect(eventEmitter.emit).toHaveBeenCalledTimes(20)
    })

    it('should complete notifications within reasonable time', async () => {
      const startTime = Date.now()

      await service.sendNotification({
        ...mockDeliveryOptions,
        channels: ['email', 'sms', 'push', 'in_app'],
        recipients: Array.from({ length: 50 }, (_, i) => `user${i}@example.com`),
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within 5 seconds (generous for test environment)
      expect(duration).toBeLessThan(5000)
    })

    it('should handle rapid sequential notifications', async () => {
      const notifications = Array.from({ length: 20 }, (_, i) => ({
        ...mockDeliveryOptions,
        title: `Rapid notification ${i}`,
      }))

      const startTime = Date.now()

      for (const notification of notifications) {
        await service.sendNotification(notification)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should handle 20 notifications reasonably fast
      expect(duration).toBeLessThan(10000) // 10 seconds
    })
  })

  describe('Event Emission and Tracking', () => {
    it('should emit correct event data structure', async () => {
      const options = { ...mockDeliveryOptions }
      await service.sendNotification(options)

      expect(eventEmitter.emit).toHaveBeenCalledWith('notification.sent', {
        options,
        result: expect.objectContaining({
          delivered: expect.any(Number),
          failed: expect.any(Number),
          channels: expect.any(Array),
          errors: expect.any(Array),
        }),
        timestamp: expect.any(Date),
      })
    })

    it('should emit in-app specific events', async () => {
      const options: NotificationDeliveryOptions = {
        ...mockDeliveryOptions,
        channels: ['in_app'],
      }

      await service.sendNotification(options)

      expect(eventEmitter.emit).toHaveBeenCalledWith('notification.in-app', {
        recipients: options.recipients,
        title: options.title,
        body: options.body,
        data: options.data,
        priority: options.priority,
        timestamp: expect.any(Date),
      })
    })

    it('should handle event emission failures gracefully', async () => {
      // Mock eventEmitter.emit to throw
      eventEmitter.emit.mockImplementation(() => {
        throw new Error('Event emission failed')
      })

      // Should not throw, notification sending should continue
      await expect(service.sendNotification(mockDeliveryOptions)).resolves.not.toThrow()
    })
  })
})
