/**
 * Achievements & Badges - Gamification system
 * Tracks user progress and awards badges based on activity
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "practice" | "coaching" | "tools" | "streak" | "milestone";
  requirement: number;
  unit: string;
}

export interface UserProgress {
  totalSessions: number;
  totalPractice: number;
  totalCoaching: number;
  totalCalls: number;
  totalTools: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  unlockedBadges: string[];
}

const PROGRESS_KEY = "sales-coach-progress";

export const ACHIEVEMENTS: Achievement[] = [
  // Practice milestones
  { id: "first-practice", name: "First Steps", description: "Complete your first practice session", icon: "🎯", category: "practice", requirement: 1, unit: "practice sessions" },
  { id: "practice-5", name: "Getting Warmed Up", description: "Complete 5 practice sessions", icon: "🔥", category: "practice", requirement: 5, unit: "practice sessions" },
  { id: "practice-25", name: "Practice Makes Perfect", description: "Complete 25 practice sessions", icon: "💪", category: "practice", requirement: 25, unit: "practice sessions" },
  { id: "practice-100", name: "Sales Machine", description: "Complete 100 practice sessions", icon: "🏆", category: "practice", requirement: 100, unit: "practice sessions" },

  // Coaching milestones
  { id: "first-coach", name: "Coachable", description: "Get your first coaching response", icon: "📚", category: "coaching", requirement: 1, unit: "coaching sessions" },
  { id: "coach-10", name: "Quick Learner", description: "Complete 10 coaching sessions", icon: "🧠", category: "coaching", requirement: 10, unit: "coaching sessions" },
  { id: "coach-50", name: "Objection Master", description: "Handle 50 objections", icon: "🛡️", category: "coaching", requirement: 50, unit: "coaching sessions" },

  // Tools milestones
  { id: "first-tool", name: "Tool Time", description: "Use a sales tool for the first time", icon: "🔧", category: "tools", requirement: 1, unit: "tool uses" },
  { id: "tools-10", name: "Swiss Army Knife", description: "Use sales tools 10 times", icon: "⚔️", category: "tools", requirement: 10, unit: "tool uses" },
  { id: "tools-50", name: "Arsenal Loaded", description: "Use sales tools 50 times", icon: "🚀", category: "tools", requirement: 50, unit: "tool uses" },

  // Call analysis
  { id: "first-call", name: "Call Reviewer", description: "Analyze your first call", icon: "📞", category: "milestone", requirement: 1, unit: "call analyses" },
  { id: "calls-10", name: "Call Analyst", description: "Analyze 10 calls", icon: "📊", category: "milestone", requirement: 10, unit: "call analyses" },

  // Streaks
  { id: "streak-3", name: "On a Roll", description: "Practice 3 days in a row", icon: "⚡", category: "streak", requirement: 3, unit: "day streak" },
  { id: "streak-7", name: "Week Warrior", description: "Practice 7 days in a row", icon: "🌟", category: "streak", requirement: 7, unit: "day streak" },
  { id: "streak-30", name: "Monthly Master", description: "Practice 30 days in a row", icon: "👑", category: "streak", requirement: 30, unit: "day streak" },

  // Overall milestones
  { id: "sessions-10", name: "Getting Started", description: "Complete 10 total sessions", icon: "🌱", category: "milestone", requirement: 10, unit: "total sessions" },
  { id: "sessions-50", name: "Dedicated Rep", description: "Complete 50 total sessions", icon: "💎", category: "milestone", requirement: 50, unit: "total sessions" },
  { id: "sessions-200", name: "Sales Legend", description: "Complete 200 total sessions", icon: "🏅", category: "milestone", requirement: 200, unit: "total sessions" },
];

export function getUserProgress(): UserProgress {
  if (typeof window === "undefined") {
    return getDefaultProgress();
  }
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return getDefaultProgress();
    return JSON.parse(raw) as UserProgress;
  } catch {
    return getDefaultProgress();
  }
}

function getDefaultProgress(): UserProgress {
  return {
    totalSessions: 0,
    totalPractice: 0,
    totalCoaching: 0,
    totalCalls: 0,
    totalTools: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: "",
    unlockedBadges: [],
  };
}

export function updateProgress(
  type: "practice" | "coach" | "call" | "tool"
): string[] {
  const progress = getUserProgress();
  const today = new Date().toISOString().split("T")[0];

  // Update counts
  progress.totalSessions++;
  if (type === "practice") progress.totalPractice++;
  if (type === "coach") progress.totalCoaching++;
  if (type === "call") progress.totalCalls++;
  if (type === "tool") progress.totalTools++;

  // Update streak
  if (progress.lastActiveDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (progress.lastActiveDate === yesterdayStr) {
      progress.currentStreak++;
    } else if (progress.lastActiveDate !== today) {
      progress.currentStreak = 1;
    }
    progress.lastActiveDate = today;
    if (progress.currentStreak > progress.longestStreak) {
      progress.longestStreak = progress.currentStreak;
    }
  }

  // Check for new badges
  const newBadges: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (progress.unlockedBadges.includes(achievement.id)) continue;

    let value = 0;
    switch (achievement.category) {
      case "practice":
        value = progress.totalPractice;
        break;
      case "coaching":
        value = progress.totalCoaching;
        break;
      case "tools":
        value = progress.totalTools;
        break;
      case "streak":
        value = progress.currentStreak;
        break;
      case "milestone":
        if (achievement.unit === "total sessions") value = progress.totalSessions;
        else if (achievement.unit === "call analyses") value = progress.totalCalls;
        break;
    }

    if (value >= achievement.requirement) {
      progress.unlockedBadges.push(achievement.id);
      newBadges.push(achievement.id);
    }
  }

  // Save
  if (typeof window !== "undefined") {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  return newBadges;
}

export function syncProgressFromSessions(): void {
  // Rebuild progress from session history (for existing users)
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("sales-coach-sessions");
    if (!raw) return;
    const sessions = JSON.parse(raw) as Array<{
      type: string;
      timestamp: number;
    }>;

    const progress = getDefaultProgress();
    progress.totalSessions = sessions.length;
    progress.totalPractice = sessions.filter(
      (s) => s.type === "practice"
    ).length;
    progress.totalCoaching = sessions.filter((s) => s.type === "coach").length;
    progress.totalCalls = sessions.filter((s) => s.type === "call").length;
    progress.totalTools = sessions.filter((s) => s.type === "tool").length;

    // Calculate streak from session dates
    const dates = [
      ...new Set(
        sessions.map((s) => new Date(s.timestamp).toISOString().split("T")[0])
      ),
    ].sort();
    if (dates.length > 0) {
      progress.lastActiveDate = dates[dates.length - 1];
      let streak = 1;
      let maxStreak = 1;
      for (let i = dates.length - 1; i > 0; i--) {
        const d1 = new Date(dates[i]);
        const d2 = new Date(dates[i - 1]);
        const diff = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          break;
        }
      }
      progress.currentStreak = streak;
      progress.longestStreak = maxStreak;
    }

    // Check badges
    for (const achievement of ACHIEVEMENTS) {
      let value = 0;
      switch (achievement.category) {
        case "practice":
          value = progress.totalPractice;
          break;
        case "coaching":
          value = progress.totalCoaching;
          break;
        case "tools":
          value = progress.totalTools;
          break;
        case "streak":
          value = progress.currentStreak;
          break;
        case "milestone":
          if (achievement.unit === "total sessions")
            value = progress.totalSessions;
          else if (achievement.unit === "call analyses")
            value = progress.totalCalls;
          break;
      }
      if (value >= achievement.requirement) {
        if (!progress.unlockedBadges.includes(achievement.id)) {
          progress.unlockedBadges.push(achievement.id);
        }
      }
    }

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Silently fail
  }
}
