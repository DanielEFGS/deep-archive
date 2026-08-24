export type EditorialStatus = 'draft' | 'source-checked' | 'reviewed';

export type EditorialSource = {
  label: string;
  url: string;
};

export type EducationalContent = {
  schemaVersion: 1;
  catalogId: number;
  nasaId: string;
  slug: string;
  locale: 'en' | 'es' | 'ja';
  status: EditorialStatus;
  introduction: string;
  observe: string[];
  explanation: string;
  colorMethod: string;
  whyItMatters: string;
  relatedIds: number[];
  sources: EditorialSource[];
  approvedBy?: 'DG';
};

export type TrailStep = {
  catalogId: number;
  nasaId: string;
  chapter: string;
  prompt: string;
};

export type EditorialTrail = {
  schemaVersion: 1;
  slug: string;
  locale: 'en' | 'es' | 'ja';
  status: EditorialStatus;
  title: string;
  dek: string;
  learningObjective: string;
  estimatedMinutes: number;
  steps: TrailStep[];
  approvedBy?: 'DG';
};
