// import { Type } from 'class-transformer';
// import { ApiProperty } from '@nestjs/swagger';
// import {
//   IsArray,
//   IsDate,
//   IsNotEmpty,
//   IsNumber,
//   IsOptional,
//   IsString,
//   ValidateNested,
// } from 'class-validator';

// export enum AvailabilityType {
//   SLOT = 'SLOT',
//   SESSION = 'SESSION',
// }

// export class CreateFieldSessionDto {
//   @IsDate()
//   @Type(() => Date)
//   @IsNotEmpty()
//   @ApiProperty({
//     description: 'Start date of the session',
//     example: '2026-01-05T14:00:00Z',
//   })
//   startDate: Date;

//   @IsDate()
//   @Type(() => Date)
//   @IsNotEmpty()
//   @ApiProperty({
//     description: 'End date of the session',
//     example: '2026-01-05T15:30:00Z',
//   })
//   endDate: Date;

//   @IsString()
//   @IsNotEmpty()
//   @ApiProperty({
//     description: 'Game mode (e.g., FIVE_V_FIVE, THREE_V_THREE)',
//     example: 'FIVE_V_FIVE',
//   })
//   gameMode: string;

//   @IsString()
//   @IsNotEmpty()
//   @ApiProperty({
//     description: 'Sport name',
//     example: 'FOOTBALL',
//   })
//   sport: string;

//   @IsString()
//   @IsNotEmpty()
//   @ApiProperty({
//     description: 'Creator UID',
//     example: 'user-uid-123',
//   })
//   creatorUid: string;

//   @IsNumber()
//   @IsOptional()
//   @ApiProperty({
//     description: 'Maximum players per team',
//     example: 5,
//   })
//   maxPlayersPerTeam?: number;

//   @IsNumber()
//   @IsOptional()
//   @ApiProperty({
//     description: 'Minimum players per team',
//     example: 3,
//   })
//   minPlayersPerTeam?: number;

//   @IsNumber()
//   @IsOptional()
//   @ApiProperty({
//     description: 'Number of teams per game',
//     example: 2,
//   })
//   teamsPerGame?: number;

//   @IsString()
//   @IsOptional()
//   @ApiProperty({
//     description: 'Session title',
//     example: 'Football Match',
//   })
//   title?: string;

//   @IsString()
//   @IsOptional()
//   @ApiProperty({
//     description: 'Session description',
//     example: 'Friendly football match',
//   })
//   description?: string;
// }

// export class CreateAvailabilitiesDto {
//   @IsString()
//   @IsNotEmpty()
//   @ApiProperty({
//     description: 'The UID of the field',
//     example: 'field-uid-123',
//   })
//   fieldUid: string;

//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => CreateFieldSlotDto)
//   @IsOptional()
//   @ApiProperty({
//     description: 'Array of field slots',
//     type: [CreateFieldSlotDto],
//   })
//   slots?: CreateFieldSlotDto[];

//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => CreateFieldSessionDto)
//   @IsOptional()
//   @ApiProperty({
//     description: 'Array of field sessions',
//     type: [CreateFieldSessionDto],
//   })
//   sessions?: CreateFieldSessionDto[];
// }
