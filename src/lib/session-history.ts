/**
 * Session History - localStorage-based session persistence
 *
 * Stores coaching sessions, practice transcripts, call analyses,
 * and tool outputs for users to revisit and learn from.
 *
 * Can be migrated to Supabase later for cloud sync.
 */

export interface Session {
  id: string;
  type: "coach" | "practice" | "call" | "tool";
  toolType?: string;
  title: string;
  input: string;
  output: string;
  model?: string;
  timestamp: number;
  score?: number;
}

const STORAGE_KEY = "sales-coach-sessions";
const MAX_SESSIONS = 200;

/**
 * Get all saved sessions, newest first
 */
export function getSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const sessions: Session[] = JSON.parse(raw);
    return sessions.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

/**
 * Get sessions filtered by type
 */
export function getSessionsByType(type: Session["type"]): Session[] {
  return getSessions().filter((s) => s.type === type);
}

/**
 * Get a single session by ID
 */
export function getSession(id: string): Session | undefined {
  return getSessions().find((s) => s.id === id);
}

/**
 * Save a new session
 */
export function saveSession(session: Omit<Session, "id" | "timestamp">): Session {
  const sessions = getSessions();
  const newSession: Session = {
    ...session,
    id: generateId(),
    timestamp: Date.now(),
  };

  sessions.unshift(newSession);

  // Cap at MAX_SESSIONS
  if (sessions.length > MAX_SESSIONS) {
    sessions.length = MAX_SESSIONS;
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }

  return newSession;
}

/**
 * Delete a session by ID
 */
export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }
}

/**
 * Clear all sessions
 */
export function clearSessions(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Get session stats
 */
export function getSessionStats() {
  const sessions = getSessions();
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const thisWeek = sessions.filter((s) => s.timestamp > oneWeekAgo);
  const thisMonth = sessions.filter((s) => s.timestamp > oneMonthAgo);

  return {
    total: sessions.length,
    thisWeek: thisWeek.length,
    thisMonth: thisMonth.length,
    byType: {
      coach: sessions.filter((s) => s.type === "coach").length,
      practice: sessions.filter((s) => s.type === "practice").length,
      call: sessions.filter((s) => s.type === "call").length,
      tool: sessions.filter((s) => s.type === "tool").length,
    },
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
