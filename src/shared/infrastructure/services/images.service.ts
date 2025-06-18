import { PrismaService } from 'src/prisma/prisma.service';
import { FileStoragePort } from 'src/shared/domain/repositories/file-storage.port';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { S3FoldersName } from '../../constants/constants';
import { UpdateImageDto } from '../../presentation/dto/images/update-image.dto';
import { CreateImageDto } from '../../presentation/dto/images/create-image.dto';

/**
 * Service responsible for handling image operations
 * @class ImagesService
 */
@Injectable()
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorage: FileStoragePort,
  ) {}

  async getImagesBySessionId(sessionId: string) {
    const existingSession = await this.prisma.sessions.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      throw new NotFoundException(`Session with id ${sessionId} not found`);
    }

    const images = await this.prisma.session_images.findMany({
      orderBy: { createdAt: 'asc' },
      where: { sessionId: sessionId },
    });

    if (!images || images.length === 0) {
      return [];
    }
    const folder = 'sessions';
    const response = await Promise.all(
      images.map(async (image) => {
        const url = await this.fileStorage.getSignedUrl(folder, image.url);
        return { order: image.order, url };
      }),
    );

    return response;
  }

  async getFirstImageBySessionId(sessionId: string) {
    const existingSession = await this.prisma.sessions.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      throw new NotFoundException(`Session with id ${sessionId} not found`);
    }

    const image = await this.prisma.session_images.findFirst({
      where: { order: 1, sessionId },
    });

    if (!image) {
      return null;
    }

    const folder = 'sessions';
    const response = await this.fileStorage.getSignedUrl(folder, image.url);

    return response;
  }

  async getProfilePic(userId: string) {
    const profilePic = await this.prisma.users.findUnique({
      select: { imageUrl: true },
      where: { id: userId },
    });

    if (!profilePic) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    const folder = 'users';
    const response = await this.fileStorage.getSignedUrl(folder, profilePic.imageUrl);

    return response;
  }

  async create(folder: S3FoldersName, createImageDto: CreateImageDto) {
    const { file, name, order } = createImageDto;

    try {
      const fileS3 = await this.fileStorage.upload(folder, name, file);

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
