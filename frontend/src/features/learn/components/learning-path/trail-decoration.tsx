import styles from "../../styles/learning-path.module.css";

interface TrailDecorationProps {
  height: number;
}

export function TrailDecoration({ height }: TrailDecorationProps) {
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
