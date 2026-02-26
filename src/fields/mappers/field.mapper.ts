import { FieldType, VerificationStatus } from 'generated/prisma/client';
import { Sport } from 'src/shared/constants/constants';

import { GAME_MODE_PLAYERS_COUNT } from '../constants/fields.constants';
import { FieldResponseDto, PublicFieldResponseData } from '../dto/output/field-response.dto';
import { FindOneFieldResponseData } from '../dto/output/find-one-field-response.dto';

interface FieldInput {
  uid: string;
  name?: string;
  type: FieldType;
  latitude: number;
  longitude: number;
  distance?: number;
  shortAddress: string;
  fieldSports?: Array<{ sport: string }>;
  fieldImages?: Array<{ order: number; url: string }>;
  fieldSlots?: Array<{
    uid: string;
    startTime: Date;
    endTime: Date;
    price: number;
    gameMode: string;
  }>;
  sessions?: Array<{
    uid: string;
    startDate: Date;
    endDate: Date;
    maxPlayersPerTeam?: number;
    teamsPerGame?: number;
    sessionPlayers?: Array<any>;
  }>;
}

interface RawFindOneField {
  uid: string;
  name: string;
  type: FieldType;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
  partnerUid: string;
  shortAddress: string;
  status: VerificationStatus;
  fieldSports: {
    sport: string;
  }[];
  partner: {
    rank: number;
    uid: string;
  };
  fieldImages: {
    order: number;
    uid: string;
    url: string;
  }[];
}

export class FieldMapper {
  static toCollectionDto(field: FieldInput, requestedDuration?: number): FieldResponseDto {
    const calculateDuration = (start: Date, end: Date) =>
      Math.round((end.getTime() - start.getTime()) / 60000);

    return {
      availabilities:
        field.type === 'PRIVATE'
          ? field.fieldSlots
              ?.filter(
                (slot) =>
                  !requestedDuration ||
                  calculateDuration(slot.startTime, slot.endTime) === requestedDuration,
              )
              .map((slot) => ({
                endTime: slot.endTime,
                price: slot.price,
                pricePerPlayer: Number(
                  (slot.price / GAME_MODE_PLAYERS_COUNT[slot.gameMode] || 1).toFixed(2),
                ),
                startTime: slot.startTime,
                type: 'RESERVATION',
                uid: slot.uid,
              }))
          : field.sessions
              ?.filter(
                (session) =>
                  !requestedDuration ||
                  calculateDuration(session.startDate, session.endDate) === requestedDuration,
              )
              .map((session) => ({
                endTime: session.endDate,
                startTime: session.startDate,
                type: 'MATCH_TO_JOIN' as const,
                uid: session.uid,
              })),
      fieldImages: field.fieldImages?.map((img) => ({
        order: img.order,
        url: img.url,
      })),
      latitude: field.latitude,
      longitude: field.longitude,
      name: field.name,
      shortAddress: field.shortAddress,
      sports: field.fieldSports?.map((fieldSport) => fieldSport.sport as Sport),
      type: field.type,

      uid: field.uid,

      userDistance: field.distance ? Math.round(Number(field.distance)) : undefined,
    };
  }

  static toFindOneDto(field: RawFindOneField): FindOneFieldResponseData {
    return {
      address: field.address,
      fieldImages: field.fieldImages.map((image) => ({
        order: image.order,
        uid: image.uid,
        url: image.url,
      })),
      latitude: field.latitude,
      longitude: field.longitude,
      name: field.name ?? undefined,
      partner: field.partner
        ? {
            rank: field.partner.rank,
            uid: field.partner.uid,
          }
        : undefined,
      partnerUid: field.partnerUid,
      shortAddress: field.shortAddress,
      sports: field.fieldSports.map((fieldSport) => fieldSport.sport as Sport),
      status: field.status,
      type: field.type,
      uid: field.uid,
    };
  }

  static toPublicFieldDto(field: FieldInput): PublicFieldResponseData {
    return {
      latitude: field.latitude,
      longitude: field.longitude,
      name: field.name,
      shortAddress: field.shortAddress,
      sports: field.fieldSports?.map((fieldSport) => fieldSport.sport as Sport),
      uid: field.uid,
    };
  }
}
