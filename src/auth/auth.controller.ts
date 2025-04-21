import { FileInterceptor } from '@nestjs/platform-express';
import { ErrorResponseDto } from 'src/interfaces/error-response-type';
import { ApiBadRequestResponse, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  HttpException,
  InternalServerErrorException,
  Request,
} from '@nestjs/common';
import {
  VerifyMailDto,
  LoginDto,
  RegisterUserDto,
  CreateGoogleUserDto,
  CreateImageDto,
  RegisterUserWithFileDto,
  RegisterResponseDto,
  LoginResponseDto,
  VerifyEmailResponseDto,
  VerifyTokenResponseDto,
} from 'src/auth/dto';

import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { VerifyEmailCodeDto } from './dto/input/verify-email-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create a user or organisation account' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: RegisterUserWithFileDto })
  @ApiBadRequestResponse({
    description: 'Error during registration',
    type: ErrorResponseDto,
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
      return this.authService.register(registerDto, createImageDto);
    }

    return this.authService.register(registerDto);
  }

  @Public()
  @Post('/login')
  @ApiOperation({
    summary: 'Allow the user to login',
  })
  @ApiBadRequestResponse({
    description: 'Error during login',
    type: ErrorResponseDto,
  })
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('verify-mail')
  @ApiOperation({
    summary: 'Allow to verify the email, unprotected route',
  })
  @ApiBadRequestResponse({
    description: 'Error during email verification',
    type: ErrorResponseDto,
  })
  async verifyEmail(@Body() verifyMailDto: VerifyMailDto): Promise<VerifyEmailResponseDto> {
    return this.authService.verifyEmail(verifyMailDto);
  }

  @Get('verify')
  @ApiOperation({
    summary: 'Verify the validity of the token & the user account',
  })
  @ApiBadRequestResponse({
    description: 'Error during token verification',
    type: ErrorResponseDto,
  })
  async verifyToken(@Req() request: Request): Promise<VerifyTokenResponseDto> {
    const id = request['user'].id;

    return this.authService.verifyToken(id);
  }

  @Post('verify-email-code')
  async verifyEmailCode(@Request() req, @Body() verifyEmailCodeDto: VerifyEmailCodeDto) {
    return this.authService.verifyEmailCode(req.user.id, verifyEmailCodeDto.code);
  }

  @Post('resend-verification-code')
  async resendVerificationCode(@Request() req) {
    return this.authService.resendVerificationCode(req.user.id);
  }

  // **************************/
  // ** GOOGLE AUTHENTICATION *
  // **************************/

  @Public() // ? décorateur @Public() pour ignorer le middleware d'authentification
  // @UseGuards(GoogleAuthGuard)
  @Post('google/login')
  @ApiOperation({
    summary: "Permet à l'utilisateur de se connecter avec Google",
  })
  async googleLogin(@Body() googleUser: CreateGoogleUserDto): Promise<any> {
    return this.authService.validateGoogleUser(googleUser);
  }
  @Public() // ? décorateur @Public() pour ignorer le middleware d'authentification
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req, @Res() res): Promise<any> {
    try {
      if (req?.user || req?.user.id) {
        throw new NotFoundException('User not found in request');
      }

      const response = await this.authService.googleLogin(req.user.id);
      // !! changerS l'addresse de redirection pour le front
      return res.redirect(`http://localhost:3000?token=${response.access_token}`);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }
}
