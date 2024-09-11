import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAbsenSiswaDto } from '../absen.dto';
import { ResponseSuccess } from '../../../utils/interface/respone';
import { map } from 'rxjs';
import {
  getMaxWeeksInMonth,
  getMonthRange,
  getWeekRange,
} from '../../../utils/helper function/getWeek';
import { calculateDistance } from '../../../utils/validator/location.validator';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AbsenSiswaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private req: any,
  ) {}

  async AbsenSiswa(createAbsenSiswaDto: CreateAbsenSiswaDto): Promise<any> {
    const {
      kode_class,
      latitude: currentLatitude,
      longitude: currentLongitude,
    } = createAbsenSiswaDto;

    // Get default location from geo_location table
    // const defaultLokasi = await this.prisma.geo_location.findUnique({
    //   where: { id: 0 },
    // });

    // if (!defaultLokasi) {
    //   throw new HttpException(
    //     'Default location not found',
    //     HttpStatus.NOT_FOUND,
    //   );
    // }

    // const { latitude: defaultLatitude, longitude: defaultLongitude } =
    //   defaultLokasi;

    // const distance = calculateDistance(
    //   currentLatitude,
    //   currentLongitude,
    //   defaultLatitude,
    //   defaultLongitude,
    // );

    // if (distance > 50) {
    //   throw new HttpException(
    //     'Anda tidak berada di lokasi yang tepat',
    //     HttpStatus.FORBIDDEN,
    //   );
    // }

    // Fetch absenKelas
    const absenKelas = await this.prisma.absen_kelas.findFirst({
      where: { kode_kelas: kode_class },
      include: {
        kelas: true,
        jam_jadwal: true,
        jam_detail_jadwal: {
          include: { subject_code_entity: { include: { mapel: true } } },
        },
        absen_siswa: { include: { user: true } },
      },
    });

    if (!absenKelas) {
      throw new HttpException('Class code not found', HttpStatus.NOT_FOUND);
    }

    // Fetch user from request
    const user = await this.prisma.user.findUnique({
      where: { id: this.req.user.id },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Check if the user already marked attendance
    const existingAbsen = await this.prisma.absen_siswa.findFirst({
      where: {
        userId: user.id,
        absenKelasId: absenKelas.id,
      },
    });

    if (existingAbsen) {
      throw new HttpException('Siswa sudah absen', HttpStatus.CONFLICT);
    }

    // Fetch jamDetailJadwal
    const jamDetailJadwal = await this.prisma.jam_detail_jadwal.findUnique({
      where: { id: absenKelas.jam_detail_jadwal.id },
      include: { jam_jadwal: true },
    });

    const jamJadwal = jamDetailJadwal.jam_jadwal;
    const currentTime = new Date();
    const currentDate = currentTime.toISOString().split('T')[0];
    const jamMulai = new Date(`${currentDate}T${jamJadwal.jam_mulai}`);
    const jamSelesai = new Date(`${currentDate}T${jamJadwal.jam_selesai}`);

    console.log('current time:', currentTime);
    console.log('jam mulai time:', jamMulai);

    // if (currentTime < jamMulai || currentTime > jamSelesai) {
    //   throw new HttpException(
    //     'Anda tidak bisa absen karena belum waktunya',
    //     HttpStatus.BAD_REQUEST,
    //   );
    // }

    let status = 'Hadir';
    const diffInMinutes = Math.floor(
      (currentTime.getTime() - jamMulai.getTime()) / 60000,
    );

    if (diffInMinutes > 15 && diffInMinutes <= 60) {
      status = 'Telat';
    } else if (
      diffInMinutes > 60 ||
      currentTime.getTime() > jamSelesai.getTime()
    ) {
      status = 'Alpha';
    }

    // Save absenSiswa
    const absenSiswa = await this.prisma.absen_siswa.create({
      data: {
        userId: user.id,
        absenKelasId: absenKelas.id,
        status,
        waktu_absen: currentTime,
        jamDetailJadwalId: absenKelas.jam_detail_jadwal.id,
      },
    });

    return {
      status: 'Success',
      message: 'Oke',
      data: absenSiswa,
    };
  }

  async getRekapSiswa(bulan: string, week: number, mapel: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: this.req.user.id },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Validate the week number
    const maxWeeks = getMaxWeeksInMonth(bulan);
    if (week > maxWeeks) {
      throw new HttpException('Week number exceeds the maximum number of weeks in the month', HttpStatus.BAD_REQUEST);
    }

    const [startOfMonth, endOfMonth] = getMonthRange(bulan);
    const startOfWeek = week ? getWeekRange(bulan, week)[0] : startOfMonth;
    const endOfWeek = week ? getWeekRange(bulan, week)[1] : endOfMonth;

    console.log('Date Range:', startOfWeek, endOfWeek);

    // Build query conditions
    const whereConditions: any = {
      userId: user.id,
      waktu_absen: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    };

    if (mapel) {
      whereConditions.jamDetailJadwal = {
        subject_code: {
          mapel: {
            nama_mapel: mapel,
          },
        },
      };
    }

    const absensi = await this.prisma.absen_siswa.findMany({
      where: whereConditions,
      include: { jam_detail_jadwal: { include: { subject_code_entity: true } } },
    });

    console.log('Attendance Records:', absensi);

    const counts = absensi.reduce(
      (acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      },
      { Hadir: 0, Telat: 0, Alpha: 0 },
    );

    const result = {
      id: user.id,
      nama: user.nama,
      bulan,
      week,
      data: counts,
    };

    return {
      status: 'Success',
      message: 'Oke',
      data: result,
    };
  }
}
