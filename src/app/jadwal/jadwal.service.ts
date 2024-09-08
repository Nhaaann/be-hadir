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
  getTodayDayName,
  // getTodayDayName,
  isCurrentTimeBetween,
} from '../../utils/helper function/getDay';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  guru,
  jadwal,
  jam_detail_jadwal,
  jam_jadwal,
  murid,
} from '@prisma/client';
import BaseResponse from '../../utils/response/base.response';

@Injectable()
export class JadwalService extends BaseResponse {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private req: any,
  ) {
    super();
  }

  async getCurrentJamDetailUser(): Promise<ResponseSuccess> {
    const todayDayName = getTodayDayName();
    const jadwalList = await this.prisma.jadwal.findMany({
      where: {
        hari: {
          nama_hari: todayDayName,
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

    // Check if the user is a student (murid)
    const murid = await this.prisma.murid.findUnique({
      where: { id: this.req.user.id },
      include: {
        kelas: true,
        user: {
          include: {
            murid: true,
          },
        },
      },
    });

    // Check if the user is a teacher (guru)
    const guru = await this.prisma.guru.findUnique({
      where: { id: this.req.user.id },
      include: {
        subject_code_entity: true,
        user: {
          include: {
            guru: true,
          },
        },
      },
    });

    if (!murid && !guru) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const currentTime = new Date();
    const currentDate = currentTime.toISOString().split('T')[0];

    const todaysSchedules = jadwalList
      .flatMap((jadwal) =>
        jadwal.jam_jadwal.map((jamJadwal) => {
          let jamDetail = null;

          if (murid) {
            // If the user is a student
            jamDetail = jamJadwal.jam_detail_jadwal.find(
              (detail) => detail.kelas.id === murid.kelas.id,
            );
          } else if (guru) {
            // If the user is a teacher
            jamDetail = jamJadwal.jam_detail_jadwal.find(
              (detail) => detail.subject_code_entity.guru.id === guru.id,
            );
          }

          return {
            jamJadwal,
            jamDetail,
          };
        }),
      )
      .filter((item) => item.jamDetail);

    todaysSchedules.sort((a, b) => {
      const jamMulaiA = new Date(`${currentDate}T${a.jamJadwal.jam_mulai}`);
      const jamMulaiB = new Date(`${currentDate}T${b.jamJadwal.jam_mulai}`);
      return jamMulaiA.getTime() - jamMulaiB.getTime();
    });

    const allSchedulesDone = this.checkIfAllSchedulesDone(
      todaysSchedules,
      currentTime,
      currentDate,
    );

    for (const schedule of todaysSchedules) {
      const jamMulai = new Date(
        `${currentDate}T${schedule.jamJadwal.jam_mulai}`,
      );
      const jamSelesai = new Date(
        `${currentDate}T${schedule.jamJadwal.jam_selesai}`,
      );

      if (currentTime >= jamMulai && currentTime <= jamSelesai) {
        let isAbsen = false;
        let isMasukKelas = false;

        if (murid) {
          // Check attendance status for the student
          const absenSiswa = await this.prisma.absen_siswa.findFirst({
            where: {
              absenKelasId: schedule.jamDetail.id,
              userId: murid.id,
            },
          });
          isAbsen = !!absenSiswa;
          isMasukKelas = !!absenSiswa;
        } else if (guru) {
          // Check attendance status for the teacher
          const absenGuru = await this.prisma.absen_guru.findFirst({
            where: {
              jamDetailJadwalId: schedule.jamDetail.id,
              guru_id: guru.id,
            },
          });

          const absenKelas = await this.prisma.absen_kelas.findFirst({
            where: {
              jamDetailJadwalId: schedule.jamDetail.id,
              guruId: guru.id,
            },
          });

          isAbsen = !!absenGuru;
          isMasukKelas = !!absenKelas;
        }

        return this._success('Jam detail found successfully', {
          id_user: murid ? murid.user.nama : guru.user.nama,
          nama_user: murid ? murid.user.nama : guru.user.nama,
          role: murid ? murid.user.role : guru.user.role,
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
        });
      }
    }

    if (todaysSchedules.length > 0) {
      const nextSchedule = todaysSchedules[0];
      const isJadwalHabis =
        allSchedulesDone ||
        currentTime >=
          new Date(`${currentDate}T${nextSchedule.jamJadwal.jam_selesai}`);
      const isMulai =
        !isJadwalHabis &&
        currentTime >=
          new Date(`${currentDate}T${nextSchedule.jamJadwal.jam_mulai}`);

      return this._success('Jam detail found successfully', {
        id_user: murid ? murid.user.id : guru.user.id,
        nama_user: murid ? murid.user.nama : guru.user.nama,
        role: murid ? murid.user.role : guru.user.role,
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
      });
    }

    throw new HttpException(
      `Jam detail not found for today (${todayDayName}), User: ${
        murid ? murid.user.nama : guru.user.nama
      } (${murid ? murid.user.role : guru.user.role})`,
      HttpStatus.NOT_FOUND,
    );
  }

  async getCurrentJamDetailIdSiswa(): Promise<ResponseSuccess> {
    const todayDayName = getTodayDayName();

    const jadwalList = await this.prisma.jadwal.findMany({
      where: {
        hari: {
          nama_hari: todayDayName,
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
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log('Jadwal List:', JSON.stringify(jadwalList, null, 2));

    const murid = await this.prisma.murid.findUnique({
      where: { id: this.req.user.id },
      include: {
        kelas: true,
        user: true,
      },
    });

    if (!murid) {
      throw new HttpException('Siswa not found', HttpStatus.NOT_FOUND);
    }

    console.log('Siswa:', JSON.stringify(murid, null, 2));

    const currentTime = new Date();
    const currentDate = currentTime.toISOString().split('T')[0];

    const todaysSchedules = jadwalList
      .flatMap((jadwal) =>
        jadwal.jam_jadwal
          .map((jamJadwal) => ({
            jamJadwal,
            jamDetail: jamJadwal.jam_detail_jadwal.find(
              (detail) => detail.kelas.id === murid.kelas.id,
            ),
          }))
          .filter((item) => item.jamDetail),
      )
      .sort((a, b) => {
        const jamMulaiA = new Date(`${currentDate}T${a.jamJadwal.jam_mulai}`);
        const jamMulaiB = new Date(`${currentDate}T${b.jamJadwal.jam_mulai}`);
        return jamMulaiA.getTime() - jamMulaiB.getTime();
      });

    const allSchedulesDone = todaysSchedules.every(
      (schedule) => schedule.jamJadwal.allSchedulesDone,
    );

    for (const schedule of todaysSchedules) {
      const jamMulai = new Date(
        `${currentDate}T${schedule.jamJadwal.jam_mulai}`,
      );
      const jamSelesai = new Date(
        `${currentDate}T${schedule.jamJadwal.jam_selesai}`,
      );

      if (currentTime >= jamMulai && currentTime <= jamSelesai) {
        const absenSiswa = await this.prisma.absen_siswa.findFirst({
          where: {
            absen_kelas: { id: schedule.jamDetail.id },
            user: { id: this.req.user.id },
          },
          include: {
            absen_kelas: true,
          },
        });

        const isAbsen = !!absenSiswa;
        const isMasukKelas = !!absenSiswa;
        const isMulai = !allSchedulesDone && currentTime >= jamMulai;

        return this._success('Jam detail found successfully', {
          nama_user: this.req.user.id,
          jamDetailId: schedule.jamDetail.id,
          jam_mulai: schedule.jamJadwal.jam_mulai,
          jam_selesai: schedule.jamJadwal.jam_selesai,
          mapel: schedule.jamDetail.subject_code_entity.mapel.nama_mapel,
          kelas: schedule.jamDetail.kelas.nama_kelas,
          is_absen: isAbsen,
          is_masuk_kelas: isMasukKelas,
          is_mulai: isMulai,
          is_jadwal_habis: allSchedulesDone,
        });
      }
    }

    if (todaysSchedules.length > 0) {
      const nextSchedule = todaysSchedules[0];
      const isJadwalHabis =
        allSchedulesDone ||
        currentTime >=
          new Date(`${currentDate}T${nextSchedule.jamJadwal.jam_selesai}`);
      const isMulai =
        !isJadwalHabis &&
        currentTime >=
          new Date(`${currentDate}T${nextSchedule.jamJadwal.jam_mulai}`);

      return this._success('Jam detail found successfully', {
        nama_user: murid.user.nama,
        jamDetailId: nextSchedule.jamDetail.id,
        jam_mulai: nextSchedule.jamJadwal.jam_mulai,
        jam_selesai: nextSchedule.jamJadwal.jam_selesai,
        mapel: nextSchedule.jamDetail.subject_code_entity.mapel.nama_mapel,
        kelas: nextSchedule.jamDetail.kelas.nama_kelas,
        is_absen: false,
        is_masuk_kelas: false,
        is_mulai: isMulai,
        is_jadwal_habis: isJadwalHabis,
      });
    }

    throw new HttpException(
      'Jam detail not found for today',
      HttpStatus.NOT_FOUND,
    );
  }

  async getCurrentJamDetailIdGuru(): Promise<ResponseSuccess> {
    const todayDayName = getTodayDayName();

    const jadwalList = await this.prisma.jadwal.findMany({
      where: {
        hari: {
          nama_hari: todayDayName,
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

    const guru = await this.prisma.guru.findUnique({
      where: { id: this.req.user.id },
      include: {
        subject_code_entity: true,
        user: true
      },
    });

    if (!guru) {
      throw new HttpException('Guru not found', HttpStatus.NOT_FOUND);
    }

    const currentTime = new Date();
    const currentDate = currentTime.toISOString().split('T')[0];

    const todaysSchedules = jadwalList
      .flatMap((jadwal) =>
        jadwal.jam_jadwal.map((jamJadwal) => ({
          jamJadwal,
          jamDetail: jamJadwal.jam_detail_jadwal.find(
            (detail) => detail.subject_code_entity.guru.id === guru.id,
          ),
        })),
      )
      .filter((item) => item.jamDetail);

    todaysSchedules.sort((a, b) => {
      const jamMulaiA = new Date(`${currentDate}T${a.jamJadwal.jam_mulai}`);
      const jamMulaiB = new Date(`${currentDate}T${b.jamJadwal.jam_mulai}`);
      return jamMulaiA.getTime() - jamMulaiB.getTime();
    });

    const lastSchedule = todaysSchedules[todaysSchedules.length - 1];
    const lastJamSelesai = lastSchedule
      ? new Date(`${currentDate}T${lastSchedule.jamJadwal.jam_selesai}`)
      : null;

    const allSchedulesDone =
      lastSchedule?.jamJadwal.allSchedulesDone ||
      (lastJamSelesai && currentTime > lastJamSelesai);

    let isJadwalHabis = false;
    let isMulai = false;
    let isJadwalHabisHariIni = allSchedulesDone;

    for (const schedule of todaysSchedules) {
      const jamMulai = new Date(
        `${currentDate}T${schedule.jamJadwal.jam_mulai}`,
      );
      const jamSelesai = new Date(
        `${currentDate}T${schedule.jamJadwal.jam_selesai}`,
      );

      isMulai = currentTime >= jamMulai && currentTime <= jamSelesai;
      isJadwalHabis = currentTime >= jamSelesai;

      // if (isMulai) {
        const absenGuru = await this.prisma.absen_guru.findFirst({
          where: {
            jam_detail_jadwal: { id: schedule.jamDetail.id },
            guru: { id: this.req.user.id },
          },
          include: { jam_detail_jadwal: true },
        });

        const absenKelas = await this.prisma.absen_kelas.findFirst({
          where: {
            jam_detail_jadwal: { id: schedule.jamDetail.id },
            guru: { id: this.req.user.id },
          },
        });

        const isAbsen = !!absenGuru;
        const isMasukKelas = !!absenKelas;

        return this._success('Jam detail found successfully', {
          nama_user: guru.user.nama,
          jamDetailId: schedule.jamDetail.id,
          jam_mulai: schedule.jamJadwal.jam_mulai,
          jam_selesai: schedule.jamJadwal.jam_selesai,
          mapel: schedule.jamDetail.subject_code_entity.mapel.nama_mapel,
          kelas: schedule.jamDetail.kelas.nama_kelas,
          is_absen: isAbsen,
          is_masuk_kelas: isMasukKelas,
          is_mulai: true,
          is_jadwal_habis: false,
          is_jadwal_habis_hari_ini: isJadwalHabisHariIni,
        });
      }
    // }

    if (todaysSchedules.length > 0) {
      const nextSchedule = todaysSchedules[0];
      isJadwalHabis =
        allSchedulesDone ||
        currentTime >=
          new Date(`${currentDate}T${nextSchedule.jamJadwal.jam_selesai}`);
      isMulai =
        !isJadwalHabis &&
        currentTime >=
          new Date(`${currentDate}T${nextSchedule.jamJadwal.jam_mulai}`);

      return this._success('Jam detail found successfullyyy', {
        nama_user: guru.user.nama,
        jamDetailId: nextSchedule.jamDetail.id,
        jam_mulai: nextSchedule.jamJadwal.jam_mulai,
        jam_selesai: nextSchedule.jamJadwal.jam_selesai,
        mapel: nextSchedule.jamDetail.subject_code_entity.mapel.nama_mapel,
        kelas: nextSchedule.jamDetail.kelas.nama_kelas,
        is_absen: false,
        is_masuk_kelas: false,
        is_mulai: isMulai,
        is_jadwal_habis: isJadwalHabis,
        is_jadwal_habis_hari_ini: isJadwalHabisHariIni,
      });
    }

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

    // Gunakan transaksi untuk memastikan atomicity
    await this.prisma.$transaction(async (prisma) => {
      // Periksa apakah Hari dan User ada
      const hari = await prisma.hari.findUnique({
        where: { id: Number(hari_id) },
      });
      if (!hari) {
        throw new HttpException('Hari not found', HttpStatus.NOT_FOUND);
      }

      const user = await prisma.user.findUnique({
        where: { id: this.req.user.id },
      });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Periksa apakah Jadwal untuk hari yang diberikan sudah ada
      const existingJadwal = await prisma.jadwal.findFirst({
        where: { hariId: Number(hari_id) },
        include: { hari: true },
      });

      if (existingJadwal) {
        throw new HttpException(
          `Jadwal for ${existingJadwal.hari.nama_hari} already exists`,
          HttpStatus.FOUND,
        );
      }

      const jadwal = await prisma.jadwal.create({
        data: {
          hariId: Number(hari_id),
          created_by: user.id,
          jam_jadwal: {
            create: jam_jadwal.map((jam) => ({
              jam_mulai: jam.jam_mulai,
              jam_selesai: jam.jam_selesai,
              is_rest: jam.is_rest,
              jam_detail_jadwal: {
                create: jam.jam_detail.map((detail) => ({
                  kelasId: detail.kelas,
                  subjectCodeId: Number(detail.subject_code),
                })),
              },
            })),
          },
        },
      });

      return {
        status: 'Success',
        message: 'Jadwal created successfully',
        data: jadwal,
      };
    });
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
      where: {
        id: id,
      },
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

  private async getAbsenStatus(
    schedule: any,
    user: murid | guru,
  ): Promise<{ isAbsen: boolean; isMasukKelas: boolean }> {
    if ('kelas' in user) {
      // Siswa
      const absenSiswa = await this.prisma.absen_siswa.findFirst({
        where: {
          absenKelasId: schedule.jam_detail_jadwal.id,
          userId: user.id,
        },
      });
      return {
        isAbsen: !!absenSiswa,
        isMasukKelas: !!absenSiswa,
      };
    } else if ('subject_code' in user) {
      // Guru
      const absenGuru = await this.prisma.absen_guru.findFirst({
        where: {
          jamDetailJadwalId: schedule.jam_detail_jadwal.id,
          guru_id: user.id,
        },
      });

      const absenKelas = await this.prisma.absen_kelas.findFirst({
        where: {
          jamDetailJadwalId: schedule.jamDetail.id,
          guruId: user.id,
        },
      });

      return {
        isAbsen: !!absenGuru,
        isMasukKelas: !!absenKelas,
      };
    }
    return { isAbsen: false, isMasukKelas: false };
  }

  private findJamDetail(
    jamDetailList: any[],
    user: murid | guru | any,
  ): jam_detail_jadwal | null {
    if ('kelas' in user) {
      // Siswa
      return jamDetailList.find((detail) => detail.kelas.id === user.kelasId);
    } else if ('subject_code' in user) {
      // Guru
      return jamDetailList.find(
        (detail) => detail.subject_code?.guru.id === user.id, // Properti sudah dapat diakses
      );
    }
    return null;
  }

  private checkIfAllSchedulesDone(
    schedules: Array<{ jamJadwal: { jam_selesai?: string } }>,
    currentTime: Date,
    currentDate: string,
  ): boolean {
    // Periksa jika schedules adalah array dan tidak kosong
    if (!schedules || schedules.length === 0) {
      return false;
    }

    return schedules.every((schedule) => {
      const jamSelesai = schedule.jamJadwal.jam_selesai
        ? new Date(`${currentDate}T${schedule.jamJadwal.jam_selesai}`)
        : null;
      return jamSelesai && currentTime > jamSelesai;
    });
  }
}
