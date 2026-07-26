import styles from "../../styles/learn-page.module.css";

export function LoadingState() {
  return (
    <div className={styles.loadingScreen} aria-label="Loading learning path">
      <div className={styles.loadingBrand}>
        <span />
        <strong>lingotrail</strong>
      </div>
      <div className={styles.loadingLayout}>
        <div className={styles.loadingSidebar} />
        <div className={styles.loadingPath}>
          <div className={styles.loadingBanner} />
          {[0, 1, 2].map((item) => (
            <div className={styles.loadingNode} key={item} />
          ))}
        </div>
        <div className={styles.loadingRail} />
      </div>
    </div>
  );
}
