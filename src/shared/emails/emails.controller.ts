import { Controller, Get } from '@nestjs/common';

import { EmailsService } from './emails.service';
import { Public } from '../decorators/public.decorator';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get('test')
  @Public()
  async testEmail() {
    await this.emailsService.testEmail();
  }
}
