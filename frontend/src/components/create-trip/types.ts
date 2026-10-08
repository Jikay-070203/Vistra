export interface MoodPhoto {
  id: string;
  url: string;
  caption: string;
  tags?: string[];
}

export type PaceType = 'relaxed' | 'normal' | 'busy';

export interface FitnessLevelOption {
  level: number;
  label: string;
  distance: string;
  desc: string;
}

export interface TravelDnaState {
  exploration: number; // 0-100: Khám phá vs Thư thái
  natureCulture: number; // 0-100: Thiên nhiên vs Văn hóa
  pace: number; // 0-100: Thư thả vs Năng động
  cuisine: number; // 0-100: Truyền thống vs Trải nghiệm mới
  budget: number; // 0-100: Tiết kiệm vs Cao cấp
}
