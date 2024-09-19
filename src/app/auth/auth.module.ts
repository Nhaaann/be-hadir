import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from './auth.entity';
// import { JwtModule } from '@nestjs/jwt';
import { JwtAccessTokenStrategy } from './jwtAccessToken.strategy';
import { JwtRefreshTokenStrategy } from './jwtRefreshToken.strategy';
// import { MailModule } from '../mail/mail.module';
// import { ResetPassword } from './reset_password.entity';
// import { Guru } from './guru/guru.entity';
// import { Mapel } from '../mapel/mapel.entity';
// import { Kelas } from '../kelas/kelas.entity';
// import { Murid } from './siswa/siswa.entity';
import { SiswaController } from './siswa/siswa.controller';
import { SiswaService } from './siswa/siswa.service';
import { GuruService } from './guru/guru.service';
import { GuruController } from './guru/guru.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
// import { SubjectCodeEntity } from '../subject_code/subject_code.entity';
import * as dotenv from 'dotenv';
import { StafController } from './staf/staf.controller';
import { StafService } from './staf/staf.service';
import { AppService } from 'src/app.service';
import { AbsenGateway } from '../absen/absen.gateway';
dotenv.config();

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      global: true,
      signOptions: {
        algorithm: 'HS256',
      },
    }),
    // MailModule,
  ],
  controllers: [AuthController, SiswaController, GuruController, StafController],
  providers: [
    AuthService,
    JwtAccessTokenStrategy,
    JwtRefreshTokenStrategy,
    SiswaService,
    AppService,
    GuruService,
    AbsenGateway,
    StafService,
  ],
})
export class AuthModule {}
