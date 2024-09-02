import { Test, TestingModule } from '@nestjs/testing';
import { MapelController } from './mapel.controller';

describe('MapelController', () => {
  let controller: MapelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MapelController],
    }).compile();

    controller = module.get<MapelController>(MapelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
