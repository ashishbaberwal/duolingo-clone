import { Check, LockKeyhole, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { CSSProperties } from "react";
import type { SkillNode as Skill } from "@/lib/api/types";
import { SKILL_ICONS } from "../../learn.constants";
import styles from "../../styles/learning-path.module.css";
import { SkillDetails } from "./skill-details";

interface SkillNodeProps {
  skill: Skill;
  offset: number;
  top: number;
  selected: boolean;
  onSelect: () => void;
  onClose: () => void;
}

function getCompletionPercentage(skill: Skill) {
  if (skill.lesson_count === 0) {
    return 0;
  }
  return Math.round((skill.lessons_completed / skill.lesson_count) * 100);
}

export function SkillNode({
  skill,
  offset,
  top,
  selected,
  onSelect,
  onClose,
}: SkillNodeProps) {
  const Icon =
    skill.state === "locked"
      ? LockKeyhole
      : skill.state === "completed"
        ? Check
        : (SKILL_ICONS[skill.icon] ?? Star);
  const completionPercentage = getCompletionPercentage(skill);
  const nodeStyle = {
    "--node-offset": `${offset}px`,
    "--node-progress": `${completionPercentage * 3.6}deg`,
    top: `${top}px`,
  } as CSSProperties;

  return (
    <motion.div
      className={`${styles.skillNodeWrap} ${
        selected ? styles.skillNodeWrapSelected : ""
      }`}
      style={nodeStyle}
      initial={{ opacity: 0, scale: 0.75, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {skill.state === "available" && (
        <motion.span
          className={styles.activeHalo}
          aria-hidden="true"
          animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.1, 0.45] }}
          transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY }}
        />
      )}
      <button
        type="button"
        className={`${styles.skillNode} ${styles[`skill_${skill.state}`]} ${
          selected ? styles.skillNodeSelected : ""
        }`}
        onClick={onSelect}
        aria-label={`${skill.title}, ${skill.state}, ${skill.lessons_completed} of ${skill.lesson_count} lessons`}
        aria-expanded={selected}
      >
        <span className={styles.progressRing} aria-hidden="true" />
        <span className={styles.nodeFace}>
          <Icon aria-hidden="true" fill="currentColor" strokeWidth={3} />
        </span>
      </button>
      <AnimatePresence>
        {selected && <SkillDetails skill={skill} onClose={onClose} />}
      </AnimatePresence>
    </motion.div>
  );
}
