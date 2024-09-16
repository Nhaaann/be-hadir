import {
  RegisterBulkStafDto,
  RegisterStafDto,
  UpdateStafDto,
  DeleteBulkStafDto,
} from './staf.dto';
import { Role } from '../roles.enum';
import { hash } from 'bcrypt';
import {
  ResponsePagination,
  ResponseSuccess,
} from '../../../utils/interface/respone';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { REQUEST } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import BaseResponse from '../../../utils/response/base.response';
import { use } from 'passport';

@Injectable()
export class StafService extends BaseResponse {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private req: any,
  ) {
    super();
  }

  async updateStaf(id: number, updateStafDto: any): Promise<ResponseSuccess> {
    const { nama, email, password } = updateStafDto;

    const staf = await this.prisma.staf.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!staf) {
      throw new HttpException('Staf not found', HttpStatus.NOT_FOUND);
    }

    // Update staf details
    const updatedStaf = await this.prisma.staf.update({
      where: { id },
      data: {
        user: {
          update: {
            nama,
            email,
            password,
          },
        },
      },
      include: { user: true },
    });

    return {
      status: 'Success',
      message: 'Staf updated successfully',
      data: updatedStaf,
    };
  }

  async deleteBulkStaf(payload: DeleteBulkStafDto): Promise<ResponseSuccess> {
    try {
      let berhasil = 0;
      let gagal = 0;

      await Promise.all(
        payload.data.map(async (data) => {
          try {
            const result = await this.prisma.user.delete({
              where: { id: data },
            });

            if (result) {
              berhasil += 1;
            } else {
              gagal += 1;
            }
          } catch {
            gagal += 1;
          }
        }),
      );

      return {
        status: 'Success',
        message: `Successfully deleted ${berhasil} staff members, failed to delete ${gagal}`,
      };
    } catch {
      throw new HttpException('An error occurred', HttpStatus.BAD_REQUEST);
    }
  }

  async registerStaf(
    registerStafDto: RegisterStafDto,
  ): Promise<ResponseSuccess> {
    const { nama, email, password } = registerStafDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    // Create and save user
    const hashedPassword = await hash(password, 12);
    const savedUser = await this.prisma.user.create({
      data: {
        nama,
        email,
        avatar:
          'https://res.cloudinary.com/dcthljxbl/image/upload/v1726458751/defaultProfile.svg',
        password: hashedPassword,
        role: Role.STAF,
      },
    });

    // Create and save staf with the same ID as the user
    const staf = await this.prisma.staf.create({
      data: {
        user: {
          connect: { id: savedUser.id },
        },
      },
    });

    return {
      status: 'Success',
      message: 'Staf registered successfully',
      data: staf,
    };
  }

  async registerBulkStaf(
    payload: RegisterBulkStafDto,
  ): Promise<ResponseSuccess> {
    let berhasil = 0;
    let gagal = 0;

    for (const dto of payload.data) {
      try {
        await this.registerStaf(dto);
        berhasil += 1;
      } catch (error) {
        gagal += 1;
      }
    }
    return {
      status: 'Success',
      message: `Successfully registered ${berhasil} staff members, failed to register ${gagal}`,
    };
  }

  async getStafList(query: any): Promise<ResponsePagination> {
    const {
      page = 1,
      pageSize = 10,
      limit,
      sort_by = 'id',
      order_by = 'asc',
      nama,
    } = query;
    const filterQuery: Prisma.stafWhereInput = {};

    if (nama) {
      filterQuery.user = { nama: { contains: nama, mode: 'insensitive' } };
    }

    // Count total records
    const total = await this.prisma.staf.count({
      where: filterQuery,
    });
    const data = await this.prisma.staf.findMany({
      where: filterQuery,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        [sort_by]: order_by.toLowerCase(),
      },
      include: {
        user: true,
      },
    });

    const hasil = data.map((staf) => ({
      id: staf.user.id,
      avatar: staf.user.avatar,
      nama: staf.user.nama,
      nomor_hp: staf.user.nomor_hp,
      email: staf.user.email,
      role: staf.user.role,
      created_at: staf.user.created_at,
      updated_at: staf.user.updated_at,
    }));

    return this._pagination('Success', hasil, total, page, pageSize);
  }

  async getStafProfile(): Promise<ResponseSuccess> {
    const staf = await this.prisma.staf.findUnique({
      where: { id: this.req.user.id },
      include: {
        user: true,
      },
    });

    if (staf.user) {
      throw new HttpException('Staf not found', HttpStatus.NOT_FOUND);
    }

    //   const { staf } = users;

    // Prepare the response
    const hasil = {
      id: staf.user.id,
      avatar: staf.user.avatar,
      nama: staf.user.nama,
      nomor_hp: staf.user.nomor_hp,
      email: staf.user.email,
      role: staf.user.role,
    };

    return {
      status: 'Success',
      message: 'Profile retrieved successfully',
      data: hasil,
    };
  }
}
