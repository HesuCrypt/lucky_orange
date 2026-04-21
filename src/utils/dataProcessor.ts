import Papa from 'papaparse';
import {
  RawPageData,
  PageMetrics,
  DashboardData,
  HealthStatus,
  DataSource,
  DataType,
  CsvRowIssue,
  ImportMeta,
} from '../types';

// Helper to generate human-readable explanations and action items for poor performance
function generateExplanation(page: RawPageData): { explanation: string; actionItem: string } {
  const issues = [];
  let primaryAction = "Review page content and simplify layout.";
  
  // Prioritize the worst issue for the action item
  if (page.rageClicks > 15) {
    issues.push(`High frustration detected (${page.rageClicks} rage clicks) — users might be clicking unclickable elements or experiencing broken interactions.`);
    primaryAction = "Check for unresponsive buttons, broken links, or misleading UI elements that look clickable.";
  } else if (page.bounceRate > 80) {
    issues.push(`Severe bounce rate (${page.bounceRate}%) — the page content isn't matching user intent or loads too slowly.`);
    primaryAction = "Improve page load speed and ensure the headline/hero section matches the user's search intent.";
  } else if (page.scrollDepth < 30) {
    issues.push(`Poor engagement (avg scroll ${page.scrollDepth}%) — users are abandoning the page before seeing the main content.`);
    primaryAction = "Move key information and calls-to-action (CTAs) higher up on the page (above the fold).";
  } else if (page.avgTimeOnPage < 10) {
    issues.push(`Extremely low time on page (${page.avgTimeOnPage}s) — users are leaving almost immediately.`);
    primaryAction = "Make the content more scannable with bullet points, bold text, and clearer headings.";
  } else if (page.bounceRate > 60) {
    issues.push(`High bounce rate (${page.bounceRate}%) — visitors aren't exploring further.`);
    primaryAction = "Add clear internal links or next steps to keep users engaged on the site.";
  }

  if (issues.length === 0) {
    return {
      explanation: "Page is underperforming across multiple minor metrics.",
      actionItem: "Conduct a general UX review using session recordings."
    };
  }

  return {
    explanation: issues.join(" "),
    actionItem: primaryAction
  };
}

// Logic to assign Health Scores
export function calculateHealthScore(page: RawPageData, isLimited: boolean): { score: number; status: HealthStatus; explanation?: string; actionItem?: string } {
  if (isLimited) {
    // With limited data, we can't meaningfully compute health
    return { score: -1, status: 'Green', explanation: undefined, actionItem: undefined };
  }

  let score = 100;

  if (page.bounceRate > 40) {
    score -= Math.min(30, (page.bounceRate - 40) * 0.6);
  }
  if (page.rageClicks > 0) {
    score -= Math.min(40, page.rageClicks * 2.5);
  }
  if (page.scrollDepth < 60) {
    score -= Math.min(20, (60 - page.scrollDepth) * 0.5);
  }
  if (page.avgTimeOnPage < 30) {
    score -= Math.min(10, (30 - page.avgTimeOnPage) * 0.5);
  }

  score = Math.max(0, Math.round(score));

  let status: HealthStatus = 'Green';
  let explanation = undefined;
  let actionItem = undefined;

  if (score < 50) {
    status = 'Red';
    const analysis = generateExplanation(page);
    explanation = analysis.explanation;
    actionItem = analysis.actionItem;
  } else if (score < 80) {
    status = 'Yellow';
  }

  return { score, status, explanation, actionItem };
}
export function processAnalyticsData(rawData: RawPageData[], isLimited: boolean): Omit<DashboardData, 'dataSource'> {
  const pages: PageMetrics[] = rawData.map((page, index) => {
    const { score, status, explanation, actionItem } = calculateHealthScore(page, isLimited);
    return {
      ...page,
      id: `page-${index}-${Date.now()}`,
      healthScore: score,
      status,
      explanation,
      actionItem,
    };
  });

  // Sort by views descending for limited data, by health ascending otherwise
  if (isLimited) {
    pages.sort((a, b) => b.views - a.views);
  } else {
    pages.sort((a, b) => a.healthScore - b.healthScore);
  }

  const topCriticalPages = pages.filter(p => p.status === 'Red').slice(0, 10);
  const overallHealth = isLimited ? -1 : Math.round(pages.reduce((acc, p) => acc + p.healthScore, 0) / (pages.length || 1));
  const totalViews = pages.reduce((acc, p) => acc + p.views, 0);
  const criticalPagesCount = pages.filter(p => p.status === 'Red').length;

  return {
    overallHealth,
    totalViews,
    criticalPagesCount,
    pages,
    topCriticalPages,
    isLimitedData: isLimited,
  };
}

