import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../common/repositories/user.repository';
import { UserResponseDto } from '../auth/dto';

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
    role?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userRepository.findAll({ skip, take: limit, role: params.role }),
      this.userRepository.count({ role: params.role }),
    ]);

    return {
      items: users.map((u) => this.mapUserToResponse(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private mapUserToResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };
  }
}
