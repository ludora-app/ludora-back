import { ApiProperty, OmitType } from '@nestjs/swagger';

import { CreatePublicFieldDto } from './create-public-field.dto';

/**
 * DTO utilisé uniquement pour la doc Swagger (multipart/form-data).
 * Décrit "images" comme tableau de fichiers binaires pour que les clients (Orval, etc.)
 * génèrent un FormData avec formData.append('images', file) et non JSON.stringify.
 */
export class CreatePublicFieldFormDto extends OmitType(CreatePublicFieldDto, ['images']) {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Images du terrain (fichiers). Envoyer chaque fichier avec le champ "images".',
    required: false,
  })
  images?: unknown;
}
