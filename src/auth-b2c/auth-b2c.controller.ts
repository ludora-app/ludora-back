import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { SuccessTypeDto } from 'src/interfaces/success-type';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Post,
  Req,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  CreateImageDto,
  LoginB2CDto,
  LoginResponseDto,
  LogoutResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  RegisterB2CWithFileDto,
  RegisterResponseDto,
  VerifyEmailResponseDto,
  VerifyMailDto,
  VerifyTokenResponseDto,
} from 'src/auth-b2c/dto';

import { AuthB2CService } from './auth-b2c.service';
import { Public } from '../shared/decorators/public.decorator';
import { VerifyEmailCodeDto } from './dto/input/verify-email-code.dto';

@Controller('auth-b2c')
export class AuthB2CController {
  constructor(private readonly authService: AuthB2CService) {}

  @Public()
  @Post('register')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create a user account' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: RegisterB2CWithFileDto })
  @ApiBadRequestResponse({
    description: 'Error during registration',
    type: BadRequestException,
  })
  @ApiConflictResponse({
    description: 'User already exists',
    type: ConflictException,
  })
  async register(
    @Body() registerDto: RegisterB2CWithFileDto,
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
        message: 'Partner created successfully',
        status: 201,
      };
    }

    const tokens = await this.authService.register(registerDto);
    return {
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      message: 'Partner created successfully',
      status: 201,
    };
  }

  @Public()
  @Post('/login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @ApiOperation({
    summary: 'Allow the user to login',
  })
  @ApiBadRequestResponse({
    type: BadRequestException,
  })
  async login(@Body() loginDto: LoginB2CDto): Promise<LoginResponseDto> {
    const tokens = await this.authService.login(loginDto);
    return {
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      message: 'Token created successfully',
      status: 200,
    };
  }

  @Public()
  @Post('verify-mail')
  @ApiOperation({
    summary: 'Allow to verify the email, unprotected route',
  })
  @ApiBadRequestResponse({
    description: 'Error during email verification',
    type: BadRequestException,
  })
  async verifyEmail(@Body() verifyMailDto: VerifyMailDto): Promise<VerifyEmailResponseDto> {
    const isAvailable = await this.authService.verifyEmail(verifyMailDto);
    return {
      data: { isAvailable: isAvailable },
      message: `Email is ${isAvailable ? 'available' : 'already used'}`,
    };
  }

  @Get('verify')
  @ApiOperation({
    summary: 'Verify the validity of the token & the user account',
  })
  @ApiBadRequestResponse({
    description: 'Error during token verification',
    type: BadRequestException,
  })
  async verifyToken(@Req() request: Request): Promise<VerifyTokenResponseDto> {
    const uid = request['user'].uid;

    const isValid = await this.authService.verifyToken(uid);
    return { data: { isValid: isValid }, message: 'token is valid' };
  }

  @Post('verify-email-code')
  async verifyEmailCode(
    @Request() req,
    @Body() verifyEmailCodeDto: VerifyEmailCodeDto,
  ): Promise<SuccessTypeDto> {
    await this.authService.verifyEmailCode(req.user.uid, verifyEmailCodeDto.code);

    return {
      message: 'Email vérifié avec succès',
      status: 200,
    };
  }

  @Post('resend-verification-code')
  async resendVerificationCode(@Request() req): Promise<SuccessTypeDto> {
    await this.authService.resendVerificationCode(req.user.uid);

    return {
      message: 'Nouveau code de vérification envoyé',
      status: 200,
    };
  }

  @Public()
  @Post('refresh-token')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 tentatives par minute
  @ApiOperation({
    summary: 'Refresh access token using refresh token',
  })
  @ApiBadRequestResponse({
    description: 'Error during token refresh',
    type: BadRequestException,
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    const tokens = await this.authService.refreshToken(refreshTokenDto);
    return {
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      message: 'Tokens refreshed successfully',
      status: 200,
    };
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout user from current device',
  })
  async logout(@Request() req): Promise<LogoutResponseDto> {
    const { deviceUid, uid } = req.user;
    await this.authService.logout(uid, deviceUid);

    return {
      message: 'Logged out successfully',
      status: 200,
    };
  }

  @Post('logout-all-devices')
  @ApiOperation({
    summary: 'Logout user from all devices',
  })
  async logoutAllDevices(@Request() req): Promise<LogoutResponseDto> {
    const { uid } = req.user;
    await this.authService.logoutAllDevices(uid);

    return {
      message: 'Logged out from all devices successfully',
      status: 200,
    };
  }

  // **************************/
  // ** GOOGLE AUTHENTICATION *
  // **************************/

  // @Public() // ? décorateur @Public() pour ignorer le middleware d'authentification
  // // @UseGuards(GoogleAuthGuard)
  // @Post('google/login')
  // @ApiOperation({
  //   summary: "Permet à l'utilisateur de se connecter avec Google",
  // })
  // async googleLogin(@Body() googleUser: CreateGoogleUserDto): Promise<any> {
  //   return this.authService.validateGoogleUser(googleUser);
  // }
}
