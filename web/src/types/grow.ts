// Shared types for grow calendar (used by both web and mobile)

export type ExperienceLevel = "beginner" | "intermediate" | "commercial";
export type StrainType = "indica_dominant" | "sativa_dominant" | "hybrid" | "autoflower";
export type GrowMedium =
  | "soil"
  | "living_soil"
  | "coco"
  | "hydro"
  | "aeroponics"
  | "rockwool";

export type LightType =
  | "led"
  | "hps"
  | "hid"
  | "cmh"
  | "fluorescent"
  | "tungsten"
  | "under_canopy";

export type NutrientType = "synthetic" | "organic";
export type GrowGoal = "yield" | "speed" | "quality";
export type GrowStage =
  | "germination"
  | "seedling"
  | "vegetative"
  | "flower"
  | "harvest"
  | "dry"
  | "cure";

export interface GrowSetup {
  experienceLevel: ExperienceLevel;
  strainType: StrainType;
  strainGenetics: string; // e.g. "OG Kush × White Widow", "Bruce Banner", "Gorilla Glue #4"
  medium: GrowMedium;
  lightType: LightType;
  lightWattage: string; // e.g. "600W", "480W", "1000W"
  nutrientType: NutrientType;
  spaceSize: string; // e.g. "4x4", "5x5", "10x10"
  startDate: string; // ISO date string
  currentStage?: GrowStage;
  currentDayInStage?: number;
  goals: GrowGoal[];
}

export interface EnvTargets {
  tempF: string; // e.g. "75-80°F"
  rh: string; // e.g. "60-70%"
  vpd: string; // e.g. "0.8-1.1"
  ppfd: string; // e.g. "400-600 μmol/m²/s"
  lightSchedule: string; // e.g. "18/6" or "12/12"
}

export interface DailyTask {
  id: string;
  task: string;
  category: "watering" | "nutrients" | "training" | "ipm" | "environment" | "defoliation" | "observation" | "harvest";
  priority: "required" | "recommended" | "optional";
  drPesosNote?: string;
}

export interface WeekPlan {
  week: number;
  stage: GrowStage;
  startDate: string; // ISO date
  endDate: string; // ISO date
  dailyTasks: DailyTask[];
  envTargets: EnvTargets;
  nutrients: string;
  defoliationScheduled: boolean;
  drPesosNote: string;
}

// Shape returned by the generate-calendar API and stored in Supabase
export interface CalendarData {
  totalWeeks: number;
  estimatedHarvestDate: string;
  weeks: WeekPlan[];
}

export interface GrowCalendar {
  id: string;
  userId: string;
  setup: GrowSetup;
  weeks: WeekPlan[];
  totalWeeks: number;
  estimatedHarvestDate: string;
  createdAt: string;
}

export interface GrowProgress {
  id: string;
  calendarId: string;
  date: string;
  tasksCompleted: string[]; // task IDs
  notes: string;
  photos: string[]; // Supabase storage URLs
}
