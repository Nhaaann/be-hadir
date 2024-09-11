/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Response } from 'express';
import * as PDFKit from 'pdfkit'; // Perbaiki impor pdfkit
import BaseResponse from '../../utils/response/base.response';
import { ResponseSuccess } from '../../utils/interface/respone';

@Injectable()
export class DownloadService extends BaseResponse {
  constructor() {
    super();
  }

  private generateUniqueFilename(): string {
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const formattedTime = now.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
    return `attendance-report-${formattedDate}-${formattedTime}.pdf`;
  }

  private generatePDFDocument(data: any[]): PDFKit.PDFDocument {
    const doc = new PDFKit({
      size: 'A4',
      layout: 'portrait',
    });

    const leftImagePath = 'assets/Logo mq.png';
    const rightImagePath = 'assets/TUT.png';

    // Add images and header
    doc
      .image(leftImagePath, 80, 90, { width: 40 })
      .image(rightImagePath, 470, 90, { width: 40 })
      .fontSize(14)
      .moveDown(2)
      .font('Helvetica-Bold')
      .text('YAYASAN PESANTREN WISATA ALAM', { align: 'center' })
      .text('SMK MADINATUL QURAN', { align: 'center' })
      .moveDown(1)
      .fontSize(11)
      .font('Helvetica')
      .text(
        'Kp. Kebon Kelapa, RT.02/RW.011, Singasari, Kec. Jonggol, Kabupaten Bogor, Jawa Barat 16830',
        { align: 'center' },
      )
      .moveDown(2);

    const startY = 200;
    const rowHeight = 20;
    const columnWidths = [40, 115, 60, 60, 60, 60, 60, 65]; // Adjust column widths as needed
    const columns = ['No', 'Name', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const xStart = 45;

    // Helper function to draw borders
    const drawBorder = (
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      doc
        .moveTo(x, y)
        .lineTo(x + width, y)
        .lineTo(x + width, y + height)
        .lineTo(x, y + height)
        .closePath()
        .stroke();
    };

    // Draw table header
    let x = xStart;
    let headerY = startY;

    columns.forEach((col, i) => {
      doc.fontSize(12).fillColor('black').text(col, x, headerY);
      x += columnWidths[i];
    });

    // Draw table header border
    drawBorder(
      xStart,
      headerY,
      columnWidths.reduce((a, b) => a + b, 0),
      rowHeight,
    );

    x = xStart;
    // Draw vertical borders for header
    columns.forEach((_, i) => {
      doc
        .moveTo(x, headerY)
        .lineTo(x, headerY + rowHeight)
        .stroke();
      x += columnWidths[i];
    });

    let y = headerY + rowHeight;

    // Draw table rows
    data.forEach((row, index) => {
      x = xStart;
      doc
        .fontSize(10)
        .fillColor('black')
        .text(`${index + 1}`, x, y)
        .text(row.name, x + columnWidths[0], y)
        .text(row.mon, x + columnWidths[0] + columnWidths[1], y)
        .text(
          row.tue,
          x + columnWidths[0] + columnWidths[1] + columnWidths[2],
          y,
        )
        .text(
          row.wed,
          x +
            columnWidths[0] +
            columnWidths[1] +
            columnWidths[2] +
            columnWidths[3],
          y,
        )
        .text(
          row.thu,
          x +
            columnWidths[0] +
            columnWidths[1] +
            columnWidths[2] +
            columnWidths[3] +
            columnWidths[4],
          y,
        )
        .text(
          row.fri,
          x +
            columnWidths[0] +
            columnWidths[1] +
            columnWidths[2] +
            columnWidths[3] +
            columnWidths[4] +
            columnWidths[5],
          y,
        )
        .text(
          row.sat,
          x +
            columnWidths[0] +
            columnWidths[1] +
            columnWidths[2] +
            columnWidths[3] +
            columnWidths[4] +
            columnWidths[5] +
            columnWidths[6],
          y,
        );

      // Draw row border
      drawBorder(
        xStart,
        y - rowHeight,
        columnWidths.reduce((a, b) => a + b, 0),
        rowHeight,
      );

      x = xStart;
      // Draw vertical borders for each cell
      columns.forEach((_, i) => {
        doc
          .moveTo(x, y)
          .lineTo(x, y + rowHeight)
          .stroke();
        x += columnWidths[i];
      });

      y += rowHeight;
    });

    // Draw outer border for the table
    drawBorder(
      xStart,
      startY,
      columnWidths.reduce((a, b) => a + b, 0),
      y - startY,
    );

    return doc;
  }

  async generateAttendanceReport(response: Response): Promise<ResponseSuccess> {
    const dummyData = [
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
        name: 'Rizky Alfiansyah',
        mon: 'Att',
        tue: 'Att',
        wed: 'Att',
        thu: 'Att',
        fri: 'Att',
        sat: 'Late',
      },
    ];

    const pdfDoc = this.generatePDFDocument(dummyData);

    // Generate a unique filename
    const uniqueFilename = this.generateUniqueFilename();
    const downloadsPath = 'D:\\Users\\fatin\\Downloads\\pdf';
    const filePath = path.join(downloadsPath, uniqueFilename);

    // Ensure the directory exists
    if (!fs.existsSync(downloadsPath)) {
      fs.mkdirSync(downloadsPath, { recursive: true });
    }

    const writeStream = fs.createWriteStream(filePath);

    pdfDoc.pipe(writeStream);

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

    pdfDoc.end();

    return this._success('OK, berhasil download', response);
  }
}
