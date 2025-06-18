import { LoginDto } from 'src/auth/presentation/dto/input/login.dto';
import { Public } from 'src/auth/presentation/decorators/public.decorator';
import { LoginResponseDto } from 'src/auth/presentation/dto/output/login-response.dto';
import { ApiBadRequestResponse, ApiConflictResponse, ApiOperation } from '@nestjs/swagger';
import { Controller, Post, Body, BadRequestException, ConflictException } from '@nestjs/common';

import { RegisterResponseDto, RegisterUserDto } from './dto';
import { LoginUseCase } from '../application/commands/login-use-case';
import { RegisterUserCase } from '../application/commands/register-use-case';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUserCase,
  ) {}
  @Public()
  @Post('register')
  // @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create a user account' })
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({ type: RegisterUserWithFileDto })
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
    // @UploadedFile() file: Express.Multer.File,
  ): Promise<RegisterResponseDto> {
    // if (file) {
    // const imageName = Date.now() + file.originalname;
    // const createImageDto: CreateImageDto = {
    //   file: file.buffer,
    //   name: imageName,
    // };
    //   return this.registerUseCase.execute(registerDto);
    // }
    return this.registerUseCase.execute(registerDto);
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
    const accessToken = await this.loginUseCase.execute(
      loginDto.email,
      loginDto.password,
      loginDto?.deviceId,
    );
    return {
      data: {
        accessToken,
      },
    };
  }
  // @Public()
  // @Post('verify-mail')
  // @ApiOperation({
  //   summary: 'Allow to verify the email, unprotected route',
  // })
  // @ApiBadRequestResponse({
  //   description: 'Error during email verification',
  //   type: BadRequestException,
  // })
  // async verifyEmail(@Body() verifyMailDto: VerifyMailDto): Promise<VerifyEmailResponseDto> {
  //   return this.authService.verifyEmail(verifyMailDto);
  // }
  // @Get('verify')
  // @ApiOperation({
  //   summary: 'Verify the validity of the token & the user account',
  // })
  // @ApiBadRequestResponse({
  //   description: 'Error during token verification',
  //   type: BadRequestException,
  // })
  // async verifyToken(@Req() request: Request): Promise<VerifyTokenResponseDto> {
  //   const id = request['user'].id;
  //   return this.authService.verifyToken(id);
  // }
  // @Post('verify-email-code')
  // async verifyEmailCode(@Request() req, @Body() verifyEmailCodeDto: VerifyEmailCodeDto) {
  //   return this.authService.verifyEmailCode(req.user.id, verifyEmailCodeDto.code);
  // }
  // @Post('resend-verification-code')
  // async resendVerificationCode(@Request() req) {
  //   return this.authService.resendVerificationCode(req.user.id);
  // }
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
