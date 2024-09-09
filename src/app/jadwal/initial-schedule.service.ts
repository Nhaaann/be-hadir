// initial-schedule.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import {
//   CreateInitialScheduleDto,
//   UpdateInitialScheduleDto,
// } from './initial-schedule.dto';

@Injectable()
export class InitialScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async createInitialSchedule(): Promise<any> {
    // Create schedules from A to Z
    const schedulesToCreate = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char) => ({ schedule_name: char }));

    // Create multiple schedules at once, skipping any that already exist
    const createdSchedules = await this.prisma.initial_schedule.createMany({
      data: schedulesToCreate,
      skipDuplicates: true, // Skip creating schedules that already exist
    });

    return {
      status: 'Success',
      message: 'Initial schedules from A to Z created successfully',
      data: createdSchedules,
    };
  }

  async getAvailableSchedules(): Promise<any> {
    // Get all schedules that are not associated with any teacher
    const availableSchedules = await this.prisma.initial_schedule.findMany({
      where: {
        guru: {
          none: {},
        },
      },
      select: {
        schedule_name: true,
      },
    });
  
    return {
      status: 'Success',
      message: 'Available schedules fetched successfully',
      data: availableSchedules,
    };
  }
  

  async updateInitialSchedule(
    id: number,
    dto: any,
  ): Promise<any> {
    const { schedule_name } = dto;

    // Check if the initial schedule exists
    const existingSchedule = await this.prisma.initial_schedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      throw new HttpException(
        'Initial schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Update the initial schedule
    const updatedSchedule = await this.prisma.initial_schedule.update({
      where: { id },
      data: { schedule_name },
    });

    return {
      status: 'Success',
      message: 'Initial schedule updated successfully',
      data: updatedSchedule,
    };
  }

  async deleteInitialSchedule(id: number): Promise<any> {
    // Check if the initial schedule exists
    const existingSchedule = await this.prisma.initial_schedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      throw new HttpException(
        'Initial schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Delete the initial schedule
    await this.prisma.initial_schedule.delete({
      where: { id },
    });

    return {
      status: 'Success',
      message: 'Initial schedule deleted successfully',
    };
  }

  async getInitialSchedules(): Promise<any> {
    const schedules = await this.prisma.initial_schedule.findMany();

    return {
      status: 'Success',
      message: 'List of initial schedules retrieved successfully',
      data: schedules,
    };
  }
}
