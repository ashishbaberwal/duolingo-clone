import Link from "next/link";
import { PipMascot } from "@/components/brand/pip-mascot";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/features/auth";
import styles from "./app-shell.module.css";
import { LogoMark } from "./logo-mark";
import { NAVIGATION_ITEMS, type AppSection } from "./navigation";

interface SidebarProps {
  activeSection: AppSection;
  onPlaceholderSelect: (feature: string) => void;
}

export function Sidebar({
  activeSection,
  onPlaceholderSelect,
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <Link className={styles.brand} href="/" aria-label="LingoTrail home">
        <LogoMark />
        <span>lingotrail</span>
      </Link>
      <nav className={styles.sidebarNav} aria-label="Primary navigation">
        {NAVIGATION_ITEMS.map(({ key, label, icon: Icon, href }) => {
          const isActive = key === activeSection;
          const content = (
            <>
              <Icon aria-hidden="true" strokeWidth={2.8} />
              <span>{label}</span>
              {!href && <span className={styles.soonDot} />}
            </>
          );

          return href ? (
            <Link
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              href={href}
              key={key}
              aria-current={isActive ? "page" : undefined}
            >
              {content}
            </Link>
          ) : (
            <button
              className={styles.navItem}
              key={key}
              type="button"
              aria-label={`${label}, coming soon`}
              onClick={() => onPlaceholderSelect(label)}
            >
              {content}
            </button>
          );
        })}
      </nav>
      <ThemeToggle className={styles.sidebarThemeToggle} showLabel />
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
