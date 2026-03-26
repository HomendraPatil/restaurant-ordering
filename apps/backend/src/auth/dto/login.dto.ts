import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    example: 'admin@restaurant.com',
    description: 'Default: admin@restaurant.com',
    required: true 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'admin123',
    description: 'Default password for admin account',
    required: true 
  })
  @IsString()
  password: string;
}
