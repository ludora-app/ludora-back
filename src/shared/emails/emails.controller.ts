import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAG_EMAILS } from 'src/swagger.config';
import { Public } from '../decorators/public.decorator';
import { EmailsService } from './emails.service';

@ApiExcludeController()
@ApiTags(SWAGGER_TAG_EMAILS)
@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get('test')
  @Public()
  async testEmail() {
    await this.emailsService.testEmail();
  }
}
