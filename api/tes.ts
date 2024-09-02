import { PrismaClient } from '@prisma/client';

export async function handleAutoAbsenSiswa(prisma: PrismaClient) {
  const currentTime = new Date();
  const currentDate = currentTime.toISOString().split('T')[0];
  const currentDay = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
  }).format(currentTime);

  console.log(`Current Time: ${currentTime}, Current Day: ${currentDay}`);

  // Fetch the schedule for the current day using Prisma
  const jadwalList = await prisma.jadwal.findMany({
    where: {
      hari: {
        nama_hari: currentDay as any,
      },
    },
    include: {
      jam_jadwal: {
        include: {
          jam_detail_jadwal: {
            include: {
              subject_code_entity: true,
            },
          },
        },
      },
    },
  });

  const jamJadwalIds = jadwalList.flatMap((jadwal) =>
    jadwal.jam_jadwal.map((jj) => jj.id),
  );

  // Fetch JamDetailJadwal for the current day using Prisma
  const jamDetailList = await prisma.jam_detail_jadwal.findMany({
    where: {
      jam_jadwal: {
        id: {
          in: jamJadwalIds,
        },
      },
    },
    include: {
      kelas: true,
      subject_code_entity: {
        include: {
          guru: {
            include: {
              user: true,
            },
          },
          mapel: true,
        },
      },
      jam_jadwal: true,
    },
  });

  const lastJamJadwal = jadwalList.flatMap((jadwal) => jadwal.jam_jadwal).pop();

  const processedStudents = new Set<number>();

  for (const jamDetailJadwal of jamDetailList) {
    const jamJadwal = jamDetailJadwal.jam_jadwal;
    const jamMulai = new Date(`${currentDate}T${jamJadwal.jam_mulai}`);
    const jamSelesaiAlpha = new Date(jamMulai.getTime() + 45 * 60000); // 45 minutes after jam_mulai
    const jamSelesai = new Date(`${currentDate}T${jamJadwal.jam_selesai}`);

    let allSchedulesDone;

    if (jamJadwal.id === lastJamJadwal.id && currentTime > jamSelesai) {
      allSchedulesDone = true;
      console.log(
        `All schedules are done for the day. JamJadwal ID: ${jamJadwal.id}`,
      );
      await prisma.murid.updateMany({
        data: {
          jamDetailJadwal_id: null,
          is_absen_today: false,
        },
      });

      for (const jamDetail of jamDetailList) {
        const siswa = await prisma.murid.findFirst({
          where: {
            kelas: {
              id: jamDetail.kelas.id,
            },
            is_absen_today: false,
          },
        });

        console.log('Student ID:', siswa?.id);
      }
      return;
    } else {
      allSchedulesDone = false;
    }

    if (currentTime > jamSelesaiAlpha) {
      console.log(
        `Time exceeded 45 minutes for Jam Detail ID: ${jamDetailJadwal.id}`,
      );

      const absentStudents = await prisma.murid.findMany({
        where: {
          kelas: { id: jamDetailJadwal.kelas.id },
          is_absen_today: false,
        },
        include: {
          user: true,
        },
      });

      console.log(
        `Found ${absentStudents.length} absent students for Jam Detail ID: ${jamDetailJadwal.id}`,
      );

      for (const absentStudent of absentStudents) {
        const newAbsenSiswa = await prisma.absen_siswa.create({
          data: {
            user: {
              connect: {
                id: absentStudent.user.id,
              },
            },
            jam_detail_jadwal: {
              connect: {
                id: jamDetailJadwal.id,
              },
            },
            status: 'Alpha',
            waktu_absen: currentTime,
          },
        });

        console.log('Student ID:', absentStudent.id);

        const payload: any = {
          studentId: absentStudent.id.toString(),
          message: `Anda belum absen hari ini pada mata pelajaran ${jamDetailJadwal.subject_code_entity.mapel.nama_mapel}`,
        };

        this.absenGateway.server
          .to(payload.studentId)
          .emit('notifSiswas', payload);

        const notifikasi = await prisma.notifikasi.create({
          data: {
            message: payload.message,
            user: {
              connect: {
                id: absentStudent.user.id,
              },
            },
            createdAt: new Date(),
          },
        });

        console.log('Data emitted:', payload);
        console.log('Payload:', payload);

        await prisma.murid.update({
          where: {
            id: absentStudent.id,
          },
          data: {
            is_absen_today: true,
          },
        });

        console.log(`Marked student ID: ${absentStudent.id} as Alpha`);
      }

      if (jamJadwal.allSchedulesDone === true) {
        console.log(`All schedules are done for JamJadwal ID: ${jamJadwal.id}`);
      }
    } else {
      console.log(
        `Current time hasn't exceeded 45 minutes after start for Jam Detail ID: ${jamDetailJadwal.id}`,
      );
    }

    if (currentTime > jamSelesai) {
      console.log('Reset is_absen_today for all students after jam_selesai');
      await prisma.murid.updateMany({
        data: {
          jamDetailJadwal_id: null,
          is_absen_today: false,
        },
      });
    } else {
      console.log(
        `Current time hasn't exceeded jam_selesai for JamJadwal ID: ${jamJadwal.id}`,
      );
    }
  }
}

