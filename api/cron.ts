import { PrismaClient } from '@prisma/client';
import { handleAutoAbsenGuru, handleAutoAbsenSiswa } from './tes';

const prisma = new PrismaClient();
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Run the auto-absen functions
      await handleAutoAbsenGuru(prisma);
      await handleAutoAbsenSiswa(prisma);

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
