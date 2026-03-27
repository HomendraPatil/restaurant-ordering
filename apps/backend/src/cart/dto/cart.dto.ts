import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 'menu-item-uuid' })
  @IsString()
  menuItemId!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 10.99 })
  @IsNumber()
  unitPrice!: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  customizationPrice?: number;

  @ApiProperty({ example: 'No onions please', required: false })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiProperty({ example: ['option-uuid-1', 'option-uuid-2'], required: false })
  @IsOptional()
  @IsArray()
  selectedOptions?: string[];
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 2, minimum: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiProperty({ example: 'Extra cheese', required: false })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}
