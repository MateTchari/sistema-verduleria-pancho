import type { CashSession } from "./types";

const CASH_SESSION_KEY = "verduleria-cash-session";
const CASH_SESSION_HISTORY_KEY = "verduleria-cash-session-history";

export function loadLocalCashSession(): CashSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CASH_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CashSession;
  } catch {
    return null;
  }
}

export function saveLocalCashSession(session: CashSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CASH_SESSION_KEY, JSON.stringify(session));
}

export function loadLocalCashSessionHistory(): CashSession[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CASH_SESSION_HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CashSession[];
  } catch {
    return [];
  }
}

export function saveLocalCashSessionHistory(history: CashSession[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CASH_SESSION_HISTORY_KEY, JSON.stringify(history));
}

export function appendLocalCashSessionHistory(session: CashSession): void {
  if (typeof window === "undefined") return;
  const history = loadLocalCashSessionHistory();
  const existingIndex = history.findIndex((entry) => entry.id === session.id);
  if (existingIndex >= 0) {
    history[existingIndex] = session;
  } else {
    history.push(session);
  }
  saveLocalCashSessionHistory(history);
}

export function defaultCashSession(): CashSession {
  return {
    id: "cash-demo",
    organizationId: "org-demo",
    branchId: "branch-main",
    status: "cerrada",
    openingAmount: 0,
    declaredAmount: 0,
    expectedAmount: 0,
    openedAt: new Date().toISOString(),
    closedAt: new Date().toISOString(),
  };
}
