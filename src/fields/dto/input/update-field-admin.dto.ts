import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { VerificationStatus } from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';
import { CreateImageDto } from 'src/shared/images/dto/input/create-image.dto';

export class UpdateFieldImageDto extends CreateImageDto {
  @ApiPropertyOptional({
    description: 'The UID of the image if it is already saved (omit for new images)',
    example: 'img_abc123',
    type: String,
  })
  @IsString()
  @IsOptional()
  readonly uid?: string;

  @ApiPropertyOptional({
    description: 'Verification status of the image',
    enum: VerificationStatus,
  })
  @IsEnum(VerificationStatus)
  @IsOptional()
  readonly status?: VerificationStatus;
}

export class UpdateFieldAdminDto {
  @ApiPropertyOptional({
    description: 'Name of the field',
    example: 'Field 1',
    type: String,
  })
  @IsString()
  @IsOptional()
  readonly name?: string;

  @ApiProperty({
    description: 'Address of the field',
    example: '123 Main St, Anytown, USA',
    type: String,
  })
  @IsString()
  readonly address: string;

  @IsOptional()
  @ApiPropertyOptional({
    description:
      'Images of the field (runtime type, populated by the controller from multipart uploads).',
    type: () => [UpdateFieldImageDto],
  })
  readonly images?: UpdateFieldImageDto[];

  // ? @Transform is used because of the multipart/form-data type messing with the array
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return [value];
      }
    }
    return value ? [value] : value;
  })
  @IsArray()
  @ApiProperty({
    description: 'Sports available on the field',
    example: [Sport.FOOTBALL, Sport.TENNIS, Sport.BASKETBALL],
    enum: Sport,
    isArray: true,
    type: 'array',
  })
  readonly sports: Sport[];

  @IsOptional()
  @ApiPropertyOptional({
    description:
      'JSON string array of image metadata objects (uid, name, order, status). Used to pass per-image metadata alongside binary file uploads.',
    example: '[{"uid":"img_abc","name":"photo.jpg","order":0,"status":"APPROVED"}]',
    type: String,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly imagesMetadata?: any;

  @ApiPropertyOptional({
    description: 'Verification status of the field',
    enum: VerificationStatus,
  })
  @IsEnum(VerificationStatus)
  @IsOptional()
  readonly status?: VerificationStatus;
}

/**
 * DTO utilisé uniquement pour la doc Swagger (multipart/form-data) sur le PUT admin.
 * Ajoute "images" comme tableau de fichiers binaires pour qu'Orval (et les clients)
 * génèrent un FormData avec formData.append('images', file) et non JSON.stringify.
 */
export class UpdateFieldAdminFormDto extends OmitType(UpdateFieldAdminDto, ['images']) {
  @ApiPropertyOptional({
    description: 'Images du terrain (fichiers). Envoyer chaque fichier avec le champ "images".',
    items: {
      format: 'binary',
      type: 'string',
    },
    type: 'array',
  })
  images?: unknown;
}
