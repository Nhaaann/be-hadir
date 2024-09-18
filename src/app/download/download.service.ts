import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFKit from 'pdfkit';
import BaseResponse from '../../utils/response/base.response';
import { ResponseSuccess } from '../../utils/interface/respone';

interface AttendanceRecord {
  name: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
}

@Injectable()
export class DownloadService extends BaseResponse {
  private readonly DOWNLOAD_PATH = 'D:\\Users\\fatin\\Downloads\\pdf';
  private readonly PAGE_SIZE = 'A4';
  private readonly PAGE_LAYOUT = 'portrait';
  private readonly FONT_REGULAR = 'Helvetica';
  private readonly FONT_BOLD = 'Helvetica-Bold';

  constructor() {
    super();
  }

  async generateAttendanceReport(response: Response): Promise<ResponseSuccess> {
    const dummyData = this.getDummyData();
    const pdfDoc = this.createPDFDocument();
    
    this.addHeaderAndImages(pdfDoc);
    this.createAttendanceTable(pdfDoc, dummyData);

    const filePath = this.saveAndDownloadPDF(pdfDoc, response);

    return this._success('OK, berhasil download', response);
  }

  private createPDFDocument(): PDFKit.PDFDocument {
    return new PDFKit({
      size: this.PAGE_SIZE,
      layout: this.PAGE_LAYOUT,
    });
  }

  private addHeaderAndImages(doc: PDFKit.PDFDocument): void {
    const leftImagePath = 'assets/Logo mq.png';
    const rightImagePath = 'assets/TUT.png';

    doc.image(leftImagePath, 80, 90, { width: 40 })
       .image(rightImagePath, 470, 90, { width: 40 })
       .fontSize(14)
       .moveDown(2)
       .font(this.FONT_BOLD)
       .text('YAYASAN PESANTREN WISATA ALAM', { align: 'center' })
       .text('SMK MADINATUL QURAN', { align: 'center' })
       .moveDown(1)
       .fontSize(11)
       .font(this.FONT_REGULAR)
       .text('Kp. Kebon Kelapa, RT.02/RW.011, Singasari, Kec. Jonggol, Kabupaten Bogor, Jawa Barat 16830', { align: 'center' })
       .moveDown(2);
  }

  private createAttendanceTable(doc: PDFKit.PDFDocument, data: AttendanceRecord[]): void {
    const startY = 200;
    const rowHeight = 20;
    const columnWidths = [40, 115, 60, 60, 60, 60, 60, 65];
    const columns = ['No', 'Name', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const xStart = 45;

    this.drawTableHeader(doc, columns, xStart, startY, columnWidths, rowHeight);
    this.drawTableRows(doc, data, xStart, startY + rowHeight, columnWidths, rowHeight);
  }

  private drawTableHeader(doc: PDFKit.PDFDocument, columns: string[], x: number, y: number, columnWidths: number[], rowHeight: number): void {
    let currentX = x;
    columns.forEach((col, i) => {
      doc.fontSize(12).fillColor('black').text(col, currentX, y);
      currentX += columnWidths[i];
    });

    this.drawBorder(doc, x, y, columnWidths.reduce((a, b) => a + b, 0), rowHeight);
    this.drawVerticalBorders(doc, columns, x, y, columnWidths, rowHeight);
  }

  private drawTableRows(doc: PDFKit.PDFDocument, data: AttendanceRecord[], x: number, y: number, columnWidths: number[], rowHeight: number): void {
    data.forEach((row, index) => {
      const rowY = y + index * rowHeight;
      this.drawRowContent(doc, row, index, x, rowY, columnWidths);
      this.drawBorder(doc, x, rowY, columnWidths.reduce((a, b) => a + b, 0), rowHeight);
      this.drawVerticalBorders(doc, Object.keys(row), x, rowY, columnWidths, rowHeight);
    });
  }

  private drawRowContent(doc: PDFKit.PDFDocument, row: AttendanceRecord, index: number, x: number, y: number, columnWidths: number[]): void {
    doc.fontSize(10).fillColor('black');
    let currentX = x;

    doc.text(`${index + 1}`, currentX, y);
    currentX += columnWidths[0];

    Object.values(row).forEach((value, i) => {
      doc.text(value, currentX, y);
      currentX += columnWidths[i + 1];
    });
  }

  private drawBorder(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number): void {
    doc.rect(x, y, width, height).stroke();
  }

  private drawVerticalBorders(doc: PDFKit.PDFDocument, columns: string[], x: number, y: number, columnWidths: number[], rowHeight: number): void {
    let currentX = x;
    columns.forEach((_, i) => {
      doc.moveTo(currentX, y).lineTo(currentX, y + rowHeight).stroke();
      currentX += columnWidths[i];
    });
  }

  private saveAndDownloadPDF(doc: PDFKit.PDFDocument, response: Response): string {
    const uniqueFilename = this.generateUniqueFilename();
    const filePath = path.join(this.DOWNLOAD_PATH, uniqueFilename);

    if (!fs.existsSync(this.DOWNLOAD_PATH)) {
      fs.mkdirSync(this.DOWNLOAD_PATH, { recursive: true });
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
    return `attendance-report-${formattedDate}-${formattedTime}.pdf`;
  }

  private getDummyData(): AttendanceRecord[] {
    return [
      {
        name: 'Rizky Alfiansyah',
        mon: 'Att',
        tue: 'Att',
        wed: 'Att',
        thu: 'Att',
        fri: 'Att',
        sat: 'Late',
      },
      {
        name: 'John Doe',
        mon: 'Att',
        tue: 'Late',
        wed: 'Att',
        thu: 'Abs',
        fri: 'Att',
        sat: 'Att',
      },
    ];
  }
}