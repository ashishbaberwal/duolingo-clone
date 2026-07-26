import { ArrowRight, Check, Flame, Sparkles, Trophy } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import type { AnswerFeedback, LessonResponse } from "../lesson.types";
import styles from "../styles/outcomes.module.css";
import { AchievementUnlocks } from "./achievement-unlocks";

interface LessonCompleteProps {
  feedback: AnswerFeedback;
  lesson: LessonResponse;
}

export function LessonComplete({
  feedback,
  lesson,
}: LessonCompleteProps) {
  const accuracy = Math.round(
    (feedback.answered_count / feedback.exercise_count) * 100,
  );

  return (
    <main className={styles.outcomeScreen}>
      <motion.section
        className={styles.completeCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-complete-heading"
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
      >
        <div className={styles.confetti} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className={styles.trophy}>
          <Trophy aria-hidden="true" />
          <span>
            <Check aria-hidden="true" />
          </span>
        </div>
        <span className={styles.eyebrow}>TRAIL STEP COMPLETE</span>
        <h1 id="lesson-complete-heading">Lesson complete!</h1>
        <p>
          You finished <strong>{lesson.title}</strong> and moved{" "}
          {lesson.skill_title} forward.
        </p>

        <div className={styles.resultGrid}>
          <div>
            <Sparkles aria-hidden="true" />
            <strong>+{feedback.xp_earned}</strong>
            <span>XP earned</span>
          </div>
          <div>
            <Flame aria-hidden="true" />
            <strong>{feedback.learner.current_streak}</strong>
            <span>day streak</span>
          </div>
          <div>
            <Check aria-hidden="true" />
            <strong>{accuracy}%</strong>
            <span>finished</span>
          </div>
        </div>

        <AchievementUnlocks
          achievements={feedback.unlocked_achievements}
        />

        <Link href="/">
          Continue on the path
          <ArrowRight aria-hidden="true" />
        </Link>
      </motion.section>
    </main>
  );
}
