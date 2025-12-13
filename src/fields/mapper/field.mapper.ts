import { GameModes } from 'generated/prisma/browser';
import { Sport } from 'src/shared/constants/constants';

import { FieldResponseDto } from '../dto/output/field-response';

/**
 * @description Raw field structure with relations queried from the database
 */
interface FieldWithRelations {
  uid: string;
  name: string;
  address: string;
  latitude: number;
  entryFee?: number;
  longitude: number;
  gameMode: GameModes;
  isVerified?: boolean;
  shortAddress: string;
  sport: Sport | string;
  fieldImages: { order: number; url: string }[];
  partner?: {
    uid: string;
    partnerOpeningHours: {
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
    }[];
  } | null;
}

/**
 * @description Mapper for the Field entity
 * Allows the response to be more friendly for the client by returning a more readable structure
 */
export class FieldMapper {
  static toDto(field: FieldWithRelations): FieldResponseDto {
    return {
      address: field.address,
      entryFee: field.entryFee ?? undefined,
      fieldImages: field.fieldImages.map((image) => ({
        url: image.url,
      })),
      gameMode: field.gameMode,
      isVerified: field.isVerified ?? undefined,
      latitude: field.latitude,
      longitude: field.longitude,
      name: field.name,
      openingHours: field.partner?.partnerOpeningHours.map((hour) => ({
        closeTime: hour.closeTime,
        dayOfWeek: hour.dayOfWeek,
        openTime: hour.openTime,
      })),
      partnerUid: field.partner?.uid,
      shortAddress: field.shortAddress,
      sport: field.sport as Sport,
      uid: field.uid,
    };
  }

  static toCollectionDto(fields: FieldWithRelations[]): FieldResponseDto[] {
    return fields.map(FieldMapper.toDto);
  }
}
