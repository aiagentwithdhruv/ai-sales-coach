/**
 * Pre-defined feature/improvement suggestions for the Vote tab.
 * Update this list to change what users can vote on.
 */

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: "feature" | "improvement";
}

export const SUGGESTIONS: Suggestion[] = [
  {
    id: "team-dashboard",
    title: "Team Dashboard",
    description: "See your whole team's coaching progress and scores in one place",
    category: "feature",
  },
  {
    id: "mobile-app",
    title: "Mobile App",
    description: "Practice sales pitches on the go from your phone",
    category: "feature",
  },
  {
    id: "crm-integrations",
    title: "CRM Integrations",
    description: "Sync with Salesforce, HubSpot, Pipedrive automatically",
    category: "feature",
  },
  {
    id: "custom-personas",
    title: "Custom AI Personas",
    description: "Create your own buyer personas for practice sessions",
    category: "improvement",
  },
  {
    id: "call-recording",
    title: "Live Call Recording",
    description: "Record real sales calls and get instant AI coaching",
    category: "feature",
  },
  {
    id: "email-templates",
    title: "AI Email Templates",
    description: "Generate follow-up emails based on call analysis",
    category: "feature",
  },
  {
    id: "leaderboard",
    title: "Sales Leaderboard",
    description: "Compete with teammates on coaching scores",
    category: "feature",
  },
  {
    id: "api-access",
    title: "API Access",
    description: "Integrate QuotaHit coaching into your own tools",
    category: "feature",
  },
];
