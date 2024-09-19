import { Injectable } from '@nestjs/common';
import { AbsenGateway } from './app/absen/absen.gateway';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly absenGateway: AbsenGateway,
  ) {}

  getHello(): string {
    return 'Hai';
  }

  async updateAttendanceOnLogin() {
    const currentTime = new Date();
    const currentDate = currentTime.toISOString().split('T')[0];
    const currentDay = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
    }).format(currentTime);

    console.log(`Current Time: ${currentTime}, Current Day: ${currentDay}`);

    // Fetch all past schedules that haven't been processed
    const pastSchedules = await this.prisma.jadwal.findMany({
      where: {
        hari: {
          nama_hari: {
            not: currentDay as any,
          },
        },
      },
      include: {
        hari: true,
        jam_jadwal: {
          include: {
            jam_detail_jadwal: {
              include: {
                subject_code_entity: {
                  include: {
                    guru: true,
                    mapel: true,
                  },
                },
                kelas: true,
              },
            },
          },
        },
      },
    });

    // Process past schedules
    for (const jadwal of pastSchedules) {
      for (const jamJadwal of jadwal.jam_jadwal) {
        for (const jamDetailJadwal of jamJadwal.jam_detail_jadwal) {
          await this.processAttendance(
            jamDetailJadwal,
            jadwal.hari.nama_hari,
            true,
          );
        }
      }
    }

    // Process current day's schedule
    const currentSchedule = await this.prisma.jadwal.findFirst({
      where: {
        hari: {
          nama_hari: currentDay as any,
        },
      },
      include: {
        jam_jadwal: {
          include: {
            jam_detail_jadwal: {
              include: {
                subject_code_entity: {
                  include: {
                    guru: true,
                    mapel: true,
                  },
                },
                kelas: true,
              },
            },
          },
        },
      },
    });

    if (currentSchedule) {
      for (const jamJadwal of currentSchedule.jam_jadwal) {
        const jamSelesai = new Date(`${currentDate}T${jamJadwal.jam_selesai}`);
        if (currentTime > jamSelesai) {
          for (const jamDetailJadwal of jamJadwal.jam_detail_jadwal) {
            await this.processAttendance(jamDetailJadwal, currentDay, false);
          }
        }
      }
    }

    console.log('Attendance update completed');
  }

  private async processAttendance(
    jamDetailJadwal: any,
    day: string,
    isPastDay: boolean,
  ) {
    const currentTime = new Date();
    const currentDate = currentTime.toISOString().split('T')[0];
    const jamMulai = new Date(
      `${currentDate}T${jamDetailJadwal.jam_jadwal.jam_mulai}`,
    );
    const jamSelesaiAlpha = new Date(jamMulai.getTime() + 45 * 60000);

    // Process teacher attendance
    const absentTeacher = await this.prisma.guru.findFirst({
      where: {
        id: jamDetailJadwal.subject_code_entity.guru.id,
        absen_guru: {
          none: {
            jamDetailJadwalId: jamDetailJadwal.id,
          },
        },
      },
      include: {
        user: true,
      },
    });

    if (absentTeacher) {
      await this.markTeacherAbsent(absentTeacher, jamDetailJadwal, currentTime);
    }

    const absentStudents = await this.prisma.murid.findMany({
      where: {
        kelas: { id: jamDetailJadwal.kelas.id },
        user: {
          absen_siswa: {
            none: {
              jamDetailJadwalId: jamDetailJadwal.id,
            },
          },
        },
      },
      include: {
        user: true,
      },
    });

    for (const absentStudent of absentStudents) {
      await this.markStudentAbsent(absentStudent, jamDetailJadwal, currentTime);
    }
  }

  private async markTeacherAbsent(
    teacher: any,
    jamDetailJadwal: any,
    currentTime: Date,
  ) {
    await this.prisma.absen_guru.create({
      data: {
        guru_id: teacher.id,
        jamDetailJadwalId: jamDetailJadwal.id,
        status: 'Alpha',
        waktu_absen: currentTime,
        jamJadwalId: jamDetailJadwal.jam_jadwal.id,
      },
    });

    const payload = {
      guruId: teacher.id.toString(),
      message: `Anda tercatat Alpha pada mata pelajaran ${jamDetailJadwal.subject_code_entity.mapel.nama_mapel}`,
    };

    this.absenGateway.server.to(payload.guruId).emit('notifGurus', payload);

    await this.prisma.notifikasi.create({
      data: {
        message: payload.message,
        userId: teacher.user.id,
        createdAt: new Date(),
      },
    });

    console.log(`Marked teacher ID: ${teacher.id} as Alpha`);
  }

  private async markStudentAbsent(
    student: any,
    jamDetailJadwal: any,
    currentTime: Date,
  ) {
    await this.prisma.absen_siswa.create({
      data: {
        user: {
          connect: {
            id: student.user.id,
          },
        },
        jam_detail_jadwal: {
          connect: {
            id: jamDetailJadwal.id,
          },
        },
        status: 'Alpha',
        waktu_absen: currentTime,
      },
    });

    const payload = {
      studentId: student.id.toString(),
      message: `Anda tercatat Alpha pada mata pelajaran ${jamDetailJadwal.subject_code_entity.mapel.nama_mapel}`,
    };

    this.absenGateway.server.to(payload.studentId).emit('notifSiswas', payload);

    await this.prisma.notifikasi.create({
      data: {
        message: payload.message,
        user: {
          connect: {
            id: student.user.id,
          },
        },
        createdAt: new Date(),
      },
    });

    console.log(`Marked student ID: ${student.id} as Alpha`);
  }
}
