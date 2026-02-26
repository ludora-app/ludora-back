import { Controller, Get } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { EmailsService } from './emails.service';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get('test')
  @Public()
  async testEmail() {
    await this.emailsService.testEmail();
  }
}
