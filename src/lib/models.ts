import mongoose, { Schema, model, models, type Model } from "mongoose";

// Skema sengaja tidak diketik ketat: inferensi generik Mongoose 9 membuat compiler kehabisan memori.
const S = (definition: any, options?: any): Schema<any> => new (Schema as any)(definition, options);
const def = <T = any>(name: string, schema: Schema<any>, collection?: string): Model<T> =>
  (models[name] as Model<T>) || (model as any)(name, schema, collection);

const oid = Schema.Types.ObjectId;

/* users — dipakai juga oleh adapter Auth.js (koleksi "users") */
export const User = def(
  "User",
  S(
    {
      email: { type: String, required: true, unique: true, lowercase: true },
      name: String,
      image: String,
      emailVerified: Date,
      passwordHash: String,
      campus: String,
      major: String,
      semester: Number,
      visibility: { type: String, enum: ["public", "private"], default: "private" }, // PR-1: default privat
    },
    { timestamps: true, strict: true },
  ),
  "users",
);

export const Profile = def(
  "Profile",
  S(
    {
      userId: { type: oid, required: true, unique: true },
      interests: [String],
      skills: [{ _id: false, name: String, level: { type: Number, min: 1, max: 5, default: null } }], // null = belum dinilai
      goal: String, // target utama (= goals[0]), dipertahankan untuk kompatibilitas
      goals: [String],
      workStyle: String,
      targetRole: String,
      profileLabel: String,
      knowDone: { type: Boolean, default: false },
      levelsRated: { type: Boolean, default: false },
      growReviewed: { type: Boolean, default: false },
    },
    { timestamps: { createdAt: false, updatedAt: true } },
  ),
  "profiles",
);
Profile.schema.index({ "skills.name": 1 });

export const Role = def(
  "Role",
  S({
    slug: { type: String, required: true, unique: true },
    name: String,
    tags: [String], // minat yang relevan, dipakai untuk menebak peran target
    requiredSkills: [{ _id: false, name: String, level: Number, weight: { type: Number, min: 1, max: 3 } }],
  }),
  "roles",
);

export const LearningPlan = def(
  "LearningPlan",
  S(
    {
      userId: { type: oid, required: true, unique: true },
      items: [{ _id: false, skill: String, title: String, meta: String, priority: Number, done: { type: Boolean, default: false } }],
      generatedAt: Date,
    },
  ),
  "learningPlans",
);

export const CANVAS_KEYS = ["problem", "rootCause", "solution", "technology", "features", "impact"] as const;
export type CanvasKey = (typeof CANVAS_KEYS)[number];

export const Project = def(
  "Project",
  S(
    {
      ownerId: { type: oid, required: true, unique: true }, // MVP: satu proyek per pemilik
      title: { type: String, default: "Proyek tanpa judul" },
      tagline: { type: String, default: "" },
      members: [
        {
          userId: { type: oid, required: true },
          role: String,
          status: { type: String, enum: ["invited", "accepted", "declined"], default: "invited" },
          invitedAt: { type: Date, default: Date.now },
        },
      ],
      canvas: {
        problem: { type: String, default: "" },
        rootCause: { type: String, default: "" },
        solution: { type: String, default: "" },
        technology: { type: String, default: "" },
        features: { type: String, default: "" },
        impact: { type: String, default: "" },
      },
    },
    { timestamps: { createdAt: true, updatedAt: true } },
  ),
  "projects",
);
Project.schema.index({ "members.userId": 1 });

export const AiFeedback = def(
  "AiFeedback",
  S({
    projectId: { type: oid, required: true },
    userId: oid,
    section: String,
    inputHash: String,
    good: String,
    improve: String,
    rewrite: String,
    ideas: [String],
    model: String,
    createdAt: { type: Date, default: Date.now },
  }),
  "aiFeedback",
);
AiFeedback.schema.index({ projectId: 1, section: 1, inputHash: 1 });
AiFeedback.schema.index({ userId: 1, createdAt: -1 });

export const Assessment = def(
  "Assessment",
  S({
    projectId: { type: oid, required: true },
    indicators: [{ _id: false, key: String, weight: Number, value: Number, why: String, tip: String }],
    score: Number,
    level: String,
    weightsVersion: String,
    model: String,
    createdAt: { type: Date, default: Date.now },
  }),
  "assessments",
);
Assessment.schema.index({ projectId: 1, createdAt: -1 });

export const Activity = def(
  "Activity",
  S({
    projectId: oid,
    actorId: { type: oid, required: true },
    type: String,
    payload: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
  }),
  "activities",
);
Activity.schema.index({ projectId: 1, createdAt: -1 });
Activity.schema.index({ actorId: 1, createdAt: -1 });

export { mongoose };
