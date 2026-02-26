import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * This guard is used to protect endpoints that are only available in development mode.
 * It throws a ForbiddenException if the NODE_ENV is not development.
 * @returns true if the NODE_ENV is development, false otherwise.
 */
@Injectable()
export class DevOnlyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(_context: ExecutionContext): boolean {
    const nodeEnv = this.configService.get('NODE_ENV');

    if (nodeEnv === 'production') {
      throw new ForbiddenException('This endpoint is only available in development mode');
    }

    return true;
  }
}
