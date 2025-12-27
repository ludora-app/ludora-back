import { Public } from 'src/shared/decorators/public.decorator';
import { ConflictResponseDto } from 'src/shared/dto/errors/conflict-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { UploadedFilesCustom } from 'src/shared/decorators/uploaded-files.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { FastifyFilesInterceptor } from 'src/shared/interceptors/fastify-file.interceptor';
import { CreateImageDto, LoginDto, LoginResponseDto, RegisterResponseDto } from 'src/auth/dto';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { AuthB2BGuard } from '../guards/auth-b2b.guard';
import { AuthB2BService } from '../services/auth-b2b.service';
import { RegisterB2BWithFileDto } from '../dto/input/register-b2b.dto';

@Controller('auth-b2b')
@UseGuards(AuthB2BGuard)
export class AuthB2BController {
  constructor(private readonly authService: AuthB2BService) {}

  @Post('register')
  @Public()
  @UseInterceptors(new FastifyFilesInterceptor('file'))
  @ApiOperation({ summary: 'Create a partner and user account' })
  @ApiCreatedResponse({
    description: 'Partner and user created successfully',
    type: RegisterResponseDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: RegisterB2BWithFileDto })
  @ApiBadRequestResponse({
    description: 'Error during registration',
    type: BadRequestResponseDto,
  })
  @ApiConflictResponse({
    description: 'Partner or user already exists',
    type: ConflictResponseDto,
  })
  @ApiOkResponse({
    description: 'Partner and user created successfully',
    type: RegisterResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterB2BWithFileDto,
    @UploadedFilesCustom() files?: { buffer: Buffer; originalname: string }[],
  ): Promise<RegisterResponseDto> {
    if (files && files.length > 0) {
      const createImageDto: CreateImageDto = {
        file: files[0].buffer,
        name: files[0].originalname,
      };
      const res = await this.authService.register(registerDto, createImageDto);
      return {
        data: { accessToken: res.accessToken, refreshToken: res.refreshToken },
        message: 'Partner and user created successfully',
      };
    }

    const res = await this.authService.register(registerDto);
    return {
      data: { accessToken: res.accessToken, refreshToken: res.refreshToken },
      message: 'Partner and user created successfully',
    };
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login a partner and user account' })
  @ApiBadRequestResponse({
    description: 'Error during login',
    type: BadRequestResponseDto,
  })
  @ApiOkResponse({
    description: 'Partner and user logged in successfully',
    type: LoginResponseDto,
  })
  @ApiBody({ type: LoginDto })
  @HttpCode(HttpStatus.OK)
  @ApiNotFoundResponse({
    description: 'User or partner not found',
    type: NotFoundResponseDto,
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const tokens = await this.authService.login(loginDto);
    return {
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      message: 'PARTNER user logged in successfully',
    };
  }
}
