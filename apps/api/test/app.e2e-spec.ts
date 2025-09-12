/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'

describe('AppController (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('/ (GET) - should return 404 for non-existent route', () => {
    // Basic connectivity test - expecting 404 as no routes are defined
    return request(app.getHttpServer())
      .get('/')
      .expect(404)
  })
})