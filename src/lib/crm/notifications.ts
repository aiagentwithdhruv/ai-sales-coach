import { createClient } from "@supabase/supabase-js";
import type {
  CRMNotification,
  NotificationType,
  NotificationSeverity,
  Contact,
} from "@/types/crm";

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  options: { unreadOnly?: boolean; limit?: number } = {}
): Promise<{ notifications: CRMNotification[]; unreadCount: number }> {
  const supabase = getSupabaseAdmin();
  const { unreadOnly = false, limit = 20 } = options;

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .eq("is_dismissed", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;

  // Get unread count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .eq("is_dismissed", false);

  if (error) {
    console.error("[CRM] getNotifications error:", error);
    return { notifications: [], unreadCount: 0 };
  }

  return {
    notifications: (data || []) as CRMNotification[],
    unreadCount: unreadCount || 0,
  };
}

/**
 * Create a notification
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  options: {
    description?: string;
    severity?: NotificationSeverity;
    contactId?: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<CRMNotification | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      contact_id: options.contactId || null,
      type,
      title,
      description: options.description || null,
      severity: options.severity || "info",
      action_url: options.actionUrl || null,
      metadata: options.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error("[CRM] createNotification error:", error);
    return null;
  }

  return data as CRMNotification;
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  return !error;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(
  userId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return !error;
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(
  userId: string,
  notificationId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("notifications")
    .update({ is_dismissed: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  return !error;
}

/**
 * Scan pipeline and generate smart notifications for stalled deals, overdue follow-ups, etc.
 */
export async function generateSmartNotifications(
  userId: string
): Promise<CRMNotification[]> {
  const supabase = getSupabaseAdmin();
  const generated: CRMNotification[] = [];

  // Get active contacts
  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .not("deal_stage", "in", '("won","lost")');

  if (!contacts) return generated;

  const now = new Date();

  // Check for existing recent notifications to avoid duplicates (last 24h)
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existingNotifs } = await supabase
    .from("notifications")
    .select("contact_id, type")
    .eq("user_id", userId)
    .gte("created_at", dayAgo);

  const existingKeys = new Set(
    (existingNotifs || []).map(
      (n: { contact_id: string; type: string }) => `${n.contact_id}:${n.type}`
    )
  );

  for (const contact of contacts as Contact[]) {
    const daysSinceContact = contact.last_contacted_at
      ? Math.floor(
          (now.getTime() - new Date(contact.last_contacted_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : Math.floor(
          (now.getTime() - new Date(contact.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );

    const contactName = `${contact.first_name} ${contact.last_name || ""}`.trim();
    const dealInfo = contact.deal_value > 0 ? ` ($${contact.deal_value.toLocaleString()})` : "";

    // Stalled deal: no activity for 14+ days in active stage
    if (
      daysSinceContact >= 14 &&
      !existingKeys.has(`${contact.id}:stalled_deal`)
    ) {
      const notif = await createNotification(userId, "stalled_deal", `Deal stalled: ${contactName}${dealInfo}`, {
        description: `No activity for ${daysSinceContact} days in ${contact.deal_stage} stage. Consider reaching out.`,
        severity: daysSinceContact > 21 ? "critical" : "warning",
        contactId: contact.id,
        actionUrl: `/dashboard/crm?contact=${contact.id}`,
        metadata: { daysSinceContact, stage: contact.deal_stage },
      });
      if (notif) generated.push(notif);
    }

    // Overdue follow-up
    if (
      contact.next_follow_up_at &&
      new Date(contact.next_follow_up_at) < now &&
      !existingKeys.has(`${contact.id}:follow_up_overdue`)
    ) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(contact.next_follow_up_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const notif = await createNotification(userId, "follow_up_overdue", `Overdue follow-up: ${contactName}`, {
        description: `Follow-up was due ${daysOverdue} day${daysOverdue > 1 ? "s" : ""} ago.`,
        severity: daysOverdue > 3 ? "critical" : "warning",
        contactId: contact.id,
        actionUrl: `/dashboard/follow-ups?contactId=${contact.id}&name=${encodeURIComponent(contactName)}&company=${encodeURIComponent(contact.company || "")}`,
        metadata: { daysOverdue },
      });
      if (notif) generated.push(notif);
    }

    // Deal at risk: high-value deal with no recent activity
    if (
      contact.deal_value >= 1000 &&
      daysSinceContact >= 7 &&
      ["proposal", "negotiation"].includes(contact.deal_stage) &&
      !existingKeys.has(`${contact.id}:deal_at_risk`)
    ) {
      const notif = await createNotification(userId, "deal_at_risk", `At risk: ${contactName}${dealInfo}`, {
        description: `High-value deal in ${contact.deal_stage} with ${daysSinceContact} days of inactivity.`,
        severity: "critical",
        contactId: contact.id,
        actionUrl: `/dashboard/crm?contact=${contact.id}`,
        metadata: { dealValue: contact.deal_value, daysSinceContact },
      });
      if (notif) generated.push(notif);
    }

    // Inactivity warning: 7-13 days with no contact
    if (
      daysSinceContact >= 7 &&
      daysSinceContact < 14 &&
      !existingKeys.has(`${contact.id}:inactivity_warning`)
    ) {
      const notif = await createNotification(userId, "inactivity_warning", `Needs attention: ${contactName}`, {
        description: `${daysSinceContact} days since last contact. Don't let this one go cold.`,
        severity: "info",
        contactId: contact.id,
        actionUrl: `/dashboard/crm?contact=${contact.id}`,
      });
      if (notif) generated.push(notif);
    }
  }

  return generated;
}

/**
 * Log stage history entry (called when stage changes)
 */
export async function logStageHistory(
  userId: string,
  contactId: string,
  fromStage: string | null,
  toStage: string,
  dealValue: number
): Promise<void> {
  const supabase = getSupabaseAdmin();

  await supabase.from("deal_stage_history").insert({
    user_id: userId,
    contact_id: contactId,
    from_stage: fromStage,
    to_stage: toStage,
    deal_value: dealValue,
  });

  // If won, create congratulation notification
  if (toStage === "won") {
    await createNotification(userId, "win_congratulation", `Deal won! 🎉`, {
      description: `Congratulations on closing the deal${dealValue > 0 ? ` worth $${dealValue.toLocaleString()}` : ""}!`,
      severity: "success",
      contactId,
      actionUrl: `/dashboard/crm?contact=${contactId}`,
    });
  }

  // If lost, create review notification
  if (toStage === "lost") {
    await createNotification(userId, "lost_review", `Deal lost — review & learn`, {
      description: `Take a moment to review what happened and learn from this experience.`,
      severity: "info",
      contactId,
      actionUrl: `/dashboard/crm?contact=${contactId}`,
    });
  }
}
