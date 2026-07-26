import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/features/auth";
import styles from "./app-shell.module.css";
import { MOBILE_NAVIGATION_ITEMS, type AppSection } from "./navigation";

interface MobileNavigationProps {
  activeSection: AppSection;
  onPlaceholderSelect: (feature: string) => void;
}

export function MobileNavigation({
  activeSection,
  onPlaceholderSelect,
}: MobileNavigationProps) {
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
            onClick={() => onPlaceholderSelect(label)}
          >
            {content}
          </button>
        );
      })}
      <ThemeToggle className={styles.mobileThemeToggle} />
      <LogoutButton className={styles.mobileLogout} />
    </nav>
  );
}
