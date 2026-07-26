import styles from "../../styles/app-shell.module.css";

export function LogoMark() {
  return (
    <span className={styles.logoMark} aria-hidden="true">
      <span className={styles.logoEye} />
      <span className={styles.logoEye} />
      <span className={styles.logoBeak} />
    </span>
  );
}
