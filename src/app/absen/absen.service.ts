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

// import { ResponseSuccess } from 'src/utils/interface/respone';
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
      nama_mapel: absenKelas.jam_detail_jadwal.subject_code_entity.mapel.nama_mapel,
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
      nama_mapel: absenKelas.jam_detail_jadwal.subject_code_entity.mapel.nama_mapel,
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
  async list(): Promise<any> {
    const absens = await this.prisma.absen_siswa.findMany();

    // const data = absens.map((absen) => ({
    //   id: absen.id,
    //   nama: absen.guru.user.nama,
    //   waktu_absen: absen.waktu_absen,
    //   status: absen.status,
    //   hasil_jurnal_kegiatan: absen.hasil_jurnal_kegiatan,
    //   hari: absen.jadwal.hari,
    //   jam_mulai: absen.jamJadwal.jam_mulai,
    //   jam_selesai: absen.jamJadwal.jam_selesai,
    //   subject_code: absen.jamDetailJadwal.subject_code.code,
    //   kelas: absen.jamDetailJadwal.kelas.nama_kelas,
    //   role: absen.guru.user.role,
    // }));

    return {
      status: 'Success',
      message: 'OKe',
      data: absens,
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
}
