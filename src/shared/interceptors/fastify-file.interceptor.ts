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
        // 1. Nettoyage du nom (ex: "images[]" -> "images")
        const cleanFieldName = part.fieldname.replace('[]', '').trim();

        if (part.type === 'file') {
          // Vérifie si le nom correspond
          if (cleanFieldName === this.fieldName) {
            // LOG CRITIQUE : Vérifier si filename existe

            const buffer = await part.toBuffer();

            // SOLUTION AU "UNDEFINED": Si pas de nom, on en invente un
            const safeFilename = part.filename || `file-${Date.now()}-${count}.bin`;

            files.push({
              buffer,
              encoding: part.encoding,
              fieldname: part.fieldname,
              mimetype: part.mimetype,
              originalname: safeFilename, // <-- ICI, on force une valeur
            });
          } else {
            await part.toBuffer(); // On vide le flux
          }
        } else {
          // Gestion des champs (inchangée)
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
