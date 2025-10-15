import { PartialType } from '@nestjs/swagger';

import { CreateAuthB2bDto } from './create-auth-b2b.dto';

export class UpdateAuthB2bDto extends PartialType(CreateAuthB2bDto) {}
