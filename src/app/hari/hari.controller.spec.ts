import { Test, TestingModule } from '@nestjs/testing';
import { HariController } from './hari.controller';

describe('HariController', () => {
  let controller: HariController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HariController],
    }).compile();

    controller = module.get<HariController>(HariController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
