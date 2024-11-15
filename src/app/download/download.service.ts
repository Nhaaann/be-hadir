/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import PDFKit, { x } from 'pdfkit';
import BaseResponse from '../../utils/response/base.response';
import { ResponseSuccess } from '../../utils/interface/respone';
import { PrismaService } from 'src/prisma/prisma.service';
import * as os from 'os';
import axios from 'axios';

interface AttendanceRecord {
  name: string;
  className: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
}
interface WeeklyAttendance {
  att: number;
  per: number;
  ab: number;
  la: number;
}
interface MonthlyAttendanceRecord {
  name: string;
  className: string;
  week1: WeeklyAttendance;
  week2: WeeklyAttendance;
  week3: WeeklyAttendance;
  week4: WeeklyAttendance;
  averagePercentage: number;
}

@Injectable()
export class DownloadService extends BaseResponse {
  private readonly PAGE_SIZE = 'A4';
  private readonly PAGE_LAYOUT = 'portrait';
  private readonly FONT_REGULAR = 'Helvetica';
  private readonly FONT_BOLD = 'Helvetica-Bold';

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async generateAttendanceReport(
    response: Response,
    role: string,
  ): Promise<ResponseSuccess> {
    const dummyData = this.getAttendanceData(role);
    const pdfDoc = this.createPDFDocument();

    this.addHeaderAndImages(pdfDoc);
    this.addReportTitle(pdfDoc, role);
    this.createAttendanceTable(pdfDoc, await dummyData);

    const filePath = this.saveAndDownloadPDF(pdfDoc, response);

    if (filePath) {
      return this._success('OK, berhasil download', response);
    } else {
      return this._error('Gagal membuat file', response as any);
    }
  }

  private createPDFDocument(isLandscape: boolean = false): PDFKit.PDFDocument {
    const PDFKit = require('pdfkit');
    return new PDFKit({
      size: this.PAGE_SIZE,
      layout: isLandscape ? 'landscape' : 'portrait',
      margin: 50,
    });
  }

  async generateMonthlyReport(
    response: Response,
    role: string,
  ): Promise<ResponseSuccess> {
    const monthlyData = await this.getMonthlyAttendanceData(role);
    const pdfDoc = this.createPDFDocument(true); // Set to landscape

    // Menambahkan await untuk memastikan header selesai ditambahkan
    await this.addHeaderAndImages(pdfDoc, true);

    // Tunggu sejenak untuk memastikan gambar telah dimuat
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.addMonthlyReportTitle(pdfDoc, role);
    this.createMonthlyTable(pdfDoc, monthlyData);

    const filePath = this.saveAndDownloadPDF(pdfDoc, response);
    return this._success('OK, berhasil download', response);
  }

