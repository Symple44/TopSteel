// Types custom pour les middlewares
declare module 'compression' {
  import type { RequestHandler } from 'express'
  function compression(options?: unknown): RequestHandler
  export = compression
}
