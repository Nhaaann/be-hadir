// src/app/mapel/mapel.service.ts

import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMapelDto, UpdateMapelDto } from './mapel.dto';
import { REQUEST } from '@nestjs/core';
import { ResponsePagination } from '../../utils/interface/respone';
import BaseResponse from '../../utils/response/base.response';
import { PageRequestDto } from '../../utils/dto/page.dto';
import { filter } from 'rxjs';
import { Prisma } from '@prisma/client';

@Injectable()
export class MapelService extends BaseResponse {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private req: any,
  ) {
    super();
  }

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
        created_by: this.req.user.id,
      },
    });

    return {
      status: 'Success',
      message: 'OKe',
      data: mapel,
    };
  }

  async createBulk(payload: { data: CreateMapelDto[] }) {
    // Map the data to match Prisma's expected format
    const prismaData = payload.data.map((item) => ({
      nama_mapel: item.nama_mapel,
      status_mapel: item.status_mapel,
      created_by: this.req.user.id,
    }));

    return await this.prisma.mapel.createMany({
      data: prismaData,
      skipDuplicates: true, // Optional: skips inserting duplicate entries
    });
  }

  async findAll(query: any): Promise<ResponsePagination> {
    const {
      page = 1,
      pageSize = 10,
      nama_mapel,
      limit,
      sort_by = 'id',
      order_by = 'asc',
    } = query;

    

    const filterQuery: Prisma.mapelWhereInput = {};

    if (nama_mapel) {
      filterQuery.nama_mapel = {
        contains: nama_mapel,
        mode: 'insensitive',
      };
    }

    // Count total records
    const total = await this.prisma.mapel.count({
      where: filterQuery,
    });

    // Fetch paginated data
    const mapels = await this.prisma.mapel.findMany({
      where: filterQuery,
      orderBy: {
        [sort_by]: order_by.toLowerCase(),
      },
      skip: limit,
      take: pageSize,
    });
    return this._pagination('OKe', mapels, total, page, pageSize);
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
        updated_by: this.req.user.id,
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
