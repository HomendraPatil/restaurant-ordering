import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressRepository {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.address.findUnique({
      where: { id },
    });
  }

  async create(userId: string, data: {
    addressLine: string;
    city: string;
    state?: string;
    pincode: string;
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        userId,
        addressLine: data.addressLine,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        isDefault: data.isDefault || false,
      },
    });
  }

  async update(id: string, userId: string, data: {
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id },
      data: {
        addressLine: data.addressLine,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        isDefault: data.isDefault,
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.address.delete({
      where: { id },
    });
  }
}