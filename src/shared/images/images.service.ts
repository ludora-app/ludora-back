import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AwsService } from 'src/shared/aws/aws.service';

import { S3FoldersName } from '../constants/constants';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';

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

  async getImagesBySessionUid(sessionUid: string) {
    const existingSession = await this.prisma.sessions.findUnique({
      where: { uid: sessionUid },
    });

    if (!existingSession) {
      throw new NotFoundException(`Session with uid ${sessionUid} not found`);
    }

    const images = await this.prisma.sessionImages.findMany({
      orderBy: { createdAt: 'asc' },
      where: { sessionUid: sessionUid },
    });

    if (!images || images.length === 0) {
      return [];
    }
    const folder = 'sessions';
    const response = await Promise.all(
      images.map(async (image) => {
        const url = await this.awsService.getSignedUrl(folder, image.url);
        return { order: image.order, url };
      }),
    );

    return response;
  }

  async getFirstImageBySessionUid(sessionUid: string) {
    const existingSession = await this.prisma.sessions.findUnique({
      where: { uid: sessionUid },
    });

    if (!existingSession) {
      throw new NotFoundException(`Session with uid ${sessionUid} not found`);
    }

    const image = await this.prisma.sessionImages.findFirst({
      where: { order: 1, sessionUid },
    });

    if (!image) {
      return null;
    }

    const folder = 'sessions';
    const response = await this.awsService.getSignedUrl(folder, image.url);

    return response;
  }

  async getProfilePic(userUid: string) {
    const profilePic = await this.prisma.users.findUnique({
      select: { imageUrl: true },
      where: { uid: userUid },
    });

    if (!profilePic) {
      throw new NotFoundException(`User with uid ${userUid} not found`);
    }
    const folder = 'users';
    const response = await this.awsService.getSignedUrl(folder, profilePic.imageUrl);

    return response;
  }

  async create(folder: S3FoldersName, createImageDto: CreateImageDto) {
    const { file, name } = createImageDto;

    try {
      const fileS3 = await this.awsService.upload(folder, name, file);

      if (!fileS3?.message) {
        throw new BadRequestException('Error uploading image');
      }

      // TODO: persister l'image dans la base de données en fonction du folder
      return { data: fileS3.message };
    } catch (error) {
      throw new BadRequestException(`Image upload failed: ${error?.message}` || error);
    }
  }

  async update(image_uid: string, updateImageDto: UpdateImageDto) {
    const existingImage = await this.prisma.sessionImages.findUnique({
      where: { uid: image_uid },
    });

    if (!existingImage) {
      throw new NotFoundException('Image not found');
    }

    const updatedImage = await this.prisma.sessionImages.update({
      data: updateImageDto,
      where: { uid: image_uid },
    });

    return updatedImage;
  }

  async delete(image_uid: string) {
    const existingImage = await this.prisma.sessionImages.findUnique({
      where: { uid: image_uid },
    });

    if (!existingImage) {
      throw new NotFoundException('Image not found');
    }

    await this.prisma.sessionImages.delete({ where: { uid: image_uid } });

    return `image '${image_uid}' deleted`;
  }
}
