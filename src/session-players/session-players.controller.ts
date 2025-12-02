import { Controller, UseGuards } from '@nestjs/common';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';

@Controller('session-players')
@UseGuards(AuthB2CGuard)
export class SessionPlayersController {}
