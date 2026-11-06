import { z } from "zod";
import bcrypt from "bcryptjs";
import { route, HttpError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";

const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(120), password: z.string().min(8).max(100) });

export const POST = route(async (req: Request) => {
  const d = schema.parse(await req.json());
  await connectDB();
  const email = d.email.toLowerCase();
  if (await User.exists({ email })) throw new HttpError(409, "Email sudah terdaftar");
  await User.create({ name: d.name, email, passwordHash: await bcrypt.hash(d.password, 11) });
  return { ok: true };
});
