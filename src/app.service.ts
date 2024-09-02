import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Like, Repository } from 'typeorm';

import * as webPush from 'web-push';
import { AbsenGateway } from './app/absen/absen.gateway';
import { PrismaService } from './prisma/prisma.service';

webPush.setVapidDetails(
  'mailto:nayhan.nayhn@example.com',
  'BDxOXWB_-WZelAIl-UDXXOmtrI7B0Ldd1ltENQs2zgyLR9FJO4ODbQaxihiWghHOy5sj6TfX2eoREXFfUacLm24',
  'sDrmPBNFvvb0jrbcJQ9KTnKijfVgUP46SrKb47Re2ZU',
);

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly absenGateway: AbsenGateway, // @Inject(REQUEST) // readonly req: any,
  ) {}
  getHello(): string {
    return 'Hai';
  }
}
