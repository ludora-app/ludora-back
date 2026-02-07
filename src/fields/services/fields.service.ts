import { DateTime } from 'luxon';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConflictException, Injectable } from '@nestjs/common';
import { StorageService } from 'src/shared/storage/storage.service';
import { Sport, StorageFolderName } from 'src/shared/constants/constants';
import { RankedFieldResult } from 'src/sessions/interfaces/session-interface';
import { FieldType, Prisma, VerificationStatus } from 'generated/prisma/client';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';

import { FieldMapper } from '../mappers/field.mapper';
import { UpdateFieldDto } from '../dto/input/update-field.dto';
import { FieldFilterDto } from '../dto/input/field-filter.dto';
import { MyFieldsFilterDto } from '../dto/input/my-fields-filter.dto';
import { FIELD_SUGGESTION_CONFIG } from '../constants/fields.constants';
import { CreatePublicFieldDto } from '../dto/input/create-public-field.dto';
import { CreatePrivateFieldDto } from '../dto/input/create-private-field.dto';
import { FieldResponseDto, FindOneFieldResponseData } from '../dto/output/field-response.dto';

@Injectable()
export class FieldsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly geolocalisationService: GeolocalisationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FieldsService.name);
  }

  async create(createPublicFieldDto: CreatePublicFieldDto): Promise<void> {
    const { address, images, lat, lng, name, shortAddress, sports } = createPublicFieldDto;

    let finalLat = lat;
    let finalLng = lng;
    let finalShortAddress = shortAddress;

    const geo = await this.geolocalisationService.getDetailsFromAddress(address);

    if (!finalLat || !finalLng || !finalShortAddress) {
      this.logger.debug(
        `Missing geo data for address: ${address}. Fetching from geolocalisation service...`,
      );

      finalLat = finalLat ?? geo.latitude;
      finalLng = finalLng ?? geo.longitude;
      finalShortAddress = finalShortAddress ?? geo.shortAddress;
    }

    // Convert to numbers
    const numericLat = Number(finalLat);
    const numericLng = Number(finalLng);

    // --- VÉRIFICATION D'EXISTENCE ---
    await this.verifyFieldLocation(numericLat, numericLng, address, sports);

    // --- TRANSACTION DATABASE ---
    await this.prisma.$transaction(async (tx) => {
      const newField = await tx.fields.create({
        data: {
          address,
          city: geo.city,
          country: geo.country,
          department: geo.department,
          latitude: numericLat,
          longitude: numericLng,
          name: name,
          shortAddress: finalShortAddress,
          status: VerificationStatus.PENDING,
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

      const fieldImages = await Promise.all(
        images.map(async (image, index) => {
          const uploadResult = await this.storageService.upload(
            StorageFolderName.FIELDS,
            image.name,
            image.file,
          );

          const fieldImage = await tx.fieldImages.create({
            data: {
              fieldUid: newField.uid,
              order: index,
              url: uploadResult.data,
            },
          });

          return { order: index, uid: fieldImage.uid, url: fieldImage.url };
        }),
      );

      return { fieldImages, newField };
    });
  }

  async createPrivateField(createPrivateFieldDto: CreatePrivateFieldDto): Promise<void> {
    const { address, images, lat, lng, name, partnerUid, shortAddress, sports } =
      createPrivateFieldDto;

    // Always fetch full geo details from address to get all required fields
    const geo = await this.geolocalisationService.getDetailsFromAddress(address);

    // Use provided coordinates and shortAddress if available, otherwise use from geo service
    const finalLat = lat ?? geo.latitude;
    const finalLng = lng ?? geo.longitude;
    const finalShortAddress = shortAddress ?? geo.shortAddress;

    await this.prisma.$transaction(async (tx) => {
      const newField = await tx.fields.create({
        data: {
          address,
          city: geo.city,
          country: geo.country,
          department: geo.department,
          latitude: finalLat,
          longitude: finalLng,
          name: name,
          partner: { connect: { uid: partnerUid } },
          shortAddress: finalShortAddress,
          status: VerificationStatus.APPROVED,
          type: FieldType.PRIVATE,
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

      const fieldImages =
        images && images.length > 0
          ? await Promise.all(
              images.map(async (image, index) => {
                const uploadResult = await this.storageService.upload(
                  StorageFolderName.FIELDS,
                  image.name,
                  image.file,
                );

                const fieldImage = await tx.fieldImages.create({
                  data: {
                    fieldUid: newField.uid,
                    order: index,
                    url: uploadResult.data,
                  },
                });

                return { order: index, uid: fieldImage.uid, url: fieldImage.url };
              }),
            )
          : [];

      return { fieldImages, newField };
    });
  }

  async findOne(uid: string): Promise<FindOneFieldResponseData | null> {
    const field = await this.prisma.fields.findUnique({
      include: {
        fieldImages: {
          select: {
            order: true,
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
      },
      where: { uid },
    });

    if (!field) return null;

    return FieldMapper.toFindOneDto(field);
  }

  /**
   * The function `verifyFieldLocation` checks if a field location already exists for a specific sport.
   * If it does, it throws a ConflictException.
   * If a field exists with the same location but different sport, nothing happens.
   * Only public fields are verified.
   */
  async verifyFieldLocation(
    latitude: number,
    longitude: number,
    address: string,
    sports: Sport[],
  ): Promise<void> {
    const field = await this.prisma.fields.findFirst({
      where: {
        address,
        fieldSports: { some: { sport: { in: sports } } },
        latitude,
        longitude,
        partnerUid: null,
      },
    });

    if (field) {
      this.logger.error(`Field location ${address} already exists for sports ${sports.join(', ')}`);
      throw new ConflictException(
        `Field location ${address} already exists for sports ${sports.join(', ')}`,
      );
    }
    this.logger.debug(`Field location ${address} does not exist for sports ${sports.join(', ')}`);
  }

  // TODO : verify this method
  async updatePublicField(uid: string, updateFieldDto: UpdateFieldDto): Promise<void> {
    const { address, images, lat, lng, name, shortAddress } = updateFieldDto;

    const existingField = await this.prisma.fields.findUnique({
      include: { fieldImages: true, fieldSports: true },
      where: { uid },
    });

    if (!existingField) {
      this.logger.error(`Field with uid ${uid} not found`);
      throw new Error(`Field with uid ${uid} not found`);
    }

    let coordinates;
    const finalLat = lat ?? (address ? undefined : existingField.latitude);
    const finalLng = lng ?? (address ? undefined : existingField.longitude);

    if (address) {
      coordinates = await this.geolocalisationService.getLatitudeAndLongitude(address);
      const sports = existingField.fieldSports.map((fieldSport) => fieldSport.sport as Sport);
      await this.verifyFieldLocation(coordinates.lat, coordinates.lng, address, sports);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.fields.update({
        data: {
          ...(address && { address }),
          ...(shortAddress && { shortAddress }),
          ...(coordinates && { latitude: coordinates.lat, longitude: coordinates.lng }),
          ...(finalLat && { latitude: finalLat }),
          ...(finalLng && { longitude: finalLng }),
          ...(name && { name }),
        },
        where: { uid },
      });

      if (images && images.length > 0) {
        await tx.fieldImages.deleteMany({
          where: { fieldUid: uid },
        });

        await Promise.all(
          images.map(async (image, index) => {
            const uploadResult = await this.storageService.upload(
              StorageFolderName.FIELDS,
              image.name,
              image.file,
            );

            await tx.fieldImages.create({
              data: {
                fieldUid: uid,
                order: index,
                url: uploadResult.data,
              },
            });
          }),
        );
      }
    });

    this.logger.debug(`Field ${uid} updated successfully`);
  }

  // TODO : verify this method
  async updatePrivateField(
    uid: string,
    partnerUid: string,
    updatePrivateFieldDto: UpdateFieldDto,
  ): Promise<void> {
    const { address, images, lat, lng, name, shortAddress } = updatePrivateFieldDto;

    const existingField = await this.prisma.fields.findUnique({
      include: { fieldImages: true, fieldSports: true },
      where: { uid },
    });

    if (!existingField) {
      this.logger.error(`Field with uid ${uid} not found`);
      throw new Error(`Field with uid ${uid} not found`);
    }

    if (existingField.partnerUid !== partnerUid) {
      this.logger.error(
        `Field with uid ${uid} is not associated with partner with uid ${partnerUid}`,
      );
      throw new Error(
        `Field with uid ${uid} is not associated with partner with uid ${partnerUid}`,
      );
    }

    let coordinates;
    const finalLat = lat ?? (address ? undefined : existingField.latitude);
    const finalLng = lng ?? (address ? undefined : existingField.longitude);

    if (address) {
      coordinates = await this.geolocalisationService.getLatitudeAndLongitude(address);
      const sports = existingField.fieldSports.map((fieldSport) => fieldSport.sport as Sport);
      await this.verifyFieldLocation(coordinates.lat, coordinates.lng, address, sports);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.fields.update({
        data: {
          ...(address && { address }),
          ...(shortAddress && { shortAddress }),
          ...(coordinates && { latitude: coordinates.lat, longitude: coordinates.lng }),
          ...(finalLat && { latitude: finalLat }),
          ...(finalLng && { longitude: finalLng }),
          ...(name && { name }),
        },
        where: { uid },
      });

      if (images && images.length > 0) {
        await tx.fieldImages.deleteMany({
          where: { fieldUid: uid },
        });

        await Promise.all(
          images.map(async (image, index) => {
            const uploadResult = await this.storageService.upload(
              StorageFolderName.FIELDS,
              image.name,
              image.file,
            );

            await tx.fieldImages.create({
              data: {
                fieldUid: uid,
                order: index,
                url: uploadResult.data,
              },
            });
          }),
        );
      }
    });
  }

  async findAll(filter: FieldFilterDto): Promise<PaginatedDataDto<FieldResponseDto>> {
    const {
      cursor,
      date,
      duration,
      gameModes,
      limit = 10,
      maxDistance = FIELD_SUGGESTION_CONFIG.THRESHOLDS.MAX_DISTANCE_KM,
      search,
      sports,
      timezone = 'Europe/Paris',
      type,
      userLat,
      userLon,
    } = filter;

    const { SCORES } = FIELD_SUGGESTION_CONFIG;
    const currentOffset = cursor ? parseInt(cursor, 10) : 0;
    const take = limit + 1;

    // --- 1. GESTION DU TEMPS (LUXON) ---
    const userNow = DateTime.now().setZone(timezone);
    const targetDate = date ? DateTime.fromISO(date, { zone: timezone }) : userNow;
    const localStartOfDay = targetDate.startOf('day');
    const localEndOfDay = targetDate.endOf('day');

    const searchStartTime =
      localStartOfDay < userNow ? userNow.toJSDate() : localStartOfDay.toJSDate();
    const searchEndTime = localEndOfDay.toJSDate();

    // --- 2. SQL : LOCALISATION ---
    const hasLocation = userLat != null && userLon != null;
    let distanceValueSql = Prisma.sql`NULL`;
    let distanceScoreSql = Prisma.sql`0`;
    let distanceWhereSql = Prisma.empty;

    if (hasLocation) {
      distanceValueSql = Prisma.sql`public.ST_DistanceSphere(public.ST_MakePoint(f.longitude::float, f.latitude::float), public.ST_MakePoint(${userLon}::float, ${userLat}::float))`;
      distanceScoreSql = Prisma.sql`CASE WHEN (${distanceValueSql}) < ${maxDistance * 1000} THEN ${SCORES.DISTANCE_MAX_POINTS} * (1 - ((${distanceValueSql}) / ${maxDistance * 1000})) ELSE 0 END`;
      distanceWhereSql = Prisma.sql`AND (${distanceValueSql}) < ${maxDistance * 1000}`;
    }

    // --- 3. SQL : RECHERCHE INTELLIGENTE (PARTIAL & FUZZY) ---
    let searchScoreSql = Prisma.sql`0`;
    let searchWhereSql = Prisma.empty;

    if (search) {
      const searchCompact = search.replace(/\s+/g, '');
      const searchPattern = `%${search}%`;

      searchScoreSql = Prisma.sql`
    GREATEST(
      word_similarity(${search}, f.name), 
      similarity(REPLACE(f.name, ' ', ''), ${searchCompact})
    ) * ${SCORES.SEARCH_MAX_POINTS}
  `;

      searchWhereSql = Prisma.sql`
    AND (
      f.name %> ${search}          -- Opérateur "word similarity" (recherche partielle floue)
      OR f.name ILIKE ${searchPattern} -- Fallback classique pour le texte exact
      OR REPLACE(f.name, ' ', '') ILIKE ${`%${searchCompact}%`} -- Pour "court1"
    )
  `;
    }

    // --- 4. SQL : LOGIQUES DE DURÉE & DISPONIBILITÉ ---
    const durationConditionSlots = duration
      ? Prisma.sql`AND (EXTRACT(EPOCH FROM (fs.end_time - fs.start_time)) / 60)::integer = ${duration}`
      : Prisma.empty;

    const hasActiveSlotsSql = Prisma.sql`
    EXISTS (
      SELECT 1 FROM infrastructure."Field_slots" fs 
      WHERE fs.field_uid = f.uid AND fs.start_time >= ${searchStartTime} AND fs.start_time <= ${searchEndTime}
      AND fs.is_reserved = false ${durationConditionSlots}
      ${gameModes?.length ? Prisma.sql`AND fs.game_mode::text IN (${Prisma.join(gameModes)})` : Prisma.empty}
    )
  `;

    // --- 5. SQL : FILTRE TYPE & SCORING FINAL ---
    const typeFilterSql =
      type === FieldType.PUBLIC
        ? Prisma.sql`AND f.type = ${FieldType.PUBLIC}`
        : type === FieldType.PRIVATE
          ? Prisma.sql`AND f.type = ${FieldType.PRIVATE} AND ${hasActiveSlotsSql}`
          : Prisma.sql`AND ( (f.type = ${FieldType.PRIVATE} AND ${hasActiveSlotsSql}) OR (f.type = ${FieldType.PUBLIC}) )`;

    const availabilityScoreSql = Prisma.sql`CASE WHEN ${hasActiveSlotsSql} THEN ${SCORES.AVAILABILITY_BONUS} ELSE 0 END`;
    const partnerScoreSql = Prisma.sql`CASE WHEN f.partner_uid IS NOT NULL THEN ${SCORES.PARTNER_BONUS} + (COALESCE(p.rank, 0) * ${SCORES.RANK_MULTIPLIER}) ELSE 0 END`;
    const sportWhereSql = sports?.length
      ? Prisma.sql`AND EXISTS (SELECT 1 FROM infrastructure."Field_sports" fs WHERE fs.field_uid = f.uid AND fs.sport IN (${Prisma.join(sports)}))`
      : Prisma.empty;

    // --- 6. EXECUTION ---
    await this.prisma.$executeRawUnsafe(
      `SET pg_trgm.word_similarity_threshold = ${FIELD_SUGGESTION_CONFIG.THRESHOLDS.WORD_SIMILARITY_THRESHOLD};`,
    );

    const rankedResults = await this.prisma.$queryRaw<RankedFieldResult[]>`

    SELECT 
      f.uid, (${distanceValueSql}) as distance_val, 
      ((${distanceScoreSql}) + (${partnerScoreSql}) + (${availabilityScoreSql}) + (${searchScoreSql})) as total_score, 
      count(*) OVER() as total_count
    FROM infrastructure."Fields" f
    LEFT JOIN infrastructure."Partners" p ON f.partner_uid = p.uid
    WHERE f.status = 'APPROVED' ${sportWhereSql} ${distanceWhereSql} ${typeFilterSql} ${searchWhereSql}
    ORDER BY total_score DESC, f.uid ASC LIMIT ${take} OFFSET ${currentOffset}
  `;

    if (!rankedResults.length) return { items: [], nextCursor: null, totalCount: 0 };

    // --- 7. HYDRATATION & MAPPING ---
    const uids = rankedResults.map((r) => r.uid);

    const fieldsFromDb = await this.prisma.fields.findMany({
      include: {
        fieldImages: { select: { order: true, url: true }, take: 1 },
        fieldSlots: {
          orderBy: { startTime: 'asc' },
          where: { isReserved: false, startTime: { gte: searchStartTime, lte: searchEndTime } },
        },
        fieldSports: {
          select: {
            sport: true,
          },
        },
        sessions: {
          include: { sessionPlayers: true },
          where: { startDate: { gte: searchStartTime, lte: searchEndTime } },
        },
      },
      where: { uid: { in: uids } },
    });

    const fieldMap = new Map(fieldsFromDb.map((f) => [f.uid, f]));

    const items = await Promise.all(
      rankedResults.map(async (rawData) => {
        const field = fieldMap.get(rawData.uid);
        if (!field) return null;

        if (field.fieldImages?.[0]?.url) {
          field.fieldImages[0].url = await this.storageService.getSignedUrl(
            StorageFolderName.FIELDS,
            field.fieldImages[0].url,
          );
        }

        return FieldMapper.toCollectionDto(
          {
            ...field,
            distance: rawData.distance_val,
            fieldSports: field.fieldSports.map((fieldSport) => ({
              sport: fieldSport.sport as Sport,
            })),
          },
          duration,
        );
      }),
    ).then((res) => res.filter((i) => i !== null));

    let nextCursor: string | null = null;
    if (items.length > limit) {
      items.pop();
      nextCursor = (currentOffset + limit).toString();
    }

    return { items, nextCursor, totalCount: Number(rankedResults[0].total_count) };
  }

  async findAllByPartnerUid(
    partnerUid: string,
    filter: MyFieldsFilterDto,
  ): Promise<PaginatedDataDto<FieldResponseDto>> {
    const {
      cursor,
      date,
      gameModes,
      limit = 10,
      search,
      sports,
      timezone = 'Europe/Paris',
    } = filter;

    const currentOffset = cursor ? parseInt(cursor, 10) : 0;
    const userNow = DateTime.now().setZone(timezone);
    const targetDate = date ? DateTime.fromISO(date, { zone: timezone }) : userNow;
    const localStartOfDay = targetDate.startOf('day');
    const localEndOfDay = targetDate.endOf('day');

    const searchStartTime =
      localStartOfDay < userNow ? userNow.toJSDate() : localStartOfDay.toJSDate();
    const searchEndTime = localEndOfDay.toJSDate();

    const query: {
      take: number;
      skip?: number;
      cursor?: {
        uid: string;
      };
      where: Prisma.FieldsWhereInput;
    } = {
      take: limit + 1,
      where: { partnerUid },
    };

    if (cursor) {
      query.cursor = {
        uid: cursor,
      };
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

    if (gameModes?.length) {
      query.where.fieldSlots = { some: { gameMode: { in: gameModes } } };
    }

    const fields = await this.prisma.fields.findMany({
      ...query,
      include: {
        fieldImages: { select: { order: true, url: true }, take: 1 },
        fieldSlots: {
          orderBy: { startTime: 'asc' },
          where: { startTime: { gte: searchStartTime, lte: searchEndTime } },
        },
        fieldSports: {
          select: {
            sport: true,
          },
        },
      },
      skip: currentOffset,
      where: { partnerUid },
    });

    let nextCursor: string | null = null;
    if (fields.length > limit) {
      const nextItem = fields.pop();
      nextCursor = nextItem!.uid;
    }

    const fieldsWithImageUrl = await Promise.all(
      fields.map(async (field) => {
        const imageUrl =
          field.fieldImages.length > 0
            ? await this.storageService.getSignedUrl(
                StorageFolderName.FIELDS,
                field.fieldImages[0].url,
              )
            : '';
        return {
          ...field,
          fieldImages: field.fieldImages.map((image) => ({ ...image, url: imageUrl })),
        };
      }),
    );

    return {
      items: fieldsWithImageUrl.map((f) =>
        FieldMapper.toCollectionDto(
          {
            ...f,
            fieldImages: f.fieldImages.map((fieldImage) => ({
              order: fieldImage.order,
              url: fieldImage.url,
            })),
            fieldSports: f.fieldSports.map((fieldSport) => ({ sport: fieldSport.sport as Sport })),
          },
          undefined,
        ),
      ),
      nextCursor,
      totalCount: fields.length,
    };
  }
}
