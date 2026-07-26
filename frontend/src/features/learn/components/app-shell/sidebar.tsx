import Link from "next/link";
import { PipMascot } from "@/components/brand/pip-mascot";
import { LogoutButton } from "@/features/auth";
import { NAVIGATION_ITEMS } from "../../learn.constants";
import styles from "../../styles/app-shell.module.css";
import { LogoMark } from "./logo-mark";

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <Link className={styles.brand} href="/" aria-label="LingoTrail home">
        <LogoMark />
        <span>lingotrail</span>
      </Link>
      <nav className={styles.sidebarNav} aria-label="Primary navigation">
        {NAVIGATION_ITEMS.map(({ label, icon: Icon, active }) => (
          <button
            className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
            key={label}
            type="button"
            aria-current={active ? "page" : undefined}
            aria-label={active ? label : `${label}, coming soon`}
          >
            <Icon aria-hidden="true" strokeWidth={2.8} />
            <span>{label}</span>
            {!active && <span className={styles.soonDot} />}
          </button>
        ))}
      </nav>
      <div className={styles.sidebarFooter}>
        <PipMascot className={styles.sidebarMascot} mood="focused" />
        <div className={styles.sidebarFooterContent}>
          <p>Small steps. Real progress.</p>
          <LogoutButton className={styles.sidebarLogout} />
        </div>
      </div>
    </aside>
  );
}
