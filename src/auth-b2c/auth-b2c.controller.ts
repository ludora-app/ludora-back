import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { SuccessTypeDto } from 'src/shared/dto/responses/success-type';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Request,
  UploadedFile,
  UseGuards,
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
import { AuthB2CGuard } from './guards/auth-b2c.guard';
import { Public } from '../shared/decorators/public.decorator';
import { VerifyEmailCodeDto } from './dto/input/verify-email-code.dto';

@Controller('auth-b2c')
@UseGuards(AuthB2CGuard)
export class AuthB2CController {
  constructor(private readonly authService: AuthB2CService) {}

  @Public()
  @Post('register')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create a user account' })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: RegisterResponseDto,
  })
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
  @HttpCode(HttpStatus.CREATED)
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
        message: 'User created successfully',
      };
    }

    const tokens = await this.authService.register(registerDto);
    return {
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      message: 'User created successfully',
    };
  }

  @Public()
  @Post('/login')
  @Throttle({
    default: {
      limit: process.env.NODE_ENV === 'production' ? 5 : 1000,
      ttl: 60000,
    },
  })
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
  @ApiOkResponse({
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
  })
  @HttpCode(HttpStatus.OK)
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
  @ApiOkResponse({
    description: 'Token is valid',
    type: VerifyTokenResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Req() request: Request): Promise<VerifyTokenResponseDto> {
    const uid = request['user'].uid;

    const isValid = await this.authService.verifyToken(uid);
    return { data: { isValid: isValid }, message: 'token is valid' };
  }

  @Post('verify-email-code')
  @ApiOperation({
    summary: 'Verify the email code',
  })
  @ApiBadRequestResponse({
    description: 'Error during email code verification',
    type: BadRequestException,
  })
  @ApiOkResponse({
    description: 'Email code verified successfully',
    type: VerifyEmailResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async verifyEmailCode(
    @Request() req,
    @Body() verifyEmailCodeDto: VerifyEmailCodeDto,
  ): Promise<SuccessTypeDto> {
    await this.authService.verifyEmailCode(req.user.uid, verifyEmailCodeDto.code);

    return {
      message: 'Email verified successfully',
    };
  }

  @Post('resend-verification-code')
  @ApiOperation({
    summary: 'Resend the verification code',
  })
  @ApiBadRequestResponse({
    description: 'Error during verification code resend',
    type: BadRequestException,
  })
  @ApiOkResponse({
    description: 'Verification code resent successfully',
    type: SuccessTypeDto,
  })
  @HttpCode(HttpStatus.OK)
  async resendVerificationCode(@Request() req): Promise<SuccessTypeDto> {
    await this.authService.resendVerificationCode(req.user.uid);

    return {
      message: 'Verification code resent successfully',
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
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    const tokens = await this.authService.refreshToken(refreshTokenDto);
    return {
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      message: 'Tokens refreshed successfully',
    };
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout user from current device',
  })
  @ApiOkResponse({
    description: 'Logged out successfully',
    type: LogoutResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req): Promise<LogoutResponseDto> {
    const { deviceUid, uid } = req.user;
    await this.authService.logout(uid, deviceUid);

    return {
      message: 'Logged out successfully',
    };
  }

  @Post('logout-all-devices')
  @ApiOperation({
    summary: 'Logout user from all devices',
  })
  @ApiOkResponse({
    description: 'Logged out from all devices successfully',
    type: LogoutResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async logoutAllDevices(@Request() req): Promise<LogoutResponseDto> {
    const { uid } = req.user;
    await this.authService.logoutAllDevices(uid);

    return {
      message: 'Logged out from all devices successfully',
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
