// src/app/mapel/mapel.service.ts

import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMapelDto, UpdateMapelDto } from './mapel.dto';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class MapelService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private req: any,
  ) {}

  async create(createMapelDto: CreateMapelDto): Promise<any> {
    const { nama_mapel } = createMapelDto;

    // Check if mata pelajaran already exists
    const existingMapel = await this.prisma.mapel.findFirst({
      where: { nama_mapel: nama_mapel },
    });

    if (existingMapel) {
      throw new HttpException(
        'Mata Pelajaran already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create and save new mata pelajaran
    const mapel = await this.prisma.mapel.create({
      data: {
        ...createMapelDto,
        created_by: this.req.user.id
      },
    });

    return {
      status: 'Success',
      message: 'OKe',
      data: mapel,
    };
  }

  async findAll(): Promise<any> {
    const mapels = await this.prisma.mapel.findMany();
    return {
      status: 'Success',
      message: 'OKe',
      data: mapels,
    };
  }

  async update(id: number, payload: UpdateMapelDto): Promise<any> {
    const check = await this.prisma.mapel.findUnique({
      where: { id },
    });

    if (!check) {
      throw new HttpException('Mata Pelajaran not found', HttpStatus.NOT_FOUND);
    }

    const hasil = await this.prisma.mapel.update({
      where: { id },
      data: {
        ...payload,
        updated_by: this.req.user.id
      },
    });

    return {
      status: 'Success',
      message: 'OKe',
      data: hasil,
    };
  }

  async delete(id: number): Promise<any> {
    const result = await this.prisma.mapel.delete({
      where: { id },
    });

    if (!result) {
      throw new HttpException('Mata Pelajaran not found', HttpStatus.NOT_FOUND);
    }

    return {
      status: 'Success',
      message: 'OKe',
    };
  }

  async deleteBulk(ids: number[]): Promise<any> {
    let berhasil = 0;
    let gagal = 0;

    await Promise.all(
      ids.map(async (id) => {
        try {
          const result = await this.prisma.mapel.delete({
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
