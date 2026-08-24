export type EditorialStatus = "draft" | "source-checked" | "reviewed";

export type EditorialSource = {
  label: string;
  url: string;
};

export type ObservationFeature = {
  id: string;
  label: string;
  description: string;
  kind: "visible-feature" | "processed-signal" | "editorial-guide";
  cells: string[];
};

export type ObservationMap = {
  mode: "guided";
  columns: number;
  rows: number;
  features: ObservationFeature[];
};

export type EducationalContent = {
  schemaVersion: 1;
  catalogId: number;
  nasaId: string;
  slug: string;
  locale: "en" | "es" | "ja";
  status: EditorialStatus;
  introduction: string;
  observe: string[];
  observationMap?: ObservationMap;
  explanation: string;
  colorMethod: string;
  whyItMatters: string;
  relatedIds: number[];
  sources: EditorialSource[];
  approvedBy?: "DG";
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
  locale: "en" | "es" | "ja";
  status: EditorialStatus;
  title: string;
  dek: string;
  learningObjective: string;
  estimatedMinutes: number;
  steps: TrailStep[];
  approvedBy?: "DG";
};

export type EditorialTrailSummary = Pick<
  EditorialTrail,
  "slug" | "locale" | "status" | "title" | "dek" | "estimatedMinutes"
> & {
  stepCount: number;
  url: string;
};

export type EditorialManifest = {
  schemaVersion: 1;
  generatedAt: string;
  locales: string[];
  trails: EditorialTrailSummary[];
};
