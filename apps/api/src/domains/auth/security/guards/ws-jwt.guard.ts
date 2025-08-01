import { type CanActivate, ExecutionContext, Injectable } from '@nestjs/common'

@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true
  }
}
