// guru.service.ts

import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterGuruDto, UpdateGuruDto, DeleteBulkGuruDto } from './guru.dto';
import { Role } from '../roles.enum';
import { hash } from 'bcrypt';
import { REQUEST } from '@nestjs/core';
import { ResponsePagination } from '../../../utils/interface/respone';
import { Prisma } from '@prisma/client';
import BaseResponse from '../../../utils/response/base.response';

@Injectable()
export class GuruService extends BaseResponse {
  constructor(
    @Inject(REQUEST) private req: any,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async registerGuru(registerGuruDto: RegisterGuruDto): Promise<any> {
    const { nama, email, password, mapel, initial_schedule } = registerGuruDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const scheduleInUse = await this.prisma.guru.findFirst({
      where: {
        initial_schedule: {
          schedule_name: initial_schedule,
        },
      },
    });

    if (scheduleInUse) {
      throw new HttpException(
        'Initial schedule is already in use by another teacher',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create and save user
    const hashedPassword = await hash(password, 12);
    const user = await this.prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        role: Role.GURU, // Ensure the role is correctly set
      },
    });

    // Check if mapel are valid
    const mapelEntities = await this.prisma.mapel.findMany({
      where: {
        id: { in: mapel },
      },
    });
    if (mapelEntities.length !== mapel.length) {
      throw new HttpException('Some mapel not found', HttpStatus.NOT_FOUND);
    }

    // Create guru
    const guru = await this.prisma.guru.create({
      data: {
        id: user.id,
        initial_schedule: {
          connect: {
            schedule_name: initial_schedule,
          },
        },
        user: { connect: { id: user.id } },
        mapel: {
          connect: mapelEntities.map((mapel) => ({ id: mapel.id })),
        },
      },
    });

    // Create subject codes
    await Promise.all(
      mapelEntities.map((subject, index) =>
        this.prisma.subject_code_entity.create({
          data: {
            code: `${initial_schedule}${index + 1}`,
            guru: { connect: { id: guru.id } },
            mapel: { connect: { id: subject.id } },
          },
        }),
      ),
    );

    return {
      status: 'Success',
      message: 'OK berhasil register guru',
      data: guru,
    };
  }

  async updateGuru(id: number, updateGuruDto: UpdateGuruDto): Promise<any> {
    const { avatar, nomor_hp, mapel, nama } = updateGuruDto;

    // Find the teacher by ID
    const guru = await this.prisma.guru.findUnique({
      where: { id },
      include: {
        user: true,
        subject_code_entity: true, // Include subject codes
        initial_schedule: true,
      },
    });

    if (!guru) {
      throw new HttpException('Teacher not found', HttpStatus.NOT_FOUND);
    }

    // Update user details
    await this.prisma.user.update({
      where: { id: guru.userId },
      data: {
        nama: nama ?? guru.user.nama,
        avatar: avatar ?? guru.user.avatar,
        nomor_hp: nomor_hp ?? guru.user.nomor_hp,
      },
    });

    // If mapel is provided, update the associated mapel entities
    if (mapel && mapel.length > 0) {
      const mapelEntities = await this.prisma.mapel.findMany({
        where: {
          id: { in: mapel },
        },
      });

      if (mapelEntities.length !== mapel.length) {
        throw new HttpException('Some mapel not found', HttpStatus.NOT_FOUND);
      }

      // Remove existing subject codes for the guru
      await this.prisma.subject_code_entity.deleteMany({
        where: { guru_id: id },
      });

      // Create new subject codes based on updated mapel
      const subjectCodes = mapelEntities.map((subject, index) => ({
        code: `${guru.initial_schedule.schedule_name}${index + 1}`,
        guruId: id,
        mapelId: subject.id,
      }));

      await this.prisma.subject_code_entity.createMany({
        data: subjectCodes,
      });
    }

    return {
      status: 'Success',
      message: 'OK',
      data: await this.prisma.guru.findFirst({
        where: { id },
        include: {
          user: true,
          subject_code_entity: {
            include: {
              mapel: true,
            },
          },
        },
      }),
    };
  }

  async deleteGuru(id: number): Promise<any> {
    const result = await this.prisma.guru.delete({
      where: { id },
    });

    if (!result) {
      throw new HttpException('Teacher not found', HttpStatus.NOT_FOUND);
    }

    return {
      status: 'Success',
      message: 'OK',
    };
  }

