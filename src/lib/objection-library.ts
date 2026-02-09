/**
 * Objection Library - localStorage-based saved objections
 * Users can save AI-generated responses to objections for quick reference
 */

export interface SavedObjection {
  id: string;
  category: string;
  objection: string;
  response: string;
  model?: string;
  timestamp: number;
  isFavorite: boolean;
}

const STORAGE_KEY = "sales-coach-objections";

export const OBJECTION_CATEGORIES = [
  { id: "price", name: "Price & Budget", icon: "💰" },
  { id: "timing", name: "Timing", icon: "⏰" },
  { id: "authority", name: "Authority", icon: "👤" },
  { id: "need", name: "Need & Value", icon: "🎯" },
  { id: "trust", name: "Trust & Risk", icon: "🛡️" },
  { id: "competitor", name: "Competitor", icon: "⚔️" },
  { id: "contract", name: "Contract & Legal", icon: "📋" },
  { id: "custom", name: "Custom", icon: "✏️" },
];

export function getSavedObjections(): SavedObjection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedObjection[];
  } catch {
    return [];
  }
}

export function saveObjection(
  objection: Omit<SavedObjection, "id" | "timestamp" | "isFavorite">
): SavedObjection {
  const all = getSavedObjections();
  const newObj: SavedObjection = {
    ...objection,
    id: `obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    isFavorite: false,
  };
  all.unshift(newObj);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
  return newObj;
}

export function toggleFavorite(id: string): void {
  const all = getSavedObjections();
  const idx = all.findIndex((o) => o.id === id);
  if (idx !== -1) {
    all[idx].isFavorite = !all[idx].isFavorite;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}

export function deleteObjection(id: string): void {
  const all = getSavedObjections().filter((o) => o.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearObjections(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