export async function handleAutoAbsenGuru(prisma: PrismaClient) {
  const currentTime = new Date();
  const currentDate = currentTime.toISOString().split('T')[0];
  const currentDay = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
  }).format(currentTime);

  console.log(`Current Time: ${currentTime}, Current Day: ${currentDay}`);

  // Fetch the schedule for the current day using Prisma
  const jadwalList = await prisma.jadwal.findMany({
    where: {
      hari: {
        nama_hari: currentDay as any,
      },
    },
    include: {
      jam_jadwal: {
        include: {
          jam_detail_jadwal: {
            include: {
              subject_code_entity: {
                include: {
                  guru: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Extract JamJadwal IDs for efficient filtering
  const jamJadwalIds = jadwalList.flatMap((jadwal) =>
    jadwal.jam_jadwal.map((jj) => jj.id),
  );

  // Fetch JamDetailJadwal for the current day
  const jamDetailList = await prisma.jam_detail_jadwal.findMany({
    where: {
      jamJadwalId: { in: jamJadwalIds },
    },
    include: {
      kelas: true,
      subject_code_entity: {
        include: {
          guru: {
            include: {
              user: true,
            },
          },
        },
      },
      jam_jadwal: true,
    },
  });

  console.log('jamDetailList', jamDetailList);

  const lastJamJadwal = jadwalList.flatMap((jadwal) => jadwal.jam_jadwal).pop();

  // Iterate through each JamDetailJadwal
  for (const jamDetailJadwal of jamDetailList) {
    const jamJadwal = jamDetailJadwal.jam_jadwal;
    const jamMulai = new Date(`${currentDate}T${jamJadwal.jam_mulai}`);
    const jamSelesai = new Date(`${currentDate}T${jamJadwal.jam_selesai}`);
    const jamSelesaiAlpha = new Date(jamMulai.getTime() + 45 * 60000); // 45 minutes after jam_mulai

    console.log(
      `Checking Jam Detail ID: ${jamDetailJadwal.id}, Jam Mulai: ${jamMulai}, Jam Selesai (45 min after): ${jamSelesai}`,
    );
    let allSchedulesDone;

    if (jamJadwal.id === lastJamJadwal.id && currentTime > jamSelesai) {
      allSchedulesDone = true;
      console.log(
        `All schedules are done for the day. JamJadwal ID: ${jamJadwal.id}`,
      );
      await prisma.guru.updateMany({
        where: {},
        data: { jadwal_detail_id: null, is_absen_today: false },
      });

      for (const jamDEtail of jamDetailList) {
        const guru = await prisma.guru.findUnique({
          where: { id: jamDEtail.subject_code_entity.guru.id },
          select: { id: true },
        });

        if (guru) {
          console.log('guru id', guru.id);
        }
      }
      return;
    } else {
      allSchedulesDone = false;
    }

    if (currentTime > jamSelesaiAlpha) {
      console.log(
        `Time exceeded 45 minutes for Jam Detail ID: ${jamDetailJadwal.id}`,
      );

      const absentStudents = await prisma.absen_siswa.findMany({
        where: {
          jamDetailJadwalId: jamDetailJadwal.id,
          waktu_absen: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
            lte: new Date(new Date().setHours(23, 59, 59, 999)), // End of today
          },
          status: 'Alpha',
        },
        include: { user: true },
      });

      console.log(
        `Found ${absentStudents.length} absent students for Jam Detail ID: ${jamDetailJadwal.id}`,
      );

      const absentStudentNames = absentStudents.map((data) => data.user.nama);

      const absentTeachers = await prisma.guru.findMany({
        where: {
          id: jamDetailJadwal.subject_code_entity.guru.id,
          is_absen_today: false,
        },
      });

      console.log(
        `Found ${absentTeachers.length} absent teachers for Jam Detail ID: ${jamDetailJadwal.id}`,
      );

      const processedTeachers = new Set<number>();

      for (const absentTeacher of absentTeachers) {
        if (processedTeachers.has(absentTeacher.id)) {
          continue; // Skip if this teacher has already been processed
        }

        const newAbsenGuru = await prisma.absen_guru.create({
          data: {
            guru_id: absentTeacher.id,
            jamDetailJadwalId: jamDetailJadwal.id,
            status: 'Alpha',
            waktu_absen: currentTime,
            jamJadwalId: jamDetailJadwal.jam_jadwal.id,
          },
        });

        console.log('guru id:', absentTeacher.id);

        const payload: any = {
          guruId: absentTeacher.id.toString(),
          message: `Anda belum absen hari ini. Siswa yang belum absen sebanyak: ${absentStudents.length} di jamDEtail: ${jamDetailJadwal.id}`,
          data: absentStudentNames,
        };

        let dataEmit = this.absenGateway.server
          .to(payload.guruId)
          .emit('notifGurus', payload);

        console.log('Data emitted:', dataEmit);
        console.log('Payload:', payload);

        const notifikasi = await prisma.notifikasi.create({
          data: {
            message: payload.message,
            userId: absentTeacher.userId,
            createdAt: new Date(),
          },
        });

        await prisma.guru.update({
          where: { id: absentTeacher.id },
          data: { is_absen_today: true },
        });

        console.log(`Marked teacher ID: ${absentTeacher.id} as Alpha`);
      }

      if (jamJadwal.allSchedulesDone === true) {
        console.log(`All schedules are done for JamJadwal ID: ${jamJadwal.id}`);
      }
    } else {
      console.log(
        `Current time hasn't exceeded 45 minutes after start for Jam Detail ID: ${jamDetailJadwal.id}`,
      );
    }

    if (currentTime > jamSelesai) {
      console.log('Reset is_absen_today for all teachers after jam_selesai');
      await prisma.guru.updateMany({
        where: {},
        data: { jadwal_detail_id: null, is_absen_today: false },
      });
    } else {
      console.log(
        `Current time hasn't exceeded jam_selesai for JamJadwal ID: ${jamJadwal.id}`,
      );
    }
  }
}
