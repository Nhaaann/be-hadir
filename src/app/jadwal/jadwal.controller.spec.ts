import { Test, TestingModule } from '@nestjs/testing';
import { JadwalController } from './jadwal.controller';

describe('JadwalController', () => {
  let controller: JadwalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JadwalController],
    }).compile();

    controller = module.get<JadwalController>(JadwalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
