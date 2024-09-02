import { PrismaClient } from '@prisma/client';
import { handleAutoAbsenGuru, handleAutoAbsenSiswa } from './tes';
import { AbsenGateway } from 'src/app/absen/absen.gateway';

const prisma = new PrismaClient();
let absenGateway = new AbsenGateway();
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Run the auto-absen functions
      await handleAutoAbsenGuru(prisma, absenGateway);
      await handleAutoAbsenSiswa(prisma, absenGateway);

      res
        .status(200)
        .json({ message: 'Auto Absen processes executed successfully.' });
    } catch (error) {
      console.error('Error running auto-absen processes:', error);
      res.status(500).json({ message: 'Error running auto-absen processes.' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
