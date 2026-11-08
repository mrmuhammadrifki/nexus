import { Suspense } from "react";
import { KnowQuiz } from "@/components/know-quiz";
import { KnowSkeleton } from "@/components/skeletons";

export const metadata = { title: "KNOW" };
export default function Page() {
  return (
    <Suspense fallback={<KnowSkeleton />}>
      <KnowQuiz />
    </Suspense>
  );
}
