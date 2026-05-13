export type HealthStatus = 'Red' | 'Yellow' | 'Green';

export type DataType = 'heatmaps' | 'form-analytics' | 'full-analytics' | 'general' | 'shopify-orders';

export type ShopifyCategory = 'Home' | 'Collections' | 'Products' | 'Search' | 'Pages' | 'Account' | 'Cart' | 'Other';

export interface DeviceBreakdown {
  desktop: number; // percentage 0-100
  mobile: number; // percentage 0-100
  tablet: number; // percentage 0-100
}

export interface FrictionMetrics {
  deadClicks: number;
  rageClicks: number;
  shakyMouse: number;
  repeatedField: number;
}

export interface FunnelStep {
  step: string;
  users: number;
  dropoff: number; // dropoff percentage from previous step
}

export interface ExecutiveAuditData {
  navigationClarity: number; // 0-100 score
  inputEfficiency: number; // avg time to complete form
  sessionDurationAvg: number; // seconds
  frictionPulse: number; // total friction events site-wide
  funnelExisting: FunnelStep[];
  funnelNew: FunnelStep[];
}

export interface ProductSales {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  revenue: number;
}

export interface OrderAnalytics {
  topProducts: ProductSales[];
  orderVolume: number;
  totalRevenue: number;
  averageOrderValue: number;
  geoDistribution: { country: string; count: number }[];
  discountImpact: number; // total discount amount
  retentionMetrics?: {
    repeatCustomerRate: number;
    loyalCustomerCount: number;
    totalUniqueCustomers: number;
  };
  financialStatus?: {
    paid: number;
    refunded: number;
    pending: number;
    cancelled: number;
  };
}

export interface LinkedProductInsight {
  productName: string;
  url: string;
  revenue: number;
  views: number;
  bounceRate: number;
  frictionScore: number;
  conversionRate: number;
}

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
  trend?: number; // percentage change, e.g. -5.2 for 5.2% decrease
  devices?: DeviceBreakdown;
  recordingUrl?: string; // Deep link to Lucky Orange recording
  heatmapUrl?: string; // Deep link to Lucky Orange heatmap
  shopifyCategory?: ShopifyCategory;
  friction?: FrictionMetrics; // Detailed friction metrics for the audit
}

export interface CategoryData {
  name: ShopifyCategory;
  views: number;
  avgBounceRate: number;
  pageCount: number;
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
  activeUsers?: number; // Real-time pulse
  periodComparison?: string; // e.g. "vs last 7 days"
  viewsTrend?: number; // percentage change in total views
  categories: CategoryData[];
  executiveAudit?: ExecutiveAuditData; // Full audit data for the new tab
  ordersData?: OrderAnalytics; // Shopify Orders analytics for the sales tab
  linkedInsights?: LinkedProductInsight[]; // Correlated data between sales and behavior
}
