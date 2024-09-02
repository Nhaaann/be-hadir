-- CreateEnum
CREATE TYPE "hari_nama_hari_enum" AS ENUM ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu');

-- CreateEnum
CREATE TYPE "mapel_status_mapel_enum" AS ENUM ('online', 'offline');

-- CreateEnum
CREATE TYPE "user_role_enum" AS ENUM ('Admin', 'Guru', 'Murid', 'Staf', 'Kepala Sekolah', 'Wali Kelas');

-- CreateTable
CREATE TABLE "absen_guru" (
    "id" SERIAL NOT NULL,
    "waktu_absen" TIMESTAMP(6),
    "status" VARCHAR NOT NULL DEFAULT 'Hadir',
    "hasil_jurnal_kegiatan" VARCHAR DEFAULT 'belum ada',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jamDetailJadwalId" INTEGER NOT NULL,
    "jamJadwalId" INTEGER,
    "jadwalId" INTEGER,
    "absenKelasId" INTEGER,
    "guru_id" INTEGER,

    CONSTRAINT "PK_087bcc2aa63f057013fbe696ad4" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absen_kelas" (
    "id" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(6) NOT NULL,
    "kode_kelas" VARCHAR NOT NULL,
    "kelasId" INTEGER,
    "userId" INTEGER,
    "guruId" INTEGER,
    "jadwalId" INTEGER,
    "jamJadwalId" INTEGER,
    "jamDetailJadwalId" INTEGER,

    CONSTRAINT "PK_a1823798c891d912cf678a7a9ee" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absen_siswa" (
    "id" SERIAL NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'Hadir',
    "waktu_absen" TIMESTAMP(6) NOT NULL,
    "userId" INTEGER,
    "jamDetailJadwalId" INTEGER,
    "absenKelasId" INTEGER,

    CONSTRAINT "PK_b3561ff58f530cc85a8ab48776a" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_location" (
    "id" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_fdc639c0cf46655c0d445636d8f" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guru" (
    "id" INTEGER NOT NULL,
    "initial_schedule" VARCHAR(1) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_absen_today" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER,
    "jadwal_detail_id" INTEGER,

    CONSTRAINT "PK_180478aa04f87b3005e3a1ed489" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hari" (
    "id" SERIAL NOT NULL,
    "nama_hari" "hari_nama_hari_enum" NOT NULL,

    CONSTRAINT "PK_ff14035b969e95dd2edbb807cbd" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jadwal" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hariId" INTEGER,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "PK_f9610978633d0384b53463d2035" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jam_detail_jadwal" (
    "id" SERIAL NOT NULL,
    "jamJadwalId" INTEGER,
    "subjectCodeId" INTEGER,
    "kelasId" INTEGER,

    CONSTRAINT "PK_8583b56c8e3ff1859dab7a6a70f" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jam_jadwal" (
    "id" SERIAL NOT NULL,
    "is_rest" BOOLEAN DEFAULT false,
    "jam_mulai" VARCHAR NOT NULL,
    "allSchedulesDone" BOOLEAN NOT NULL DEFAULT false,
    "jam_selesai" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jadwal_id" INTEGER,

    CONSTRAINT "PK_094b1c72825d949badedd1fdc02" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelas" (
    "id" SERIAL NOT NULL,
    "nama_kelas" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "PK_55bb4fb74bbbd202d55118b0417" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jurnal_kegiatan" (
    "id" SERIAL NOT NULL,
    "matapelajaran" VARCHAR(255) NOT NULL DEFAULT '',
    "jam_pelajaran" VARCHAR(255) NOT NULL DEFAULT '',
    "materi" TEXT NOT NULL,
    "kendala" TEXT,
    "jamJadwalId" INTEGER NOT NULL,
    "jamDetailJadwalId" INTEGER NOT NULL,
    "absenGuruId" INTEGER NOT NULL,

    CONSTRAINT "PK_cacaa0b65e919ee12928fdbba13" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rekap_absen" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR NOT NULL,
    "tanggal" DATE NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'Hadir',
    "totalAbsensi" INTEGER NOT NULL,
    "totalLembur" INTEGER NOT NULL,
    "siswa_id" INTEGER,
    "guru_id" INTEGER,
    "jam_detail_jadwal_id" INTEGER,
    "absen_kelas_id" INTEGER,

    CONSTRAINT "PK_4167685cad85c09bcca1733ac3c" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_code_entity" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guru_id" INTEGER,
    "mapel_id" INTEGER,

    CONSTRAINT "PK_ec63e8b16d5b478284b9637687a" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mapel" (
    "id" SERIAL NOT NULL,
    "nama_mapel" VARCHAR(50) NOT NULL,
    "status_mapel" "mapel_status_mapel_enum" NOT NULL DEFAULT 'online',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "PK_86949c794f4f6eed671f3fa635e" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "avatar" VARCHAR,
    "nama" VARCHAR NOT NULL,
    "nomor_hp" VARCHAR,
    "email" VARCHAR NOT NULL,
    "password" VARCHAR,
    "refresh_token" VARCHAR,
    "role" "user_role_enum" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kelasId" INTEGER,

    CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guru_mapel_mapel" (
    "guruId" INTEGER NOT NULL,
    "mapelId" INTEGER NOT NULL,

    CONSTRAINT "PK_a2612d8009f4204941b711ba102" PRIMARY KEY ("guruId","mapelId")
);

-- CreateTable
CREATE TABLE "murid" (
    "id" INTEGER NOT NULL,
    "jamDetailJadwal_id" INTEGER,
    "NISN" VARCHAR NOT NULL,
    "tanggal_lahir" VARCHAR NOT NULL,
    "alamat" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_absen_today" BOOLEAN NOT NULL DEFAULT false,
    "kelasId" INTEGER,

    CONSTRAINT "PK_defc696fd2c66dffa636c8197bd" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifikasi" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "message" VARCHAR NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,

    CONSTRAINT "PK_6360ae6fe339a3ecbae422325f4" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reset_password" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER,

    CONSTRAINT "PK_82bffbeb85c5b426956d004a8f5" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "siswa" (
    "id" INTEGER NOT NULL,
    "NISN" VARCHAR NOT NULL,
    "tanggal_lahir" VARCHAR NOT NULL,
    "alamat" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kelasId" INTEGER,

    CONSTRAINT "PK_8ce1ff71b8d1e5fe6596c8b2bb7" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staf" (
    "id" SERIAL NOT NULL,
    "jurnal_kegiatan" VARCHAR,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,

    CONSTRAINT "PK_e274793cdf4648601a9da410168" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_e12875dfb3b1d92d7d7c5377e22" ON "user"("email");

-- CreateIndex
CREATE INDEX "IDX_c305edb353ed0706b820a883f6" ON "guru_mapel_mapel"("guruId");

-- CreateIndex
CREATE INDEX "IDX_d95d4e976fcb0282f46efd073c" ON "guru_mapel_mapel"("mapelId");

-- AddForeignKey
ALTER TABLE "absen_guru" ADD CONSTRAINT "FK_17b171efab3a08a8d931fb8b578" FOREIGN KEY ("absenKelasId") REFERENCES "absen_kelas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "absen_guru" ADD CONSTRAINT "FK_2c71c754c39af7e12ece4ce86ca" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "absen_guru" ADD CONSTRAINT "FK_4519767abb6bd0321a57a506f86" FOREIGN KEY ("jadwalId") REFERENCES "jadwal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "absen_guru" ADD CONSTRAINT "FK_4dce9b42848bb5481a636acbb52" FOREIGN KEY ("jamJadwalId") REFERENCES "jam_jadwal"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "absen_guru" ADD CONSTRAINT "FK_c26baa4936bd2394b9c15f230ad" FOREIGN KEY ("jamDetailJadwalId") REFERENCES "jam_detail_jadwal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "absen_kelas" ADD CONSTRAINT "FK_0d611bceacc20c44331f3ea7309" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "absen_kelas" ADD CONSTRAINT "FK_2946023ad2d65b62f9f52724a2a" FOREIGN KEY ("jadwalId") REFERENCES "jadwal"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "absen_kelas" ADD CONSTRAINT "FK_32cffc561339b8e16b91afd0307" FOREIGN KEY ("jamDetailJadwalId") REFERENCES "jam_detail_jadwal"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "absen_kelas" ADD CONSTRAINT "FK_8a74afda726a084512918715d5c" FOREIGN KEY ("kelasId") REFERENCES "kelas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "absen_kelas" ADD CONSTRAINT "FK_91671c6fc7d2af03a2c0c783d00" FOREIGN KEY ("jamJadwalId") REFERENCES "jam_jadwal"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "absen_kelas" ADD CONSTRAINT "FK_b4c052cd6acd4f49d5510867f9d" FOREIGN KEY ("guruId") REFERENCES "guru"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "absen_siswa" ADD CONSTRAINT "FK_909e2d9f9d57ab7ed6e00b820d0" FOREIGN KEY ("jamDetailJadwalId") REFERENCES "jam_detail_jadwal"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "absen_siswa" ADD CONSTRAINT "FK_c57a7293745b85a961207b60730" FOREIGN KEY ("absenKelasId") REFERENCES "absen_kelas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "absen_siswa" ADD CONSTRAINT "FK_cd0c5b5852abad936639f5ffd36" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "guru" ADD CONSTRAINT "FK_08f6654efacdc7bec2119e0aaee" FOREIGN KEY ("jadwal_detail_id") REFERENCES "jam_detail_jadwal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "guru" ADD CONSTRAINT "FK_ea4aeffc90a824f19811ee289e1" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "FK_0cb04461c26bb8bb3358d349591" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "FK_2a161ad125e5af793271c8240c5" FOREIGN KEY ("hariId") REFERENCES "hari"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "FK_61eebee6e0aec3032fa7db5b29d" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jam_detail_jadwal" ADD CONSTRAINT "FK_78533f50016836727ed01ab54c4" FOREIGN KEY ("kelasId") REFERENCES "kelas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jam_detail_jadwal" ADD CONSTRAINT "FK_822d1602b8a995304fd8993fef5" FOREIGN KEY ("subjectCodeId") REFERENCES "subject_code_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jam_detail_jadwal" ADD CONSTRAINT "FK_dda060fcbefae7b360106138e2f" FOREIGN KEY ("jamJadwalId") REFERENCES "jam_jadwal"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jam_jadwal" ADD CONSTRAINT "FK_93466a11612940194f7d52a2e5f" FOREIGN KEY ("jadwal_id") REFERENCES "jadwal"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "FK_30ac19ced238e39a22cbc28e15a" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "FK_cdb4c92038bc48a311e2e9c31ab" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jurnal_kegiatan" ADD CONSTRAINT "FK_04459e5df1bc17f0710d3051357" FOREIGN KEY ("jamDetailJadwalId") REFERENCES "jam_detail_jadwal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jurnal_kegiatan" ADD CONSTRAINT "FK_7508fcdbd828c572467d2f82a76" FOREIGN KEY ("absenGuruId") REFERENCES "absen_guru"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jurnal_kegiatan" ADD CONSTRAINT "FK_d3355fc4a2f2b6281ab5bde2c65" FOREIGN KEY ("jamJadwalId") REFERENCES "jam_jadwal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rekap_absen" ADD CONSTRAINT "FK_1887ce61ce4b1c35ee8ff81d02f" FOREIGN KEY ("absen_kelas_id") REFERENCES "absen_kelas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rekap_absen" ADD CONSTRAINT "FK_8a1283b175a8451c5527001771e" FOREIGN KEY ("siswa_id") REFERENCES "murid"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rekap_absen" ADD CONSTRAINT "FK_90d11a005f97e473a0cb49b8b97" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rekap_absen" ADD CONSTRAINT "FK_91cb5beaef947bc69f7933ea4c6" FOREIGN KEY ("jam_detail_jadwal_id") REFERENCES "jam_detail_jadwal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subject_code_entity" ADD CONSTRAINT "FK_70534ebc48919de5cd8ae6143f0" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subject_code_entity" ADD CONSTRAINT "FK_fa78c211ad7580a03543a152b6b" FOREIGN KEY ("mapel_id") REFERENCES "mapel"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mapel" ADD CONSTRAINT "FK_315f0401d5993068a38c099ff63" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mapel" ADD CONSTRAINT "FK_b9aaaca0a676713ad4db60024d3" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "FK_1bdb8d8cdba56955287d278a4f9" FOREIGN KEY ("kelasId") REFERENCES "kelas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "guru_mapel_mapel" ADD CONSTRAINT "FK_c305edb353ed0706b820a883f65" FOREIGN KEY ("guruId") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guru_mapel_mapel" ADD CONSTRAINT "FK_d95d4e976fcb0282f46efd073c0" FOREIGN KEY ("mapelId") REFERENCES "mapel"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "murid" ADD CONSTRAINT "FK_061b19da22a87d6faf336b5e631" FOREIGN KEY ("kelasId") REFERENCES "kelas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "murid" ADD CONSTRAINT "FK_defc696fd2c66dffa636c8197bd" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "FK_947abc6aabf4d25e4eac89ab0b2" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reset_password" ADD CONSTRAINT "FK_de65040d842349a5e6428ff21e6" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "siswa" ADD CONSTRAINT "FK_8ce1ff71b8d1e5fe6596c8b2bb7" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "siswa" ADD CONSTRAINT "FK_b93fa8b4609e8f9a311dba44590" FOREIGN KEY ("kelasId") REFERENCES "kelas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staf" ADD CONSTRAINT "FK_7e131111b7e37193cbdd8b98251" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
