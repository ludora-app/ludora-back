import { Controller } from '@nestjs/common';

import { AuthB2BService } from './auth-b2b.service';

@Controller('auth-b2b')
export class AuthB2BController {
  constructor(private readonly authService: AuthB2BService) {}
}
