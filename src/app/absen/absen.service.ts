/* eslint-disable @typescript-eslint/no-empty-function */
import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
// import { AbsenGuru } from './absen-guru/absen-guru.entity';
import {
  CreateAbsenGuruDto,
  CreateAbsenSiswaDto,
  CreateEnterClassGuruDto,
  CreateJurnalKegiatanDto,
  FilterAbsenDto,
} from './absen.dto';
// import { Jadwal } from '../jadwal/jadwal.entity';

// import { ResponseSuccess } from '../../utils/interface/respone';
// import { REQUEST } from '@nestjs/core';
// import { User } from '../auth/auth.entity';
// import { Role } from '../auth/roles.enum';
// import { JamJadwal } from '../jadwal/jam-jadwal.entity';
// import { JamDetailJadwal } from '../jadwal/jam-detail-jadwal.entity';
// import { Kelas } from '../kelas/kelas.entity';
// import { AbsenSiswa } from './absen-siswa/absen-siswa.entity';
// import { AbsenKelas } from './absen-kelas/absen-kelas.entity';
// import { Murid } from '../auth/siswa/siswa.entity';
// import { JurnalKegiatan } from './jurnal-kegiatan.entity';
// import { constants } from 'crypto';
// import { Guru } from '../auth/guru/guru.entity';
// import { SubjectCodeEntity } from '../subject_code/subject_code.entity';
import { AbsenGateway } from './absen.gateway';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { REQUEST } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Injectable()
export class AbsenService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private req: any,
  ) {}

  async enterClassGuru(
    createEnterClassGuruDto: CreateEnterClassGuruDto,
  ): Promise<any> {
    const { jam_detail } = createEnterClassGuruDto;

    // Find teacher data
    const guru = await this.prisma.guru.findUnique({
      where: { id: this.req.user.id },
      include: { jam_detail_jadwal: true },
    });

    // Check for existing entry
    const existingEntry = await this.prisma.absen_kelas.findUnique({
      where: { id: jam_detail },
    });

    if (existingEntry) {
      throw new HttpException('Guru sudah masuk kelas', HttpStatus.CONFLICT);
    }

    // Fetch schedule detail
    const jamDetailJadwal = await this.prisma.jam_detail_jadwal.findUnique({
      where: { id: jam_detail },
      include: { jam_jadwal: true, kelas: true },
    });

    if (!guru || !jamDetailJadwal) {
      throw new HttpException(
        'User or Jam Detail Jadwal not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const kodeKelas = this.generateClassCode();
    const absenKelas = await this.prisma.absen_kelas.create({
      data: {
        id: jam_detail,
        kelasId: jamDetailJadwal.kelas.id,
        guruId: guru.id,
        jamDetailJadwalId: jamDetailJadwal.id,
        jamJadwalId: jamDetailJadwal.jam_jadwal.id,
        tanggal: new Date(),
        kode_kelas: kodeKelas,
      },
    });

    return {
      status: 'Success',
      message: 'OKe',
      data: absenKelas,
    };
  }

  async keluarKelasGuru(
    createJurnalKegiatanDto: CreateJurnalKegiatanDto,
    jam_detail_id: number,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: this.req.user.id },
      include: { guru: true },
    });

    const jamDetailJadwal = await this.prisma.jam_detail_jadwal.findUnique({
      where: { id: jam_detail_id },
      include: {
        jam_jadwal: true,
        subject_code_entity: { include: { mapel: true } },
        kelas: true,
      },
    });

    if (!user || !jamDetailJadwal) {
      throw new HttpException(
        'User or Jam Detail Jadwal not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.guru) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          guru: {
            update: {
              where: { id: user.id },
              data: { jadwal_detail_id: null },
            },
          },
        },
      });
    } else {
      throw new HttpException('Guru not found for user', HttpStatus.NOT_FOUND);
    }

    const absenGuru = await this.prisma.absen_guru.findFirst({
      where: { guru_id: this.req.user.id },
      include: { guru: { include: { user: true } } },
    });

    const jurnalKegiatan = await this.prisma.jurnal_kegiatan.create({
      data: {
        jamJadwalId: jamDetailJadwal.jam_jadwal.id,
        absenGuruId: absenGuru.id,
        jamDetailJadwalId: jamDetailJadwal.id,
        matapelajaran: jamDetailJadwal.subject_code_entity.mapel.nama_mapel,
        materi: createJurnalKegiatanDto.materi,
        kendala: createJurnalKegiatanDto.kendala,
      },
    });

    const absenKelas = await this.prisma.absen_kelas.findFirst({
      where: { jamDetailJadwalId: jamDetailJadwal.id },
      include: { absen_siswa: true },
    });

    if (!absenKelas) {
      throw new NotFoundException('Absen Kelas not found');
    }

    await this.prisma.absen_siswa.updateMany({
      where: { absenKelasId: absenKelas.id },
      data: { absenKelasId: null },
    });

    await this.prisma.absen_kelas.delete({
      where: { id: absenKelas.id },
    });

    const students = await this.prisma.murid.findMany({
      where: { kelasId: jamDetailJadwal.kelas.id },
    });

    for (const student of students) {
      await this.prisma.murid.update({
        where: { id: student.id },
        data: { jamDetailJadwal_id: null },
      });
    }

    return {
      status: 'Success',
      message: 'OKe',
      data: jurnalKegiatan,
    };
  }

  async getAbsenKelasDetail(id: number): Promise<any> {
    const absenKelas = await this.prisma.absen_kelas.findUnique({
      where: { id },
      include: {
        kelas: {
          include: {
            murid: true,
          },
        },
        jam_jadwal: true,
        jam_detail_jadwal: {
          include: {
            subject_code_entity: {
              include: {
                mapel: true,
              },
            },
          },
        },
        absen_siswa: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!absenKelas) {
      throw new HttpException('Absen Kelas not found', HttpStatus.NOT_FOUND);
    }

    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const totalSiswa = absenKelas.kelas.murid.length;
    console.log(totalSiswa);
    const jumlahHadir = absenKelas.absen_siswa.filter(
      (siswa) => siswa.status === 'Hadir',
    ).length;
    const jumlahTelat = absenKelas.absen_siswa.filter(
      (siswa) => siswa.status === 'Telat',
    ).length;
    const jumlahAlpha = absenKelas.absen_siswa.filter(
      (siswa) => siswa.status === 'Alpha',
    ).length;

    const data = {
      id: absenKelas.id,
      kode_kelas: absenKelas.kode_kelas,
      nama_kelas: absenKelas.kelas.nama_kelas,
      nama_mapel:
        absenKelas.jam_detail_jadwal.subject_code_entity.mapel.nama_mapel,
      jam_mulai: absenKelas.jam_jadwal.jam_mulai,
      jam_selesai: absenKelas.jam_jadwal.jam_selesai,
      subject_code: absenKelas.jam_detail_jadwal.subject_code_entity.code,
      jumlah_siswa: totalSiswa,
      jumlah_hadir: jumlahHadir,
      jumlah_telat: jumlahTelat,
      jumlah_alpha: jumlahAlpha,
      daftar_siswa: absenKelas.absen_siswa.map((siswa) => ({
        id: siswa.user.id,
        nama: siswa.user.nama,
        status: siswa.status,
        tanggal: formattedDate,
        waktu_masuk: new Date(siswa.waktu_absen).toLocaleDateString('en-GB', {
          minute: '2-digit',
          hour: '2-digit',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        waktu_keluar: null,
      })),
    };

    return {
      status: 'Success',
      message: 'OKe',
      data: data,
    };
  }
  async deleteAbsenKelas(id: number): Promise<any> {
    const cek = await this.prisma.absen_kelas.findUnique({
      where: { id },
    });

    if (!cek) {
      throw new HttpException('Absen kelas not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.absen_kelas.delete({
      where: { id },
    });

    return {
      status: 'Success',
      message: 'OKe',
    };
  }
  async listAbsenKelas(): Promise<any> {
    const absenKelasList = await this.prisma.absen_kelas.findMany({
      include: {
        kelas: true,
        user: true,
        absen_siswa: {
          include: {
            user: true,
          },
        },
        jam_detail_jadwal: {
          include: {
            subject_code_entity: {
              include: {
                mapel: true,
              },
            },
          },
        },
      },
    });

    const data = absenKelasList.map((absenKelas) => ({
      id: absenKelas.id,
      nama_kelas: absenKelas.kelas.nama_kelas,
      code_kelas: absenKelas.kode_kelas,
      nama_mapel:
        absenKelas.jam_detail_jadwal.subject_code_entity.mapel.nama_mapel,
      subject_code: absenKelas.jam_detail_jadwal.subject_code_entity.code,
      guru: absenKelas.user.nama,
      daftar_siswa: absenKelas.absen_siswa.map((siswa) => ({
        id: siswa.user.id,
        nama: siswa.user.nama,
        status: siswa.status,
        waktu_absen: siswa.waktu_absen,
      })),
    }));

    return {
      status: 'Success',
      message: 'OKe',
      data: data,
    };
  }

  async delete(id: number): Promise<any> {
    const absen = await this.prisma.absen_kelas.findUnique({
      where: { id },
    });

    if (!absen) {
      throw new HttpException('Attendance not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.absen_kelas.delete({
      where: { id },
    });

    return {
      status: 'Success',
      message: 'OKe',
      data: absen,
    };
  }
  private generateClassCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  async list(
    startDateFilter?: string,
    endDateFilter?: string,
    roleFilter?: string,
  ): Promise<any> {
    // Setup options for filtering date range
    const dateFilter =
      startDateFilter && endDateFilter
        ? {
            waktu_absen: {
              gte: new Date(new Date(startDateFilter).setHours(0, 0, 0, 0)),
              lte: new Date(new Date(endDateFilter).setHours(23, 59, 59, 999)),
            },
          }
        : {};

    // Initialize arrays to store absences based on role filter
    let siswaAbsens = [];
    let guruAbsens = [];

    // Fetch data based on roleFilter or fetch both if no roleFilter
    if (!roleFilter || roleFilter === 'siswa') {
      siswaAbsens = await this.prisma.absen_siswa.findMany({
        where: dateFilter,
        include: {
          user: true,
          absen_kelas: { include: { kelas: true } },
          jam_detail_jadwal: {
            include: {
              jam_jadwal: { include: { jadwal: { include: { hari: true } } } },
              subject_code_entity: true,
            },
          },
        },
      });
    }

    if (!roleFilter || roleFilter === 'guru') {
      guruAbsens = await this.prisma.absen_guru.findMany({
        where: dateFilter,
        include: {
          guru: {
            include: {
              user: true,
            },
          },
          absen_kelas: { include: { kelas: true } },
          jam_detail_jadwal: {
            include: {
              jam_jadwal: { include: { jadwal: { include: { hari: true } } } },
              subject_code_entity: true,
              kelas: true,
            },
          },
        },
      });
    }

    // Format data for both siswa and guru absences
    const formattedSiswaAbsens = siswaAbsens.map((absen) => ({
      id: absen.id,
      nama: absen.user?.nama || 'N/A',
      waktu_absen: absen.waktu_absen ? absen.waktu_absen.toISOString() : 'N/A',
      status: absen.status,
      hasil_jurnal_kegiatan: 'N/A',
      hari: absen.jam_detail_jadwal.jam_jadwal.jadwal?.hari?.nama_hari || 'N/A',
      jam_mulai: absen.jam_detail_jadwal.jam_jadwal.jam_mulai || 'N/A',
      jam_selesai: absen.jam_detail_jadwal.jam_jadwal.jam_selesai || 'N/A',
      subject_code: absen.jam_detail_jadwal?.subject_code_entity?.code || 'N/A',
      kelas: absen.absen_kelas?.kelas?.nama_kelas || 'N/A',
      role: 'siswa',
    }));

    const formattedGuruAbsens = guruAbsens.map((absen) => ({
      id: absen.id,
      nama: absen.guru?.user?.nama || 'N/A',
      waktu_absen: absen.waktu_absen ? absen.waktu_absen.toISOString() : 'N/A',
      status: absen.status,
      hasil_jurnal_kegiatan: 'N/A',
      hari: absen.jam_detail_jadwal.jam_jadwal.jadwal?.hari?.nama_hari || 'N/A',
      jam_mulai: absen.jam_detail_jadwal.jam_jadwal.jam_mulai || 'N/A',
      jam_selesai: absen.jam_detail_jadwal.jam_jadwal.jam_selesai || 'N/A',
      subject_code: absen.jam_detail_jadwal?.subject_code_entity?.code || 'N/A',
      kelas: absen.jam_detail_jadwal?.kelas?.nama_kelas || 'N/A',
      role: 'guru',
    }));

    // Combine both arrays if no specific roleFilter, otherwise return only one of them
    const combinedData = [...formattedSiswaAbsens, ...formattedGuruAbsens];

    // Calculate the total number of 'hadir' (present) status
    const totalHadir = combinedData.filter(
      (absen) => absen.status === 'Hadir',
    ).length;

    return {
      status: 'Success',
      message: 'Data retrieved successfully',
      data: combinedData,
      totalHadir, // Add total 'hadir' count to the response
    };
  }

  private getWeekRangeForMonth(
    week: number,
    month: number,
    year: number,
  ): { startDate: Date; endDate: Date } {
    const startOfMonth = new Date(year, month - 1, 1); // Awal bulan
    const startDate = new Date(startOfMonth);
    startDate.setDate((week - 1) * 7 + 1); // Menghitung tanggal mulai minggu
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Menghitung tanggal akhir minggu

    // Sesuaikan akhir minggu jika melebihi batas bulan
    if (endDate.getMonth() !== startOfMonth.getMonth()) {
      endDate.setDate(new Date(year, month, 0).getDate()); // Sesuaikan dengan akhir bulan
    }

    // Kembalikan rentang minggu dalam zona waktu lokal
    startDate.setHours(0, 0, 0, 0); // Set waktu mulai ke awal hari
    endDate.setHours(23, 59, 59, 999); // Set waktu akhir ke akhir hari
    return { startDate, endDate };
  }

  // Fungsi untuk mendapatkan data kehadiran berdasarkan minggu dan role
  async getAttendanceByWeekAndRole(
    role?: string, // Role: siswa/guru
    week?: number, // Minggu yang dipilih (1-5), optional
  ): Promise<any> {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1; // Bulan dimulai dari 0, jadi +1
    const year = currentDate.getFullYear();
  
    if (!week) {
      const currentDay = currentDate.getDate();
      week = Math.ceil(currentDay / 7); // Menentukan minggu berdasarkan tanggal hari ini
    }
  
    const { startDate, endDate } = this.getWeekRangeForMonth(week, month, year);
  
    console.log(`Minggu ke-${week} Bulan ${month} Tahun ${year}`);
    console.log(`Tanggal mulai: ${startDate.toLocaleDateString()}`);
    console.log(`Tanggal akhir: ${endDate.toLocaleDateString()}`);
  
    const dateFilter = {
      waktu_absen: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      status: 'Hadir',
    };
  
    let absens = [];
  
    // Cek apakah role disediakan
    if (role === 'siswa') {
      absens = await this.prisma.absen_siswa.findMany({
        where: dateFilter,
        include: {
          user: true,
          absen_kelas: { include: { kelas: true } },
          jam_detail_jadwal: {
            include: {
              jam_jadwal: { include: { jadwal: { include: { hari: true } } } },
            },
          },
        },
      });
    } else if (role === 'guru') {
      absens = await this.prisma.absen_guru.findMany({
        where: dateFilter,
        include: {
          guru: {
            include: {
              user: true,
            },
          },
          absen_kelas: { include: { kelas: true } },
          jam_detail_jadwal: {
            include: {
              jam_jadwal: { include: { jadwal: { include: { hari: true } } } },
              kelas: true,
            },
          },
        },
      });
    } else {
      // Jika role tidak disediakan (null, undefined, atau kosong), gabungkan data guru dan siswa
      const siswaAbsens = await this.prisma.absen_siswa.findMany({
        where: dateFilter,
        include: {
          user: true,
          absen_kelas: { include: { kelas: true } },
          jam_detail_jadwal: {
            include: {
              jam_jadwal: { include: { jadwal: { include: { hari: true } } } },
            },
          },
        },
      });
  
      const guruAbsens = await this.prisma.absen_guru.findMany({
        where: dateFilter,
        include: {
          guru: {
            include: {
              user: true,
            },
          },
          absen_kelas: { include: { kelas: true } },
          jam_detail_jadwal: {
            include: {
              jam_jadwal: { include: { jadwal: { include: { hari: true } } } },
              kelas: true,
            },
          },
        },
      });
  
      // Gabungkan kedua array data absensi
      absens = [...siswaAbsens, ...guruAbsens];
    }
  
    const formattedAbsens = absens.map((absen) => ({
      id: absen.id,
      nama: absen.guru?.user?.nama || absen.user?.nama || 'N/A',
      status: absen.status,
      hari: absen.jam_detail_jadwal.jam_jadwal.jadwal?.hari?.nama_hari || 'N/A',
      kelas: absen.absen_kelas?.kelas?.nama_kelas || 'N/A',
      role: role || (absen.guru ? 'guru' : 'siswa'), // Tentukan role berdasarkan data
    }));
  
    console.log('Formatted Absen Data:', formattedAbsens);
  
    // Mapping hari ke dalam format yang sesuai dengan key dalam attendanceSummary
    const attendanceSummary = {
      Senin: 0,
      Selasa: 0,
      Rabu: 0,
      Kamis: 0,
      Jumat: 0,
      Sabtu: 0,
      Minggu: 0,
    };
  
    // Mapping hari dari absen ke dalam format yang sesuai
    const dayMapping = {
      senin: 'Senin',
      selasa: 'Selasa',
      rabu: 'Rabu',
      kamis: 'Kamis',
      jumat: 'Jumat',
      sabtu: 'Sabtu',
      minggu: 'Minggu',
    };
  
    formattedAbsens.forEach((absen) => {
      console.log(
        `Processing Absen: ${absen.nama}, Status: ${absen.status}, Hari: ${absen.hari}`,
      );
  
      // Normalisasi hari dan sesuaikan dengan key dalam attendanceSummary
      const normalizedDay = absen.hari.trim().toLowerCase();
      console.log(`Normalized Day: ${normalizedDay}`); // Log untuk memastikan normalisasi
  
      // Jika hari ada dalam mapping, tambahkan ke counter
      if (dayMapping[normalizedDay]) {
        const mappedDay = dayMapping[normalizedDay];
        attendanceSummary[mappedDay]++;
      }
    });
  
    console.log('Attendance Summary:', attendanceSummary);
    return attendanceSummary;
  }
  
}
