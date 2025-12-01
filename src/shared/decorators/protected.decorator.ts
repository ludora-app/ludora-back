import { ApiBearerAuth } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

/**
 * Decorator to mark a route as protected
 * - Explicitly applies authentication
 * - Shows the lock in Swagger documentation
 */
export const Protected = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'), // Shows lock in Swagger
  );
