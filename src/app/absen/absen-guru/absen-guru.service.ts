import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AbsenGateway } from '../absen.gateway';
import { REQUEST } from '@nestjs/core';
import { CreateAbsenGuruDto } from '../absen.dto';
// import { ResponseSuccess } from '../../utils/interface/response';
import {
  getMaxWeeksInMonth,
  getMonthRange,
  getWeekNumberInMonth,
  getWeekRange,
  indexToMonthName,
} from '../../../utils/helper function/getWeek';
import { calculateDistance } from '../../../utils/validator/location.validator';

@Injectable()
export class AbsenGuruService {
  private readonly logger = new Logger(AbsenGuruService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private req: any,
    private readonly absenGateway: AbsenGateway,
  ) {}

  async AbsenGuru(createAbsenDto: CreateAbsenGuruDto): Promise<any> {
    const {
      jam_detail,
      latitude: currentLatitude,
      longitude: currentLongitude,
    } = createAbsenDto;

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

    const guru = await this.prisma.guru.findUnique({
      where: { id: this.req.user.id },
      include: { jam_detail_jadwal: true },
    });

    if (!guru) {
      throw new HttpException('Guru not found', HttpStatus.NOT_FOUND);
    }

    const existingAbsen = await this.prisma.absen_guru.findFirst({
      where: {
        guru_id: this.req.user.id,
        jamDetailJadwalId: jam_detail,
      },
    });

    if (existingAbsen) {
      throw new HttpException('Guru sudah absen', HttpStatus.CONFLICT);
    }

    const jamDetailJadwal = await this.prisma.jam_detail_jadwal.findUnique({
      where: { id: jam_detail },
      include: { jam_jadwal: true, kelas: true },
    });

    if (!jamDetailJadwal) {
      throw new HttpException(
        'Jam Detail Jadwal not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.guru.update({
      where: { id: this.req.user.id },
      data: { jam_detail_jadwal: { connect: { id: jam_detail } } },
    });

    const { jam_jadwal } = jamDetailJadwal;
    if (!jam_jadwal) {
      throw new HttpException('Jam Jadwal not found', HttpStatus.NOT_FOUND);
    }

    const currentTime = new Date();
    const currentDate = currentTime.toISOString().split('T')[0];
    const jamMulai = new Date(`${currentDate}T${jam_jadwal.jam_mulai}`);
    const jamSelesai = new Date(`${currentDate}T${jam_jadwal.jam_selesai}`);

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
    } else if (diffInMinutes > 60 || currentTime > jamSelesai) {
      status = 'Alpha';
    }

    const absen = await this.prisma.absen_guru.create({
      data: {
        guru_id: guru.id,
        jamDetailJadwalId: jam_detail,
        status: status,
        waktu_absen: currentTime,
      },
    });

    await this.prisma.guru.update({
      where: { id: this.req.user.id },
      data: { is_absen_today: true },
    });

    this.absenGateway.server.emit('absenGuru', absen);

    const students = await this.prisma.murid.findMany({
      where: { kelasId: jamDetailJadwal.kelas.id },
    });

    for (const student of students) {
      await this.prisma.murid.update({
        where: { id: student.id },
        data: { jamDetailJadwal_id: jam_detail },
      });
    }

    return {
      status: 'Success',
      message: 'OKe',
      data: absen.id,
    };
  }

  async getRekapGuru(
    month?: string,
    week?: number,
    mapel?: string,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: this.req.user.id },
    });

    if (!user) {
      throw new HttpException('Guru not found', HttpStatus.NOT_FOUND);
    }

    const currentDate = new Date();

    if (!month) {
      month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    } else {
      month = month.padStart(2, '0');
    }

    if (!week) {
      week = getWeekNumberInMonth(currentDate);
    }

    const [startOfMonth, endOfMonth] = getMonthRange(month);
    const maxWeeks = getMaxWeeksInMonth(month);

    if (week > maxWeeks) {
      throw new HttpException(
        'Week number exceeds the maximum number of weeks in the month',
        HttpStatus.BAD_REQUEST,
      );
    }

    const startOfWeek = week ? getWeekRange(month, week)[0] : startOfMonth;
    const endOfWeek = week ? getWeekRange(month, week)[1] : endOfMonth;

    const absensi = await this.prisma.absen_guru.findMany({
      where: {
        guru_id: user.id,
        waktu_absen: { gte: startOfWeek, lte: endOfWeek },
        ...(mapel && {
          jamDetailJadwal: {
            subject_code: {
              mapel: { nama_mapel: mapel },
            },
          },
        }),
      },
      include: {
        jam_detail_jadwal: { include: { subject_code_entity: true } },
      },
    });

    const counts = absensi.reduce(
      (acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      },
      { Hadir: 0, Telat: 0, Alpha: 0 },
    );

    const guru = await this.prisma.guru.findUnique({
      where: { id: user.id },
      include: {
        initial_schedule: true,
        subject_code_entity: {
          include: { mapel: true },
        },
      },
    });

    const formattedMapelList = guru.subject_code_entity.map((subject, index) => ({
      id_mapel: subject.id,
      nama_mapel: subject.mapel.nama_mapel,
      status_mapel: subject.mapel.status_mapel,
      subject_code: `${guru.initial_schedule.schedule_name}${index + 1}`,
    }));

    const monthName = indexToMonthName[parseInt(month, 10) - 1];

    const result = {
      id: user.id,
      nama: user.nama,
      month: monthName,
      week: week,
      list_mapel: formattedMapelList,
      data: counts,
    };

    return {
      status: 'Success',
      message: 'OKe',
      data: result,
    };
  }
}
