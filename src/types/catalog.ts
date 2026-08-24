export type CatalogItem = {
  id: number;
  nasaId?: string;
  slug?: string;
  title: string;
  subtitle?: string;
  category: string;
  date?: string;
  year?: string;
  detailShard?: string;
  description?: string;
  center?: string;
  photographer?: string;
  mission?: string;
  telescope?: string;
  instrument?: string;
  credit?: string;
  sourceUrl?: string;
  fullImageUrl?: string;
  keywords?: string[];
  featured?: boolean;
  focalPoint?: [number, number];
  rightsNote?: string;
  reviewRequired?: boolean;
};

export type DetailShard = Record<string, CatalogItem>;

export type AtlasConfig = {
  url: string;
  columns: number;
  rows: number;
  tileWidth: number;
  tileHeight: number;
  bytes?: number;
};

export type CatalogPayload = {
  generatedAt: string;
  source: 'demo' | 'nasa';
  atlas: AtlasConfig;
  items: CatalogItem[];
};

export type RenderQuality = {
  label: 'ECO' | 'BALANCED' | 'HIGH';
  pixelRatio: number;
};

export type RenderDiagnostics = {
  fps: number;
  frameTime: number;
  pixelRatio: number;
  width: number;
  height: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  active: boolean;
};
