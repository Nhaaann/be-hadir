// import {
//   Controller,
//   Delete,
//   HttpException,
//   HttpStatus,
//   MaxFileSizeValidator,
//   Param,
//   ParseFilePipe,
//   Post,
//   UploadedFile,
//   UploadedFiles,
//   UseGuards,
//   UseInterceptors,
// } from '@nestjs/common';
// import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
// import { diskStorage } from 'multer';
// // import { ResponseSuccess } from 'src/interface/respone';

// import { JwtGuard } from '../auth/auth.guard';
// import * as fs from 'fs';
// import { ResponseSuccess } from 'src/utils/interface/respone';

// @UseGuards(JwtGuard)
// @Controller('upload')
// export class UploadController {
//   constructor() {
//     // Harus ada apabila kita meng-extends
//   }
//   @UseInterceptors(
//     FileInterceptor('file', {
//       storage: diskStorage({
//         destination: 'public/uploads',
//         filename: (req, file, cb) => {
//           console.log('req', req);
//           console.log('file', file);
//           const fileExtension = file.originalname.split('.').pop();
//           cb(null, `${new Date().getTime()}.${fileExtension}`);
//         },
//       }),
//       fileFilter: (req, file, cb) => {
//         if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|svg)$/)) {
//           console.log('file', file);
//           console.log('req', req);
//           return cb(
//             new HttpException(
//               'Hanya file gambar (JPG, JPEG, PNG, PDF)yang diizinkan',
//               HttpStatus.BAD_REQUEST,
//             ),
//             false,
//           );
//         }
//         cb(null, true);
//       },
//     }),
//   )
//   @Post('file')
//   async uploadFile(
//     @UploadedFile(
//       new ParseFilePipe({
//         validators: [new MaxFileSizeValidator({ maxSize: 2097152 })],
//       }),
//     )
//     file: Express.Multer.File,
//   ): Promise<any> {
//     console.log('file', file);
//     try {
//       const url = `http://localhost:2009/uploads/${file.filename}`;
//       return {
//         status: 'Success',
//         message: 'OKe',
//         data: {
//           file_url: url,
//           file_name: file.filename,
//           file_size: file.size,
//         },
//       };
//     } catch (err) {
//       throw new HttpException('Ada Kesalahan', HttpStatus.BAD_REQUEST);
//     }
//   }

//   @UseInterceptors(
//     FilesInterceptor('files', 20, {
//       storage: diskStorage({
//         destination: 'public/uploads',
//         filename: (req, file, cb) => {
//           console.log('req', req);
//           console.log('file', file);
//           const fileExtension = file.originalname.split('.').pop();
//           cb(null, `${new Date().getTime()}.${fileExtension}`);
//         },
//       }),
//       fileFilter: (req, file, cb) => {
//         if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|svg)$/)) {
//           console.log('file', file);
//           console.log('req', req);
//           return cb(
//             new HttpException(
//               'Hanya file gambar (JPG, JPEG, PNG, PDF)yang diizinkan',
//               HttpStatus.BAD_REQUEST,
//             ),
//             false,
//           );
//         }
//         cb(null, true);
//       },
//     }),
//   )
//   @Post('files')
//   async uploadFileMulti(
//     @UploadedFiles(
//       new ParseFilePipe({
//         validators: [new MaxFileSizeValidator({ maxSize: 2097152 })],
//       }),
//     )
//     files: Array<Express.Multer.File>,
//   ): Promise<any> {
//     console.log('files', files);
//     try {
//       const file_response: Array<{
//         file_url: string;
//         file_name: string;
//         file_size: number;
//       }> = [];

//       files.forEach((file) => {
//         const url = `http://localhost:2007/upload/${file.filename}`;
//         file_response.push({
//           file_url: url,
//           file_name: file.filename,
//           file_size: file.size,
//         });
//       });
//       return {
//         status: 'Success',
//         message: 'OKe',
//         data: {
//           file: file_response,
//         },
//       };
//     } catch (err) {
//       throw new HttpException('Ada Kesalahan', HttpStatus.BAD_REQUEST);
//     }
//   }

//   @Delete('file/delete/:filename')
//   async DeleteFile(@Param('filename') filename: string): Promise<any> {
//     try {
//       const filePath = `public/uploads/${filename}`;
//       fs.unlinkSync(filePath);
//       return {
//         status: 'Success',
//         message: 'OKe',
//       };
//     } catch (err) {
//       throw new HttpException('File not Found', HttpStatus.NOT_FOUND);
//     }
//   }
// }
