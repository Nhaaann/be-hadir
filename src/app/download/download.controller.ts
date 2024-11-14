import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { DownloadService } from './download.service';

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get('pdf-week')
  async downloadAttendanceReport(@Res() res: Response): Promise<void> {
    try {
      await this.downloadService.generateAttendanceReport(res);
    } catch (error) {
      console.error('Error generating attendance report:', error);
      res.status(500).send('Failed to generate report');
    }
  }

  @Get('pdf-month')
  async downloadAttendanceReportMontly(@Res() res: Response): Promise<void> {
    try {
      await this.downloadService.generateMonthlyReport(res);
    } catch (error) {
      console.error('Error generating attendance report:', error);
      res.status(500).send('Failed to generate report');
    }
  }

  @Get('preview-data-week')
  async previewAttendanceData(): Promise<any> {
    const attendanceData = await this.downloadService.getAttendanceData();
    return {
      status: 'Success',
      message: 'Preview of attendance data',
      data: attendanceData,
    };
  }

  @Get('preview-data-month')
  async previewAttendanceDataMOntly(): Promise<any> {
    const attendanceData = await this.downloadService.getMonthlyAttendanceData();
    return {
      status: 'Success',
      message: 'Preview of attendance data',
      data: attendanceData,
    };
  }
}
