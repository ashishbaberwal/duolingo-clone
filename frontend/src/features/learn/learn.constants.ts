import {
  Apple,
  BookOpen,
  Hand,
  Plane,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const SKILL_ICONS: Readonly<Record<string, LucideIcon>> = {
  "book-open": BookOpen,
  hand: Hand,
  apple: Apple,
  users: Users,
  plane: Plane,
};

export const PATH_OFFSETS = [0, -88, -48, 54, 92, 24, -70] as const;
export const SKILL_VERTICAL_GAP = 164;
export const SKILL_START_OFFSET = 50;
export const TRAIL_BOTTOM_SPACE = 80;
