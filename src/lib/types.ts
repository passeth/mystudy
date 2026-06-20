export type BlockColor =
  | "lime"
  | "lilac"
  | "cream"
  | "pink"
  | "mint"
  | "coral"
  | "navy";

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  file: string; // path under /  e.g. lessons/ppwr/0011-foo.html
  date?: string;
}

export interface Topic {
  id: string;
  title: string;
  subtitle: string;
  color: BlockColor;
  order: number;
  lessons: Lesson[];
}

export interface Manifest {
  generatedAt: string;
  topics: Topic[];
}

export const BLOCK_COLORS: BlockColor[] = [
  "lime",
  "lilac",
  "cream",
  "pink",
  "mint",
  "coral",
  "navy",
];

export const COLOR_HEX: Record<BlockColor, string> = {
  lime: "#dceeb1",
  lilac: "#c5b0f4",
  cream: "#f4ecd6",
  pink: "#efd4d4",
  mint: "#c8e6cd",
  coral: "#f3c9b6",
  navy: "#1f1d3d",
};

export const isDark = (c: BlockColor) => c === "navy";
