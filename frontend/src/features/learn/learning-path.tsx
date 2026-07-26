"use client";

import {
  Apple,
  BookMarked,
  BookOpen,
  Check,
  ChevronRight,
  Crown,
  Hand,
  LockKeyhole,
  Plane,
  Star,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type {
  SkillNode as SkillNodeType,
  UnitNode,
} from "@/lib/api/types";
import styles from "./learn.module.css";

const SKILL_ICONS: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  hand: Hand,
  apple: Apple,
  users: Users,
  plane: Plane,
};

const PATH_OFFSETS = [0, -88, -48, 54, 92, 24, -70];

interface SkillButtonProps {
  skill: SkillNodeType;
  offset: number;
  top: number;
  selected: boolean;
  onSelect: () => void;
  onClose: () => void;
}

function SkillDetails({
  skill,
  onClose,
}: {
  skill: SkillNodeType;
  onClose: () => void;
}) {
  const progress = `${skill.lessons_completed} of ${skill.lesson_count} lessons`;
  const isLocked = skill.state === "locked";

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

function SkillButton({
  skill,
  offset,
  top,
  selected,
  onSelect,
  onClose,
}: SkillButtonProps) {
  const Icon =
    skill.state === "locked"
      ? LockKeyhole
      : skill.state === "completed"
        ? Check
        : (SKILL_ICONS[skill.icon] ?? Star);
  const percentage =
    skill.lesson_count === 0
      ? 0
      : Math.round((skill.lessons_completed / skill.lesson_count) * 100);
  const nodeStyle = {
    "--node-offset": `${offset}px`,
    "--node-progress": `${percentage * 3.6}deg`,
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

function UnitBanner({ unit }: { unit: UnitNode }) {
  return (
    <header
      className={`${styles.unitBanner} ${
        unit.position % 2 === 0 ? styles.unitBannerBlue : ""
      }`}
    >
      <div>
        <span>UNIT {unit.position}</span>
        <h2>{unit.title}</h2>
        <p>{unit.description}</p>
      </div>
      <button type="button" aria-label="Guidebook, coming soon">
        <BookMarked aria-hidden="true" />
        <span>Guidebook</span>
      </button>
    </header>
  );
}

function TrailDecoration({ height }: { height: number }) {
  return (
    <svg
      className={styles.trailDecoration}
      viewBox={`0 0 500 ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={`M250 20 C 110 100, 120 190, 250 250 S 410 400, 250 500 S 90 650, 250 ${
          height - 25
        }`}
      />
    </svg>
  );
}

function UnitSection({
  unit,
  selectedSkillId,
  onSelectSkill,
}: {
  unit: UnitNode;
  selectedSkillId: number | null;
  onSelectSkill: (skillId: number | null) => void;
}) {
  const height = unit.skills.length * 164 + 80;
  return (
    <section className={styles.unitSection}>
      <UnitBanner unit={unit} />
      <div className={styles.trail} style={{ height }}>
        <TrailDecoration height={height} />
        {unit.skills.map((skill, index) => (
          <SkillButton
            key={skill.id}
            skill={skill}
            offset={PATH_OFFSETS[(index + unit.position - 1) % PATH_OFFSETS.length]}
            top={50 + index * 164}
            selected={selectedSkillId === skill.id}
            onSelect={() =>
              onSelectSkill(selectedSkillId === skill.id ? null : skill.id)
            }
            onClose={() => onSelectSkill(null)}
          />
        ))}
      </div>
    </section>
  );
}

export function LearningPath({ units }: { units: UnitNode[] }) {
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);

  return (
    <div className={styles.learningPath}>
      <div className={styles.pathIntro}>
        <span>YOUR SPANISH TRAIL</span>
        <h1>Keep your momentum moving</h1>
        <p>Every bright step opens the path a little further.</p>
      </div>
      {units.map((unit) => (
        <UnitSection
          key={unit.id}
          unit={unit}
          selectedSkillId={selectedSkillId}
          onSelectSkill={setSelectedSkillId}
        />
      ))}
    </div>
  );
}
