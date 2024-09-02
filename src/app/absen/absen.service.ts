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

@Injectable()
export class AbsenService{
  constructor(
    // @InjectRepository(AbsenGuru)
    // private readonly absenRepository: Repository<AbsenGuru>,
    // @InjectRepository(Jadwal)
    // private readonly jadwalRepository: Repository<Jadwal>,
    // @InjectRepository(User) // Inject User repository
    // private readonly userRepository: Repository<User>,
    // @InjectRepository(Guru) // Inject Guru repository
    // private readonly guruRepository: Repository<Guru>,
    // @Inject(REQUEST) private req: any,
    // private readonly absenGateway: AbsenGateway,
    // @InjectRepository(JamJadwal)
    // private readonly jamJadwalRepository: Repository<JamJadwal>,
    // @InjectRepository(JurnalKegiatan)
    // private readonly jurnalKegiatanRepository: Repository<JurnalKegiatan>,
    // @InjectRepository(JamDetailJadwal)
    // private readonly jamDetailJadwalRepository: Repository<JamDetailJadwal>,
    // @InjectRepository(Kelas)
    // private readonly kelasRepository: Repository<Kelas>,
    // @InjectRepository(AbsenSiswa)
    // private readonly absenSiswaRepository: Repository<AbsenSiswa>,
    // @InjectRepository(AbsenGuru)
    // private readonly absenGuruRepository: Repository<AbsenGuru>,
    // @InjectRepository(SubjectCodeEntity)
    // private readonly subjectCodeRepository: Repository<SubjectCodeEntity>,
    // @InjectRepository(AbsenKelas)
    // private readonly absenKelasRepository: Repository<AbsenKelas>,
    // @InjectRepository(Murid)
    // private readonly siswaRepository: Repository<Murid>,
  ) {
    
  }

  // async enterClassGuru(
  //   createEnterClassGuruDto: CreateEnterClassGuruDto,
  // ): Promise<any> {
  //   const { jam_detail } = createEnterClassGuruDto;

  //   const guru = await this.guruRepository.findOne({
  //     where: { id: this.req.user.id },
  //     relations: ['jadwal_detail'], // pastikan ini dimasukkan
  //   });
  //   const existingEntry = await this.absenKelasRepository.findOne({
  //     where: {
  //       id: jam_detail,
  //     },
  //   });

  //   if (existingEntry) {
  //     throw new HttpException('Guru sudah masuk kelas', HttpStatus.CONFLICT);
  //   }

  //   const jamDetailJadwal = await this.jamDetailJadwalRepository.findOne({
  //     where: { id: jam_detail },
  //     relations: ['jamJadwal', 'kelas'],
  //   });

