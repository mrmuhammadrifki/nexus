/**
 * Sekali jalan: versi lama memberi level bawaan 3 pada skill yang dicentang (bukan hasil penilaian pengguna).
 * Skrip ini mengosongkan level semua profil non-demo agar pengguna menilai ulang di KNOW ("Seberapa mahir?").
 *   npm run migrate:levels            → ringkasan saja (dry-run)
 *   npm run migrate:levels -- --apply → terapkan
 */
import { connectDB } from "../src/lib/db";
import { Profile, User } from "../src/lib/models";

(async () => {
  await connectDB();
  const demo = (await User.find({ email: /@demo\.nexus$/ }).select("_id").lean<any[]>()).map((u) => u._id);
  const filter = { userId: { $nin: demo }, "skills.0": { $exists: true } };
  const n = await Profile.countDocuments(filter);
  console.log(`${n} profil dengan skill akan di-reset (levelnya dikosongkan, KNOW dibuka lagi)`);
  if (process.argv.includes("--apply")) {
    const r = await Profile.updateMany(filter, { $set: { "skills.$[].level": null, knowDone: false, levelsRated: false, growReviewed: false } });
    console.log(`selesai: ${r.modifiedCount} profil diubah`);
  } else console.log("dry-run. Tambahkan --apply untuk menerapkan.");
  process.exit(0);
})();
