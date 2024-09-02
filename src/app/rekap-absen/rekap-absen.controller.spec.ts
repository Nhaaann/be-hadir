import { Test, TestingModule } from '@nestjs/testing';
import { RekapAbsenController } from './rekap-absen.controller';

describe('RekapAbsenController', () => {
  let controller: RekapAbsenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RekapAbsenController],
    }).compile();

    controller = module.get<RekapAbsenController>(RekapAbsenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
