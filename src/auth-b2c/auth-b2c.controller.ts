import { Throttle } from '@nestjs/throttler';
import { Provider } from 'generated/prisma/enums';
import { FileInterceptor } from '@nestjs/platform-express';
import { SuccessTypeDto } from 'src/shared/dto/responses/success-type';
import { ConflictResponseDto } from 'src/shared/dto/errors/conflict-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Req,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  CreateImageDto,
  LoginDto,
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
import { Protected } from '../shared/decorators/protected.decorator';
import { VerifyEmailCodeDto } from './dto/input/verify-email-code.dto';
import { CreateGoogleUserDto } from './dto/input/create-google-user.dto';
import { CreateOrConnectGoogleResponseDto } from './dto/output/create-or-connect-google.response';

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
    type: BadRequestResponseDto,
  })
  @ApiConflictResponse({
    description: 'User already exists',
    type: ConflictResponseDto,
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
  @Post('/google-login')
  @ApiOperation({
    summary: 'Creates or connects a user with a Google account',
  })
  @ApiCreatedResponse({
    description: 'User created or connected successfully',
    type: CreateOrConnectGoogleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Error during Google user creation or connection',
    type: BadRequestResponseDto,
  })
  @ApiBody({ type: CreateGoogleUserDto })
  async createOrConnectGoogleUser(
    @Body() createGoogleUserDto: CreateGoogleUserDto,
  ): Promise<CreateOrConnectGoogleResponseDto> {
    const provider = Provider.GOOGLE;
    createGoogleUserDto.provider = provider;
    const data = await this.authService.createOrConnectGoogleUser(createGoogleUserDto);
    return {
      data: { accessToken: data.accessToken, refreshToken: data.refreshToken },
      message: data.message,
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
    type: BadRequestResponseDto,
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
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
    type: BadRequestResponseDto,
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

  @Protected()
  @Get('verify')
  @ApiOperation({
    summary: 'Verify the validity of the token & the user account',
  })
  @ApiBadRequestResponse({
    description: 'Error during token verification',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
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

  @Protected()
  @Post('verify-email-code')
  @ApiOperation({
    summary: 'Verify the email code',
  })
  @ApiBadRequestResponse({
    description: 'Error during email code verification',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired code',
    type: UnauthorizedResponseDto,
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

  @Protected()
  @Post('resend-verification-code')
  @ApiOperation({
    summary: 'Resend the verification code',
  })
  @ApiBadRequestResponse({
    description: 'Error during verification code resend',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
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
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  @ApiOperation({
    summary: 'Refresh access token using refresh token',
  })
  @ApiBadRequestResponse({
    description: 'Error during token refresh',
    type: BadRequestResponseDto,
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

  @Protected()
  @Post('logout')
  @ApiOperation({
    summary: 'Logout user from current device',
  })
  @ApiOkResponse({
    description: 'Logged out successfully',
    type: LogoutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req): Promise<LogoutResponseDto> {
    const { deviceUid, uid } = req.user;
    await this.authService.logout(uid, deviceUid);

    return {
      message: 'Logged out successfully',
    };
  }

  @Protected()
  @Post('logout-all-devices')
  @ApiOperation({
    summary: 'Logout user from all devices',
  })
  @ApiOkResponse({
    description: 'Logged out from all devices successfully',
    type: LogoutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
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

  @Public() // ? décorateur @Public() pour ignorer le middleware d'authentification
  @Get('google/callback')
  async googleCallback(@Req() req, @Res() res): Promise<any> {
    try {
      if (req?.user || req?.user.id) {
        throw new NotFoundException('User not found in request');
      }

      const response = await this.authService.googleLogin(req.user.id);
      // !! changer l'addresse de redirection pour le front
      return res.redirect(`http://localhost:3000?token=${response.accessToken}`);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  @Public()
  @Post('generate-access-token-from-code')
  @ApiOperation({
    summary: 'Generate an access token from a verification code',
  })
  @ApiBadRequestResponse({
    description: 'Error during access token generation',
    type: BadRequestResponseDto,
  })
  @ApiOkResponse({
    description: 'Access token generated successfully',
    schema: {
      properties: {
        accessToken: { type: 'string' },
      },
      type: 'object',
    },
  })
  @HttpCode(HttpStatus.OK)
  async generateAccessTokenFromCode(
    @Body() generateAccessTokenFromCodeDto: { code: string },
  ): Promise<{ accessToken: string }> {
    const accessToken = await this.authService.generateAccessTokenFromCode(
      generateAccessTokenFromCodeDto.code,
    );
    return { accessToken: accessToken };
  }
}
