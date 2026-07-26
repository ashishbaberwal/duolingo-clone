import { ChevronRight, Crown, LockKeyhole, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import type { SkillNode } from "@/lib/api/types";
import styles from "../../styles/learning-path.module.css";

interface SkillDetailsProps {
  skill: SkillNode;
  onClose: () => void;
}

export function SkillDetails({ skill, onClose }: SkillDetailsProps) {
  const isLocked = skill.state === "locked";
  const progress = `${skill.lessons_completed} of ${skill.lesson_count} lessons`;

  return (
    <motion.div
      className={`${styles.skillDetails} ${
        isLocked ? styles.skillDetailsLocked : ""
      }`}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      role="dialog"
      aria-label={`${skill.title} details`}
    >
      <button
        className={styles.closeDetails}
        onClick={onClose}
        type="button"
        aria-label="Close skill details"
      >
        <X aria-hidden="true" />
      </button>
      <span className={styles.skillStateLabel}>
        {isLocked
          ? "LOCKED"
          : skill.state === "completed"
            ? "COMPLETED"
            : "CURRENT SKILL"}
      </span>
      <h3>{skill.title}</h3>
      <p>
        {isLocked
          ? "Finish the skills before this one to open the trail."
          : skill.description}
      </p>
      <div className={styles.skillProgressRow}>
        <div>
          <Crown aria-hidden="true" fill="currentColor" />
          <span>{skill.crowns}</span>
        </div>
        <span>{progress}</span>
      </div>
      {isLocked || skill.next_lesson_id === null ? (
        <button className={styles.lockedAction} type="button" disabled>
          <LockKeyhole aria-hidden="true" />
          Complete prerequisites
        </button>
      ) : (
        <Link
          className={styles.startLesson}
          href={`/lesson/${skill.next_lesson_id}`}
        >
          {skill.lessons_completed > 0 ? "Continue lesson" : "Start lesson"}
          <ChevronRight aria-hidden="true" />
        </Link>
      )}
    </motion.div>
  );
}
