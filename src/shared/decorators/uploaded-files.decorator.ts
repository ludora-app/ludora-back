import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

/**
 * Parameter decorator to retrieve an ARRAY of uploaded files from the request.
 * * Designed to work in tandem with `FastifyFileInterceptor`.
 * It extracts the file object that was buffered and attached to the request context.
 * * @returns {object} The file object containing the buffer, originalname, mimetype, etc.
 * * @example
 * upload(@UploadedFiles() files: { buffer: Buffer, originalname: string }[])
 */
export const UploadedFilesCustom = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<FastifyRequest>();
  // C'est ici qu'on récupère ce que ton Interceptor a sauvegardé
  return (req as any).incomingFiles;
});
