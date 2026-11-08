import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB, getMongoClient } from "@/lib/db";
import { User } from "@/lib/models";

const providers: any[] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const p = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(raw);
      if (!p.success) return null;
      await connectDB();
      const u = await User.findOne({ email: p.data.email.toLowerCase() }).lean<any>();
      if (!u?.passwordHash) return null;
      if (!(await bcrypt.compare(p.data.password, u.passwordHash))) return null;
      return { id: String(u._id), email: u.email, name: u.name };
    },
  }),
];
export const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
if (googleEnabled) providers.push(Google({ allowDangerousEmailAccountLinking: true }));

// Konfigurasi lazy (fungsi): adapter/koneksi Mongo baru dibuat saat ADA request, bukan saat modul di-import.
// Dengan begitu `next build` (mis. di Vercel) tidak butuh MONGODB_URI maupun akses jaringan ke database.
export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  adapter: MongoDBAdapter(getMongoClient()),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 }, // AU-1: 30 hari
  pages: { signIn: "/masuk" },
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      const uid = (token.uid ?? token.sub) as string;
      if (uid) session.user.id = uid;
      return session;
    },
  },
}));
