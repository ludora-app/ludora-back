import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageFolderName } from 'src/shared/constants/constants';
import { StorageService } from 'src/shared/storage/storage.service';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';

import { UpdateFieldDto } from './dto/input/update-field.dto';
import { FieldWithImagesDto } from './dto/output/field-with-images.dto';
import { CreatePublicFieldDto } from './dto/input/create-public-field.dto';

@Injectable()
export class FieldsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly geolocalisationService: GeolocalisationService,
  ) {}

  async create(
    createPublicFieldDto: CreatePublicFieldDto,
    tx?: Prisma.TransactionClient,
  ): Promise<FieldWithImagesDto> {
    const prisma = tx ?? this.prisma;
    const { address, images, sport } = createPublicFieldDto;

    const coordinates = await this.geolocalisationService.getLatitudeAndLongitude(address);

    const newField = await prisma.fields.create({
      data: {
        address,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        sport,
      },
    });

    const fieldImages = await Promise.all(
      images.map(async (image, index) => {
        const uploadResult = await this.storageService.upload(
          StorageFolderName.FIELDS,
          image.name,
          image.file,
        );
        const url = uploadResult.data;
        await prisma.fieldImages.create({
          data: {
            fieldUid: newField.uid,
            order: index,
            url,
          },
        });
        return { url };
      }),
    );
    return { ...newField, fieldImages };
  }

  findAll() {
    return `This action returns all fields`;
  }

  findOne(id: number) {
    return `This action returns a #${id} field`;
  }

  update(id: number, _updateFieldDto: UpdateFieldDto) {
    return `This action updates a #${id} field`;
  }

  remove(id: number) {
    return `This action removes a #${id} field`;
  }
}
