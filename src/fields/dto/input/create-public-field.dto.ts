import { OmitType } from '@nestjs/swagger';

import { CreatePrivateFieldDto } from './create-private-field.dto';

export class CreatePublicFieldDto extends OmitType(CreatePrivateFieldDto, ['partnerUid']) {}
