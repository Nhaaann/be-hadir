// src/app/hari/hari.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { Hari } from './hari.entity';
import { HariService } from './hari.service';
import { HariController } from './hari.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [HariService],
  controllers: [HariController],
})
export class HariModule {}
