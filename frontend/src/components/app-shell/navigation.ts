import {
  Home,
  Settings,
  ShoppingBag,
  Target,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type AppSection = "learn" | "leaderboard" | "profile";

type NavigationKey = AppSection | "quests" | "shop" | "settings";

interface NavigationItem {
  key: NavigationKey;
  label: string;
  icon: LucideIcon;
  href?: string;
}

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { key: "learn", label: "Learn", icon: Home, href: "/" },
  {
    key: "leaderboard",
    label: "Leaderboards",
    icon: Trophy,
    href: "/leaderboard",
  },
  { key: "quests", label: "Quests", icon: Target },
  { key: "shop", label: "Shop", icon: ShoppingBag },
  { key: "profile", label: "Profile", icon: UserRound, href: "/profile" },
  { key: "settings", label: "Settings", icon: Settings },
];

const MOBILE_KEYS: readonly NavigationKey[] = [
  "learn",
  "leaderboard",
  "quests",
  "profile",
];

export const MOBILE_NAVIGATION_ITEMS = NAVIGATION_ITEMS.filter((item) =>
  MOBILE_KEYS.includes(item.key),
);
