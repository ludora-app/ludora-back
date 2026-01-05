import { FieldType } from 'generated/prisma/client';
import { Sport } from 'src/shared/constants/constants';

import { FieldResponseDto } from '../dto/output/field-response.dto';
import { GAME_MODE_PLAYERS_COUNT } from '../constants/fields.constants';

interface FieldInput {
  uid: string;
  name?: string;
  type: FieldType;
  latitude: number;
  longitude: number;
  distance?: number;
  shortAddress: string;
  sport: Sport | string;
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

export class FieldMapper {
  static toDto(field: FieldInput, requestedDuration?: number): FieldResponseDto {
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
      sport: field.sport as Sport,
      type: field.type,

      uid: field.uid,

      userDistance: field.distance ? Math.round(Number(field.distance)) : undefined,
    };
  }

  static toCollectionDto(fields: FieldInput[], duration?: number): FieldResponseDto[] {
    return fields.map((f) => FieldMapper.toDto(f, duration));
  }
}
