import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './profile.dto';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private req: any,
  ) {}

  async updateProfile(
    id: number,
    payload: UpdateProfileDto,
  ): Promise<any> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Update user profile
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        nama: payload.nama,
        avatar: payload.avatar,
      },
    });

    return {
      status: 'Success',
      message: 'Profile updated successfully',
      data: updatedUser,
    };
  }
}
