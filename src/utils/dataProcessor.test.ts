import { describe, it, expect } from 'vitest';
import {
  calculateHealthScore,
  processAnalyticsData,
  parseNumeric,
  parseNumericReport,
  parseCSV,
} from './dataProcessor';
import type { RawPageData } from '../types';

describe('parseNumeric / parseNumericReport', () => {
  it('parses plain numbers and strips units', () => {
    expect(parseNumeric('42')).toBe(42);
    expect(parseNumeric('1,250')).toBe(1250);
    expect(parseNumeric('85%')).toBe(85);
    expect(parseNumeric('')).toBe(0);
  });

  it('reports invalid non-empty strings', () => {
    const r = parseNumericReport('not-a-number');
    expect(r.value).toBe(0);
    expect(r.invalidText).toBeDefined();
  });

  it('treats empty as zero without invalid', () => {
    const r = parseNumericReport('');
    expect(r.value).toBe(0);
    expect(r.invalidText).toBeUndefined();
  });
});

describe('calculateHealthScore', () => {
  it('returns limited mode sentinel when isLimited', () => {
    const page: RawPageData = {
      url: '/x',
      views: 100,
      bounceRate: 99,
      rageClicks: 100,
      scrollDepth: 0,
      avgTimeOnPage: 0,
    };
    const r = calculateHealthScore(page, true);
    expect(r.score).toBe(-1);
    expect(r.status).toBe('Green');
  });

  it('marks severe issues as Red with explanation', () => {
    const page: RawPageData = {
      url: '/bad',
      views: 1000,
      bounceRate: 90,
      rageClicks: 50,
      scrollDepth: 10,
      avgTimeOnPage: 5,
    };
    const r = calculateHealthScore(page, false);
    expect(r.status).toBe('Red');
    expect(r.explanation).toBeDefined();
    expect(r.score).toBeLessThan(50);
  });

  it('marks healthy traffic as Green', () => {
    const page: RawPageData = {
      url: '/good',
      views: 1000,
      bounceRate: 30,
      rageClicks: 0,
      scrollDepth: 80,
      avgTimeOnPage: 120,
    };
    const r = calculateHealthScore(page, false);
    expect(r.status).toBe('Green');
    expect(r.score).toBeGreaterThanOrEqual(80);
  });
});

describe('processAnalyticsData', () => {
  it('computes aggregates', () => {
    const raw: RawPageData[] = [
      { url: '/a', views: 100, bounceRate: 30, rageClicks: 0, scrollDepth: 80, avgTimeOnPage: 60 },
      { url: '/b', views: 100, bounceRate: 90, rageClicks: 40, scrollDepth: 10, avgTimeOnPage: 5 },
    ];
    const d = processAnalyticsData(raw, false);
    expect(d.pages.length).toBe(2);
    expect(d.totalViews).toBe(200);
    expect(d.criticalPagesCount).toBeGreaterThanOrEqual(0);
  });
});

describe('parseCSV', () => {
  it('parses a minimal two-column export', async () => {
    const csv = 'URL,Pageviews\n/home,1000\n/pricing,500\n';
    const d = await parseCSV(csv, 'test.csv');
    expect(d.pages.length).toBe(2);
    expect(d.isLimitedData).toBe(true);
    expect(d.totalViews).toBe(1500);
  });
});
