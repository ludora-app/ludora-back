import { PinoLogger } from 'nestjs-pino';
import { FieldSlots } from 'generated/prisma/browser';
import { DateUtils } from 'src/shared/utils/date.utils';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { FieldsService } from './fields.service';
import { CreateFieldSlotDto } from '../dto/input/create-field-slot.dto';
import { FindAllFieldSlotsDto } from '../dto/input/find-all-field-slots.dto';

@Injectable()
export class FieldSlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fieldsService: FieldsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FieldSlotsService.name);
  }

  async create(dto: CreateFieldSlotDto, partnerUid: string): Promise<FieldSlots> {
    const { endTime, fieldUid, gameMode, price, startTime } = dto;

    const existingField = await this.fieldsService.findOne(fieldUid);

    if (!existingField) {
      this.logger.error(`Field not found: ${fieldUid}`);

      throw new NotFoundException('Field not found');
    }

    if (existingField.partnerUid !== partnerUid) {
      this.logger.error(`You are not authorized to create a slot for this field: ${fieldUid}`);

      throw new ForbiddenException('Action not allowed');
    }

    DateUtils.checkValidityForCreation(startTime, endTime);

    const existingSlot = await this.prisma.fieldSlots.findFirst({
      where: { endTime, fieldUid, startTime },
    });

    if (existingSlot) {
      this.logger.error(`A slot already exists at this time: ${startTime} - ${endTime}`);
      throw new ConflictException('A slot already exists at this time');
    }

    const newSlot = await this.prisma.fieldSlots.create({
      data: {
        endTime,
        fieldUid,
        gameMode,
        price,
        startTime,
      },
    });

    return newSlot;
  }

  async findAllByFieldUid(dto: FindAllFieldSlotsDto) {
    const { fieldUid, startDate } = dto;

    const existingField = await this.fieldsService.findOne(fieldUid);

    if (!existingField) {
      this.logger.error(`Field not found: ${fieldUid}`);

      throw new NotFoundException('Field not found');
    }

    const now = new Date();

    if (new Date(startDate) < now) {
      this.logger.error(`Start date is in the past: ${startDate}`);

      throw new BadRequestException('You cannot search for slots in the past');
    }

    const slots = await this.prisma.fieldSlots.findMany({
      where: {
        fieldUid,
        startTime: { gte: startDate },
      },
    });

    return slots;
  }

  findOne(uid: string): Promise<FieldSlots> {
    return this.prisma.fieldSlots.findUnique({
      where: { uid },
    });
  }

  async markAsReserved(uid: string): Promise<void> {
    await this.prisma.fieldSlots.update({
      data: { isReserved: true },
      where: { uid },
    });
    this.logger.debug(`Marked slot as reserved: ${uid}`);
  }

  /**
   * Method to call when emitting a slot reservation event, before the creation of the slot
   * No need verification because they were all made while creating the session
   * @param fieldUid - The field uid
   * @param startTime - The start time
   * @returns The field slot
   */
  // async findOneByDateAndFieldUid(fieldUid: string, startTime: string): Promise<FieldSlots> {
  //   const slot = await this.prisma.fieldSlots.findFirst({
  //     where: { fieldUid, startTime },
  //   });

  //   return slot;
  // }
}
