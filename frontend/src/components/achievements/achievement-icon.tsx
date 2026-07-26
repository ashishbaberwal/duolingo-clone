import {
  Flame,
  Footprints,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

const ACHIEVEMENT_ICONS: Readonly<Record<string, LucideIcon>> = {
  flame: Flame,
  footprints: Footprints,
  sparkles: Sparkles,
  trophy: Trophy,
};

interface AchievementIconProps {
  icon: string;
}

export function AchievementIcon({ icon }: AchievementIconProps) {
  const Icon = ACHIEVEMENT_ICONS[icon] ?? Trophy;
  return <Icon aria-hidden="true" />;
}
