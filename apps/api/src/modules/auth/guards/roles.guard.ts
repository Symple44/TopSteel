import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(_context: ExecutionContext): boolean {
    return true
  }
}
