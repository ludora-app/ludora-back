import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/shared/decorators/public.decorator';
import { ConflictResponseDto } from 'src/shared/dto/errors/conflict-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { CreateImageDto, LoginDto, LoginResponseDto, RegisterResponseDto } from 'src/auth-b2c/dto';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { AuthB2BService } from './auth-b2b.service';
import { AuthB2BGuard } from './guards/auth-b2b.guard';
import { RegisterB2BWithFileDto } from './dto/input/register-b2b.dto';

@Controller('auth-b2b')
@UseGuards(AuthB2BGuard)
@ApiBearerAuth('JWT-auth')
export class AuthB2BController {
  constructor(private readonly authService: AuthB2BService) {}

  @Post('register')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
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
      };
    }

    const tokens = await this.authService.register(registerDto);
    return {
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
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
