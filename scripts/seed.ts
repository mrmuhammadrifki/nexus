/**
 * npm run seed            → isi koleksi `roles` (data referensi GROW)
 * npm run seed -- --demo  → tambah pengguna demo berprofil publik (HANYA untuk dev/uji; password "demo12345")
 */
import bcrypt from "bcryptjs";
import { connectDB } from "../src/lib/db";
import { Profile, Role, User } from "../src/lib/models";
import { ROLE_SEEDS, WORK_STYLES } from "../src/lib/catalog";

const DEMO = [
  { name: "Raka Pratama", email: "raka@demo.nexus", major: "DKV", interests: ["Teknologi", "Lingkungan"], style: "kreator", skills: { "UI/UX": 5, "Desain Grafis": 4, Frontend: 3 } },
  { name: "Salsa Nabila", email: "salsa@demo.nexus", major: "Manajemen", interests: ["Ekonomi Kreatif", "Lingkungan"], style: "penghubung", skills: { "Model Bisnis": 5, "Public Speaking": 5, Riset: 4 } },
  { name: "Bima Aditya", email: "bima@demo.nexus", major: "Ilmu Komunikasi", interests: ["Pendidikan", "Sosial"], style: "penghubung", skills: { "Public Speaking": 5, Menulis: 4 } },
  { name: "Nadia Putri", email: "nadia@demo.nexus", major: "Sistem Informasi", interests: ["Teknologi", "Pendidikan"], style: "eksekutor", skills: { "UI/UX": 4, Frontend: 5, "Manajemen Proyek": 4 } },
];

(async () => {
  await connectDB();
  for (const r of ROLE_SEEDS) await Role.updateOne({ slug: r.slug }, { $set: r }, { upsert: true });
  console.log(`roles: ${ROLE_SEEDS.length} peran`);
  if (process.argv.includes("--demo")) {
    const passwordHash = await bcrypt.hash("demo12345", 10);
    for (const d of DEMO) {
      const u = await User.findOneAndUpdate({ email: d.email }, { $set: { name: d.name, campus: "Kampus Demo", major: d.major, semester: 5, visibility: "public", passwordHash } }, { upsert: true, returnDocument: "after" });
      const skills = Object.entries(d.skills).map(([name, level]) => ({ name, level }));
      await Profile.updateOne({ userId: u._id }, { $set: { interests: d.interests, skills, goal: "lomba", goals: ["lomba"], workStyle: d.style, profileLabel: WORK_STYLES.find((w) => w.id === d.style)!.label, knowDone: true, levelsRated: true, targetRole: "ui-ux-designer" } }, { upsert: true });
    }
    console.log(`demo: ${DEMO.length} pengguna publik`);
  }
  process.exit(0);
})();
