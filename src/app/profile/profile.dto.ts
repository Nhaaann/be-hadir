import { PickType } from '@nestjs/mapped-types';
import { UserDto } from '../auth/auth.dto';

export class UpdateProfileDto extends PickType(UserDto, [
  'avatar',
  'nama',
  'id',
]) {}
