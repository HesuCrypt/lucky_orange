const STORAGE_KEY = 'lo_audit_log_v1';
const MAX = 100;

export type AuditAction = 'upload' | 'reset' | 'export_print' | 'cache_restore';

export interface AuditEntry {
  id: string;
  at: string;
  action: AuditAction;
  detail: string;
}

function load(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AuditEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(entries: AuditEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    // quota
  }
}

export function appendAudit(action: AuditAction, detail: string) {
  const entry: AuditEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: new Date().toISOString(),
    action,
    detail,
  };
  const next = [entry, ...load()];
  save(next);
  return entry;
}

export function readAuditLog(): AuditEntry[] {
  return load();
}
