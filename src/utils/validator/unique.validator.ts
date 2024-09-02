/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { EntityManager } from 'typeorm';

@ValidatorConstraint({ async: true })
@Injectable()
export class UniqueValidator implements ValidatorConstraintInterface {
  constructor(private readonly entityManager: EntityManager) {}
  async validate(value: any, arg?: ValidationArguments): Promise<boolean> {
    const find = { [arg.constraints[1]]: arg.value };
    const user = await this.entityManager
      .getRepository(arg.constraints[0])
      .findOne({
        where: find,
      });

    if (user === null) {
      return true;
    } else {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.constraints[1]} sudah digunakan`;
  }
}
export function IsUnique(options: any, validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsUnique',
      target: object.constructor,
      constraints: options,
      propertyName: propertyName,
      options: validationOptions,
      validator: UniqueValidator,
      async: true,
    });
  };
}