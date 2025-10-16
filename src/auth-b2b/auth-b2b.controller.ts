import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/shared/decorators/public.decorator';
import { CreateImageDto, RegisterResponseDto } from 'src/auth-b2c/dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { AuthB2BService } from './auth-b2b.service';
import { RegisterB2BWithFileDto } from './dto/input/register-b2b.dto';

@Controller('auth-b2b')
export class AuthB2BController {
  constructor(private readonly authService: AuthB2BService) {}

  @Post('register')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create a partner and user account' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: RegisterB2BWithFileDto })
  @ApiBadRequestResponse({
    description: 'Error during registration',
    type: BadRequestException,
  })
  @ApiConflictResponse({
    description: 'Partner or user already exists',
    type: ConflictException,
  })
  @ApiOkResponse({
    description: 'Partner and user created successfully',
    type: RegisterResponseDto,
  })
  async register(
    @Body() registerDto: RegisterB2BWithFileDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<RegisterResponseDto> {
    if (file) {
      const imageName = Date.now() + file.originalname;

      const createImageDto: CreateImageDto = {
        file: file.buffer,
        name: imageName,
      };
      const tokens = await this.authService.register(registerDto, createImageDto);
      return {
        data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
        message: 'Partner and user created successfully',
        status: 201,
      };
    }

    const tokens = await this.authService.register(registerDto);
    return {
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      message: 'Partner and user created successfully',
      status: 201,
    };
  }
}
