
export interface IELTSWord {
  id: string;
  term: string;
  vietnameseTranslation: string;
  definition: string;
  example: string;
  bandLevel: string;
  collocations: string[];
}

export interface WordSet {
  id: string;
  name: string;
  words: IELTSWord[];
  createdAt: number;
}

export type StudyMode = 'DASHBOARD' | 'FLASHCARDS' | 'LEARN' | 'CUSTOM_IMPORT';

export interface UserStats {
  gold: number;
  masteredCount: number;
  learningCount: number;
  lastScore: number | null;
}