  private async addHeaderAndImages(
    doc: PDFKit.PDFDocument,
    isLandscape: boolean = false,
  ): Promise<void> {
    const pageWidth = isLandscape ? 842 : 595;
    const leftImageUrl =
      'https://res.cloudinary.com/dcthljxbl/image/upload/v1731639108/Logo_mq_vglxby.png';
    const rightImageUrl =
      'https://res.cloudinary.com/dcthljxbl/image/upload/v1731639120/TUT_fnqspi.png';

    try {
      // Mengunduh gambar kiri dan kanan secara bersamaan
      const [leftImageResponse, rightImageResponse] = await Promise.all([
        axios.get(leftImageUrl, { responseType: 'arraybuffer' }),
        axios.get(rightImageUrl, { responseType: 'arraybuffer' }),
      ]);

      const leftImageBuffer = leftImageResponse.data;
      const rightImageBuffer = rightImageResponse.data;

      // Posisi dan ukuran gambar disesuaikan
      const imageWidth = 50;
      const imageY = 45;
      const headerCenterX = pageWidth / 2;
      const headerWidth = 400; // Lebar fixed untuk header text
      const headerX = headerCenterX - headerWidth / 2;

      // Menambahkan gambar dan teks ke PDF dengan posisi yang disesuaikan
      doc
        .image(leftImageBuffer, 50, imageY, { width: imageWidth })
        .image(rightImageBuffer, pageWidth - 100, imageY, { width: imageWidth })
        .font(this.FONT_BOLD)
        .fontSize(16)
        .text('YAYASAN PESANTREN WISATA ALAM', headerX, imageY, {
          align: 'center',
          width: headerWidth,
        })
        .fontSize(14)
        .text('SMK MADINATUL QURAN', headerX, doc.y, {
          align: 'center',
          width: headerWidth,
        })
        .moveDown(0.5)
        .fontSize(10)
        .font(this.FONT_REGULAR)
        .text(
          'Kp. Kebon Kelapa, RT.02/RW.011, Singasari, Kec. Jonggol, Kabupaten Bogor, Jawa Barat 16830',
          headerX,
          doc.y,
          {
            align: 'center',
            width: headerWidth,
          },
        )
        .moveDown(1);

      // Tambahkan garis pemisah header
      doc
        .moveTo(50, 160)
        .lineTo(pageWidth - 50, 160)
        .stroke();
    } catch (error) {
      console.error('Error loading images:', error);
      // Fallback jika gambar gagal dimuat
      doc
        .font(this.FONT_BOLD)
        .fontSize(16)
        .text('YAYASAN PESANTREN WISATA ALAM', { align: 'center' })
        .fontSize(14)
        .text('SMK MADINATUL QURAN', { align: 'center' })
        .moveDown(0.5);
    }
  }

  private addReportTitle(doc: PDFKit.PDFDocument, role: string): void {
    doc
      .moveDown(1)
      .fontSize(18)
      .font(this.FONT_BOLD)
      .text(`Laporan Rekap Mingguan - ${role}`, -200, doc.y, { align: 'left' })
      .moveDown(1);
  }

  private createAttendanceTable(
    doc: PDFKit.PDFDocument,
    data: AttendanceRecord[],
  ): void {
    const startY = 200;
    const rowHeight = 30;
    const tableWidth = 500;
    const columnWidths = [30, 100, 70, 50, 50, 50, 50, 50, 50]; // Updated widths
    const columns = [
      'No',
      'Name',
      'Class',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]; // Added "Class" column

    this.drawTableHeader(doc, columns, 50, startY, columnWidths, rowHeight);
    this.drawTableRows(
      doc,
      data,
      50,
      startY + rowHeight,
      columnWidths,
      rowHeight,
    );
    this.drawTableOutline(
      doc,
      50,
      startY,
      tableWidth,
      (data.length + 1) * rowHeight,
    );
  }

  private drawTableHeader(
    doc: PDFKit.PDFDocument,
    columns: string[],
    x: number,
    y: number,
    columnWidths: number[],
    rowHeight: number,
  ): void {
    let currentX = x;
    columns.forEach((col, i) => {
      doc.rect(currentX, y, columnWidths[i], rowHeight).stroke();
      doc
        .fontSize(11)
        .font(this.FONT_BOLD)
        .text(col, currentX + 2, y + 10, {
          width: columnWidths[i],
          align: 'center',
        });
      currentX += columnWidths[i];
    });
  }

  private drawTableRows(
    doc: PDFKit.PDFDocument,
    data: AttendanceRecord[],
    x: number,
    y: number,
    columnWidths: number[],
    rowHeight: number,
  ): void {
    data.forEach((row, index) => {
      const rowY = y + index * rowHeight;
      this.drawRowContent(doc, row, index, x, rowY, columnWidths, rowHeight);
    });
  }

