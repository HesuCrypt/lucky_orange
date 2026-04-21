import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { ImportMeta } from '../types';

interface ImportIssuesPanelProps {
  meta: ImportMeta;
}

export function ImportIssuesPanel({ meta }: ImportIssuesPanelProps) {
  const [open, setOpen] = useState(true);
  const showRows = meta.rowIssues.slice(0, 25);
  const more = meta.rowIssues.length - showRows.length;

  return (
    <div
      className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 print:hidden"
      role="region"
      aria-labelledby="import-issues-title"
    >
      <button
        type="button"
        id="import-issues-title"
        className="flex w-full items-center justify-between gap-3 p-4 text-left text-amber-100"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
          <span className="font-medium">Import validation</span>
          <span className="text-sm text-amber-200/80">
            {meta.warnings.length} warning(s), {meta.rowIssues.length} row note(s)
          </span>
        </div>
        {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      {open && (
        <div className="border-t border-amber-500/20 px-4 pb-4">
          {meta.warnings.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-100/90">
              {meta.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
          {showRows.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-lo-border bg-lo-bg/50">
              <table className="w-full text-left text-sm text-lo-muted">
                <caption className="sr-only">Rows with validation messages</caption>
                <thead>
                  <tr className="border-b border-lo-border text-lo-text">
                    <th scope="col" className="px-3 py-2 font-medium">
                      Row
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Issue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {showRows.map((r, i) => (
                    <tr key={i} className="border-b border-lo-border/60">
                      <td className="px-3 py-2 font-mono text-lo-accent">{r.rowNumber}</td>
                      <td className="px-3 py-2">{r.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {more > 0 && (
            <p className="mt-2 text-xs text-amber-200/70">… and {more} more (see your CSV source file)</p>
          )}
        </div>
      )}
    </div>
  );
}
