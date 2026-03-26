import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ 
    example: 'newuser@example.com',
    description: 'User email address',
    required: true 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'password123', 
    minLength: 6,
    description: 'Minimum 6 characters',
    required: true 
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    example: 'John Doe',
    description: 'Full name of the user',
    required: true 
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    example: '+919876543210',
    description: 'Phone number with country code' 
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
