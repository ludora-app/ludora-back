import { Injectable } from '@nestjs/common';
import { Partners, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createPartnerDto: CreatePartnerDto,
    tx?: Prisma.TransactionClient,
  ): Promise<Partners> {
    const prisma = tx ?? this.prisma;
    const { address, email, imageUrl, latitude, longitude, name, phone } = createPartnerDto;
    // const coordinates = await this.geolocalisation.getLatitudeAndLongitude(address);
    const newPartner = await prisma.partners.create({
      data: {
        address,
        email,
        imageUrl,
        latitude,
        longitude,
        name,
        phone,
      },
    });
    return newPartner;
  }

  async findAll() {
    return `This action returns all partners`;
  }

  async findOneByEmail(email: string) {
    return this.prisma.partners.findUnique({
      where: {
        email,
      },
    });
  }

  async findOne(uid: string) {
    return this.prisma.partners.findUnique({
      where: {
        uid,
      },
    });
  }

  async update(uid: string, updatePartnerDto: UpdatePartnerDto) {
    return this.prisma.partners.update({
      data: {
        ...updatePartnerDto,
      },
      where: {
        uid,
      },
    });
  }

  async remove(id: number) {
    return `This action removes a #${id} partner`;
  }
}
