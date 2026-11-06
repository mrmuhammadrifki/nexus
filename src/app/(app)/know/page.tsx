import { Suspense } from "react";
import { KnowQuiz } from "@/components/know-quiz";
export const metadata = { title: "KNOW" };
export default function Page() { return <Suspense fallback={<p>Memuat…</p>}><KnowQuiz /></Suspense>; }
