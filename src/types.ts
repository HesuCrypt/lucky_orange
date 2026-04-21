export type HealthStatus = 'Red' | 'Yellow' | 'Green';

export type DataType = 'heatmaps' | 'form-analytics' | 'full-analytics' | 'general';

export interface RawPageData {
  url: string;
  views: number;
  bounceRate: number; // percentage 0-100
  rageClicks: number;
  scrollDepth: number; // percentage 0-100
  avgTimeOnPage: number; // in seconds
}

export interface PageMetrics extends RawPageData {
  id: string;
  healthScore: number; // 0-100
  status: HealthStatus;
  explanation?: string;
  actionItem?: string;
}

export interface DataSource {
  fileName: string;
  dataType: DataType;
  dataTypeLabel: string;    // e.g. "Heatmaps", "Form Analytics"
  identifierLabel: string;  // e.g. "Page", "Form"
  countLabel: string;       // e.g. "Pageviews", "Submissions"
  summary: string;          // plain-English summary for presentation
  uploadedAt: Date;
  sourceKind?: 'csv-upload' | 'sample' | 'lucky-orange-api';
  syncedAt?: string;
}

/** Row-level issues detected while parsing a CSV (1-based data row index includes header as row 1). */
export interface CsvRowIssue {
  rowNumber: number;
  message: string;
}

/** Optional metadata attached after a successful import. */
export interface ImportMeta {
  warnings: string[];
  rowIssues: CsvRowIssue[];
}

export interface DashboardData {
  overallHealth: number;
  totalViews: number;
  criticalPagesCount: number;
  pages: PageMetrics[];
  topCriticalPages: PageMetrics[];
  isLimitedData: boolean;
  dataSource?: DataSource;
  /** Present when the last CSV import produced warnings or per-row notes. */
  importMeta?: ImportMeta;
}
