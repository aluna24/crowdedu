// Mock reservations data for the Facility Scheduling page
// Times are in minutes since midnight (e.g., 6:00 AM = 360)

export type ReservationColor =
  | "red"
  | "green"
  | "blue"
  | "pink"
  | "orange"
  | "teal"
  | "yellow"
  | "black";

export interface Reservation {
  id: string;
  space: string;
  title: string;
  startMin: number;
  endMin: number;
  color: ReservationColor;
  // Weekday (0=Sun..6=Sat). undefined = every day.
  weekday?: number;
}

// Ordered list of all spaces shown in the grid (matches the screenshot order)
export const SPACES: string[] = [
  "4th Floor Courts",
  "Basketball Court #4",
  "Basketball Court #3",
  "4th Floor Squash Courts",
  "Squash Court #6 (Table Tennis)",
  "Squash Court #5",
  "Squash Court #4",
  "3M",
  "3M Squash Court Overflow",
  "3rd Floor Courts",
  "Basketball Court #2",
  "Basketball Court #1",
  "3rd Floor Squash Courts",
  "Squash Court #3",
  "Squash Court #2",
  "Squash Court #1",
  "Multipurpose Room",
  "Fitness Center",
  "Personal Training Room",
  "Conference Room",
  "Pool",
  "P3",
  "Racquetball Court (P3)",
  "Varsity Place",
  "Lobby",
  "MVC Field",
  "Smith Center Aux Gym",
  "Smith Center Pool",
];

// Spaces that are closed/unavailable (renders as X pattern)
export const CLOSED_SPACES: Record<string, { startMin: number; endMin: number }[]> = {
  Pool: [{ startMin: 360, endMin: 540 }, { startMin: 900, endMin: 1320 }],
};

// Color → tailwind classes
export const COLOR_CLASSES: Record<ReservationColor, string> = {
  red: "bg-red-500 text-white border-red-700",
  green: "bg-green-600 text-white border-green-800",
  blue: "bg-blue-600 text-white border-blue-800",
  pink: "bg-pink-400 text-white border-pink-600",
  orange: "bg-orange-400 text-white border-orange-600",
  teal: "bg-teal-400 text-white border-teal-600",
  yellow: "bg-yellow-300 text-yellow-950 border-yellow-500",
  black: "bg-neutral-900 text-white border-neutral-950",
};

const t = (h: number, m = 0) => h * 60 + m;

// Mock data — mirrors the screenshot
export const RESERVATIONS: Reservation[] = [
  // 4th Floor Courts
  { id: "r1", space: "4th Floor Courts", title: "NROTC", startMin: t(6, 30), endMin: t(8), color: "red" },
  { id: "r2", space: "4th Floor Courts", title: "Women's Varsity Basketball", startMin: t(11), endMin: t(13, 30), color: "red" },
  { id: "r3", space: "4th Floor Courts", title: "Men's Varsity Basketball", startMin: t(13, 30), endMin: t(16, 30), color: "red" },

  // 4th Floor Squash
  { id: "r4", space: "4th Floor Squash Courts", title: "Training", startMin: t(10), endMin: t(11, 30), color: "blue" },
  { id: "r5", space: "4th Floor Squash Courts", title: "Archery club - Practice", startMin: t(17), endMin: t(20), color: "blue" },

  // 3M
  { id: "r6", space: "3M", title: "School Without Walls", startMin: t(8, 30), endMin: t(11, 30), color: "teal" },
  { id: "r7", space: "3M", title: "School Without Walls", startMin: t(13, 30), endMin: t(15, 30), color: "teal" },

  // 3rd Floor Courts via Basketball Court #2
  { id: "r8", space: "Basketball Court #2", title: "School Without Walls", startMin: t(8, 30), endMin: t(11, 30), color: "green" },
  { id: "r9", space: "Basketball Court #2", title: "School Without Walls", startMin: t(13, 30), endMin: t(15, 30), color: "green" },
  { id: "r10", space: "Basketball Court #2", title: "Pickleball club - Practice", startMin: t(16), endMin: t(18), color: "green" },
  { id: "r11", space: "Basketball Court #2", title: "Fencing club - Practice", startMin: t(18), endMin: t(20), color: "green" },

  // Basketball Court #1
  { id: "r12", space: "Basketball Court #1", title: "Men's Club Rowing Practice", startMin: t(7), endMin: t(9), color: "green" },

  // 3rd Floor Squash
  { id: "r13", space: "3rd Floor Squash Courts", title: "Squash club - Practice", startMin: t(17), endMin: t(20), color: "yellow" },

  // Multipurpose Room (group fitness)
  { id: "r14", space: "Multipurpose Room", title: "Power Yoga", startMin: t(7), endMin: t(8), color: "pink" },
  { id: "r15", space: "Multipurpose Room", title: "Strength", startMin: t(8), endMin: t(9), color: "pink" },
  { id: "r16", space: "Multipurpose Room", title: "Yoga Sculpt", startMin: t(12), endMin: t(13), color: "pink" },
  { id: "r17", space: "Multipurpose Room", title: "Flow Yoga", startMin: t(16, 30), endMin: t(17, 30), color: "pink" },
  { id: "r18", space: "Multipurpose Room", title: "Yoga Sculpt", startMin: t(17, 30), endMin: t(18, 30), color: "pink" },
  { id: "r19", space: "Multipurpose Room", title: "Vinyasa", startMin: t(18, 30), endMin: t(19, 30), color: "pink" },
  { id: "r20", space: "Multipurpose Room", title: "Alpha Phi Alpha Practice", startMin: t(19, 30), endMin: t(21), color: "pink" },

  // Conference Room (academic)
  { id: "r21", space: "Conference Room", title: "LSPA 103", startMin: t(10, 30), endMin: t(11, 30), color: "orange" },
  { id: "r22", space: "Conference Room", title: "CREC Staff", startMin: t(11, 30), endMin: t(12, 30), color: "orange" },

  // P3 - Racquetball
  { id: "r23", space: "Racquetball Court (P3)", title: "Wrestling club - Practice", startMin: t(17), endMin: t(19), color: "black" },

  // Smith Center Pool
  { id: "r24", space: "Smith Center Pool", title: "Swimming club", startMin: t(18), endMin: t(20), color: "pink" },
  { id: "r25", space: "Smith Center Pool", title: "Water Polo club", startMin: t(20), endMin: t(22), color: "pink" },
];

// Hours range shown in the grid
export const GRID_START_MIN = 6 * 60; // 6 AM
export const GRID_END_MIN = 22 * 60; // 10 PM
export const HOURS: number[] = Array.from(
  { length: (GRID_END_MIN - GRID_START_MIN) / 60 },
  (_, i) => 6 + i
);

export const formatHourLabel = (h: number): string => {
  const period = h >= 12 ? "pm" : "am";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${period}`;
};
