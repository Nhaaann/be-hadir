import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
// import { PrismaService } from '../prisma.service'; // Make sure this points to your Prisma service
import { CreateGeoLocationDto } from './geo-location.dto';
import { ResponseSuccess } from 'src/utils/interface/respone';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GeoLocationService {
  constructor(private readonly prisma: PrismaService) {}

  async getGeoLocation(id: number): Promise<any> {
    const geoLocation = await this.prisma.geo_location.findUnique({
      where: { id },
    });
    if (!geoLocation) {
      throw new NotFoundException('Geolocation not found');
    }
    return {
      status: 'Success',
      message: 'OKe',
      data: geoLocation,
    };
  }

  async createGeoLocation(pay: CreateGeoLocationDto): Promise<any> {
    try {
      const geoLocation = await this.prisma.geo_location.create({
        data: pay as any
      });
      
      return {
        status: 'Success',
        message: 'OKe',
        data: geoLocation,
      };
    } catch (error) {
      // Handle specific error scenarios if needed
      throw new ConflictException('Error creating geolocation');
    }
  }

  async updateGeoLocation(
    id: number,
    updateGeoLocationDto: CreateGeoLocationDto,
  ): Promise<any> {
    const geoLocation = await this.prisma.geo_location.findUnique({
      where: { id },
    });
    if (!geoLocation) {
      throw new NotFoundException('Geolocation not found');
    }

    const updatedGeoLocation = await this.prisma.geo_location.update({
      where: { id },
      data: updateGeoLocationDto,
    });
    return {
      status: 'Success',
      message: 'OKe',
      data: updatedGeoLocation,
    };
  }

  async deleteGeoLocation(id: number): Promise<any> {
    const geoLocation = await this.prisma.geo_location.findUnique({
      where: { id },
    });
    if (!geoLocation) {
      throw new NotFoundException('Geolocation not found');
    }

    await this.prisma.geo_location.delete({
      where: { id },
    });
    return {
      status: 'Success',
      message: 'OKe',
      data: { id },
    };
  }
}
