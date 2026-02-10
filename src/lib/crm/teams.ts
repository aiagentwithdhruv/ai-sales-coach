import { createClient } from "@supabase/supabase-js";
import type { Team, TeamMember, TeamCreateInput, TeamStats } from "@/types/teams";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ---------- Auth helper (reuse pattern) ----------

export async function authenticateUser(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 } as const;
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = getAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { error: "Invalid token", status: 401 } as const;
  return { userId: user.id, email: user.email || "" } as const;
}

// ---------- Team CRUD ----------

export async function createTeam(userId: string, input: TeamCreateInput): Promise<Team | null> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("teams")
    .insert({ owner_id: userId, name: input.name, description: input.description || null })
    .select()
    .single();
  if (error || !data) return null;

  // Add owner as team member
  await supabase.from("team_members").insert({
    team_id: data.id,
    user_id: userId,
    role: "owner",
    display_name: input.name.split(" ")[0] || "Owner",
  });

  return data;
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  const supabase = getAdmin();
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);

  if (!memberships || memberships.length === 0) return [];

  const teamIds = memberships.map((m) => m.team_id);
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .in("id", teamIds)
    .order("created_at", { ascending: false });

  return teams || [];
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const supabase = getAdmin();
  const { data } = await supabase.from("teams").select("*").eq("id", teamId).single();
  return data;
}

export async function deleteTeam(teamId: string, userId: string): Promise<boolean> {
  const supabase = getAdmin();
  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId)
    .eq("owner_id", userId);
  return !error;
}

// ---------- Team Members ----------

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .order("score", { ascending: false });
  return data || [];
}

export async function joinTeamByCode(userId: string, inviteCode: string, displayName: string): Promise<TeamMember | null> {
  const supabase = getAdmin();
  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("invite_code", inviteCode)
    .single();
  if (!team) return null;

  // Check already member
  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", team.id)
    .eq("user_id", userId)
    .single();
  if (existing) return null;

  const { data, error } = await supabase
    .from("team_members")
    .insert({
      team_id: team.id,
      user_id: userId,
      role: "member",
      display_name: displayName,
    })
    .select()
    .single();

  return error ? null : data;
}

export async function updateMemberScore(
  teamId: string,
  userId: string,
  updates: { score?: number; sessions_count?: number; streak?: number; badges?: string[]; last_active_at?: string }
): Promise<boolean> {
  const supabase = getAdmin();
  const { error } = await supabase
    .from("team_members")
    .update(updates)
    .eq("team_id", teamId)
    .eq("user_id", userId);
  return !error;
}

export async function removeMember(teamId: string, memberId: string): Promise<boolean> {
  const supabase = getAdmin();
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", memberId)
    .eq("team_id", teamId);
  return !error;
}

// ---------- Team Stats ----------

export async function getTeamStats(teamId: string): Promise<TeamStats> {
  const members = await getTeamMembers(teamId);
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const totalMembers = members.length;
  const avgScore = totalMembers > 0
    ? Math.round(members.reduce((s, m) => s + m.score, 0) / totalMembers)
    : 0;
  const totalSessions = members.reduce((s, m) => s + m.sessions_count, 0);
  const topPerformer = members.length > 0 ? members[0] : null;
  const activeToday = members.filter(
    (m) => m.last_active_at && m.last_active_at.startsWith(todayStr)
  ).length;

  return { totalMembers, avgScore, totalSessions, topPerformer, activeToday };
}

// ---------- Leaderboard ----------

export async function getLeaderboard(teamId: string, period: "week" | "month" | "all"): Promise<TeamMember[]> {
  // For now, return all members sorted by score
  // Period filtering would require score snapshots (future enhancement)
  return getTeamMembers(teamId);
}

// ---------- Check membership ----------

export async function isTeamMember(teamId: string, userId: string): Promise<boolean> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();
  return !!data;
}

export async function getMemberRole(teamId: string, userId: string): Promise<string | null> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();
  return data?.role || null;
}
