import { NAVIGATION_ITEMS } from "../../learn.constants";
import styles from "../../styles/app-shell.module.css";

export function MobileNavigation() {
  return (
    <nav className={styles.mobileNav} aria-label="Mobile navigation">
      {NAVIGATION_ITEMS.slice(0, 5).map(({ label, icon: Icon, active }) => (
        <button
          key={label}
          type="button"
          className={active ? styles.mobileNavActive : ""}
          aria-current={active ? "page" : undefined}
          aria-label={active ? label : `${label}, coming soon`}
        >
          <Icon aria-hidden="true" strokeWidth={2.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
