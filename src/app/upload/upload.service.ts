// upload.service.ts
import { Injectable } from '@nestjs/common';
import cloudinary from '../../config/cloudinary.config';

@Injectable()
export class UploadService {
  async uploadImage(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        },
      ).end(file.buffer);
    });
  }
}
