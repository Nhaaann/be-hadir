// src/app/kelas/kelas.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { Kelas } from './kelas.entity';
import { KelasService } from './kelas.service';
import { KelasController } from './kelas.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [KelasService],
  controllers: [KelasController],
})
export class KelasModule {}
