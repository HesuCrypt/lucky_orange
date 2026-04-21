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
