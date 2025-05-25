export interface Session {
  id: string;
  date: string;
  gameType: string;
  buyIn: number;
  cashOut: number | null;
  profit: number | null;
  location: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
} 