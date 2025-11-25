import { PartialType } from '@nestjs/swagger';

import { CreatePublicFieldDto } from './create-public-field.dto';

export class UpdateFieldDto extends PartialType(CreatePublicFieldDto) {}
