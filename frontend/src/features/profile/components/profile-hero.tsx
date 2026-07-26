import { CalendarDays } from "lucide-react";
import { LearnerAvatar } from "@/components/learner-avatar";
import type { ProfileResponse } from "@/lib/api/types";
import styles from "../styles/profile.module.css";

interface ProfileHeroProps {
  profile: ProfileResponse;
}

export function ProfileHero({ profile }: ProfileHeroProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.heroPattern} aria-hidden="true" />
      <LearnerAvatar
        avatarKey={profile.avatar_key}
        displayName={profile.display_name}
        size="large"
      />
      <div className={styles.identity}>
        <span>LINGOTRAIL LEARNER</span>
        <h1>{profile.display_name}</h1>
        <p>@{profile.username}</p>
      </div>
      <div className={styles.joinedBadge}>
        <CalendarDays aria-hidden="true" />
        Spanish explorer
      </div>
    </header>
  );
}
