import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { Request } from 'express';
import { AddressService } from './address.service';
import { JwtAuthGuard } from '../auth/guards';

class CreateAddressDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  addressLine!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  city!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  pincode!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isDefault?: boolean;
}

class UpdateAddressDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  addressLine?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isDefault?: boolean;
}

@ApiTags('Addresses')
@Controller('user/addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get()
  @ApiOperation({ summary: 'Get user addresses' })
  @ApiResponse({ status: 200, description: 'List of user addresses' })
  async getAddresses(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.addressService.getUserAddresses(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add new address' })
  @ApiResponse({ status: 201, description: 'Address created' })
  async createAddress(@Body() dto: CreateAddressDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.addressService.createAddress(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update address' })
  @ApiResponse({ status: 200, description: 'Address updated' })
  async updateAddress(@Param('id') id: string, @Body() dto: UpdateAddressDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.addressService.updateAddress(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete address' })
  @ApiResponse({ status: 200, description: 'Address deleted' })
  async deleteAddress(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.addressService.deleteAddress(id, userId);
  }
}