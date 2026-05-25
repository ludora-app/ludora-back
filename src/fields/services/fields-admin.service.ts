import { Injectable, NotFoundException } from '@nestjs/common';
import { FieldType, Prisma, VerificationStatus } from 'generated/prisma/browser';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { Sport, StorageFolderName } from 'src/shared/constants/constants';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { GeoDetails } from 'src/shared/geolocalisation/dto/output/geolocalisation-details.response.dto';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';
import { SportsMapper } from 'src/shared/mappers/sports.mapper';
import { StorageService } from 'src/shared/storage/storage.service';
import { AdminFieldFiltersDto } from '../dto/input/admin-field-filters.dto';
import { CreatePublicFieldDto } from '../dto/input/create-public-field.dto';
import { UpdateFieldAdminDto, UpdateFieldImageDto } from '../dto/input/update-field-admin.dto';
import { AdminFieldCollectionResponseData } from '../dto/output/admin-field-collection-response.dto';
import { AdminFindOneFieldResponseData } from '../dto/output/admin-find-one-field-response.dto';
import { FieldMapper } from '../mappers/field.mapper';

@Injectable()
export class FieldsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly geolocalisationService: GeolocalisationService,
    readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FieldsAdminService.name);
  }

  /**
   * @description Get a field by uid without verification status filter
   * @param uid
   * @returns
   */
  async findOneForAdmin(uid: string): Promise<AdminFindOneFieldResponseData | null> {
    const field = await this.prisma.fields.findUnique({
      include: {
        fieldImages: {
          select: {
            order: true,
            status: true,
            uid: true,
            url: true,
          },
        },
        fieldSports: {
          select: {
            sport: true,
          },
        },
        partner: {
          select: {
            rank: true,
            uid: true,
          },
        },
        creator: {
          select: {
            firstname: true,
            uid: true,
            lastname: true,
            isEmailVerified: true,
            imageUrl: true,
          },
        },
      },
      where: { uid },
    });

    if (!field) return null;
    return FieldMapper.toFindOneForAdminDto(field);
  }

  async findAllFieldsAdmin(
    filters: AdminFieldFiltersDto,
  ): Promise<PaginatedDataDto<AdminFieldCollectionResponseData>> {
    const { cursor, limit = 10, search, sports, status } = filters;

    const query: {
      take: number;
      skip?: number;
      cursor?: {
        uid: string;
      };
      where: Prisma.FieldsWhereInput;
    } = {
      take: limit + 1,
      where: {},
    };

    if (cursor) {
      query.cursor = { uid: cursor };
      query.skip = 1;
    }
    if (search) {
      query.where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (sports?.length) {
      query.where.fieldSports = { some: { sport: { in: sports } } };
    }

    if (status) {
      query.where.status = status;
    }

    const fields = await this.prisma.fields.findMany({
      ...query,
      include: {
        fieldImages: { orderBy: { order: 'asc' }, select: { order: true, url: true }, take: 1 },
        fieldSports: { select: { sport: true } },
      },
    });

    const actualLimit = limit || 10;
    let nextCursor: string | null = null;
    if (fields.length > actualLimit) {
      const nextItem = fields.pop();
      nextCursor = nextItem?.uid;
    }
    const items = fields.map((field) => FieldMapper.toAdminFieldDto(field));

    return { items, nextCursor, totalCount: fields.length };
  }

  /**
   * @description Method used to update all the field informations
   */
  async update(uid: string, dto: UpdateFieldAdminDto): Promise<AdminFindOneFieldResponseData> {
    const { images, sports } = dto;
    const existingField = await this.prisma.fields.findUnique({
      where: { uid },
      include: {
        fieldImages: {
          orderBy: { order: 'asc' },
          select: { order: true, url: true, uid: true, status: true },
        },
        fieldSports: { select: { sport: true } },
      },
    });
    if (!existingField) {
      throw new NotFoundException('Field not found');
    }

    // ? UPDATE SPORTS
    const currentSports = SportsMapper.toEnum(existingField.fieldSports);
    await this.checkAndUpdateSports(sports, currentSports, existingField.uid);

    // ? UPDATE LOCALISATION
    let geo: GeoDetails;
    if (dto.address !== existingField.address) {
      geo = await this.geolocalisationService.getDetailsFromAddress(dto.address);
    }

    // ? UPDATE IMAGES
    if (images) {
      await this.checkAndUpdateImages(images, existingField.fieldImages, existingField.uid);
    }

    const updatedField = await this.prisma.fields.update({
      where: { uid: existingField.uid },
      data: {
        address: dto.address ?? existingField.address,
        city: geo?.city ?? existingField.city,
        country: geo?.country ?? existingField.country,
        department: geo?.department ?? existingField.department,
        latitude: geo?.latitude ?? existingField.latitude,
        longitude: geo?.longitude ?? existingField.longitude,
        zipCode: geo?.zipCode ?? existingField.zipCode,
        name: dto.name ?? existingField.name,
        status: dto.status,
      },
      include: {
        fieldImages: {
          select: { order: true, url: true, uid: true, status: true },
        },
        fieldSports: { select: { sport: true } },
        partner: { select: { rank: true, uid: true } },
        creator: {
          select: {
            firstname: true,
            uid: true,
            lastname: true,
            isEmailVerified: true,
            imageUrl: true,
          },
        },
      },
    });

    return FieldMapper.toFindOneForAdminDto(updatedField);
  }

  async create(dto: CreatePublicFieldDto): Promise<string> {
    const { address, images = [], lat, lng, name, shortAddress, sports } = dto;

    let finalLat = lat;
    let finalLng = lng;
    let finalShortAddress = shortAddress;

    const geo = await this.geolocalisationService.getDetailsFromAddress(address);

    if (!finalLat || !finalLng || !finalShortAddress) {
      finalLat = finalLat ?? geo.latitude;
      finalLng = finalLng ?? geo.longitude;
      finalShortAddress = finalShortAddress ?? geo.shortAddress;
    }

    const newField = await this.prisma.$transaction(async (tx) => {
      const newField = await tx.fields.create({
        data: {
          address,
          city: geo.city,
          country: geo.country,
          department: geo.department,
          latitude: finalLat,
          longitude: finalLng,
          name: name,
          shortAddress: finalShortAddress,
          status: VerificationStatus.APPROVED,
          type: FieldType.PUBLIC,
          zipCode: geo.zipCode,
        },
      });

      await Promise.all(
        sports.map(async (sport) => {
          await tx.fieldSports.create({
            data: { fieldUid: newField.uid, sport },
          });
        }),
      );

      await Promise.all(
        images.map(async (image, index) => {
          const uploadResult = await this.storage.upload(
            StorageFolderName.FIELDS,
            image.name,
            image.file,
          );

          const fieldImage = await tx.fieldImages.create({
            data: {
              fieldUid: newField.uid,
              order: index,
              url: uploadResult.data,
              status: VerificationStatus.APPROVED,
            },
          });

          return { order: index, uid: fieldImage.uid, url: fieldImage.url };
        }),
      );
      return newField;
    });
    return newField.uid;
  }

  /**
   * @description Method used to check and update the sports of a field
   */
  private async checkAndUpdateSports(
    newSports: Sport[],
    currentSports: Sport[],
    fieldUid: string,
  ): Promise<void> {
    const sportsToDelete = currentSports.filter((sport) => !newSports.includes(sport));
    const sportsToAdd = newSports.filter((sport) => !currentSports.includes(sport));

    if (sportsToDelete.length) {
      await this.prisma.fieldSports.deleteMany({
        where: {
          fieldUid,
          sport: { in: sportsToDelete },
        },
      });
      this.logger.debug(`Deleted ${sportsToDelete.length} sports for field ${fieldUid}`);
      this.logger.debug(`Deleted sports: ${sportsToDelete.join(', ')}`);
    }

    if (sportsToAdd.length) {
      await this.prisma.fieldSports.createMany({
        data: sportsToAdd.map((sport) => ({
          fieldUid,
          sport,
        })),
      });
      this.logger.debug(`Added ${sportsToAdd.length} sports for field ${fieldUid}`);
      this.logger.debug(`Added sports: ${sportsToAdd.join(', ')}`);
    }
  }

  /**
   * @description Method used to check and update the images of a field
   * @param newImages images received from the DTO
   * @param currentImages images existing on the field
   * @param fieldUid field uid
   * @param files files to upload
   */
  private async checkAndUpdateImages(
    newImages: UpdateFieldImageDto[],
    currentImages: { uid: string; url: string; order: number; status: string }[],
    fieldUid: string,
  ): Promise<void> {
    // ? Delete images that are not in the new payload
    const newImagesUids = newImages.filter((img) => img.uid).map((img) => img.uid);
    const imagesToDelete = currentImages.filter((img) => !newImagesUids.includes(img.uid));

    for (const image of imagesToDelete) {
      const urlParts = image.url.split('/');
      const folderIndex = urlParts.indexOf(StorageFolderName.FIELDS);
      if (folderIndex !== -1) {
        const key = urlParts.slice(folderIndex).join('/');
        await this.storage.deleteFile(key);
      }
      this.logger.debug(`Deleted image ${image.uid} for field ${fieldUid}`);
      await this.prisma.fieldImages.delete({ where: { uid: image.uid } });
    }

    // ? Update existing images (order or status)
    //* if they have a uid they already exist in the database
    const imagesToUpdate = newImages.filter((img) => img.uid);
    for (const image of imagesToUpdate) {
      const current = currentImages.find((img) => img.uid === image.uid);
      if (current && (current.order !== image.order || current.status !== image.status)) {
        await this.prisma.fieldImages.update({
          where: { uid: image.uid },
          data: {
            order: image.order ?? current.order,
            status: (image.status as any) ?? current.status,
          },
        });
        this.logger.debug(`Updated image ${image.uid} for field ${fieldUid}`);
      }
    }

    // ? Add new images
    // * if they don't have a uid and they have a file
    const imagesToAdd = newImages.filter((img) => !img.uid);

    for (const image of imagesToAdd) {
      if (image.file) {
        const uploadResult = await this.storage.upload(
          StorageFolderName.FIELDS,
          image.name,
          image.file,
        );
        if (uploadResult) {
          await this.prisma.fieldImages.create({
            data: {
              fieldUid,
              url: uploadResult.data,
              order: image.order ?? 1,
              status: image.status ?? VerificationStatus.APPROVED,
            },
          });
        }

        this.logger.debug(`Added image ${image.uid} for field ${fieldUid}`);
      }
    }
  }
}
