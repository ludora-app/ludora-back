import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Partners, Prisma } from 'generated/prisma/client';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';

import { UpdatePartnerDto } from './dto/input/update-partner.dto';
import { CreatePartnerDto } from './dto/input/create-partner.dto';

@Injectable()
export class PartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geolocalisationService: GeolocalisationService,
  ) {}

  async create(
    createPartnerDto: CreatePartnerDto,
    tx?: Prisma.TransactionClient,
  ): Promise<Partners> {
    const prisma = tx ?? this.prisma;
    const { address, email, imageUrl, latitude, longitude, name, phone } = createPartnerDto;
    const geo = await this.geolocalisationService.getDetailsFromAddress(address);
    const newPartner = await prisma.partners.create({
      data: {
        address,
        city: geo.city,
        email,
        imageUrl,
        latitude,
        longitude,
        name,
        phone,
        zipCode: geo.zipCode,
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
