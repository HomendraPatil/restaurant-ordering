import { Injectable, NotFoundException } from '@nestjs/common';
import { AddressRepository } from './address.repository';

@Injectable()
export class AddressService {
  constructor(private addressRepository: AddressRepository) {}

  async getUserAddresses(userId: string) {
    return this.addressRepository.findByUserId(userId);
  }

  async getAddressById(id: string, userId: string) {
    const address = await this.addressRepository.findById(id);
    if (!address || address.userId !== userId) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  async createAddress(userId: string, data: {
    addressLine: string;
    city: string;
    state?: string;
    pincode: string;
    isDefault?: boolean;
  }) {
    return this.addressRepository.create(userId, data);
  }

  async updateAddress(id: string, userId: string, data: {
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
    isDefault?: boolean;
  }) {
    const address = await this.addressRepository.findById(id);
    if (!address || address.userId !== userId) {
      throw new NotFoundException('Address not found');
    }
    return this.addressRepository.update(id, userId, data);
  }

  async deleteAddress(id: string, userId: string) {
    const address = await this.addressRepository.findById(id);
    if (!address || address.userId !== userId) {
      throw new NotFoundException('Address not found');
    }
    return this.addressRepository.delete(id, userId);
  }
}