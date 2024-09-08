import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbsenController } from './absen.controller';
import { AbsenService } from './absen.service';
// import { AbsenGuru } from './absen-guru/absen-guru.entity';
// import { Jadwal } from '../jadwal/jadwal.entity';
// import { User } from '../auth/auth.entity';
// import { JamJadwal } from '../jadwal/jam-jadwal.entity';
// import { JamDetailJadwal } from 'src/app/jadwal/jam-detail-jadwal.entity';
// import { Kelas } from '../kelas/kelas.entity';
// import { AbsenKelas } from './absen-kelas/absen-kelas.entity';
// import { AbsenSiswa } from './absen-siswa/absen-siswa.entity';
// import { Murid } from '../auth/siswa/siswa.entity';
// import { JurnalKegiatan } from './jurnal-kegiatan.entity';
// import { Guru } from '../auth/guru/guru.entity';
// import { SubjectCodeEntity } from '../subject_code/subject_code.entity';
// import { AbsenGateway } from './absen.gateway';
// import { RekapAbsen } from '../rekap-absen/rekap-absen.entity';
import { AbsenSiswaService } from './absen-siswa/absen-siswa.service';
import { AbsenGuruService } from './absen-guru/absen-guru.service';
import { AbsenGuruController } from './absen-guru/absen-guru.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { AbsenSiswaController } from './absen-siswa/absen-siswa.controller';
import { AbsenGateway } from './absen.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';
// import { GeoLocation } from '../geo-location/geo-location.entity';

@Module({
  imports: [
    PrismaModule
  ],
  controllers: [AbsenController, AbsenSiswaController, AbsenGuruController],
  providers: [AbsenService, AbsenGateway, AbsenSiswaService, AbsenGuruService],
})
export class AbsenModule {}
