// guru.service.ts

import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterGuruDto, UpdateGuruDto, DeleteBulkGuruDto } from './guru.dto';
import { Role } from '../roles.enum';
import { hash } from 'bcrypt';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class GuruService {
  constructor(
    @Inject(REQUEST) private req: any,
    private readonly prisma: PrismaService,
  ) {}

  async registerGuru(registerGuruDto: RegisterGuruDto): Promise<any> {
    const { nama, email, password, mapel, initial_schedule } = registerGuruDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
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

    // Map to generate subject codes with mapelId and initial_schedule
    const subjectCodes = mapelEntities.map((subject, index) => ({
      code: `${initial_schedule}${index + 1}`, // Correctly formatted as a string
      mapelId: subject.id,
    }));

    // Create and save guru with the user ID and subject codes
    const guru = await this.prisma.guru.create({
      data: {
        id: this.req.user.id,
        initial_schedule,
        user: {
          connect: { id: user.id },
        },
        subject_code_entity: {
          create: subjectCodes.map((subject) => ({
            code: subject.code, // Use code as a string
            mapel: { connect: { id: subject.mapelId } }, // Correctly connect mapel
            initial_schedule, // Include only if needed
          })),
        },
      },
    });

    return {
      status: 'Success',
      message: 'OK',
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
        code: `${guru.initial_schedule}${index + 1}`,
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

  async getGuruList(): Promise<any> {
    const guruList = await this.prisma.guru.findMany({
      include: {
        user: true,
        subject_code_entity: {
          include: {
            mapel: true,
          },
        },
      },
    });

    return {
      status: 'Success',
      message: 'OK',
      data: guruList,
    };
  }

  async getGuruListWithSubject(): Promise<any> {
    const guruList = await this.prisma.guru.findMany({
      include: {
        user: true,
        subject_code_entity: {
          include: {
            mapel: true,
          },
        },
      },
    });

    const formattedGuruList = guruList.map((guru) => {
      const { initial_schedule, subject_code_entity } = guru;

      const formattedMapelList = subject_code_entity.map((subject, index) => ({
        id_mapel: subject.mapel.id,
        nama_mapel: subject.mapel.nama_mapel,
        status_mapel: subject.mapel.status_mapel,
        subject_code: `${initial_schedule}${index + 1}`,
      }));

      return {
        id: guru.id,
        initial_schedule: guru.initial_schedule,
        nama: guru.user.nama,
        email: guru.user.email,
        mapel: formattedMapelList,
        created_at: guru.user.created_at,
        updated_at: guru.user.updated_at,
      };
    });

    const hasil = formattedGuruList.sort((a, b) => {
      if (a.initial_schedule < b.initial_schedule) return -1;
      if (a.initial_schedule > b.initial_schedule) return 1;
      return 0;
    });

    return {
      status: 'Success',
      message: 'OK',
      data: hasil,
    };
  }

  async getGuruDetailWithSubject(id: number): Promise<any> {
    const guru = await this.prisma.guru.findUnique({
      where: { id },
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