  private drawRowContent(
    doc: PDFKit.PDFDocument,
    row: AttendanceRecord,
    index: number,
    x: number,
    y: number,
    columnWidths: number[],
    rowHeight: number,
  ): void {
    doc.fontSize(10).font(this.FONT_REGULAR);
    let currentX = x;

    // Draw No column
    doc.rect(currentX, y, columnWidths[0], rowHeight).stroke();
    doc.text(`${index + 1}`, currentX + 2, y + 10, {
      width: columnWidths[0],
      align: 'center',
    });
    currentX += columnWidths[0];

    // Draw other columns
    Object.values(row).forEach((value, i) => {
      doc.rect(currentX, y, columnWidths[i + 1], rowHeight).stroke();
      doc.text(value, currentX + 2, y + 10, {
        width: columnWidths[i + 1],
        align: 'center',
      });
      currentX += columnWidths[i + 1];
    });
  }

  private drawTableOutline(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    doc.rect(x, y, width, height).stroke();
  }

  private saveAndDownloadPDF(
    doc: PDFKit.PDFDocument,
    response: Response,
  ): string {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const downloadsPath = path.join(os.tmpdir(), 'downloads');
    const uniqueFilename = this.generateUniqueFilename();
    const filePath = path.join(downloadsPath, uniqueFilename);

    // Membuat folder jika belum ada
    if (!fs.existsSync(downloadsPath)) {
      fs.mkdirSync(downloadsPath, { recursive: true });
    }

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    writeStream.on('finish', () => {
      response.download(filePath, uniqueFilename, (err) => {
        if (err) {
          console.error('Gagal mengirim file:', err);
          response.status(500).send('Gagal mengirim file.');
        } else {
          console.log('File berhasil disimpan dan dikirim.');
          console.log('downloadsPath', downloadsPath);
          // Menghapus file setelah di-download untuk menghindari akumulasi file
          // fs.unlink(filePath, (err) => {
          //   if (err) console.error('Gagal menghapus file:', err);
          // });
        }
      });
    });
    doc.end();
    return filePath;
  }

