export type SkillState = "completed" | "available" | "locked";

export interface LearnerStats {
  hearts: number;
  max_hearts: number;
  gems: number;
  total_xp: number;
  current_streak: number;
  daily_goal_xp: number;
  today_xp: number;
}

export interface LessonNode {
  id: number;
  title: string;
  position: number;
  is_completed: boolean;
}

export interface SkillNode {
  id: number;
  title: string;
  description: string | null;
  icon: string;
  position: number;
  state: SkillState;
  lessons_completed: number;
  lesson_count: number;
  crowns: number;
  next_lesson_id: number | null;
  prerequisite_ids: number[];
  lessons: LessonNode[];
}

export interface UnitNode {
  id: number;
  title: string;
  description: string | null;
  position: number;
  skills: SkillNode[];
}

export interface LearningPathResponse {
  course: {
    id: number;
    code: string;
    title: string;
    source_language: string;
    target_language: string;
  };
  learner: LearnerStats;
  units: UnitNode[];
}
