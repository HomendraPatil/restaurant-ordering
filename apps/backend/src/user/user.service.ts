import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../common/repositories/user.repository';
import { UserResponseDto } from '../auth/dto';
import { Role, User } from '@prisma/client';

interface UserSummary {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async findById(id: string) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapUserToResponse(user);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    role?: Role;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userRepository.findAll({ skip, take: limit, role: params.role }),
      this.userRepository.count({ role: params.role }),
    ]);

    return {
      items: users.map((u) => this.mapUserToResponse(u as UserSummary)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private mapUserToResponse(user: User | UserSummary): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone ?? undefined,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
