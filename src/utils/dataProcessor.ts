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
  ShopifyCategory,
  CategoryData,
  OrderAnalytics,
  ProductSales,
} from '../types';

function getShopifyCategory(url: string): ShopifyCategory {
  if (!url || url === '/' || url === '/home') return 'Home';
  if (url.includes('/products/')) return 'Products';
  if (url.includes('/collections/')) return 'Collections';
  if (url.includes('/search')) return 'Search';
  if (url.includes('/pages/')) return 'Pages';
  if (url.includes('/account/') || url === '/account') return 'Account';
  if (url.includes('/cart')) return 'Cart';
  return 'Other';
}

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
    
    // Mock advanced data
    const desktop = Math.floor(Math.random() * 60) + 20; // 20-80%
    const mobile = Math.floor(Math.random() * (100 - desktop));
    const tablet = 100 - desktop - mobile;
    
    // Random trend between -15 and +15
    const trend = Number((Math.random() * 30 - 15).toFixed(1));

    const friction = {
      deadClicks: Math.floor(Math.random() * 50),
      rageClicks: page.rageClicks,
      shakyMouse: Math.floor(Math.random() * 100),
      repeatedField: Math.floor(Math.random() * 20),
    };
    
    return {
      ...page,
      id: `page-${index}-${Date.now()}`,
      healthScore: score,
      status,
      explanation,
      actionItem,
      trend,
      devices: { desktop, mobile, tablet },
      recordingUrl: `https://app.luckyorange.com/v2/recordings?search=${encodeURIComponent(page.url)}`,
      heatmapUrl: `https://app.luckyorange.com/v2/heatmaps?url=${encodeURIComponent(page.url)}`,
      shopifyCategory: getShopifyCategory(page.url),
      friction,
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

  const categoryMap: Record<ShopifyCategory, { views: number; totalBounce: number; count: number }> = {
    Home: { views: 0, totalBounce: 0, count: 0 },
    Collections: { views: 0, totalBounce: 0, count: 0 },
    Products: { views: 0, totalBounce: 0, count: 0 },
    Search: { views: 0, totalBounce: 0, count: 0 },
    Pages: { views: 0, totalBounce: 0, count: 0 },
    Account: { views: 0, totalBounce: 0, count: 0 },
    Cart: { views: 0, totalBounce: 0, count: 0 },
    Other: { views: 0, totalBounce: 0, count: 0 },
  };

  pages.forEach(p => {
    const cat = p.shopifyCategory || 'Other';
    categoryMap[cat].views += p.views;
    categoryMap[cat].totalBounce += p.bounceRate;
    categoryMap[cat].count += 1;
  });

  const categories: CategoryData[] = (Object.keys(categoryMap) as ShopifyCategory[])
    .map(name => ({
      name,
      views: categoryMap[name].views,
      avgBounceRate: categoryMap[name].count > 0 ? Math.round(categoryMap[name].totalBounce / categoryMap[name].count) : 0,
      pageCount: categoryMap[name].count,
    }))
    .filter(c => c.pageCount > 0)
    .sort((a, b) => b.views - a.views);

  const totalDeadClicks = pages.reduce((acc, p) => acc + (p.friction?.deadClicks || 0), 0);
  const totalRageClicks = pages.reduce((acc, p) => acc + (p.friction?.rageClicks || 0), 0);
  const sessionDurationAvg = Math.round(pages.reduce((acc, p) => acc + p.avgTimeOnPage, 0) / (pages.length || 1));

  const executiveAudit = {
    navigationClarity: isLimited ? 0 : Math.floor(Math.random() * 40) + 50, // 50-90
    inputEfficiency: Math.floor(Math.random() * 60) + 15, // 15-75 seconds
    sessionDurationAvg,
    frictionPulse: totalDeadClicks + totalRageClicks,
    funnelExisting: [
      { step: 'Landing Page', users: totalViews, dropoff: 0 },
      { step: 'Product Page', users: Math.round(totalViews * 0.7), dropoff: 30 },
      { step: 'Cart', users: Math.round(totalViews * 0.3), dropoff: 57 },
      { step: 'Checkout', users: Math.round(totalViews * 0.15), dropoff: 50 },
      { step: 'Purchase', users: Math.round(totalViews * 0.05), dropoff: 66 },
    ],
    funnelNew: [
      { step: 'Landing Page', users: totalViews, dropoff: 0 },
      { step: 'Signup Page', users: Math.round(totalViews * 0.4), dropoff: 60 },
      { step: 'Input Details', users: Math.round(totalViews * 0.2), dropoff: 50 },
      { step: 'Product Page', users: Math.round(totalViews * 0.1), dropoff: 50 },
      { step: 'Purchase', users: Math.round(totalViews * 0.02), dropoff: 80 },
    ]
  };

  return {
    overallHealth,
    totalViews,
    criticalPagesCount,
    pages,
    topCriticalPages,
    isLimitedData: isLimited,
    activeUsers: Math.floor(Math.random() * 500) + 50, // Mock real-time pulse
    periodComparison: 'vs last 7 days',
    viewsTrend: Number((Math.random() * 20 - 5).toFixed(1)), // -5% to +15%
    categories,
    executiveAudit,
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
  'Lineitem name', 'Product Title', 'Product',
];

// All known aliases for the count/views column
const COUNT_ALIASES = [
  'Pageviews', 'Views', 'Visits', 'Sessions', 'Page Views', 'Hits', 'Count',
  'Submissions', 'Clicks', 'Interactions', 'Events', 'Total', 'Net Sales', 'Lineitem quantity',
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

  if (id.includes('lineitem') || id.includes('product') || cnt.includes('total') || cnt.includes('sales')) {
    return { dataType: 'shopify-orders' as DataType, dataTypeLabel: 'Orders & Sales', identifierLabel: 'Product', countLabel: 'Sales' };
  }
  if (id.includes('form') || id.includes('selector') || id.includes('element') || cnt.includes('submission')) {
    return { dataType: 'form-analytics' as DataType, dataTypeLabel: 'Form Analytics', identifierLabel: 'Form', countLabel: 'Submissions' };
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
          let { identifierCol, countCol } = detectColumns(headers, firstRow);

          console.log('[CSV Parser] Detected headers:', headers);
          console.log('[CSV Parser] Identifier column:', identifierCol, '| Count column:', countCol);

          if (!identifierCol && !countCol) {
            // Check if it's a Shopify Orders export without standard headers
            if (headers.includes('Lineitem name') && headers.includes('Lineitem price')) {
              identifierCol = 'Lineitem name';
              countCol = 'Lineitem quantity';
            } else {
              reject(new Error(`Could not detect data columns. Found headers: ${headers.join(', ')}`));
              return;
            }
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
                _rawRow: row, // Keep raw row for order processing
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

          const { dataType, dataTypeLabel, identifierLabel, countLabel } = preDetected;

          // Process Orders if it's a sales export
          let ordersData: any = undefined;
          if (dataType === 'shopify-orders') {
            const productMap = new Map<string, any>();
            let orderVolume = new Set();
            let totalRevenue = 0;
            let discountImpact = 0;
            const geoMap: Record<string, number> = {};
            const customerMap: Record<string, number> = {};
            const financialStats = { paid: 0, refunded: 0, pending: 0, cancelled: 0 };
            
            let lastOrderName = '';
            let lastStatus = '';

            rawData.forEach(r => {
              const row = (r as any)._rawRow;
              const currentOrderName = String(row['Name'] || row['Id'] || '').trim();
              
              // Financial Status Pulse - Handle 'fill-down' for multi-line orders
              let status = (row['Financial Status'] || '').toLowerCase().trim();
              
              if (currentOrderName && currentOrderName === lastOrderName && !status) {
                status = lastStatus; // Use the status from the first line of this order
              } else if (status) {
                lastStatus = status;
                lastOrderName = currentOrderName;
                
                // Only count the order status once per unique order ID for the breakdown stats
                if (status === 'paid') financialStats.paid++;
                else if (status.includes('refund')) financialStats.refunded++;
                else if (status === 'pending') financialStats.pending++;
                else if (status === 'voided' || status === 'cancelled') financialStats.cancelled++;
              }

              // Include both paid and pending (COD) for revenue calculation
              if (status !== 'paid' && status !== 'pending' && status !== 'partially_paid') return; 

              const pName = row['Lineitem name'] || row['Product Title'] || r.url;
              const pSku = row['Lineitem sku'] || row['SKU'] || 'N/A';
              const pQty = parseNumeric(row['Lineitem quantity'] || row['Quantity'] || row['Net Quantity'] || r.views);
              const pPrice = parseNumeric(row['Lineitem price'] || row['Price'] || row['Gross Sales'] || 0);
              const pDiscount = parseNumeric(row['Lineitem discount'] || 0);
              
              const pRevenue = (pQty * pPrice) - pDiscount;

              if (currentOrderName) {
                orderVolume.add(currentOrderName);
              }
              
              // Customer Retention
              const customerEmail = row['Email'] || row['Customer Email'] || row['Billing Name'];
              if (customerEmail) {
                customerMap[customerEmail] = (customerMap[customerEmail] || 0) + 1;
              }

              totalRevenue += pRevenue;
              discountImpact += pDiscount;

              const country = row['Billing Country'] || row['Country'] || 'Unknown';
              if (country !== 'Unknown') {
                geoMap[country] = (geoMap[country] || 0) + 1;
              }

              if (pName && pName !== 'Unknown') {
                const existing = productMap.get(pName) || { id: pName, name: pName, sku: pSku, quantity: 0, revenue: 0 };
                existing.quantity += pQty;
                existing.revenue += pRevenue;
                productMap.set(pName, existing);
              }
            });

            const uniqueCustomers = Object.keys(customerMap).length;
            const repeatCustomers = Object.values(customerMap).filter(v => v > 1).length;

            ordersData = {
              topProducts: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue),
              orderVolume: orderVolume.size || rawData.length,
              totalRevenue,
              averageOrderValue: orderVolume.size ? totalRevenue / orderVolume.size : 0,
              geoDistribution: Object.entries(geoMap).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count),
              discountImpact,
              retentionMetrics: {
                totalUniqueCustomers: uniqueCustomers,
                loyalCustomerCount: repeatCustomers,
                repeatCustomerRate: uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0
              },
              financialStatus: financialStats
            };
          }

          const processed = processAnalyticsData(rawData.map(r => {
            const { _rawRow, ...rest } = r as any;
            return rest;
          }), isLimited);

          // Cross-Functional Linking (Missing Link)
          let linkedInsights: any[] = [];
          if (ordersData && processed.pages.length > 0) {
            ordersData.topProducts.slice(0, 50).forEach(product => {
              if (!product.name || typeof product.name !== 'string') return;
              
              const productNameLower = product.name.toLowerCase();
              const productSlug = productNameLower.replace(/\s+/g, '-');
              
              const matchedPage = processed.pages.find(p => {
                if (!p.url) return false;
                const urlLower = p.url.toLowerCase();
                return urlLower.includes(productSlug) || 
                       productNameLower.includes(urlLower.split('/').pop()?.replace(/-/g, ' ') || '___');
              });
              
              if (matchedPage) {
                linkedInsights.push({
                  productName: product.name,
                  url: matchedPage.url,
                  revenue: product.revenue,
                  views: matchedPage.views,
                  bounceRate: matchedPage.bounceRate,
                  frictionScore: (matchedPage.friction?.deadClicks || 0) + (matchedPage.friction?.rageClicks || 0),
                  conversionRate: matchedPage.views > 0 ? (product.quantity / matchedPage.views) * 100 : 0
                });
              }
            });
          }
          
          if (dataType === 'shopify-orders') {
            processed.totalViews = ordersData.orderVolume;
            processed.overallHealth = 100;
          }

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

          resolve({ ...processed, dataSource, importMeta, ordersData, linkedInsights });
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

export function mergeDashboardData(datasets: DashboardData[]): DashboardData {
  if (datasets.length === 0) throw new Error("No data to merge");
  if (datasets.length === 1) return datasets[0];

  // Separate behavioral pages from order-based "pages"
  const behavioralDatasets = datasets.filter(d => d.dataSource?.dataType !== 'shopify-orders');
  const orderDatasets = datasets.filter(d => d.ordersData !== undefined);

  // If we only have orders, the "pages" list should be empty to avoid confusion in heatmap tabs
  const allPages = behavioralDatasets.flatMap(d => d.pages).sort((a, b) => b.views - a.views);
  
  const totalViews = allPages.length > 0 
    ? allPages.reduce((acc, p) => acc + p.views, 0)
    : orderDatasets.reduce((acc, d) => acc + (d.ordersData?.orderVolume || 0), 0);

  const criticalPagesCount = allPages.filter(p => p.status === 'Red').length;
  const topCriticalPages = allPages.filter(p => p.status === 'Red').sort((a, b) => a.healthScore - b.healthScore).slice(0, 10);
  const isLimitedData = behavioralDatasets.length > 0 ? behavioralDatasets.some(d => d.isLimitedData) : true;
  const overallHealth = allPages.length > 0 
    ? Math.round(allPages.reduce((acc, p) => acc + p.healthScore, 0) / (allPages.length || 1))
    : -1;

  // Merge ordersData if present
  let mergedOrders: OrderAnalytics | undefined = undefined;
  if (orderDatasets.length > 0) {
    const productMap = new Map<string, ProductSales>();
    let orderVolume = 0;
    let totalRevenue = 0;
    let discountImpact = 0;
    const geoMap: Record<string, number> = {};

    orderDatasets.forEach(d => {
      const o = d.ordersData!;
      orderVolume += o.orderVolume;
      totalRevenue += o.totalRevenue;
      discountImpact += o.discountImpact;
      
      o.topProducts.forEach(p => {
        const existing = productMap.get(p.name) || { ...p, quantity: 0, revenue: 0 };
        existing.quantity += p.quantity;
        existing.revenue += p.revenue;
        productMap.set(p.name, existing);
      });

      o.geoDistribution.forEach(g => {
        geoMap[g.country] = (geoMap[g.country] || 0) + g.count;
      });
    });

    mergedOrders = {
      topProducts: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue),
      orderVolume,
      totalRevenue,
      averageOrderValue: orderVolume > 0 ? totalRevenue / orderVolume : 0,
      geoDistribution: Object.entries(geoMap).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count),
      discountImpact,
    };
  }

  // Merge categories (only from behavioral data)
  const categoryMap: Record<string, { views: number; totalBounce: number; count: number }> = {};
  allPages.forEach(p => {
    const cat = p.shopifyCategory || 'Other';
    if (!categoryMap[cat]) categoryMap[cat] = { views: 0, totalBounce: 0, count: 0 };
    categoryMap[cat].views += p.views;
    categoryMap[cat].totalBounce += p.bounceRate;
    categoryMap[cat].count += 1;
  });

  const categories = Object.keys(categoryMap).map(name => ({
    name: name as any,
    views: categoryMap[name].views,
    avgBounceRate: categoryMap[name].count > 0 ? Math.round(categoryMap[name].totalBounce / categoryMap[name].count) : 0,
    pageCount: categoryMap[name].count,
  })).sort((a, b) => b.views - a.views);

  const mergedDataSource = {
    ...datasets[0].dataSource!,
    fileName: datasets.map(d => d.dataSource?.fileName).filter(Boolean).join(', '),
    summary: datasets.length > 1 
      ? `Merged data from ${datasets.length} files. ${allPages.length} pages and ${mergedOrders?.orderVolume || 0} orders found.`
      : datasets[0].dataSource?.summary || '',
  };

  const importMetaWarnings = datasets.flatMap(d => d.importMeta?.warnings || []);
  const importMetaRowIssues = datasets.flatMap(d => d.importMeta?.rowIssues || []);
  const importMeta = importMetaWarnings.length > 0 || importMetaRowIssues.length > 0 
    ? { warnings: importMetaWarnings, rowIssues: importMetaRowIssues.slice(0, 120) } 
    : undefined;

  return {
    ...datasets[0],
    overallHealth,
    totalViews,
    criticalPagesCount,
    pages: allPages,
    topCriticalPages,
    isLimitedData,
    dataSource: mergedDataSource,
    importMeta,
    categories,
    executiveAudit: behavioralDatasets.length > 0 ? behavioralDatasets[0].executiveAudit : undefined,
    ordersData: mergedOrders,
    linkedInsights: datasets.flatMap(d => d.linkedInsights || []).sort((a, b) => b.revenue - a.revenue),
  };
}
