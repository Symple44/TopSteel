import 'reflect-metadata'
import { config } from 'dotenv'
import { afterAll, beforeAll, vi } from 'vitest'

config({ path: '.env.test' })

beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  vi.restoreAllMocks()
})

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key-for-topsteel'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/topsteel_test'
