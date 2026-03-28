import { ApiResponseProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiResponseProperty()
  id: string;

  @ApiResponseProperty()
  email: string;

  @ApiResponseProperty()
  name: string;

  @ApiResponseProperty()
  phone?: string;

  @ApiResponseProperty({ enum: Role })
  role: Role;

  @ApiResponseProperty()
  createdAt: Date;

  @ApiResponseProperty()
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiResponseProperty()
  accessToken: string;

  @ApiResponseProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
