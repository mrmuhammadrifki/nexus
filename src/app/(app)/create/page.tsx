import { Suspense } from "react";
import { CreateCanvas } from "@/components/create-canvas";
export const metadata = { title: "CREATE" };
export default function Page() { return <Suspense fallback={<p>Memuat…</p>}><CreateCanvas /></Suspense>; }
