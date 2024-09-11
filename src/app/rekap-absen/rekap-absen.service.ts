/* eslint-disable @typescript-eslint/no-empty-function */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// import { RekapAbsen } from './rekap-absen.entity';
import { Between, MoreThanOrEqual, LessThanOrEqual, Repository } from 'typeorm';

import { ResponseSuccess } from '../../utils/interface/respone';

@Injectable()
export class RekapAbsenService{
  constructor(
    // @InjectRepository(RekapAbsen)
    // private readonly rekapAbsenRepository: Repository<RekapAbsen>,
  ) {
    
  }

  // async getRekapMingguan(
  //   startDate: Date,
  //   endDate: Date,
  // ): Promise<any> {
  //   const result = await this.rekapAbsenRepository.find({
  //     where: {
  //       tanggal: Between(startDate, endDate),
  //     },
  //   });
  //   return {
  //     status: 'Success',
  //     message: 'OKe',
  //     data: result
  //   };
  // }

  // async getRekapBulanan(year: number, month: number): Promise<any> {
  //   const startDate = new Date(year, month - 1, 1);
  //   const endDate = new Date(year, month, 0); // Last day of the month
  //   const hasil = await this.rekapAbsenRepository.find({
  //     where: {
  //       tanggal: Between(startDate, endDate),
  //     },
  //   });
  //   return {
  //     status: 'Success',
  //     message: 'OKe',
  //     data: hasil
  //   };
  // }

  // async rekapSiswa(startDate: Date, endDate: Date): Promise<any> {
  //   // Query to get weekly/monthly report for siswa
  //   // This should include aggregation and counting based on `siswa_id`
  //   // Example:
  //   const result = await this.rekapAbsenRepository
  //     .createQueryBuilder('rekap')
  //     .select('rekap.siswa_id', 'siswa_id')
  //     .addSelect('COUNT(*)', 'total_absen')
  //     .where('rekap.tanggal BETWEEN :startDate AND :endDate', {
  //       startDate,
  //       endDate,
  //     })
  //     .andWhere('rekap.type = :type', { type: 'siswa' })
  //     .groupBy('rekap.siswa_id')
  //     .getRawMany();
  //   return {
  //     status: 'Success',
  //     message: 'OKe',
  //     data: result
  //   };
  // }

  // async rekapGuru(startDate: Date, endDate: Date): Promise<any> {
  //   // Query to get weekly/monthly report for guru
  //   // This should include aggregation and counting based on `guru_id`
  //   // Example:
  //   const result = await this.rekapAbsenRepository
  //     .createQueryBuilder('rekap')
  //     .select('rekap.guru_id', 'guru_id')
  //     .addSelect('COUNT(*)', 'total_absen')
  //     .where('rekap.tanggal BETWEEN :startDate AND :endDate', {
  //       startDate,
  //       endDate,
  //     })
  //     .andWhere('rekap.type = :type', { type: 'guru' })
  //     .groupBy('rekap.guru_id')
  //     .getRawMany();

  //   return {
  //     status: 'Success',
  //     message: 'OKe',
  //     data: result
  //   };
  // }
}
