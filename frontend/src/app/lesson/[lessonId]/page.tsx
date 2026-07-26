import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import styles from "./lesson-placeholder.module.css";

export default async function LessonPlaceholder({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  return (
    <main className={styles.screen}>
      <section className={styles.card}>
        <div className={styles.sparkle}>
          <Sparkles aria-hidden="true" />
        </div>
        <span>LESSON {lessonId} IS READY</span>
        <h1>The lesson player is our next checkpoint.</h1>
        <p>
          Your path selection works. Next we&apos;ll replace this bridge screen
          with all five interactive exercise types.
        </p>
        <Link href="/">
          <ArrowLeft aria-hidden="true" />
          Return to learning path
        </Link>
      </section>
    </main>
  );
}