  async deleteBulkGuru(payload: DeleteBulkGuruDto): Promise<any> {
    let berhasil = 0;
    let gagal = 0;

    await Promise.all(
      payload.data.map(async (id) => {
        try {
          const result = await this.prisma.guru.delete({
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
      message: `Berhasil menghapus ${berhasil} dan gagal ${gagal}`,
    };
  }

  async getGuruList(query: any): Promise<ResponsePagination> {
    const {
      page = 1,
      pageSize = 10,
      limit,
      sort_by = 'id',
      order_by = 'asc',
      nama,
    } = query;

    const filterQuery: Prisma.guruWhereInput = {};

    // Add filtering by name if provided
    if (nama) {
      filterQuery.user = { nama: { contains: nama, mode: 'insensitive' } };
    }

    // Count total records
    const total = await this.prisma.guru.count({
      where: filterQuery,
    });

    // Fetch paginated data
    const guruList = await this.prisma.guru.findMany({
      where: filterQuery,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        [sort_by]: order_by.toLowerCase(),
      },
      include: {
        user: true,
        initial_schedule: true,
        subject_code_entity: {
          include: {
            mapel: true,
          },
        },
      },
    });

    // Transform the data to match the desired format
    const transformedData = guruList.map((guru) => {
      const { user, subject_code_entity } = guru;

      return {
        id: guru.id,
        initial_schedule: guru.initial_schedule.schedule_name,
        is_absen_today: guru.is_absen_today,
        nama: user.nama,
        nomor_hp: user.nomor_hp,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        avatar: user.avatar,
        mapel: subject_code_entity.map((subject) => ({
          id: subject.mapel.id,
          nama_mapel: subject.mapel.nama_mapel,
          status_mapel: subject.mapel.status_mapel,
          created_at: subject.mapel.created_at,
          updated_at: subject.mapel.updated_at,
        })),
      };
    });

    return this._pagination(
      `Berhasil, jumlah data ${total}`,
      transformedData,
      total,
      page,
      pageSize,
    );
  }

  async getGuruListWithSubject(query: any): Promise<ResponsePagination> {
    const {
      page = 1,
      pageSize = 10,
      sort_by = 'id',
      nama,
      nama_mapel,
      initial_subject,
      order_by = 'asc',
    } = query;

    const filterQuery: any = {
      AND: [],
    };
    if (nama) {
      filterQuery.AND.push({
        user: {
          nama: {
            contains: nama,
            mode: 'insensitive',
          },
        },
      });
    }

    if (nama_mapel) {
      filterQuery.AND.push({
        subject_code_entity: {
          some: {
            mapel: {
              nama_mapel: {
                contains: nama_mapel,
                mode: 'insensitive',
              },
            },
          },
        },
      });
    }

    if (initial_subject) {
      filterQuery.AND.push({
        subject_code_entity: {
          some: {
            code: {
              contains: initial_subject.toUpperCase(), // Ensure the search is case-insensitive
              mode: 'insensitive',
            },
          },
        },
      });
    }

    // Fetch paginated data
    const guruList = await this.prisma.guru.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        [sort_by]: order_by.toLowerCase(),
      },
      where: filterQuery,
      include: {
        user: true,
        initial_schedule: true,
        subject_code_entity: {
          include: {
            mapel: true,
          },
        },
      },
    });

    // Count total records
    const total = await this.prisma.guru.count({ where: filterQuery });

    const total_page = Math.ceil(total / pageSize);

    const current_data = await this.prisma.guru.count({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: filterQuery,
      orderBy: {
        [sort_by]: order_by.toLowerCase(),
      },
    });

    // Format guru list
    const formattedGuruList = guruList.map((guru) => {
      const { initial_schedule, subject_code_entity } = guru;

      // Filter subject_code_entity by initial_subject
      const filteredMapelList = subject_code_entity
        .filter((subject) =>
          subject.code.toUpperCase().includes(initial_subject.toUpperCase()),
        )
        .map((subject, index) => ({
          id_mapel: subject.mapel.id,
          nama_mapel: subject.mapel.nama_mapel,
          status_mapel: subject.mapel.status_mapel,
          subject_code: `${initial_schedule.schedule_name}${index + 1}`,
        }));

      return {
        id: guru.id,
        initial_schedule: guru.initial_schedule.schedule_name,
        nama: guru.user.nama,
        email: guru.user.email,
        mapel: filteredMapelList,
        created_at: guru.user.created_at,
        updated_at: guru.user.updated_at,
      };
    });

    const hasil = formattedGuruList.sort((a, b) => {
      if (a.initial_schedule < b.initial_schedule) return -1;
      if (a.initial_schedule > b.initial_schedule) return 1;
      return 0;
    });

    return this._pagination(
      'Success',
      hasil,
      total,
      page,
      pageSize,
      total_page,
      current_data,
    );
  }

  async getGuruDetailWithSubject(id: number): Promise<any> {
    const guru = await this.prisma.guru.findUnique({
      where: { id },
      include: {
        user: true,
        initial_schedule: true,
        subject_code_entity: {
          include: {
            mapel: true,
          },
        },
      },
    });

    if (!guru) {
      throw new HttpException('Teacher not found', HttpStatus.NOT_FOUND);
    }

    const { initial_schedule, subject_code_entity } = guru;

    const formattedMapelList = subject_code_entity.map((subject, index) => ({
      id_mapel: subject.mapel.id,
      nama_mapel: subject.mapel.nama_mapel,
      status_mapel: subject.mapel.status_mapel,
      subject_code: `${initial_schedule}${index + 1}`,
    }));

    return {
      status: 'Success',
      message: 'OK',
      data: {
        id: guru.id,
        initial_schedule: guru.initial_schedule,
        nama: guru.user.nama,
        email: guru.user.email,
        mapel: formattedMapelList,
        created_at: guru.user.created_at,
        updated_at: guru.user.updated_at,
      },
    };
  }

  async getGuruProfile(): Promise<any> {
    const userId: number = this.req.user.id; // Extract user ID from request

    const guru = await this.prisma.guru.findFirst({
      where: {
        user: {
          id: userId,
        },
      },
      include: {
        user: true,
        subject_code_entity: {
          include: {
            mapel: true,
          },
        },
      },
    });

    if (!guru) {
      throw new HttpException('Guru not found', HttpStatus.NOT_FOUND);
    }

    return {
      status: 'Success',
      message: 'OK',
      data: {
        id: guru.id,
        nama: guru.user.nama,
        email: guru.user.email,
        avatar: guru.user.avatar,
        nomor_hp: guru.user.nomor_hp,
        mapel: guru.subject_code_entity.map((subject) => ({
          id_mapel: subject.mapel.id,
          nama_mapel: subject.mapel.nama_mapel,
          status_mapel: subject.mapel.status_mapel,
          subject_code: subject.code,
        })),
      },
    };
  }
}
