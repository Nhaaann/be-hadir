import {
    Controller,
    Delete,
    HttpException,
    HttpStatus,
    MaxFileSizeValidator,
    Param,
    ParseFilePipe,
    Post,
    UploadedFile,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
  } from '@nestjs/common';
  import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
  import { ResponseSuccess } from '../../utils/interface/respone';
  import { JwtGuard } from '../auth/auth.guard';
  import { UploadService } from './upload.service';
import cloudinary from 'src/config/cloudinary.config';
  
  @UseGuards(JwtGuard)
  @Controller('upload')
  export class UploadController {
    constructor(private readonly uploadService: UploadService) {}
  
    @Post('file')
    @UseInterceptors(
      FileInterceptor('file', {
        fileFilter: (req, file, cb) => {
          if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|svg)$/)) {
            return cb(
              new HttpException(
                'Hanya file gambar (JPG, JPEG, PNG, PDF) yang diizinkan',
                HttpStatus.BAD_REQUEST,
              ),
              false,
            );
          }
          cb(null, true);
        },
      }),
    )
    async uploadFile(
      @UploadedFile(
        new ParseFilePipe({
          validators: [new MaxFileSizeValidator({ maxSize: 2097152 })],
        }),
      )
      file: Express.Multer.File,
    ): Promise<any> {
      try {
        const result = await this.uploadService.uploadImage(file);
        return {
          status: 'Success',
          message: 'File uploaded successfully',
          data: {
            file_url: result.secure_url,
            file_name: result.public_id,
            file_size: file.size,
          },
        };
      } catch (err) {
        throw new HttpException('Upload failed', HttpStatus.BAD_REQUEST);
      }
    }
  
    @Post('files')
    @UseInterceptors(
      FilesInterceptor('files', 20, {
        fileFilter: (req, file, cb) => {
          if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|svg)$/)) {
            return cb(
              new HttpException(
                'Hanya file gambar (JPG, JPEG, PNG, PDF) yang diizinkan',
                HttpStatus.BAD_REQUEST,
              ),
              false,
            );
          }
          cb(null, true);
        },
      })
    )
    async uploadFileMulti(
      @UploadedFiles(
        new ParseFilePipe({
          validators: [new MaxFileSizeValidator({ maxSize: 2097152 })],
        }),
      )
      files: Array<Express.Multer.File>,
    ): Promise<any> {
      try {
        const fileResponses = await Promise.all(
          files.map((file) => this.uploadService.uploadImage(file)),
        );
  
        const fileResponse = fileResponses.map((result) => ({
          file_url: result.secure_url,
          file_name: result.public_id,
          file_size: files.find((f) => f.originalname === result.originalname)?.size,
        }));
  
        return {
          status: 'Success',
          message: 'Files uploaded successfully',
          data: {
            files: fileResponse,
          },
        };
      } catch (err) {
        throw new HttpException('Upload failed', HttpStatus.BAD_REQUEST);
      }
    }
  
    @Delete('file/delete/:public_id')
    async deleteFile(@Param('public_id') public_id: string): Promise<any> {
      try {
        await cloudinary.uploader.destroy(public_id);
        return {
          status: 'Success',
          message: 'File deleted successfully',
        };
      } catch (err) {
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }
    }
  }
  