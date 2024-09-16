/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// import { User } from './auth.entity';
import { Repository } from 'typeorm';
import {
  ResponsePagination,
  ResponseSuccess,
} from '../../utils/interface/respone';
import {
  DeleteBulkUserDto,
  LoginDto,
  queryUSerDTO,
  RegisterDto,
  ResetPasswordDto,
} from './auth.dto';
import { compare, hash } from 'bcrypt'; //import hash

import { JwtService } from '@nestjs/jwt';
import { jwt_config } from '../../config/jwt.config';
// import { MailService } from '../mail/mail.service';
import { randomBytes } from 'crypto';

import { Role } from './roles.enum';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import BaseResponse from '../../utils/response/base.response';
import { Prisma, user_role_enum } from '@prisma/client';
import { formatRole } from '../../utils/helper function/formattedRole';

@Injectable()
export class AuthService extends BaseResponse {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    // private mailService: MailService,
    @Inject(REQUEST) private req: any,
  ) {
    super();
  }

  async getUserId() {
    const userId = this.req.user.id;
    return userId;
  }

  async getUsers(query: any): Promise<ResponsePagination> {
    const {
        role,
        page = 1,
        pageSize = 10,
        nama,
        sort_by = 'id',
        order_by = 'asc',
    } = query;

    let filter: Prisma.userWhereInput = {};

    if (role && role !== 'all') {
        const formattedRole = formatRole(role) as user_role_enum;
        if (!Object.values(user_role_enum).includes(formattedRole)) {
            throw new HttpException(
                `Role tidak valid. Gunakan role berikut: ${Object.values(user_role_enum).join(', ')}`, 
                HttpStatus.BAD_REQUEST
            );
        }
        filter.role = formattedRole;
    }

    if (nama) {
        filter.nama = { contains: nama, mode: 'insensitive' };
    }

    const total = await this.prisma.user.count({ where: filter });

    const users = await this.prisma.user.findMany({
        where: filter,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
            [sort_by]: order_by.toLowerCase() as 'asc' | 'desc',
        },
    });

    return this._pagination('Success', users, total, page, pageSize);
}


  async register(payload: RegisterDto): Promise<any> {
    // Check if user already exists
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (existingUser) {
        throw new HttpException(
          'User dengan email ini sudah terdaftar',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Hash the password
      const hashedPassword = await hash(payload.password, 12);

      // Create a new user
      const user = await this.prisma.user.create({
        data: {
          ...payload,
          role: payload.role as any,
          password: hashedPassword,
          avatar: 'http://localhost:2009/uploads/default-avatar.svg', // Set default avatar or other default values
        },
      });

      return {
        status: 'Success',
        message: 'Pendaftaran berhasil',
        data: user,
      };
    } catch (error) {
      console.error('Error during user registration:', error);
      return {
        message: `Error during user registration: ${error.message}`,
      };
    }
  }

  async resetPassword(
    userId: number,
    token: string,
    payload: ResetPasswordDto,
  ): Promise<any> {
    // Check if the token and user are valid
    const userToken = await this.prisma.reset_password.findFirst({
      where: {
        token,
        user_id: userId,
      },
    });

    if (!userToken) {
      throw new HttpException(
        'Token tidak valid',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (payload.confirm_password !== payload.new_password) {
      throw new HttpException(
        'Password tidak sama',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Hash the new password
    const hashedPassword = await hash(payload.new_password, 12);

    // Update the user's password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Delete all reset tokens for the user
    await this.prisma.reset_password.deleteMany({
      where: { user_id: userId },
    });
  }

  async login(payload: LoginDto): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: payload.email,
      },
      select: {
        id: true,
        nama: true,
        email: true,
        password: true,
        refresh_token: true,
        role: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new HttpException(
        'User tidak ditemukan',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const checkPassword = await compare(payload.password, user.password);
    if (checkPassword) {
      const jwtPayload: jwtPayload = {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      };

      const access_token = await this.generateJWT(
        jwtPayload,
        '7d',
        jwt_config.access_token_secret,
      );
      const refresh_token = await this.generateJWT(
        jwtPayload,
        '7d',
        jwt_config.refresh_token_secret,
      );

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refresh_token: refresh_token },
      });

      return {
        status: 'Success',
        message: 'Success Login',
        data: {
          ...user,
          access_token: access_token,
          refresh_token: refresh_token,
        },
      };
    } else {
      throw new HttpException(
        'Email atau Password tidak sesuai',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async refreshToken(id: number, token: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
        refresh_token: token,
      },
      select: {
        id: true,
        nama: true,
        email: true,
        password: true,
        refresh_token: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const jwtPayload: jwtPayload = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    };

    const access_token = await this.generateJWT(
      jwtPayload,
      '1d',
      jwt_config.access_token_secret,
    );

    const refresh_token = await this.generateJWT(
      jwtPayload,
      '1d',
      jwt_config.refresh_token_secret,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: refresh_token },
    });

    return {
      status: 'Success',
      message: 'Success Update Token',
      data: {
        ...user,
        access_token: access_token,
        refresh_token: refresh_token,
      },
    };
  }

  async profile(id: number): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return {
      message: 'OK',
      data: user,
    };
  }

  async profileCheck(id: number): Promise<any> {
    return this.profile(id); // Memanggil fungsi profile untuk memeriksa
  }

  async forgotPassword(email: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new HttpException(
        'Email tidak ditemukan',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const token = randomBytes(32).toString('hex');
    const link = `http://localhost:3000/reset-password/${user.id}/${token}`;

    const payload = {
      userId: user.id,
      token: token,
    };

    await this.prisma.reset_password.create({
      data: payload,
    });

    // await this.mailService.sendForgotPassword({
    //   email: email,
    //   name: user.nama,
    //   link: link,
    // });

    return {
      message: 'Silahkan Cek Email',
      token: token,
      email: email,
    };
  }

  async deleteBulkUser(payload: DeleteBulkUserDto): Promise<any> {
    try {
      let berhasil = 0;
      let gagal = 0;
      await Promise.all(
        payload.data.map(async (data) => {
          try {
            const result = await this.prisma.user.deleteMany({
              where: {
                id: data.id,
              },
            });
            if (result.count === 1) {
              berhasil += 1;
            } else {
              gagal += 1;
            }
          } catch {
            gagal += 1;
          }
        }),
      );
      return {
        berhasil,
        gagal,
      };
    } catch {
      throw new HttpException('Ada Kesalahan', HttpStatus.BAD_REQUEST);
    }
  }

  private generateJWT(
    payload: jwtPayload,
    expiresIn: string | number,
    secret_key: string,
  ) {
    return this.jwtService.sign(payload, {
      secret: secret_key,
      expiresIn: expiresIn,
    });
  }
}
