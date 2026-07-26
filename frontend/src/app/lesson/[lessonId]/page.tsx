import { AuthGuard } from "@/features/auth";
import { LessonPage } from "@/features/lesson";
import { notFound } from "next/navigation";

export default async function LessonRoute({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const parsedLessonId = Number(lessonId);
  if (!Number.isSafeInteger(parsedLessonId) || parsedLessonId <= 0) {
    notFound();
  }

  return (
    <AuthGuard>
      <LessonPage lessonId={parsedLessonId} />
    </AuthGuard>
  );
}
