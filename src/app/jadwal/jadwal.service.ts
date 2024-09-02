// src/app/jadwal/jadwal.service.ts
import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import {
  CreateJadwalDto,
  // CreateJamDto,
  FindAllJadwalDTO,
  UpdateJadwalDto,
} from './jadwal.dto';
import { ResponseSuccess } from 'src/utils/interface/respone';
import { REQUEST } from '@nestjs/core';
import {
  getTodayDayNames,
  isCurrentTimeBetween,
} from '../../utils/helper function/getDay';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JadwalService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private req: any,
  ) {}

  async getCurrentJamDetailUser(): Promise<any> {
    const todayDayName = getTodayDayNames();
    
    // Retrieve today's schedules with required relations
    const jadwalList = await this.prisma.jadwal.findMany({
      where: {
        hari: {
          nama_hari: todayDayName as any,
        },
      },
      include: {
        hari: true,
        jam_jadwal: {
          include: {
            jam_detail_jadwal: {
              include: {
                kelas: true,
                subject_code_entity: {
                  include: {
                    mapel: true,
                    guru: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  
    const user = await this.prisma.user.findUnique({
      where: { id: this.req.user.id },
    });
  
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  
    const currentTime = new Date();
    const currentDate = currentTime.toISOString().split('T')[0];
  
    // Filter and sort schedules for today
    const todaysSchedules = jadwalList
      .flatMap((jadwal) =>
        jadwal.jam_jadwal.map((jamJadwal) => ({
          jamJadwal,
          jamDetail: jamJadwal.jam_detail_jadwal.find(
            (detail) => detail.kelas.id === user.kelasId,
          ),
        })),
      )
      .filter((item) => item.jamDetail);
  
    todaysSchedules.sort((a, b) => {
      const jamMulaiA = new Date(`${currentDate}T${a.jamJadwal.jam_mulai}`);
      const jamMulaiB = new Date(`${currentDate}T${b.jamJadwal.jam_mulai}`);
      return jamMulaiA.getTime() - jamMulaiB.getTime();
    });
  
    // Check if all schedules are done
    const allSchedulesDone = todaysSchedules.every(
      (schedule) => currentTime >= new Date(`${currentDate}T${schedule.jamJadwal.jam_selesai}`)
    );
  
    // Iterate through today's schedules to find the current or next schedule
    for (const schedule of todaysSchedules) {
      const jamMulai = new Date(`${currentDate}T${schedule.jamJadwal.jam_mulai}`);
      const jamSelesai = new Date(`${currentDate}T${schedule.jamJadwal.jam_selesai}`);
  
      if (currentTime >= jamMulai && currentTime <= jamSelesai) {
        const absenSiswa = await this.prisma.absen_siswa.findFirst({
          where: {
            absen_kelas: {
              id: schedule.jamDetail.id,
            },
            user: {
              id: this.req.user.id,
            },
          },
        });
  
        const isAbsen = !!absenSiswa;
        const isMasukKelas = !!absenSiswa;
        
        return {
          status: 'Success',
          message: 'Schedule found successfully',
          data: {
            id_user: user.id,
            nama_user: user.nama,
            role: user.role,
            jamDetailId: schedule.jamDetail.id,
            jam_mulai: schedule.jamJadwal.jam_mulai,
            jam_selesai: schedule.jamJadwal.jam_selesai,
            mapel: schedule.jamDetail.subject_code_entity.mapel.nama_mapel,
            kelas: schedule.jamDetail.kelas.nama_kelas,
            is_absen: isAbsen,
            is_masuk_kelas: isMasukKelas,
            is_mulai: true,
            is_jadwal_habis: false,
            is_jadwal_habis_hari_ini: allSchedulesDone,
          },
        };
      }
    }
  
    // Handle the case where no current schedule is active
    if (todaysSchedules.length > 0) {
      const nextSchedule = todaysSchedules[0];
      const isJadwalHabis =
        allSchedulesDone ||
        currentTime >= new Date(`${currentDate}T${nextSchedule.jamJadwal.jam_selesai}`);
      const isMulai =
        !isJadwalHabis &&
        currentTime >= new Date(`${currentDate}T${nextSchedule.jamJadwal.jam_mulai}`);
  
      return {
        status: 'Success',
        message: 'Next schedule found',
        data: {
          id_user: user.id,
          nama_user: user.nama,
          role: user.role,
          jamDetailId: nextSchedule.jamDetail.id,
          jam_mulai: nextSchedule.jamJadwal.jam_mulai,
          jam_selesai: nextSchedule.jamJadwal.jam_selesai,
          mapel: nextSchedule.jamDetail.subject_code_entity.mapel.nama_mapel,
          kelas: nextSchedule.jamDetail.kelas.nama_kelas,
          is_absen: false,
          is_masuk_kelas: false,
          is_mulai: isMulai,
          is_jadwal_habis: isJadwalHabis,
          is_jadwal_habis_hari_ini: allSchedulesDone,
        },
      };
    }
  
    // If no schedules are found for today
    throw new HttpException(
      'Jam detail not found for today',
      HttpStatus.NOT_FOUND,
    );
  }
  

  async findOne(id: number): Promise<any> {
    // Cari jadwal dengan menggunakan Prisma dan melakukan eager loading pada relasi yang dibutuhkan
    const jadwal = await this.prisma.jadwal.findFirst({
      where: {
        hariId: id, // Sesuaikan dengan struktur Prisma
      },
      include: {
        hari: true,
        jam_jadwal: {
          include: {
            jam_detail_jadwal: {
              include: {
                kelas: true,
                subject_code_entity: true,
              },
            },
          },
        },
      },
    });

    if (!jadwal) {
      throw new HttpException('Jadwal not found', HttpStatus.NOT_FOUND);
    }

    // Sort jam_detail berdasarkan kelas.id
    const sortedJamJadwal = jadwal.jam_jadwal.map((jam) => ({
      ...jam,
      jam_detail: jam.jam_detail_jadwal.sort((a, b) => a.kelas.id - b.kelas.id),
    }));

    const jadwalDto = {
      id: jadwal.id,
      hari: jadwal.hari,
      jam_jadwal: sortedJamJadwal.map((jam) => ({
        id: jam.id,
        jam_mulai: jam.jam_mulai,
        jam_selesai: jam.jam_selesai,
        is_rest: jam.is_rest,
        jam_detail: jam.jam_detail.map((detail) => ({
          id: detail.id,
          kelas: {
            id: detail.kelas.id,
            nama_kelas: detail.kelas.nama_kelas,
          },
          subject_code: {
            id: detail.subject_code_entity.id,
            code: detail.subject_code_entity.code,
          },
        })),
      })),
    };

    return {
      status: 'Success',
      message: 'OKe',
      data: jadwalDto,
    };
  }

  async create(createJadwalDto: CreateJadwalDto): Promise<any> {
    const { hari_id, jam_jadwal } = createJadwalDto;
    // Check if Hari and User records exist
    const hari = await this.prisma.hari.findUnique({
      where: { id: hari_id },
    });
    if (!hari) {
      throw new HttpException('Hari not found', HttpStatus.NOT_FOUND);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: this.req.user.id },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Check if Jadwal for the given day already exists
    const existingJadwal = await this.prisma.jadwal.findFirst({
      where: { hariId: hari_id },
      include: { hari: true },
    });

    if (existingJadwal) {
      throw new HttpException(
        `Jadwal for ${existingJadwal.hari.nama_hari} already exists`,
        HttpStatus.FOUND,
      );
    }

    // Create the main Jadwal entity
    const jadwal = await this.prisma.jadwal.create({
      data: {
        hariId: hari_id,
        created_by: this.req.user.id,
      },
    });

    // Loop through each JamJadwal DTO to create related entities
    let lastSavedJamJadwal: any;
    for (const jamJadwalDto of jam_jadwal) {
      // Create the JamJadwal entity
      const jamJadwal = await this.prisma.jam_jadwal.create({
        data: {
          jam_mulai: jamJadwalDto.jam_mulai,
          jam_selesai: jamJadwalDto.jam_selesai,
          is_rest: jamJadwalDto.is_rest,
          jadwal_id: jadwal.id, // Note the correct field name in Prisma
        },
      });

      lastSavedJamJadwal = jamJadwal;

      // Loop through each JamDetailJadwal DTO to create related entities
      for (const jdDto of jamJadwalDto.jam_detail) {
        // Find the related Kelas and SubjectCode entities
        const kelas = await this.prisma.kelas.findUnique({
          where: { id: jdDto.kelas },
        });
        const subject_code = await this.prisma.subject_code_entity.findUnique({
          where: { id: parseInt(jdDto.subject_code, 10) },
        });

        // Check if Kelas and SubjectCode entities are found
        if (!kelas || !subject_code) {
          throw new HttpException(
            'Kelas or Subject Code not found',
            HttpStatus.NOT_FOUND,
          );
        }

        // Create the JamDetailJadwal entity
        await this.prisma.jam_detail_jadwal.create({
          data: {
            jamJadwalId: lastSavedJamJadwal.id, // Note the correct field name in Prisma
            kelasId: kelas.id,
            subjectCodeId: subject_code.id,
          },
        });
      }
    }

    // Set the last JamJadwal's allSchedulesDone to true
    if (lastSavedJamJadwal) {
      await this.prisma.jam_jadwal.update({
        where: { id: lastSavedJamJadwal.id },
        data: { allSchedulesDone: true },
      });
    }

    return {
      status: 'Success',
      message: 'Jadwal created successfully',
      data: jadwal,
    };
  }

  async update(id: number, updateJadwalDto: UpdateJadwalDto): Promise<any> {
    // Find the existing Jadwal entity
    const jadwal = await this.prisma.jadwal.findUnique({
      where: { id: id },
      include: {
        jam_jadwal: {
          include: {
            jam_detail_jadwal: {
              include: {
                subject_code_entity: true,
                kelas: true,
              },
            },
          },
        },
      },
    });

    if (!jadwal) {
      throw new HttpException('Jadwal not found', HttpStatus.NOT_FOUND);
    }

    // Handle update for jam_jadwal
    if (updateJadwalDto.jam_jadwal) {
      for (const jamJadwalDto of updateJadwalDto.jam_jadwal) {
        let jamJadwal = jadwal.jam_jadwal.find(
          (jj) => jj.id === jamJadwalDto.id,
        );

        if (jamJadwal) {
          // Update existing jamJadwal
          await this.prisma.jam_jadwal.update({
            where: { id: jamJadwal.id },
            data: {
              jam_mulai: jamJadwalDto.jam_mulai,
              jam_selesai: jamJadwalDto.jam_selesai,
              is_rest: jamJadwalDto.is_rest,
            },
          });

          // Track existing jamDetailJadwal IDs to handle deletions
          const existingDetailIds = jamJadwal.jam_detail_jadwal.map(
            (jd) => jd.id,
          );
          const updatedDetailIds = jamJadwalDto.jam_detail.map(
            (jdDto) => jdDto.id,
          );
          const detailIdsToDelete = existingDetailIds.filter(
            (id) => !updatedDetailIds.includes(id),
          );

          // Delete removed jamDetailJadwal
          if (detailIdsToDelete.length > 0) {
            await this.prisma.jam_detail_jadwal.deleteMany({
              where: { id: { in: detailIdsToDelete } },
            });
          }

          // Update existing or add new jamDetailJadwal records
          for (const jdDto of jamJadwalDto.jam_detail) {
            let jamDetailJadwal = jamJadwal.jam_detail_jadwal.find(
              (jd) => jd.id === jdDto.id,
            );
            if (jamDetailJadwal) {
              // Find subject_code and kelas
              const subject_code =
                await this.prisma.subject_code_entity.findUnique({
                  where: { id: jdDto.subject_code },
                });
              const kelas = await this.prisma.kelas.findUnique({
                where: { id: jdDto.kelas },
              });

              if (!subject_code || !kelas) {
                throw new HttpException(
                  'Subject code or Kelas not found',
                  HttpStatus.NOT_FOUND,
                );
              }

              // Update existing jamDetailJadwal
              await this.prisma.jam_detail_jadwal.update({
                where: { id: jamDetailJadwal.id },
                data: {
                  subjectCodeId: subject_code.id,
                  kelasId: kelas.id,
                },
              });
            } else {
              // Create new jamDetailJadwal if not exists
              const subject_code =
                await this.prisma.subject_code_entity.findUnique({
                  where: { id: jdDto.subject_code },
                });
              const kelas = await this.prisma.kelas.findUnique({
                where: { id: jdDto.kelas },
              });

              if (!subject_code || !kelas) {
                throw new HttpException(
                  'Subject code or Kelas not found',
                  HttpStatus.NOT_FOUND,
                );
              }

              await this.prisma.jam_detail_jadwal.create({
                data: {
                  jamJadwalId: jamJadwal.id,
                  subjectCodeId: subject_code.id,
                  kelasId: kelas.id,
                },
              });
            }
          }
        } else {
          // Create new jamJadwal and jamDetailJadwal records if not exists
          const newJamJadwal = await this.prisma.jam_jadwal.create({
            data: {
              jam_mulai: jamJadwalDto.jam_mulai,
              jam_selesai: jamJadwalDto.jam_selesai,
              is_rest: jamJadwalDto.is_rest,
              jadwal_id: jadwal.id,
            },
          });

          for (const jdDto of jamJadwalDto.jam_detail) {
            const subject_code =
              await this.prisma.subject_code_entity.findUnique({
                where: { id: jdDto.subject_code },
              });
            const kelas = await this.prisma.kelas.findUnique({
              where: { id: jdDto.kelas },
            });

            if (!subject_code || !kelas) {
              throw new HttpException(
                'Subject code or Kelas not found',
                HttpStatus.NOT_FOUND,
              );
            }

            await this.prisma.jam_detail_jadwal.create({
              data: {
                jamJadwalId: newJamJadwal.id,
                subjectCodeId: subject_code.id,
                kelasId: kelas.id,
              },
            });
          }
        }
      }
    }

    const updatedJadwal = await this.prisma.jadwal.update({
      where: { id: jadwal.id },
      data: {
        jam_jadwal: updateJadwalDto.jam_jadwal as any,
        hariId: updateJadwalDto.hari_id,
        updated_by: updateJadwalDto.updated_by.id, // Ensure this matches your Prisma schema
      },
    });

    return {
      status: 'Success',
      message: 'OKe',
      data: updatedJadwal,
    };
  }

  async findAll(query: FindAllJadwalDTO): Promise<any> {
    const { hari } = query;
    const filter: any = {};

    if (hari) {
      filter.hari = {
        nama_hari: {
          contains: hari,
          mode: 'insensitive',
        },
      };
    }

    // Fetch jadwal entities with the necessary relations
    const jadwalList = await this.prisma.jadwal.findMany({
      where: filter,
      include: {
        hari: true,
        jam_jadwal: {
          include: {
            jam_detail_jadwal: {
              include: {
                kelas: true,
                subject_code_entity: {
                  include: {
                    guru: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Extract JamJadwal IDs for efficient filtering
    const jamJadwalIds = jadwalList.flatMap((jadwal) =>
      jadwal.jam_jadwal.map((jj) => jj.id),
    );

    // Fetch all JamDetailJadwal with the specified relations and filter
    const jamDetailList = await this.prisma.jam_detail_jadwal.findMany({
      where: {
        jam_jadwal: {
          id: {
            in: jamJadwalIds,
          },
        },
      },
      include: {
        kelas: true,
        subject_code_entity: {
          include: {
            guru: {
              include: {
                user: true,
              },
            },
          },
        },
        jam_jadwal: true,
      },
    });

    // Helper function to convert time string to a comparable format
    const timeStringToDate = (timeString: string) => {
      const [hours, minutes, seconds] = timeString.split(':').map(Number);
      return new Date(0, 0, 0, hours, minutes, seconds);
    };

    // Construct the final response object with sorting by jam_mulai
    const hasil = jadwalList.map((jadwal) => ({
      id: jadwal.id,
      hari: jadwal.hari,
      jam_jadwal: jadwal.jam_jadwal
        .sort(
          (a, b) =>
            timeStringToDate(a.jam_mulai).getTime() -
            timeStringToDate(b.jam_mulai).getTime(),
        ) // Sort by jam_mulai
        .map((jamJadwal) => ({
          id: jamJadwal.id,
          jam_mulai: jamJadwal.jam_mulai,
          jam_selesai: jamJadwal.jam_selesai,
          is_rest: jamJadwal.is_rest,
          allSchedulesDone: jamJadwal.allSchedulesDone,
          jam_detail: jamDetailList
            .filter((detail) => detail.jam_jadwal.id === jamJadwal.id)
            .sort((a, b) =>
              a.kelas.nama_kelas.localeCompare(b.kelas.nama_kelas),
            ) // Sort by nama_kelas
            .map((detail) => ({
              id: detail.id,
              id_subject_code: detail.subject_code_entity?.id || null,
              nama_kelas: detail.kelas?.nama_kelas || null,
              subject_code: detail.subject_code_entity?.code || null,
              nama_guru: detail.subject_code_entity?.guru.user.nama || null,
              id_guru: detail.subject_code_entity.guru.id,
            })),
        })),
    }));

    return {
      status: 'Success',
      message: 'OKe',
      data: hasil,
    };
  }

  async delete(id: number): Promise<any> {
    const jadwal = await this.prisma.jadwal.findUnique({
      where: { id: id },
      include: { hari: true },
    });

    if (!jadwal) {
      throw new HttpException('Jadwal not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.jadwal.delete({
      where: { id: id },
    });

    return {
      status: 'Success',
      message: 'OKe',
      data: jadwal,
    };
  }

  async deleteBulk(data: number[]): Promise<any> {
    const jadwals = await this.prisma.jadwal.findMany({
      where: { id: { in: data } },
    });

    if (jadwals.length === 0) {
      throw new HttpException('Jadwal not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.jadwal.deleteMany({
      where: { id: { in: data } },
    });

    return {
      status: 'Success',
      message: 'OKe',
      data: jadwals,
    };
  }

  // private async findUserByRole(userId: number): Promise<Murid | Guru> {
  //   const siswa = await this.siswaRepository.findOne({
  //     where: { id: userId },
  //     relations: ['kelas', 'user'],
  //   });

  //   if (siswa) return siswa;

  //   const guru = await this.guruRepository.findOne({
  //     where: { id: userId },
  //     relations: ['subject_code', 'user'],
  //   });

  //   return guru || null;
  // }

  // private findJamDetail(
  //   jamDetailList: JamDetailJadwal[],
  //   user: Murid | Guru,
  // ): JamDetailJadwal | null {
  //   if ('kelas' in user) {
  //     // Siswa
  //     return jamDetailList.find((detail) => detail.kelas.id === user.kelas.id);
  //   } else if ('subject_code' in user) {
  //     // Guru
  //     return jamDetailList.find(
  //       (detail) => detail.subject_code.guru.id === user.id,
  //     );
  //   }
  //   return null;
  // }

  private checkIfAllSchedulesDone(
    schedules: any[],
    currentTime: Date,
    currentDate: string,
  ): boolean {
    const lastSchedule = schedules[schedules.length - 1];
    const lastJamSelesai = lastSchedule
      ? new Date(`${currentDate}T${lastSchedule.jamJadwal.jam_selesai}`)
      : null;

    return (
      lastSchedule?.jamJadwal.allSchedulesDone ||
      (lastJamSelesai && currentTime > lastJamSelesai)
    );
  }
}