/**
 * Parses a numeric cell; if the cell is non-empty but not numeric, returns invalidText for validation UI.
 */
export function parseNumericReport(val: unknown): { value: number; invalidText?: string } {
  if (val === undefined || val === null || val === '') return { value: 0 };
  if (typeof val === 'number') {
    return Number.isNaN(val) ? { value: 0, invalidText: 'NaN' } : { value: val };
  }
  const s = String(val).trim();
  if (s === '') return { value: 0 };
  const cleaned = s.replace(/[%\s,s$]/gi, '');
  const parsed = parseFloat(cleaned);
  if (Number.isNaN(parsed)) {
    const clip = s.length > 48 ? `${s.slice(0, 45)}…` : s;
    return { value: 0, invalidText: clip };
  }
  return { value: parsed };
}

/** Robustly parses a numeric value from a string, stripping common units and symbols. */
export function parseNumeric(val: unknown): number {
  return parseNumericReport(val).value;
}

/**
 * Finds a value in a row by matching its key against a list of aliases (case-insensitive).
 */
function findHeaderValue(row: any, aliases: string[]): any {
  const keys = Object.keys(row);
  const normalizedAliases = aliases.map(a => a.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  const foundKey = keys.find(k => {
    const normalizedKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normalizedAliases.includes(normalizedKey);
  });
  
  return foundKey ? row[foundKey] : undefined;
}

// All known aliases for the identifier (URL/name) column
const URL_ALIASES = [
  'URL Path', 'URLPath', 'Page URL', 'Link', 'Path', 'URL', 'Request Path', 'Address',
  'Page', 'Form', 'Element', 'Name', 'Selector', 'Component', 'Field',
];

// All known aliases for the count/views column
const COUNT_ALIASES = [
  'Pageviews', 'Views', 'Visits', 'Sessions', 'Page Views', 'Hits', 'Count',
  'Submissions', 'Clicks', 'Interactions', 'Events', 'Total',
];

/**
 * Smart column detection: finds the best column for identifier and count.
 */
function detectColumns(headers: string[], sampleRow: any): { identifierCol: string | null; countCol: string | null } {
  const normalizedUrlAliases = URL_ALIASES.map(a => a.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const normalizedCountAliases = COUNT_ALIASES.map(a => a.toLowerCase().replace(/[^a-z0-9]/g, ''));

  let identifierCol: string | null = null;
  let countCol: string | null = null;

  for (const h of headers) {
    const normalized = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!identifierCol && normalizedUrlAliases.includes(normalized)) identifierCol = h;
    if (!countCol && normalizedCountAliases.includes(normalized)) countCol = h;
  }

  if (!identifierCol || !countCol) {
    for (const h of headers) {
      const val = sampleRow[h];
      if (!identifierCol && typeof val === 'string') identifierCol = h;
      if (!countCol && typeof val === 'number') countCol = h;
    }
  }

  return { identifierCol, countCol };
}

/**
 * Detects the type of data from column names.
 */
function detectDataType(identifierCol: string, countCol: string): { dataType: DataType; dataTypeLabel: string; identifierLabel: string; countLabel: string } {
  const id = identifierCol.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cnt = countCol.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (id.includes('form') || id.includes('selector') || id.includes('element') || cnt.includes('submission')) {
    return { dataType: 'form-analytics', dataTypeLabel: 'Form Analytics', identifierLabel: 'Form', countLabel: 'Submissions' };
  }
  if (id.includes('url') || id.includes('path') || id.includes('page')) {
    if (cnt.includes('pageview') || cnt.includes('view') || cnt.includes('hit')) {
      return { dataType: 'heatmaps', dataTypeLabel: 'Heatmaps', identifierLabel: 'Page', countLabel: 'Pageviews' };
    }
  }
  return { dataType: 'general', dataTypeLabel: 'Analytics', identifierLabel: identifierCol, countLabel: countCol };
}

/**
 * Generates a plain-English summary of the data for presentation.
 */
function generateSummary(pages: PageMetrics[], identifierLabel: string, countLabel: string, isLimited: boolean): string {
  const total = pages.reduce((acc, p) => acc + p.views, 0);
  const topItem = pages.reduce((best, p) => p.views > best.views ? p : best, pages[0]);
  const formattedTotal = new Intl.NumberFormat('en-US').format(total);
  const formattedTopViews = new Intl.NumberFormat('en-US').format(topItem.views);

  let summary = `${pages.length} items tracked with a total of ${formattedTotal} ${countLabel.toLowerCase()}. `;
  summary += `The top ${identifierLabel.toLowerCase()} is "${topItem.url}" with ${formattedTopViews} ${countLabel.toLowerCase()}.`;

  if (!isLimited) {
    const criticalCount = pages.filter(p => p.status === 'Red').length;
    if (criticalCount > 0) {
      summary += ` ${criticalCount} ${criticalCount === 1 ? 'item needs' : 'items need'} immediate attention.`;
    } else {
      summary += ` All items are performing within healthy thresholds.`;
    }
  }

  return summary;
}

/**
 * Converts CSS selectors and developer-facing IDs into human-readable names.
 * e.g. '.cart-drawer__foot.cart__foot [method="post"]' → 'Cart Checkout Form'
 *      '#CustomerLogin' → 'Customer Login'
 *      '[id="NewsletterForm--footer-block-4"]' → 'Newsletter Form'
 */
function simplifySelectorName(raw: string): string {
  let name = raw;

  // Catch common specific search form patterns that lack good IDs
  if (name.includes('search') || name.includes('predictive')) {
    return 'Search Form';
  }

  if (name === '[results="true"] [method="get"]' || name === '[loading="true"] [method="get"]') {
    return 'Search Form (Generic)';
  }

  // Extract ID from [id="..."] attribute selectors
  const idAttrMatch = name.match(/\[id=["']?([^"'\]]+)["']?\]/);
  if (idAttrMatch) {
    name = '#' + idAttrMatch[1];
  }

  // Extract the most meaningful part: prefer #id, then .className
  const idMatch = name.match(/#([a-zA-Z][a-zA-Z0-9_-]*)/);
  const classMatch = name.match(/\.([a-zA-Z][a-zA-Z0-9_-]*)/);
  
  if (idMatch) {
    name = idMatch[1];
  } else if (classMatch) {
    name = classMatch[1];
  } else {
    // Strip attribute selectors for anything left
    name = name.replace(/\[.*?\]/g, '').trim();
    if (!name) {
      // If only attributes, try to extract meaningful words from the original
      const words = raw.match(/[a-zA-Z]{3,}/g);
      if (words && words.length > 0) {
        name = words.filter(w => !['method', 'post', 'get', 'true', 'false', 'role', 'dialog', 'results', 'loading'].includes(w.toLowerCase())).join(' ');
      }
      if (!name) name = 'Unnamed Form';
    }
  }

  // Remove BEM template suffixes (--template--12345__main--67890)
  name = name.replace(/--template--[\w-]+/g, '');
  // Remove long numeric suffixes
  name = name.replace(/[-_]\d{4,}/g, '');
  // Remove BEM element/modifier suffixes like __main, --footer-block-4 etc.
  name = name.replace(/--[a-zA-Z]+-block-\d+/g, '');
  name = name.replace(/__main$/g, '');
  
  // Convert camelCase → separate words
  name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
  // Convert kebab-case and snake_case → spaces
  name = name.replace(/[-_]+/g, ' ');
  // Remove BEM double-underscore leftovers
  name = name.replace(/\s{2,}/g, ' ').trim();

  // Capitalize each word
  name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  // Add "Form" suffix if not already present and it looks like a form
  const lower = name.toLowerCase();
  if (!lower.includes('form') && !lower.includes('search') && !lower.includes('login') && !lower.includes('signup')) {
    name += ' Form';
  }

  return name;
}

export function parseCSV(csvString: string, fileName: string = 'Uploaded CSV'): Promise<DashboardData> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            reject(new Error('The CSV file appears to be empty or invalid.'));
            return;
          }

          const firstRow = results.data[0] as any;
          const headers = Object.keys(firstRow);
          const { identifierCol, countCol } = detectColumns(headers, firstRow);

          console.log('[CSV Parser] Detected headers:', headers);
          console.log('[CSV Parser] Identifier column:', identifierCol, '| Count column:', countCol);

          if (!identifierCol && !countCol) {
            reject(new Error(`Could not detect data columns. Found headers: ${headers.join(', ')}`));
            return;
          }

          const hasBounce = findHeaderValue(firstRow, ['Bounce Rate', 'Bounce %', 'Bounces', 'BounceRate']) !== undefined;
          const hasRage = findHeaderValue(firstRow, ['Rage Clicks', 'Frustration', 'Rage', 'RageClicks']) !== undefined;
          const isLimited = !hasBounce && !hasRage;

          // Pre-detect data type to know if we should simplify names
          const preDetected = detectDataType(identifierCol || 'Item', countCol || 'Count');
          const shouldSimplifyNames = preDetected.dataType === 'form-analytics';

          const rowIssues: CsvRowIssue[] = [];
          const importWarnings: string[] = [];

          const rawData: RawPageData[] = (results.data as any[])
            .map((row: any, i: number) => ({ row, i }))
            .filter(({ row }) => row && Object.keys(row).length >= 1)
            .map(({ row, i }) => {
              const rowNumber = i + 2;

              const rawIdentifier = identifierCol ? row[identifierCol] : null;
              const idStr = rawIdentifier == null ? '' : String(rawIdentifier).trim();
              if (!idStr) {
                rowIssues.push({ rowNumber, message: 'Missing identifier (URL, page, or form name)' });
              }

              const rawUrl = idStr || 'Unknown';
              const viewsCell = countCol ? row[countCol] : 0;
              const vr = parseNumericReport(viewsCell);
              if (vr.invalidText !== undefined && String(viewsCell ?? '').trim() !== '') {
                rowIssues.push({ rowNumber, message: `Views: not a valid number (${vr.invalidText})` });
              }

              const bounceCell = findHeaderValue(row, ['Bounce Rate', 'Bounce %', 'Bounces', 'BounceRate']);
              const br = parseNumericReport(bounceCell);
              if (br.invalidText !== undefined && String(bounceCell ?? '').trim() !== '') {
                rowIssues.push({ rowNumber, message: `Bounce rate: not a valid number (${br.invalidText})` });
              }

              const rageCell = findHeaderValue(row, ['Rage Clicks', 'Frustration', 'Rage', 'RageClicks']);
              const rr = parseNumericReport(rageCell);
              if (rr.invalidText !== undefined && String(rageCell ?? '').trim() !== '') {
                rowIssues.push({ rowNumber, message: `Rage clicks: not a valid number (${rr.invalidText})` });
              }

              const scrollCell = findHeaderValue(row, ['Scroll Depth', 'Avg Scroll', 'Depth', 'Scroll %', 'ScrollDepth']);
              const sr = parseNumericReport(scrollCell);
              if (sr.invalidText !== undefined && String(scrollCell ?? '').trim() !== '') {
                rowIssues.push({ rowNumber, message: `Scroll depth: not a valid number (${sr.invalidText})` });
              }

              const timeCell = findHeaderValue(row, ['Avg Time', 'Time on Page', 'Duration', 'Session Length', 'Avg Time on Page']);
              const tr = parseNumericReport(timeCell);
              if (tr.invalidText !== undefined && String(timeCell ?? '').trim() !== '') {
                rowIssues.push({ rowNumber, message: `Time on page: not a valid number (${tr.invalidText})` });
              }

              const displayUrl =
                shouldSimplifyNames && idStr ? simplifySelectorName(rawUrl) : rawUrl;

              return {
                url: displayUrl,
                views: vr.value,
                bounceRate: br.value,
                rageClicks: rr.value,
                scrollDepth: sr.value,
                avgTimeOnPage: tr.value,
              };
            });

          if (rawData.filter((r) => r.url === 'Unknown').length > rawData.length / 2 && rawData.length > 3) {
            importWarnings.push('Many rows are missing an identifier; check the identifier column mapping.');
          }
          if (rowIssues.length > 40) {
            importWarnings.push(`Many cells failed validation (${rowIssues.length} notes). Fix the CSV and re-upload.`);
          }
          
          if (rawData.length === 0) {
            reject(new Error('No valid data could be extracted from the CSV. Please check the column headers.'));
            return;
          }

          const processed = processAnalyticsData(rawData, isLimited);
          const { dataType, dataTypeLabel, identifierLabel, countLabel } = detectDataType(
            identifierCol || 'Item',
            countCol || 'Count'
          );

          const dataSource: DataSource = {
            fileName,
            dataType,
            dataTypeLabel,
            identifierLabel,
            countLabel,
            summary: generateSummary(processed.pages, identifierLabel, countLabel, isLimited),
            uploadedAt: new Date(),
          };

          const importMeta: ImportMeta | undefined =
            importWarnings.length > 0 || rowIssues.length > 0
              ? { warnings: importWarnings, rowIssues: rowIssues.slice(0, 120) }
              : undefined;

          resolve({ ...processed, dataSource, importMeta });
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => reject(error)
    });
  });
}

