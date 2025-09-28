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
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import {
  CreateImageDto,
  LoginDto,
  LoginResponseDto,
  RegisterResponseDto,
  RegisterUserDto,
  RegisterUserWithFileDto,
  VerifyEmailResponseDto,
  VerifyMailDto,
  VerifyTokenResponseDto,
} from 'src/auth/dto';
import { SuccessTypeDto } from 'src/interfaces/success-type';

import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { VerifyEmailCodeDto } from './dto/input/verify-email-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create a user account' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: RegisterUserWithFileDto })
  @ApiBadRequestResponse({
    description: 'Error during registration',
    type: BadRequestException,
  })
  @ApiConflictResponse({
    description: 'User already exists',
    type: ConflictException,
  })
  async register(
    @Body() registerDto: RegisterUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<RegisterResponseDto> {
    if (file) {
      const imageName = Date.now() + file.originalname;

      const createImageDto: CreateImageDto = {
        file: file.buffer,
        name: imageName,
      };
      const accessToken = await this.authService.register(registerDto, createImageDto);
      return {
        data: { accessToken },
        message: 'User created successfully',
        status: 201,
      };
    }

    const accessToken = await this.authService.register(registerDto);
    return {
      data: { accessToken },
      message: 'User created successfully',
      status: 201,
    };
  }

  @Public()
  @Post('/login')
  @ApiOperation({
    summary: 'Allow the user to login',
  })
  @ApiBadRequestResponse({
    type: BadRequestException,
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const accessToken = await this.authService.login(loginDto);
    return { data: { accessToken }, message: 'Token created successfully', status: 200 };
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
