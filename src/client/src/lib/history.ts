import type { HistoryEntry, NavTool } from "@shared/types";

const STORAGE_KEY = "netmonitor_history";
const MAX_ENTRIES = 100;

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistory(tool: NavTool, target: string, result: unknown): void {
  const entries = getHistory();
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    tool,
    target,
    result,
    createdAt: new Date().toISOString(),
  };
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function deleteHistory(id: string): void {
  const entries = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
