import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createPartnerDto: CreatePartnerDto) {
    const { address, email, imageUrl, name, phone } = createPartnerDto;
    //todo: add google maps api to get latitude and longitude from the address
    const partner = await this.prisma.partners.create({
      data: {
        address,
        email,
        imageUrl,
        name,
        phone,
      },
    });
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
