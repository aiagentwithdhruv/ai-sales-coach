/**
 * Custom Personas - localStorage-based persona management
 * Users can create their own prospect personas for practice sessions
 */

export interface CustomPersona {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  personality: string;
  difficulty: "easy" | "medium" | "hard";
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "sales-coach-personas";

export const INDUSTRIES = [
  "SaaS / Software",
  "Healthcare",
  "Financial Services",
  "Manufacturing",
  "Retail / E-Commerce",
  "Consulting",
  "Real Estate",
  "Education",
  "Media / Advertising",
  "Logistics / Supply Chain",
  "Energy",
  "Government",
  "Non-Profit",
  "Other",
];

export const PERSONALITY_TEMPLATES = [
  "Friendly and open to new ideas, asks lots of questions",
  "Analytical, needs data and ROI proof before deciding",
  "Busy executive, values efficiency, short attention span",
  "Skeptical, has been burned by vendors before",
  "Enthusiastic early adopter, loves technology",
  "Risk-averse, needs references and case studies",
  "Price-sensitive, always looking for discounts",
  "Protective gatekeeper, screens all calls for the boss",
  "Technical decision-maker, wants deep product details",
  "Consensus builder, needs buy-in from multiple stakeholders",
];

export function getCustomPersonas(): CustomPersona[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as CustomPersona[]).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  } catch {
    return [];
  }
}

export function getCustomPersona(id: string): CustomPersona | undefined {
  return getCustomPersonas().find((p) => p.id === id);
}

export function saveCustomPersona(
  persona: Omit<CustomPersona, "id" | "createdAt" | "updatedAt">
): CustomPersona {
  const all = getCustomPersonas();
  const newPersona: CustomPersona = {
    ...persona,
    id: `persona-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  all.unshift(newPersona);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return newPersona;
}

export function updateCustomPersona(
  id: string,
  updates: Partial<Omit<CustomPersona, "id" | "createdAt">>
): void {
  const all = getCustomPersonas();
  const idx = all.findIndex((p) => p.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}

export function deleteCustomPersona(id: string): void {
  const all = getCustomPersonas().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
