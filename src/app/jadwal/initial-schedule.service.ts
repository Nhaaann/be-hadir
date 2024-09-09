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

  async createInitialSchedule(dto: any): Promise<any> {
    const { schedule_name } = dto;

    // Validate that the schedule_name is a single character A-Z
    if (!/^[A-Z]$/.test(schedule_name)) {
      throw new Error('Invalid schedule name. Must be a single uppercase letter from A to Z.');
    }

    // Check if the schedule already exists
    const existingSchedule = await this.prisma.initial_schedule.findUnique({
      where: { schedule_name },
    });

    if (existingSchedule) {
      throw new Error('Schedule already exists.');
    }

    // Create the initial schedule
    const createdSchedule = await this.prisma.initial_schedule.create({
      data: { schedule_name },
    });

    // Add schedules from A to Z
    const schedulesToCreate = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(char => ({ schedule_name: char }));

    // Create multiple schedules at once
    await this.prisma.initial_schedule.createMany({
      data: schedulesToCreate
    });

    return {
      status: 'Success',
      message: 'Initial schedule created successfully and A-Z schedules added',
      data: createdSchedule,
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
