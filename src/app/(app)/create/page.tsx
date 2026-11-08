import { Suspense } from "react";
import { CreateCanvas } from "@/components/create-canvas";
import { CreateSkeleton } from "@/components/skeletons";

export const metadata = { title: "CREATE" };
export default function Page() {
  return (
    <Suspense fallback={<CreateSkeleton />}>
      <CreateCanvas />
    </Suspense>
  );
}
