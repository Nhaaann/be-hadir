/* eslint-disable @typescript-eslint/no-empty-function */
// src/app/hari/hari.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // Updated import path
import { ResponseSuccess } from '../../utils/interface/respone'; 

@Injectable()
export class HariService {
  constructor(private readonly prisma: PrismaService) {}

  async createBulk(): Promise<any> {
    // Daftar nama hari dari Senin sampai Sabtu
    const hariNames = [
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
      'Minggu',
    ];

    // Membuat array objek Hari
    const hariEntities = hariNames.map((name) => ({
      nama_hari: name,
    }));

    // Menyimpan semua entitas Hari ke database
    const createdHari = await this.prisma.hari.createMany({
      data: hariEntities as any,
    });

    return {
      status: 'Success',
      message: 'OKe',
      data: createdHari,
    };
  }

  async list(): Promise<any> {
    // Fetch all Hari entities from the database
    const hariList = await this.prisma.hari.findMany();

    // Return a success response
    return {
      status: 'Success',
      message: 'OKe',
      data: hariList,
    };
  }
}