  //   if (!guru || !jamDetailJadwal) {
  //     throw new HttpException(
  //       'User or Jam Detail Jadwal not found',
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }

  //   const kodeKelas = this.generateClassCode();
  //   const absenKelas = new AbsenKelas();
  //   absenKelas.id = jam_detail; // Set ID to match jam_detail
  //   absenKelas.kelas = jamDetailJadwal.kelas;
  //   absenKelas.guru = guru;
  //   absenKelas.jamDetailJadwal = jamDetailJadwal;
  //   absenKelas.jamJadwal = jamDetailJadwal.jamJadwal;
  //   absenKelas.tanggal = new Date();
  //   absenKelas.kode_kelas = kodeKelas;

  //   await this.absenKelasRepository.save(absenKelas);

  //   return {
  //     status: 'Success',
  //     message: 'OKe',
  //     data: absenKelas
  //   };
  // }

  // async keluarKelasGuru(
  //   createJurnalKegiatanDto: CreateJurnalKegiatanDto,
  //   jam_detail_id: number,
  // ): Promise<any> {
  //   const user = await this.userRepository.findOne({
  //     where: { id: this.req.user.id },
  //     relations: ['guru'], // Ensure guru relation is loaded
  //   });

  //   const jamDetailJadwal = await this.jamDetailJadwalRepository.findOne({
  //     where: { id: jam_detail_id },
  //     relations: ['jamJadwal', 'subject_code.mapel', 'kelas'],
  //   });

  //   if (!user || !jamDetailJadwal) {
  //     throw new HttpException(
  //       'User or Jam Detail Jadwal not found',
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }

  //   // Check if user.guru exists
  //   if (user.guru) {
  //     user.guru.jadwal_detail = null;
  //     await this.userRepository.save(user);
  //   } else {
  //     throw new HttpException('Guru not found for user', HttpStatus.NOT_FOUND);
  //   }

  //   const absenGuru = await this.absenGuruRepository.findOne({
  //     relations: ['guru.user'],
  //     where: {
  //       guru: {
  //         id: this.req.user.id,
  //       },
  //     },
  //   });

  //   // Create Journal Entry
  //   const jurnalKegiatan = new JurnalKegiatan();
  //   jurnalKegiatan.jamJadwal = jamDetailJadwal.jamJadwal;
  //   jurnalKegiatan.absen_guru = absenGuru;
  //   jurnalKegiatan.jamDetailJadwal = jamDetailJadwal;
  //   jurnalKegiatan.matapelajaran =
  //     jamDetailJadwal.subject_code.mapel.nama_mapel;
  //   jurnalKegiatan.materi = createJurnalKegiatanDto.materi;
  //   jurnalKegiatan.kendala = createJurnalKegiatanDto.kendala;

  //   await this.jurnalKegiatanRepository.save(jurnalKegiatan);

  //   // Find Absen Kelas
  //   const absenKelas = await this.absenKelasRepository.findOne({
  //     where: {
  //       jamDetailJadwal: {
  //         id: jamDetailJadwal.id,
  //       },
  //     },
  //     relations: ['absenSiswa'],
  //   });

  //   if (!absenKelas) {
  //     throw new NotFoundException('Absen Kelas not found');
  //   }

  //   // Update Absen Siswa to set id_kelas_absen to NULL
  //   await this.absenSiswaRepository.update(
  //     { absenKelas: { id: absenKelas.id } },
  //     { absenKelas: null },
  //   );

  //   // Delete Absen Kelas
  //   await this.absenKelasRepository.remove(absenKelas);

  //   // Reset jamDetailJadwal_id for students to null
  //   const students = await this.siswaRepository.find({
  //     where: { kelas: { id: jamDetailJadwal.kelas.id } },
  //   });

  //   for (const student of students) {
  //     student.jamDetailJadwal_id = null;
  //     await this.siswaRepository.save(student); // Use save instead of update
  //   }

  //   return {
  //     status: 'Success',
  //     message: 'OKe',
  //     data: jurnalKegiatan
  //   };
  // }

  // async getAbsenKelasDetail(id: number): Promise<any> {
  //   const absenKelas = await this.absenKelasRepository.findOne({
  //     where: { id },
  //     relations: [
  //       'kelas',
  //       'jamJadwal',
  //       'jamDetailJadwal',
  //       'jamDetailJadwal.subject_code',
  //       'jamDetailJadwal.subject_code.mapel',
  //       'absenSiswa',
  //       'absenSiswa.user',
  //     ],
  //   });

  //   if (!absenKelas) {
  //     throw new HttpException('Absen Kelas not found', HttpStatus.NOT_FOUND);
  //   }

  //   const siswaList = await this.absenSiswaRepository.find({
  //     where: { absenKelas: { id: absenKelas.id } },
  //     relations: ['user'],
  //   });

  //   const formattedDate = new Date().toLocaleDateString('en-GB', {
  //     day: 'numeric',
  //     month: 'long',
  //     year: 'numeric',
  //   });

  //   const kelas = await this.kelasRepository.findOne({
  //     where: { id: absenKelas.kelas.id },
  //     relations: ['siswa'], // Ensure to load the related siswa
  //   });

  //   const totalSiswa = kelas.siswa.length;
  //   const jumlahHadir = siswaList.filter(
  //     (siswa) => siswa.status === 'Hadir',
  //   ).length;
  //   const jumlahTelat = siswaList.filter(
  //     (siswa) => siswa.status === 'Telat',
  //   ).length;
  //   const jumlahAlpha = siswaList.filter(
  //     (siswa) => siswa.status === 'Alpha',
  //   ).length;

  //   const data = {
  //     id: absenKelas.id,
  //     kode_kelas: absenKelas.kode_kelas,
  //     nama_kelas: absenKelas.kelas.nama_kelas,
  //     nama_mapel: absenKelas.jamDetailJadwal.subject_code.mapel.nama_mapel,
  //     jam_mulai: absenKelas.jamJadwal.jam_mulai,
  //     jam_selesai: absenKelas.jamJadwal.jam_selesai,
  //     subject_code: absenKelas.jamDetailJadwal.subject_code.code,
  //     jumlah_siswa: totalSiswa, // Total siswa
  //     jumlah_hadir: jumlahHadir, // Jumlah siswa yang hadir
  //     jumlah_telat: jumlahTelat, // Jumlah siswa yang telat
  //     jumlah_alpha: jumlahAlpha,
  //     daftar_siswa: siswaList.map((siswa) => ({
  //       id: siswa.user.id,
  //       nama: siswa.user.nama,
  //       status: siswa.status,
  //       tanggal: formattedDate,
  //       waktu_masuk: new Date(siswa.waktu_absen).toLocaleDateString('en-GB', {
  //         minute: '2-digit',
  //         hour: '2-digit',
  //         day: 'numeric',
  //         month: 'long',
  //         year: 'numeric',
  //       }),
  //       waktu_keluar: null,
  //     })),
  //   };

  //   return {
  //     status: 'Success',
  //     message: 'OKe',
  //     data: data
  //   };
  // }

  // async deleteAbsenKelas(id: number): Promise<any> {
  //   const cek = await this.absenKelasRepository.find({
  //     where: {
  //       id,
  //     },
  //   });

  //   if (!cek) {
  //     throw new HttpException('absen kelas not found', HttpStatus.NOT_FOUND);
  //   }

  //   await this.absenKelasRepository.remove(cek);
  //   return {
  //     status: 'Success',
  //     message: 'OKe',
  //     // data: hasil
  //   };
  // }

  // private generateClassCode(): string {
  //   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  //   let result = '';
  //   for (let i = 0; i < 6; i++) {
  //     result += characters.charAt(
  //       Math.floor(Math.random() * characters.length),
  //     );
  //   }
  //   return result;
  // }

  // async listAbsenKelas(): Promise<any> {
  //   // Find all AbsenKelas entries along with relations to Kelas and Guru
  //   const absenKelasList = await this.absenKelasRepository.find({
  //     relations: [
  //       'kelas',
  //       'user',
  //       'absenSiswa',
  //       'jamDetailJadwal',
  //       'jamDetailJadwal.subject_code',
  //       'jamDetailJadwal.subject_code.mapel',
  //     ],
  //   });

  //   const data = await Promise.all(
  //     absenKelasList.map(async (absenKelas) => {
  //       // Retrieve the list of students who have entered the class
  //       const siswaList = await this.absenSiswaRepository.find({
  //         where: { absenKelas: { id: absenKelas.id } },
  //         relations: ['user'],
  //       });

  //       return {
  //         id: absenKelas.id,
  //         nama_kelas: absenKelas.kelas.nama_kelas,
  //         code_kelas: absenKelas.kode_kelas,
  //         nama_mapel: absenKelas.jamDetailJadwal.subject_code.mapel.nama_mapel,
  //         subject_code: absenKelas.jamDetailJadwal.subject_code.code,
  //         guru: absenKelas.user.nama, // assuming guru entity has a 'nama' field
  //         daftar_siswa: siswaList.map((siswa) => ({
  //           id: siswa.user.id,
  //           nama: siswa.user.nama,
  //           status: siswa.status,
  //           waktu_absen: siswa.waktu_absen,
  //         })),
  //       };
  //     }),
  //   );

  //   return {
  //     status: 'Success',
  //     message: 'OKe',
  //     data: data
  //   };
  // }

  // async list(): Promise<any> {
  //   const absens = await this.absenRepository.find({
  //     relations: [
  //       'jadwal',
  //       'guru.user',
  //       'jamJadwal',
  //       'jamDetailJadwal',
  //       'jamDetailJadwal.mapel',
  //       'jamDetailJadwal.kelas',
  //     ],
  //   });

  //   const data = absens.map((absen) => ({
  //     id: absen.id,
  //     nama: absen.guru.user.nama,
  //     waktu_absen: absen.waktu_absen,
  //     status: absen.status,
  //     hasil_jurnal_kegiatan: absen.hasil_jurnal_kegiatan,
  //     hari: absen.jadwal.hari,
  //     jam_mulai: absen.jamJadwal.jam_mulai,
  //     jam_selesai: absen.jamJadwal.jam_selesai,
  //     subject_code: absen.jamDetailJadwal.subject_code.code,
  //     kelas: absen.jamDetailJadwal.kelas.nama_kelas,
  //     role: absen.guru.user.role,
  //   }));

  //   return {
  //     status: 'Success',
  //     message: 'OKe',
  //     data: data
  //   };
  // }

  // async delete(id: number): Promise<any> {
  //   const absen = await this.absenRepository.findOne({ where: { id } });

  //   if (!absen) {
  //     throw new HttpException('Attendance not found', HttpStatus.NOT_FOUND);
  //   }

  //   await this.absenRepository.remove(absen);
  //   return {
  //     status: 'Success',
  //     message: 'OKe',
  //     data: absen
  //   };
  // }
}
