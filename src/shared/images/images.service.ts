import { AwsService } from 'src/shared/aws/aws.service';
import { Injectable } from '@nestjs/common';

// import { CreateImageDto } from './dto/create-image.dto';
// import { UpdateImageDto } from './dto/update-image.dto';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Service responsible for handling image operations
 * @class ImagesService
 */
@Injectable()
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AwsService,
  ) {}
}
