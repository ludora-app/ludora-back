import { Observable } from 'rxjs';
import { FastifyRequest } from 'fastify';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  BadRequestException,
} from '@nestjs/common';

/**
 * Interceptor to handle multipart/form-data requests and extract files from the request body.
 * @param fieldName - The name of the field to extract files from.
 * @returns The extracted files.
 */
@Injectable()
export class FastifyFilesInterceptor implements NestInterceptor {
  constructor(private readonly fieldName: string) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();

    if (!req.isMultipart()) {
      return next.handle();
    }

    const parts = req.parts();
    const body: Record<string, any> = {};
    const files: any[] = [];
    let count = 0;

    try {
      for await (const part of parts) {
        count++;
        // 1. Name cleanup (e.g.: "images[]" -> "images")
        const cleanFieldName = part.fieldname.replace('[]', '').trim();

        if (part.type === 'file') {
          // Checks if the name matches
          if (cleanFieldName === this.fieldName) {
            const buffer = await part.toBuffer();

            // SOLUTION FOR "UNDEFINED": If there is no name, generate one
            const safeFilename = part.filename || `file-${Date.now()}-${count}.bin`;

            files.push({
              buffer,
              encoding: part.encoding,
              fieldname: part.fieldname,
              mimetype: part.mimetype,
              originalname: safeFilename,
            });
          } else {
            await part.toBuffer(); // We drain the stream
          }
        } else {
          // Field handling (unchanged)
          const value = (part as any).value;
          if (body[cleanFieldName]) {
            if (!Array.isArray(body[cleanFieldName])) {
              body[cleanFieldName] = [body[cleanFieldName]];
            }
            body[cleanFieldName].push(value);
          } else {
            body[cleanFieldName] = value;
          }
        }
      }
    } catch {
      throw new BadRequestException('Failed to process uploaded files.');
    }

    req.body = body;
    (req as any).incomingFiles = files;

    return next.handle();
  }
}
