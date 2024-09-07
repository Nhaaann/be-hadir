import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { DownloadService } from './download.service';

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get('pdf')
  async downloadAttendanceReport(@Res() res: Response): Promise<void> {
    try {
      await this.downloadService.generateAttendanceReport(res);
    } catch (error) {
      console.error('Error generating attendance report:', error);
      res.status(500).send('Failed to generate report');
    }
  }
}
