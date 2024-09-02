import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class SubjectCodeService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private req: any,
  ) {}

  async findAll(): Promise<any> {
    try {
      const data = await this.prisma.subject_code_entity.findMany({
        include: {
          guru: {
            include: {
              user: true,
            },
          },
          mapel: true,
        },
      });

      // Map the data to match the required format
      const formattedData = data.map((subject) => ({
        id: subject.id,
        nama_mapel: subject.mapel.nama_mapel, // Adjust these properties based on your Prisma schema
        status_mapel: subject.mapel.status_mapel,
        subject_code: subject.code,
        nama_guru: subject.guru.user.nama,
      }));

      return {
        status: 'success',
        message: 'List of Subject retrieved successfully',
        data: formattedData,
      };
    } catch (error) {
      throw new HttpException('Failed to retrieve subjects', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
