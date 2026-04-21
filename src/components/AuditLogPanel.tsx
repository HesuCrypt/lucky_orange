import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp } from 'lucide-react';
import { readAuditLog, type AuditEntry } from '../lib/auditLog';

function formatAction(e: AuditEntry): string {
  switch (e.action) {
    case 'upload':
      return 'Upload';
    case 'reset':
      return 'Reset';
    case 'export_print':
      return 'Print / PDF';
    case 'cache_restore':
      return 'Restore cache';
    default:
      return e.action;
  }
}

export function AuditLogPanel() {
  const [open, setOpen] = useState(false);
  const entries = readAuditLog().slice(0, 40);

  if (entries.length === 0) return null;

  return (
    <div
      className="mt-10 rounded-xl border border-lo-border bg-lo-panel print:hidden"
      role="region"
      aria-labelledby="audit-log-title"
    >
      <button
        type="button"
        id="audit-log-title"
        className="flex w-full items-center justify-between gap-3 p-4 text-left text-lo-text"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 shrink-0 text-lo-muted" aria-hidden />
          <span className="font-medium">Activity log</span>
          <span className="text-sm text-lo-muted">({entries.length} recent)</span>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-lo-muted" /> : <ChevronDown className="h-5 w-5 text-lo-muted" />}
      </button>
      {open && (
        <ul className="max-h-64 space-y-2 overflow-y-auto border-t border-lo-border px-4 py-3 text-sm custom-scrollbar">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-col gap-0.5 border-b border-lo-border/50 pb-2 last:border-0">
              <span className="text-xs text-lo-muted">{new Date(e.at).toLocaleString()}</span>
              <span className="text-lo-text">
                <span className="font-medium text-lo-accent">{formatAction(e)}</span>
                {' — '}
                {e.detail}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
