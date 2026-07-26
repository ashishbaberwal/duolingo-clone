import Link from "next/link";
import { LogoutButton } from "@/features/auth";
import styles from "./app-shell.module.css";
import { MOBILE_NAVIGATION_ITEMS, type AppSection } from "./navigation";

interface MobileNavigationProps {
  activeSection: AppSection;
}

export function MobileNavigation({ activeSection }: MobileNavigationProps) {
  return (
    <nav className={styles.mobileNav} aria-label="Mobile navigation">
      {MOBILE_NAVIGATION_ITEMS.map(({ key, label, icon: Icon, href }) => {
        const isActive = key === activeSection;
        const content = (
          <>
            <Icon aria-hidden="true" strokeWidth={2.8} />
            <span>{label}</span>
          </>
        );

        return href ? (
          <Link
            key={key}
            href={href}
            className={isActive ? styles.mobileNavActive : ""}
            aria-current={isActive ? "page" : undefined}
          >
            {content}
          </Link>
        ) : (
          <button
            key={key}
            type="button"
            aria-label={`${label}, coming soon`}
          >
            {content}
          </button>
        );
      })}
      <LogoutButton className={styles.mobileLogout} />
    </nav>
  );
}
