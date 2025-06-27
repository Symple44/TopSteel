// Types custom pour les middlewares
declare module 'compression' {
  import { RequestHandler } from 'express';
  function compression(options?: any): RequestHandler;
  export = compression;
}