import { DashboardData } from '../types';

/** Rule-based bullets so the dashboard is understandable without an API. */
export function buildPlainInsights(data: DashboardData): string[] {
  const id = data.dataSource?.identifierLabel || 'Page';
  const count = data.dataSource?.countLabel || 'views';
  const bullets: string[] = [];

  if (data.isLimitedData) {
    bullets.push(
      `This file is treated as a simple list: each row is one ${id.toLowerCase()} with a ${count.toLowerCase()} total.`,
    );
    bullets.push(
      'We are not scoring health because the export does not include frustration signals such as rage clicks or bounce rate.',
    );
    const top = data.pages[0];
    if (top) {
      bullets.push(
        `The busiest ${id.toLowerCase()} is “${top.url}” with ${new Intl.NumberFormat('en-US').format(top.views)} ${count.toLowerCase()}.`,
      );
    }
    return bullets;
  }

  bullets.push(
    `Overall health is ${data.overallHealth} out of 100, averaged across ${data.pages.length} ${id.toLowerCase()}s with full metrics.`,
  );
  bullets.push(
    `${data.criticalPagesCount} ${id.toLowerCase()}${data.criticalPagesCount === 1 ? '' : 's'} scored below 50 and appear in the alert strip and as “critical” in the table.`,
  );
  bullets.push(
    `Together these ${id.toLowerCase()}s recorded ${new Intl.NumberFormat('en-US').format(data.totalViews)} ${count.toLowerCase()}.`,
  );

  const redPct = Math.round((data.pages.filter((p) => p.status === 'Red').length / data.pages.length) * 100);
  const yellowPct = Math.round((data.pages.filter((p) => p.status === 'Yellow').length / data.pages.length) * 100);
  const greenPct = Math.round((data.pages.filter((p) => p.status === 'Green').length / data.pages.length) * 100);
  bullets.push(
    `Rough mix: about ${greenPct}% healthy, ${yellowPct}% warning, ${redPct}% critical (by row count, not weighted by traffic).`,
  );

  // Inject Shopify Category Intelligence
  if (data.categories && data.categories.length > 0) {
    const topCat = data.categories[0];
    bullets.push(`The top Shopify category by traffic is '${topCat.name}' with ${topCat.views} views and an average bounce rate of ${topCat.avgBounceRate}%.`);
    const worstCat = [...data.categories].sort((a, b) => b.avgBounceRate - a.avgBounceRate)[0];
    if (worstCat && worstCat.name !== topCat.name) {
      bullets.push(`The Shopify category with the highest friction is '${worstCat.name}' with a ${worstCat.avgBounceRate}% bounce rate across ${worstCat.pageCount} pages.`);
    }
  }

  // Inject Friction Hotspots
  const pagesWithFriction = data.pages
    .filter(p => p.friction)
    .map(p => ({
      url: p.url,
      totalFriction: (p.friction?.rageClicks || 0) + (p.friction?.deadClicks || 0) + (p.friction?.shakyMouse || 0)
    }))
    .sort((a, b) => b.totalFriction - a.totalFriction)
    .slice(0, 3);
  
  if (pagesWithFriction.length > 0 && pagesWithFriction[0].totalFriction > 0) {
    bullets.push(`Top 3 pages with the highest UX friction (Rage Clicks, Dead Clicks, Shaky Mouse): ${pagesWithFriction.map(p => p.url).join(', ')}.`);
  }

  // Inject Funnel Integrity
  if (data.executiveAudit) {
    bullets.push(`Executive Audit - Navigation Clarity Score: ${data.executiveAudit.navigationClarity}/100.`);
    bullets.push(`Executive Audit - Form Input Efficiency: ${data.executiveAudit.inputEfficiency} seconds average.`);
    const existingFunnel = data.executiveAudit.funnelExisting;
    const existingPurchase = existingFunnel.find(f => f.step.toLowerCase() === 'purchase');
    if (existingPurchase) {
       bullets.push(`Existing Customer Funnel: Dropoff at the final Purchase step is ${existingPurchase.dropoff}%.`);
    }
    const newFunnel = data.executiveAudit.funnelNew;
    const newSignup = newFunnel.find(f => f.step.toLowerCase().includes('signup'));
    if (newSignup) {
       bullets.push(`New Customer Funnel: Dropoff at the Signup step is ${newSignup.dropoff}%.`);
    }
  }

  // Inject Sales Intelligence
  if (data.ordersData) {
    const o = data.ordersData;
    bullets.push(`Sales Intelligence: Total Revenue is PHP ${o.totalRevenue.toLocaleString()} with an Average Order Value of PHP ${o.averageOrderValue.toLocaleString()}.`);
    if (o.retentionMetrics) {
      bullets.push(`Customer Retention: Repeat Customer Rate is ${o.retentionMetrics.repeatCustomerRate.toFixed(1)}%. We have ${o.retentionMetrics.loyalCustomerCount} loyal shoppers.`);
    }
    if (o.financialStatus) {
      bullets.push(`Order Pulse: ${o.financialStatus.paid} orders are Paid, while ${o.financialStatus.refunded} have been Refunded.`);
    }
  }

  // Inject Linked Revenue Leaks
  if (data.linkedInsights && data.linkedInsights.length > 0) {
    const topLeak = data.linkedInsights[0];
    bullets.push(`Revenue-at-Risk: The product '${topLeak.productName}' has PHP ${topLeak.revenue.toLocaleString()} in revenue but shows a ${topLeak.bounceRate}% bounce rate and ${topLeak.frictionScore} friction events.`);
  }

  return bullets;
}

export function buildReviewSummary(data: DashboardData): string {
  const id = data.dataSource?.identifierLabel || 'page';
  if (data.isLimitedData) {
    return `This export is count-focused. You can compare traffic leaders confidently, while behavioral quality remains unknown until richer columns are added.`;
  }
  const critical = data.criticalPagesCount;
  const healthTone = data.overallHealth >= 80 ? 'strong' : data.overallHealth >= 60 ? 'mixed' : 'at risk';
  return `Overall performance is ${healthTone}: health ${data.overallHealth}/100 with ${critical} critical ${id}${critical === 1 ? '' : 's'}. Prioritize critical fixes before growth work.`;
}
