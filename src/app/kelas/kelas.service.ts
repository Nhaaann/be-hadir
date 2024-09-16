// src/app/kelas/kelas.service.ts

import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Adjust import path as needed
import { BulkCreateKelasDto, CreateKelasDto } from './kelas.dto';
import { REQUEST } from '@nestjs/core';
import BaseResponse from '../../utils/response/base.response';
import { ResponsePagination } from '../../utils/interface/respone';
import { Prisma } from '@prisma/client';

@Injectable()
export class KelasService extends BaseResponse {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private req: any,
  ) {
    super();
  }

  async create(createKelasDto: CreateKelasDto): Promise<any> {
    const { nama_kelas } = createKelasDto;

    // Check if class already exists
    const existingKelas = await this.prisma.kelas.findFirst({
      where: { nama_kelas },
    });
    if (existingKelas) {
      throw new HttpException('Class already exists', HttpStatus.BAD_REQUEST);
    }

    // Create and save new class
    const hasil = await this.prisma.kelas.create({
      data: {
        nama_kelas,
        created_by: this.req.user.id,
      },
    });

    return {
      status: 'Success',
      message: 'OKe',
      data: hasil,
    };
  }

  async findAll(query: any): Promise<ResponsePagination> {
    const {
      page = 1,
      pageSize = 10,
      limit,
      nama_kelas,
      sort_by = 'id',
      order_by = 'asc',
    } = query;

    const filterQuery: Prisma.kelasWhereInput = {};

    if (nama_kelas) {
      filterQuery.nama_kelas = {
        contains: nama_kelas,
        mode: 'insensitive',
      };
    }

    // Count total records
    const total = await this.prisma.kelas.count({
      where: filterQuery
    });

    // Fetch paginated data
    const kelasList = await this.prisma.kelas.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        [sort_by]: order_by
      },
      where: filterQuery,
      include: {
        murid: {
          include: {
            user: true,
          },
        },
      },
    });

    // Structure the response to include user with nested siswa
    const response = kelasList.map((kelas) => ({
      id: kelas.id,
      nama_kelas: kelas.nama_kelas,
      users: kelas.murid.map((siswa) => ({
        id: siswa.id,
        avatar: siswa.user.avatar,
        nama: siswa.user.nama,
        nomor_hp: siswa.user.nomor_hp,
        email: siswa.user.email,
        role: siswa.user.role,
        kelas: siswa.kelasId,
        siswa: {
          id: siswa.id,
          NISN: siswa.NISN,
          tanggal_lahir: siswa.tanggal_lahir,
          alamat: siswa.alamat,
        },
      })),
    }));

    return this._pagination('Success', response, total, page, pageSize);
  }

  async findOneWithStudents(id: number): Promise<any> {
    const kelas = await this.prisma.kelas.findUnique({
      where: { id },
      include: { murid: true }, // Ensure to load the related siswa
    });

    if (!kelas) {
      throw new HttpException('Kelas not found', HttpStatus.NOT_FOUND);
    }

    // Structure the response to include the students
    const response = {
      id: kelas.id,
      nama_kelas: kelas.nama_kelas,
      siswa: kelas.murid.map((siswa) => ({
        id: siswa.id,
        NISN: siswa.NISN,
        tanggal_lahir: siswa.tanggal_lahir,
        alamat: siswa.alamat,
      })),
    };

    return {
      status: 'Success',
      message: 'OKe',
      data: response,
    };
  }

  async update(id: number, updateKelasDto: CreateKelasDto): Promise<any> {
    const { nama_kelas } = updateKelasDto;

    const kelas = await this.prisma.kelas.findUnique({
      where: { id },
    });

    if (!kelas) {
      throw new HttpException('Kelas not found', HttpStatus.NOT_FOUND);
    }

    // Update class
    const hasil = await this.prisma.kelas.update({
      where: { id },
      data: { nama_kelas },
    });

    return {
      status: 'Success',
      message: 'OKe',
      data: hasil,
    };
  }

  async delete(id: number): Promise<any> {
    const result = await this.prisma.kelas.delete({
      where: { id },
    });

    if (!result) {
      throw new HttpException('Kelas not found', HttpStatus.NOT_FOUND);
    }

    return {
      status: 'Success',
      message: 'OKe',
    };
  }

  async createBulk(bulkCreateKelasDto: BulkCreateKelasDto): Promise<any> {
    const { data } = bulkCreateKelasDto;

    const errors = [];
    const successes = [];

    for (const createKelasDto of data) {
      const { nama_kelas } = createKelasDto;

      // Check if class already exists
      const existingKelas = await this.prisma.kelas.findFirst({
        where: { nama_kelas },
      });
      if (existingKelas) {
        errors.push(`Class "${nama_kelas}" already exists`);
        continue;
      }

      try {
        const hasil = await this.prisma.kelas.create({
          data: {
            ...createKelasDto,
            created_by: this.req.user.id,
          },
        });
        successes.push(hasil);
      } catch (error) {
        errors.push(`Error creating class "${nama_kelas}": ${error.message}`);
      }
    }

    return {
      status: 'Success',
      message: 'OKe',
      data: { successes, errors },
    };
  }

  async deleteBulk(ids: number[]): Promise<any> {
    let berhasil = 0;
    let gagal = 0;

    await Promise.all(
      ids.map(async (id) => {
        try {
          const result = await this.prisma.kelas.delete({
            where: { id },
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
      message: `Bulk delete completed. Berhasil: ${berhasil}, Gagal: ${gagal}`,
    };
  }
}
