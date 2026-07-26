import type { UnitNode } from "@/lib/api/types";
import {
  PATH_OFFSETS,
  SKILL_START_OFFSET,
  SKILL_VERTICAL_GAP,
  TRAIL_BOTTOM_SPACE,
} from "../../learn.constants";
import styles from "../../styles/learning-path.module.css";
import { SkillNode } from "./skill-node";
import { TrailDecoration } from "./trail-decoration";
import { UnitBanner } from "./unit-banner";

interface UnitSectionProps {
  unit: UnitNode;
  selectedSkillId: number | null;
  onSelectSkill: (skillId: number | null) => void;
}

export function UnitSection({
  unit,
  selectedSkillId,
  onSelectSkill,
}: UnitSectionProps) {
  const trailHeight =
    unit.skills.length * SKILL_VERTICAL_GAP + TRAIL_BOTTOM_SPACE;

  return (
    <section className={styles.unitSection}>
      <UnitBanner unit={unit} />
      <div className={styles.trail} style={{ height: trailHeight }}>
        <TrailDecoration height={trailHeight} />
        {unit.skills.map((skill, index) => (
          <SkillNode
            key={skill.id}
            skill={skill}
            offset={
              PATH_OFFSETS[(index + unit.position - 1) % PATH_OFFSETS.length]
            }
            top={SKILL_START_OFFSET + index * SKILL_VERTICAL_GAP}
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