  private generateUniqueFilename(): string {
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 10).replace(/-/g, '');
    const formattedTime = now.toTimeString().slice(0, 8).replace(/:/g, '');
    return `laporan-rekap-mingguan-${formattedDate}-${formattedTime}.pdf`;
  }

  private createMonthlyTable(
    doc: PDFKit.PDFDocument,
    data: MonthlyAttendanceRecord[],
  ): void {
    const startY = 200;
    const rowHeight = 30;
    const tableWidth = 631; // Adjusted for landscape A4

    // Adjusted column widths for landscape orientation
    const mainColumns = [
      { width: 170, title: 'Name', isHeader: true }, // Increased width to accommodate combined columns
      { width: 115, title: 'Week 1', subColumns: ['Att', 'Per', 'Ab', 'La'] },
      { width: 115, title: 'Week 2', subColumns: ['Att', 'Per', 'Ab', 'La'] },
      { width: 115, title: 'Week 3', subColumns: ['Att', 'Per', 'Ab', 'La'] },
      { width: 115, title: 'Week 4', subColumns: ['Att', 'Per', 'Ab', 'La'] },
      { width: 82, title: 'Average %', isHeader: true }, // Added isHeader flag
    ];

    this.drawMonthlyTableHeader(doc, mainColumns, 50, startY, rowHeight);
    this.drawMonthlyTableRows(
      doc,
      data,
      mainColumns,
      50,
      startY + rowHeight * 2,
      rowHeight,
    );
    this.drawTableOutline(
      doc,
      50,
      startY,
      tableWidth,
      (data.length + 2) * rowHeight,
    );
  }

  private drawMonthlyTableHeader(
    doc: PDFKit.PDFDocument,
    columns: any[],
    x: number,
    y: number,
    rowHeight: number,
  ): void {
    let currentX = x;

    // Draw main header row
    columns.forEach((col) => {
      doc
        .rect(currentX, y, col.width, col.isHeader ? rowHeight * 2 : rowHeight)
        .stroke();

      if (col.isHeader) {
        // Center text vertically for headers that span two rows
        doc
          .fontSize(11)
          .font(this.FONT_BOLD)
          .text(col.title, currentX + 2, y + rowHeight - 6, {
            width: col.width - 4,
            align: 'center',
          });
      } else {
        doc
          .fontSize(11)
          .font(this.FONT_BOLD)
          .text(col.title, currentX + 2, y + 10, {
            width: col.width - 4,
            align: 'center',
          });

        // Draw sub-columns
        if (col.subColumns) {
          const subWidth = col.width / 4;
          let subX = currentX;
          col.subColumns.forEach((subCol) => {
            doc.rect(subX, y + rowHeight, subWidth, rowHeight).stroke();
            doc.fontSize(9).text(subCol, subX + 2, y + rowHeight + 10, {
              width: subWidth - 4,
              align: 'center',
            });
            subX += subWidth;
          });
        }
      }

      currentX += col.width;
    });
  }

  private drawMonthlyTableRows(
    doc: PDFKit.PDFDocument,
    data: MonthlyAttendanceRecord[],
    columns: any[],
    x: number,
    y: number,
    rowHeight: number,
  ): void {
    data.forEach((record, rowIndex) => {
      let currentX = x;
      const currentY = y + rowIndex * rowHeight;

      // Draw combined name and class
      doc.rect(currentX, currentY, columns[0].width, rowHeight).stroke();
      doc
        .fontSize(10)
        .font(this.FONT_REGULAR)
        .text(
          `${record.name} - ${record.className}`,
          currentX + 4,
          currentY + 10,
          {
            width: columns[0].width - 8,
            align: 'center',
          },
        );
      currentX += columns[0].width;

      // Draw weekly attendance data
      ['week1', 'week2', 'week3', 'week4'].forEach((week) => {
        const weekData = record[week];
        const weekWidth = columns[1].width;
        const subWidth = weekWidth / 4;

        ['att', 'per', 'ab', 'la'].forEach((status) => {
          doc.rect(currentX, currentY, subWidth, rowHeight).stroke();
          doc.text(weekData[status].toString(), currentX + 2, currentY + 10, {
            width: subWidth - 4,
            align: 'center',
          });
          currentX += subWidth;
        });
      });

      // Draw average percentage
      doc.rect(currentX, currentY, columns[5].width, rowHeight).stroke();
      doc.text(
        `${record.averagePercentage.toFixed(2)}%`,
        currentX + 2,
        currentY + 10,
        {
          width: columns[5].width - 4,
          align: 'center',
        },
      );
    });
  }

  async getMonthlyAttendanceData(
    role: string,
  ): Promise<MonthlyAttendanceRecord[]> {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    // Get attendance data for the entire month
    const absens = await this.prisma.absen_siswa.findMany({
      where: {
        user: { role: role as any },
        waktu_absen: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      include: {
        user: true,
        jam_detail_jadwal: {
          include: {
            kelas: true,
          },
        },
      },
    });

    // Process attendance data into weekly records
    const attendanceMap = new Map<string, MonthlyAttendanceRecord>();

    absens.forEach((absen) => {
      const userName = absen.user?.nama || 'Unknown';
      const className = absen.jam_detail_jadwal?.kelas?.nama_kelas || 'Unknown';
      const date = new Date(absen.waktu_absen);
      const weekNumber = Math.ceil(date.getDate() / 7);

      if (!attendanceMap.has(userName)) {
        attendanceMap.set(userName, {
          name: userName,
          className,
          week1: { att: 0, per: 0, ab: 0, la: 0 },
          week2: { att: 0, per: 0, ab: 0, la: 0 },
          week3: { att: 0, per: 0, ab: 0, la: 0 },
          week4: { att: 0, per: 0, ab: 0, la: 0 },
          averagePercentage: 0,
        });
      }

      const record = attendanceMap.get(userName);
      const weekData = record[`week${weekNumber}`];

      // Update attendance counts based on status
      switch (absen.status?.toLowerCase()) {
        case 'hadir':
          weekData.att++;
          break;
        case 'permission':
          weekData.per++;
          break;
        case 'alpha':
          weekData.ab++;
          break;
        case 'late':
          weekData.la++;
          break;
      }

      // Logic to handle incomplete weeks and mark remaining days as "absent"
      const totalAttendance =
        weekData.att + weekData.per + weekData.ab + weekData.la;
      const maxWeekDays = 6; // Maximum number of days in a week for this case

      if (totalAttendance < maxWeekDays) {
        const missingDays = maxWeekDays - totalAttendance;
        weekData.ab += missingDays; // Mark the remaining days as absent
      }

      // Calculate average percentage
      const totalDays = ['week1', 'week2', 'week3', 'week4'].reduce(
        (sum, week) => {
          const w = record[week];
          return sum + w.att + w.per + w.ab + w.la;
        },
        0,
      );

      const totalPresent = ['week1', 'week2', 'week3', 'week4'].reduce(
        (sum, week) => {
          const w = record[week];
          return sum + w.att;
        },
        0,
      );

      record.averagePercentage =
        totalDays > 0
          ? parseFloat(((totalPresent / totalDays) * 100).toFixed(1))
          : 0;
    });

    return Array.from(attendanceMap.values());
  }

  private addMonthlyReportTitle(doc: PDFKit.PDFDocument, role: string): void {
    const currentDate = new Date();
    const monthName = currentDate.toLocaleString('id-ID', {
      month: 'long',
      year: 'numeric',
    });

    doc
      .moveDown(0.5)
      .fontSize(18)
      .font(this.FONT_BOLD)
      .text(`Laporan Rekap Bulanan ${role} - ${monthName}`, 0, doc.y, {
        align: 'center',
      })
      .moveDown(1);
  }

  async getAttendanceData(role: any): Promise<AttendanceRecord[]> {
    // Get the current date
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const week = Math.ceil(currentDate.getDate() / 7);

    // Get attendance data using the existing list method logic
    const absens = await this.prisma.absen_siswa.findMany({
      where: {
        user: {
          role,
        },
        waktu_absen: {
          gte: new Date(year, month - 1, (week - 1) * 7 + 1),
          lte: new Date(year, month - 1, week * 7),
        },
      },
      include: {
        user: true,
        jam_detail_jadwal: {
          include: {
            kelas: true,
            jam_jadwal: {
              include: {
                jadwal: {
                  include: {
                    hari: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Group attendance by user
    const attendanceByUser = new Map<string, AttendanceRecord>();

    absens.forEach((absen) => {
      const userName = absen.user?.nama || 'Unknown';
      const className = absen.jam_detail_jadwal?.kelas?.nama_kelas || 'Unknown';
      const dayName =
        absen.jam_detail_jadwal?.jam_jadwal?.jadwal?.hari?.nama_hari?.toLowerCase() ||
        '';
      const status = absen.status || 'Abs';

      if (!attendanceByUser.has(userName)) {
        attendanceByUser.set(userName, {
          name: userName,
          className,
          mon: 'Abs',
          tue: 'Abs',
          wed: 'Abs',
          thu: 'Abs',
          fri: 'Abs',
          sat: 'Abs',
        });
      }

      const record = attendanceByUser.get(userName);

      // Map the day to the corresponding field
      switch (dayName) {
        case 'senin':
          record.mon = status;
          break;
        case 'selasa':
          record.tue = status;
          break;
        case 'rabu':
          record.wed = status;
          break;
        case 'kamis':
          record.thu = status;
          break;
        case 'jumat':
          record.fri = status;
          break;
        case 'sabtu':
          record.sat = status;
          break;
      }
    });

    return Array.from(attendanceByUser.values());
  }
}