// Generate mock data for the initial state
export function getMockData(): DashboardData {
  const mockRawData: RawPageData[] = [
    { url: '/checkout/payment', views: 12500, bounceRate: 85, rageClicks: 42, scrollDepth: 20, avgTimeOnPage: 12 },
    { url: '/pricing', views: 45000, bounceRate: 65, rageClicks: 18, scrollDepth: 45, avgTimeOnPage: 25 },
    { url: '/features/analytics', views: 8200, bounceRate: 72, rageClicks: 25, scrollDepth: 30, avgTimeOnPage: 18 },
    { url: '/blog/new-update', views: 15000, bounceRate: 40, rageClicks: 2, scrollDepth: 85, avgTimeOnPage: 120 },
    { url: '/home', views: 150000, bounceRate: 35, rageClicks: 5, scrollDepth: 75, avgTimeOnPage: 85 },
    { url: '/contact-us', views: 3200, bounceRate: 90, rageClicks: 35, scrollDepth: 15, avgTimeOnPage: 8 },
    { url: '/docs/api', views: 22000, bounceRate: 25, rageClicks: 1, scrollDepth: 90, avgTimeOnPage: 300 },
    { url: '/about', views: 18000, bounceRate: 45, rageClicks: 3, scrollDepth: 60, avgTimeOnPage: 45 },
    { url: '/careers', views: 9500, bounceRate: 30, rageClicks: 0, scrollDepth: 80, avgTimeOnPage: 150 },
    { url: '/login', views: 85000, bounceRate: 15, rageClicks: 55, scrollDepth: 100, avgTimeOnPage: 40 },
    { url: '/signup', views: 42000, bounceRate: 60, rageClicks: 28, scrollDepth: 50, avgTimeOnPage: 35 },
    { url: '/dashboard', views: 210000, bounceRate: 10, rageClicks: 8, scrollDepth: 95, avgTimeOnPage: 450 },
    { url: '/settings/profile', views: 15000, bounceRate: 20, rageClicks: 15, scrollDepth: 85, avgTimeOnPage: 60 },
    { url: '/forgot-password', views: 5000, bounceRate: 75, rageClicks: 22, scrollDepth: 40, avgTimeOnPage: 20 },
    { url: '/terms-of-service', views: 2000, bounceRate: 85, rageClicks: 0, scrollDepth: 10, avgTimeOnPage: 15 },
  ];

  for (let i = 0; i < 229; i++) {
    const isGood = Math.random() > 0.3;
    mockRawData.push({
      url: `/page/generated-content-${i + 1}`,
      views: Math.floor(Math.random() * 5000) + 100,
      bounceRate: isGood ? Math.floor(Math.random() * 40) : Math.floor(Math.random() * 60) + 40,
      rageClicks: isGood ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 30),
      scrollDepth: isGood ? Math.floor(Math.random() * 50) + 50 : Math.floor(Math.random() * 40) + 10,
      avgTimeOnPage: isGood ? Math.floor(Math.random() * 120) + 30 : Math.floor(Math.random() * 25) + 5,
    });
  }

  const processed = processAnalyticsData(mockRawData, false);
  return {
    ...processed,
    dataSource: {
      fileName: 'Sample Data',
      dataType: 'full-analytics',
      dataTypeLabel: 'Full Analytics',
      identifierLabel: 'Page',
      countLabel: 'Views',
      summary: generateSummary(processed.pages, 'Page', 'Views', false),
      uploadedAt: new Date(),
    },
  };
}
