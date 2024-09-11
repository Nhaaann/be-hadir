import {
  DeleteBulkUserDto,
  RegisterBulkSiswaDto,
  RegisterSiswaDto,
  UpdateSiswaDto,
} from './siswa.dto';
import { Role } from '../roles.enum';
import { hash } from 'bcrypt';
import {
  ResponsePagination,
  ResponseSuccess,
} from '../../../utils/interface/respone';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { REQUEST } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import BaseResponse from '../../../utils/response/base.response';
// import { PrismaService } from 'src/prisma/prisma.service'; // Import PrismaService

@Injectable()
export class SiswaService extends BaseResponse {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private req: any,
  ) {
    super();
  }

  async updateSiswa(id: number, updateSiswaDto: UpdateSiswaDto): Promise<any> {
    const { avatar, nomor_hp, alamat } = updateSiswaDto;

    const siswa = await this.prisma.murid.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!siswa) {
      throw new HttpException('Siswa not found', HttpStatus.NOT_FOUND);
    }

    // Update user details
    const updatedSiswa = await this.prisma.murid.update({
      where: { id },
      data: {
        user: {
          update: {
            avatar: avatar ?? siswa.user.avatar,
            nomor_hp: nomor_hp ?? siswa.user.nomor_hp,
          },
        },
        alamat: alamat ?? siswa.alamat,
      },
      include: { user: true },
    });

    return {
      status: 'Success',
      message: 'OKe',
      data: updatedSiswa,
    };
  }

  async DeleteBulkSiswa(payload: DeleteBulkUserDto): Promise<any> {
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
        message: `Berhasil menghapus ${berhasil} dan gagal ${gagal}`,
      };
    } catch {
      throw new HttpException('Ada Kesalahan', HttpStatus.BAD_REQUEST);
    }
  }

  async registerSiswa(registerSiswaDto: RegisterSiswaDto): Promise<any> {
    const { nama, email, password, kelas, NISN, tanggal_lahir, alamat } =
      registerSiswaDto;

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
        password: hashedPassword,
        role: Role.Murid,
      },
    });

    // Check if Kelas exists
    const kelasExixts = await this.prisma.kelas.findUnique({
      where: { id: kelas },
    });
    if (!kelasExixts) {
      throw new HttpException('Kelas not found', HttpStatus.NOT_FOUND);
    }

    // Create and save student with the same ID as the user
    const siswa = await this.prisma.murid.create({
      data: {
        user: {
          connect: {
            id: savedUser.id,
          },
        },
        kelas: {
          connect: {
            id: kelasExixts.id,
          },
        },
        NISN,
        tanggal_lahir,
        alamat,
      },
    });

    return {
      status: 'Success',
      message: 'OKe',
      data: siswa,
    };
  }

  async registerBulkSiswa(payload: RegisterBulkSiswaDto): Promise<any> {
    let berhasil = 0;
    let gagal = 0;

    for (const dto of payload.data) {
      try {
        await this.registerSiswa(dto);
        berhasil += 1;
      } catch (error) {
        gagal += 1;
      }
    }
    return {
      status: 'Success',
      message: `Berhasil Register, berhasil: ${berhasil} dan gagal: ${gagal}`,
    };
  }

  async getSiswaList(query: any): Promise<ResponsePagination> {
    const {
      page = 1,
      pageSize = 10,
      limit,
      sort_by = 'id',
      order_by = 'asc',
      nama,
    } = query;
    const filterQuery: Prisma.muridWhereInput = {};

    if (nama) {
      filterQuery.user = { nama: { contains: nama, mode: 'insensitive' } };
    }

    // Count total records
    const total = await this.prisma.murid.count({
      where: filterQuery,
    });
    const data = await this.prisma.murid.findMany({
      skip: limit,
      take: pageSize,
      orderBy: {
        [sort_by]: order_by.toLowerCase(),
      },
      include: {
        user: true,
        kelas: true,
      },
    });

    return this._pagination('Success', data, total, page, pageSize);
  }

  async getSiswaProfile(): Promise<any> {
    const users = await this.prisma.user.findUnique({
      where: { id: this.req.user.id },
      include: {
        murid: {
          include: {
            kelas: true,
          },
        },
      },
    });

    if (!users?.murid) {
      throw new HttpException('Siswa not found', HttpStatus.NOT_FOUND);
    }

    const { murid } = users;

    // Prepare the response
    const hasil = {
      id: users.id,
      avatar: users.avatar,
      nama: users.nama,
      nomor_hp: users.nomor_hp,
      email: users.email,
      role: users.role,
      NISN: murid.NISN,
      tanggal_lahir: murid.tanggal_lahir,
      alamat: murid.alamat,
    };

    return {
      status: 'Success',
      message: 'OKe',
      data: hasil,
    };
  }
}
