import { Test, TestingModule } from '@nestjs/testing';
import { AbsenController } from './absen.controller';

describe('AbsenController', () => {
  let controller: AbsenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AbsenController],
    }).compile();

    controller = module.get<AbsenController>(AbsenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
