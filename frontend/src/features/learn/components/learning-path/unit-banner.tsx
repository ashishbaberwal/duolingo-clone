import { BookMarked } from "lucide-react";
import type { UnitNode } from "@/lib/api/types";
import styles from "../../styles/learning-path.module.css";

interface UnitBannerProps {
  unit: UnitNode;
}

export function UnitBanner({ unit }: UnitBannerProps) {
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
