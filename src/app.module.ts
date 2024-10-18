import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './app/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ProfileModule } from './app/profile/profile.module';
import { UniqueValidator } from './utils/validator/unique.validator';
import { KelasModule } from './app/kelas/kelas.module';
import { MapelModule } from './app/mapel/mapel.module';
import { JadwalModule } from './app/jadwal/jadwal.module';
import { AbsenModule } from './app/absen/absen.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './app/auth/roles.guard';
import { SubjectCodeModule } from './app/subject_code/subject_code.module';
import { HariModule } from './app/hari/hari.module';
import { DownloadModule } from './app/download/download.module';
import { RekapAbsenModule } from './app/rekap-absen/rekap-absen.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AbsenService } from './app/absen/absen.service';
import { GeoLocationModule } from './app/geo-location/geo-location.module';
import { AbsenGateway } from './app/absen/absen.gateway';
import { AuthService } from './app/auth/auth.service';
import { DownloadService } from './app/download/download.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { UploadService } from './app/upload/upload.service';
import { UploadModule } from './app/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ScheduleModule.forRoot(),
    AuthModule,
    ProfileModule,
    KelasModule,
    MapelModule,
    JadwalModule,
    AbsenModule,
    SubjectCodeModule,
    HariModule,
    DownloadModule,

    RekapAbsenModule,
    GeoLocationModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthService, AbsenGateway, DownloadService, UploadService],
})
export class AppModule {}
