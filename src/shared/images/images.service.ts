import { AwsService } from 'src/shared/aws/aws.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { S3FoldersName } from '../constants/constants';
import { UpdateImageDto } from './dto/update-image.dto';
import { CreateImageDto } from './dto/create-image.dto';

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

  async getImagesBySessionId(session_id: string) {
    const existingSession = await this.prisma.sessions.findUnique({
      where: { id: session_id },
    });

    if (!existingSession) {
      throw new NotFoundException(`Session with id ${session_id} not found`);
    }

    const images = await this.prisma.session_images.findMany({
      orderBy: { created_at: 'asc' },
      where: { session_id: session_id },
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

  async getFirstImageBySessionId(session_id: string) {
    const existingSession = await this.prisma.sessions.findUnique({
      where: { id: session_id },
    });

    if (!existingSession) {
      throw new NotFoundException(`Session with id ${session_id} not found`);
    }

    const image = await this.prisma.session_images.findFirst({
      where: { order: 1, session_id },
    });

    if (!image) {
      return null;
    }

    const folder = 'sessions';
    const response = await this.awsService.getSignedUrl(folder, image.url);

    return response;
  }

  async getProfilePic(user_id: string) {
    const profilePic = await this.prisma.users.findUnique({
      select: { image_url: true },
      where: { id: user_id },
    });

    if (!profilePic) {
      throw new NotFoundException(`User with id ${user_id} not found`);
    }
    const folder = 'users';
    const response = await this.awsService.getSignedUrl(folder, profilePic.image_url);

    return response;
  }

  async create(folder: S3FoldersName, createImageDto: CreateImageDto) {
    const { file, name, order } = createImageDto;

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

  async update(image_id: string, updateImageDto: UpdateImageDto) {
    const existingImage = await this.prisma.session_images.findUnique({
      where: { id: image_id },
    });

    if (!existingImage) {
      throw new NotFoundException('Image not found');
    }

    const updatedImage = await this.prisma.session_images.update({
      data: updateImageDto,
      where: { id: image_id },
    });

    return updatedImage;
  }

  async delete(image_id: string) {
    const existingImage = await this.prisma.session_images.findUnique({
      where: { id: image_id },
    });

    if (!existingImage) {
      throw new NotFoundException('Image not found');
    }

    await this.prisma.session_images.delete({ where: { id: image_id } });

    return `image '${image_id}' deleted`;
  }
}
