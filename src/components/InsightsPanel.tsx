import React, { useState, useEffect } from 'react';
import { BookOpen, Languages, Sparkles, Loader2 } from 'lucide-react';
import { DashboardData } from '../types';
import { buildPlainInsights, buildReviewSummary } from '../lib/plainInsights';
import { explainDashboardWithMode, askDashboardQuestion, checkExplainApi } from '../lib/geminiExplain';
import { useLocale } from '../context/LocaleContext';

interface InsightsPanelProps {
  data: DashboardData;
}

export function InsightsPanel({ data }: InsightsPanelProps) {
  const { t, locale } = useLocale();
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [explainOk, setExplainOk] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const r = await fetch('/api/health');
        if (!r.ok) {
          setAiErr(`HTTP ${r.status}`);
          setExplainOk(false);
          return;
        }
        const j = await r.json();
        if (active) {
          setExplainOk(Boolean(j.gemini));
          setAiErr(j.gemini ? 'Ready' : 'Keys Missing on Server');
        }
      } catch (err) {
        if (active) {
          setAiErr('Network Error');
          setExplainOk(false);
        }
      }
    };

    // Initial check + periodic retry so UI recovers if API starts later.
    refresh();
    const id = window.setInterval(refresh, 5000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);

    return () => {
      active = false;
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    setAiText(null);
    setAiErr(null);
    setChatAnswer(null);
    setQuestion('');
  }, [locale, data.dataSource?.fileName, data.pages.length, data.overallHealth, data.isLimitedData]);

  const bullets = buildPlainInsights(data);
  const reviewSummary = buildReviewSummary(data);
  const aiLines = aiText
    ? aiText
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];
  const aiSummaryLine = aiLines.find((l) => /^summary\s*:/i.test(l)) ?? aiLines[0];
  const aiSummary = aiSummaryLine ? aiSummaryLine.replace(/^summary\s*:/i, '').trim() : '';
  const aiBullets = aiLines
    .filter((l) => l !== aiSummaryLine)
    .map((l) => l.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);

  const runAi = async (mode: 'quick' | 'detailed') => {
    setAiErr(null);
    setAiLoading(true);
    try {
      const text = await explainDashboardWithMode(data, locale, mode);
      setAiText(text);
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : t('aiError'));
      setAiText(null);
    } finally {
      setAiLoading(false);
    }
  };

  const runChat = async () => {
    if (!question.trim()) return;
    setAiErr(null);
    setChatLoading(true);
    try {
      const text = await askDashboardQuestion(data, locale, question.trim());
      setChatAnswer(text);
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : t('aiError'));
      setChatAnswer(null);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-lo-accent/10 via-transparent to-transparent p-8 md:p-10 border-b border-lo-border">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-lo-accent/20 flex items-center justify-center text-lo-accent shadow-lg shadow-lo-accent/10">
                <BookOpen className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none">{t('insightTitle')}</h3>
                <p className="text-sm text-lo-muted font-bold tracking-wide mt-2">{t('insightSubtitle')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => runAi('quick')}
                disabled={aiLoading || !explainOk}
                className="group flex items-center gap-2.5 rounded-xl bg-lo-accent px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all active:scale-95 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 group-hover:animate-pulse" />}
                {t('aiExplain')}
              </button>
              <button
                onClick={() => runAi('detailed')}
                disabled={aiLoading || !explainOk}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-lo-text hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
              >
                Detailed Report
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-10 space-y-12">
          {/* Executive Summary Card */}
          <div className="rounded-[2rem] bg-white/5 border border-white/5 p-8 relative overflow-hidden group">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-lo-accent/50" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-lo-accent mb-4 opacity-80">Executive Summary</h4>
            <p className="text-xl font-bold text-lo-text leading-relaxed tracking-tight">
              "{reviewSummary}"
            </p>
          </div>

          {/* Observations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-lo-muted px-1 whitespace-nowrap">Observations</h4>
                <div className="h-[1px] w-full bg-lo-border" />
              </div>
              <ul className="space-y-5">
                {(aiText ? aiBullets : bullets).map((b, i) => (
                  <li key={i} className="flex items-start gap-4 group">
                    <div className="mt-2 h-2 w-2 rounded-full bg-lo-accent group-hover:scale-125 transition-transform shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <span className="text-sm font-bold text-lo-muted leading-relaxed group-hover:text-lo-text transition-colors duration-300">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-lo-muted px-1 whitespace-nowrap">Intelligence Deep-Dive</h4>
                <div className="h-[1px] w-full bg-lo-border" />
              </div>
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center h-56 rounded-[2rem] border border-dashed border-lo-border animate-pulse bg-white/[0.02]">
                  <Loader2 className="h-10 w-10 text-lo-accent animate-spin mb-4" />
                  <p className="text-[10px] font-black text-lo-muted uppercase tracking-[0.2em]">Processing Analytics...</p>
                </div>
              ) : aiText ? (
                <div className="rounded-[2rem] bg-lo-accent/5 border border-lo-accent/10 p-8 relative">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="h-4 w-4 text-lo-accent" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lo-accent">AI Synthesis Complete</span>
                  </div>
                  <p className="text-sm font-bold text-lo-text leading-loose whitespace-pre-wrap">
                    {aiSummary || aiText}
                  </p>
                </div>
              ) : (
                <div className="rounded-[2rem] border-2 border-dashed border-lo-border/30 p-10 text-center flex flex-col items-center justify-center">
                  <Sparkles className="h-8 w-8 text-lo-muted/20 mb-4" />
                  <p className="text-sm text-lo-muted mb-6 font-bold leading-relaxed max-w-xs">
                    Synthesize your data to unlock behavioral patterns and conversion fixes.
                  </p>
                  {aiErr && (
                    <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                        API Check: {aiErr}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Chat Interaction */}
          <div className="pt-10 border-t border-lo-border">
            <div className="relative group max-w-3xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-lo-accent to-blue-600 rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition-opacity" />
              <div className="relative">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runChat()}
                  placeholder="Ask a specific intelligence query..."
                  className="w-full rounded-xl border border-lo-border bg-lo-bg-soft/80 py-5 pl-8 pr-32 text-sm font-bold text-white placeholder:text-lo-muted/50 focus:border-lo-accent/50 focus:outline-none focus:ring-0 transition-all backdrop-blur-sm"
                />
                <button
                  onClick={runChat}
                  disabled={chatLoading || !question.trim()}
                  className="absolute right-3 top-3 bottom-3 rounded-lg bg-lo-accent px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all disabled:opacity-50"
                >
                  {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Execute'}
                </button>
              </div>
            </div>

            {chatAnswer && (
              <div className="mt-8 max-w-3xl mx-auto rounded-[1.5rem] bg-lo-elevated/50 border border-lo-border p-8 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1.5 w-1.5 rounded-full bg-lo-accent shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lo-text">Intelligence Response</span>
                </div>
                <p className="text-sm font-bold text-lo-muted leading-loose whitespace-pre-wrap">
                  {chatAnswer}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
