export enum PunchStatus {
  Open = 'open',
  InReview = 'in_review',
  Resolved = 'resolved',
}

export enum PunchPriority {
  Critical = 'critical',
  Standard = 'standard',
  Cosmetic = 'cosmetic',
}

export type TradeName =
  | 'Electrical'
  | 'Plumbing'
  | 'HVAC'
  | 'Drywall & Paint'
  | 'Carpentry & Millwork'
  | 'Flooring & Tile'
  | 'Glazing & Doors'
  | 'Fire & Life Safety'
  | 'Concrete & Masonry'
  | 'Roofing & Exterior';

export interface PhotoPin {
  x: number; // Percentage 0..100 from left
  y: number; // Percentage 0..100 from top
}

export interface PunchNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface PunchItem {
  id: string;
  code: string;
  projectId: string;
  title: string;
  description: string;
  trade: TradeName;
  subcontractor: string;
  location: string;
  status: PunchStatus;
  priority: PunchPriority;
  photoUrl: string;
  photoPin?: PhotoPin;
  afterPhotoUrl?: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  notes: PunchNote[];
}

export interface Project {
  id: string;
  name: string;
  code: string;
  address: string;
  superintendent: string;
  createdAt: string;
}

export type ViewMode = 'grid' | 'table';
export type SortOption = 'newest' | 'priority' | 'trade' | 'due_date';

export interface TradeDefinition {
  name: TradeName;
  defaultSubcontractor: string;
  csiDivision: string;
}
