"use client";

import { useState } from "react";
import type { UnitNode } from "@/lib/api/types";
import styles from "../../styles/learning-path.module.css";
import { UnitSection } from "./unit-section";

interface LearningPathProps {
  units: UnitNode[];
}

export function LearningPath({ units }: LearningPathProps) {
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
