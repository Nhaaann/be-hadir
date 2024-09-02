import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const InjectUpdatedBy = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    console.log('Request Headers:', request.headers); // Tampilkan header untuk memeriksa apakah token ada di sini
    console.log('Request User:', request.user); // Tampilkan informasi pengguna untuk memeriksa apakah user ada di sini

    const updatedBy = request.user ? request.user.id : null;
    return updatedBy;
  },
);
