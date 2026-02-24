/**
 * Item 21: Meeting Booking (Calendar)
 *
 * Calendly-style booking integrated into outreach sequences.
 * Features:
 *   - Generate booking links with available time slots
 *   - Embed booking in email/WhatsApp/LinkedIn messages
 *   - Webhook for booking confirmations
 *   - Google Calendar / Outlook sync (via API)
 *   - Auto-reminder emails (1 day before, 1 hour before)
 *
 * No external Calendly dependency — built-in scheduler.
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startHour: number; // 0-23
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface BookingConfig {
  userId: string;
  title: string;
  duration: number; // minutes
  availability: AvailabilitySlot[];
  timezone: string;
  bufferBefore?: number; // minutes
  bufferAfter?: number;
  maxBookingsPerDay?: number;
  confirmationEmail?: boolean;
  reminderEmails?: boolean;
}

export interface Meeting {
  id: string;
  userId: string;
  contactId?: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
  attendeeName: string;
  attendeeEmail: string;
  notes?: string;
  meetingLink?: string;
  bookingLink?: string;
}

export interface TimeSlot {
  start: string; // ISO datetime
  end: string;
  available: boolean;
}

// ─── Default Availability (Mon-Fri 9AM-5PM) ────────────────────────────────

const DEFAULT_AVAILABILITY: AvailabilitySlot[] = [
  { dayOfWeek: 1, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
  { dayOfWeek: 2, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
  { dayOfWeek: 3, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
  { dayOfWeek: 4, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
  { dayOfWeek: 5, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
];

// ─── Get Available Slots ────────────────────────────────────────────────────

export async function getAvailableSlots(
  userId: string,
  date: string, // YYYY-MM-DD
  duration = 30 // minutes
): Promise<TimeSlot[]> {
  const supabase = getAdmin();

  // Get user's booking config
  const { data: config } = await supabase
    .from("booking_configs")
    .select("*")
    .eq("user_id", userId)
    .single();

  const availability = (config?.availability as AvailabilitySlot[]) || DEFAULT_AVAILABILITY;
  const buffer = (config?.buffer_before || 0) + (config?.buffer_after || 0);
  const maxPerDay = config?.max_bookings_per_day || 8;

  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();

  // Check if this day has availability
  const daySlots = availability.filter((a) => a.dayOfWeek === dayOfWeek);
  if (daySlots.length === 0) return [];

  // Get existing bookings for this date
  const dayStart = new Date(date + "T00:00:00Z").toISOString();
  const dayEnd = new Date(date + "T23:59:59Z").toISOString();

  const { data: existing } = await supabase
    .from("meetings")
    .select("start_time, end_time")
    .eq("user_id", userId)
    .gte("start_time", dayStart)
    .lte("start_time", dayEnd)
    .neq("status", "cancelled");

  const bookedSlots = (existing || []).map((m) => ({
    start: new Date(m.start_time).getTime(),
    end: new Date(m.end_time).getTime(),
  }));

  // Check max bookings per day
  if (bookedSlots.length >= maxPerDay) return [];

  // Generate available time slots
  const slots: TimeSlot[] = [];

  for (const daySlot of daySlots) {
    let current = new Date(date);
    current.setHours(daySlot.startHour, daySlot.startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(daySlot.endHour, daySlot.endMinute, 0, 0);

    while (current.getTime() + (duration + buffer) * 60 * 1000 <= endTime.getTime()) {
      const slotStart = current.getTime();
      const slotEnd = slotStart + duration * 60 * 1000;

      // Check if slot conflicts with existing bookings
      const hasConflict = bookedSlots.some(
        (booked) => slotStart < booked.end && slotEnd > booked.start
      );

      // Don't show past slots
      const isPast = slotStart < Date.now();

      slots.push({
        start: new Date(slotStart).toISOString(),
        end: new Date(slotEnd).toISOString(),
        available: !hasConflict && !isPast,
      });

      // Move to next slot
      current = new Date(slotEnd + buffer * 60 * 1000);
    }
  }

  return slots;
}

// ─── Book Meeting ───────────────────────────────────────────────────────────

export async function bookMeeting(
  userId: string,
  params: {
    contactId?: string;
    startTime: string;
    duration?: number;
    title?: string;
    attendeeName: string;
    attendeeEmail: string;
    notes?: string;
  }
): Promise<Meeting> {
  const supabase = getAdmin();

  const duration = params.duration || 30;
  const endTime = new Date(new Date(params.startTime).getTime() + duration * 60 * 1000).toISOString();

  // Verify slot is available
  const date = params.startTime.split("T")[0];
  const slots = await getAvailableSlots(userId, date, duration);
  const slot = slots.find(
    (s) => s.start === params.startTime && s.available
  );

  if (!slot) {
    throw new Error("Selected time slot is not available");
  }

  // Generate meeting link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const meetingId = crypto.randomUUID();

  // Store meeting
  const { data: meeting } = await supabase
    .from("meetings")
    .insert({
      id: meetingId,
      user_id: userId,
      contact_id: params.contactId || null,
      title: params.title || "Sales Call",
      start_time: params.startTime,
      end_time: endTime,
      duration,
      status: "scheduled",
      attendee_name: params.attendeeName,
      attendee_email: params.attendeeEmail,
      notes: params.notes || null,
      meeting_link: `${appUrl}/meet/${meetingId}`,
    })
    .select("id")
    .single();

  // If contact exists, link the meeting
  if (params.contactId) {
    await supabase.from("activities").insert({
      user_id: userId,
      contact_id: params.contactId,
      activity_type: "meeting_booked",
      details: {
        meeting_id: meeting?.id,
        start_time: params.startTime,
        duration,
        attendee: params.attendeeName,
      },
    });
  }

  // Send confirmation email
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && params.attendeeEmail) {
    const startDate = new Date(params.startTime);
    const formattedDate = startDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "meetings@quotahit.com",
        to: params.attendeeEmail,
        subject: `Meeting Confirmed: ${params.title || "Sales Call"} — ${formattedDate}`,
        html: `
          <h2>Meeting Confirmed</h2>
          <p>Hey ${params.attendeeName},</p>
          <p>Your meeting has been scheduled:</p>
          <ul>
            <li><strong>Date:</strong> ${formattedDate}</li>
            <li><strong>Time:</strong> ${formattedTime}</li>
            <li><strong>Duration:</strong> ${duration} minutes</li>
          </ul>
          ${params.notes ? `<p><strong>Notes:</strong> ${params.notes}</p>` : ""}
          <p>See you there!</p>
        `,
        tags: [{ name: "type", value: "meeting_confirmation" }],
      }),
    });
  }

  return {
    id: meeting?.id || meetingId,
    userId,
    contactId: params.contactId,
    title: params.title || "Sales Call",
    startTime: params.startTime,
    endTime,
    duration,
    status: "scheduled",
    attendeeName: params.attendeeName,
    attendeeEmail: params.attendeeEmail,
    notes: params.notes,
    meetingLink: `${appUrl}/meet/${meetingId}`,
  };
}

// ─── Generate Booking Link ──────────────────────────────────────────────────

export function generateBookingLink(
  userId: string,
  params?: {
    duration?: number;
    title?: string;
    contactId?: string;
  }
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const query = new URLSearchParams();
  query.set("u", userId);
  if (params?.duration) query.set("d", String(params.duration));
  if (params?.title) query.set("t", params.title);
  if (params?.contactId) query.set("c", params.contactId);

  return `${appUrl}/book?${query.toString()}`;
}

// ─── Cancel Meeting ─────────────────────────────────────────────────────────

export async function cancelMeeting(
  userId: string,
  meetingId: string,
  reason?: string
): Promise<boolean> {
  const supabase = getAdmin();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("contact_id, attendee_email, attendee_name, title, start_time")
    .eq("id", meetingId)
    .eq("user_id", userId)
    .single();

  if (!meeting) return false;

  await supabase
    .from("meetings")
    .update({ status: "cancelled" })
    .eq("id", meetingId);

  // Log activity
  if (meeting.contact_id) {
    await supabase.from("activities").insert({
      user_id: userId,
      contact_id: meeting.contact_id,
      activity_type: "meeting_cancelled",
      details: { meeting_id: meetingId, reason },
    });
  }

  // Send cancellation email
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && meeting.attendee_email) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "meetings@quotahit.com",
        to: meeting.attendee_email,
        subject: `Meeting Cancelled: ${meeting.title}`,
        html: `
          <p>Hey ${meeting.attendee_name},</p>
          <p>Unfortunately, we need to cancel our upcoming meeting${reason ? `: ${reason}` : "."}</p>
          <p>We'll reach out to reschedule. Sorry for the inconvenience.</p>
        `,
      }),
    });
  }

  return true;
}

// ─── List Upcoming Meetings ─────────────────────────────────────────────────

export async function listMeetings(
  userId: string,
  filters?: { status?: string; contactId?: string; upcoming?: boolean }
): Promise<Meeting[]> {
  const supabase = getAdmin();

  let query = supabase
    .from("meetings")
    .select("*")
    .eq("user_id", userId)
    .order("start_time", { ascending: true })
    .limit(50);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.contactId) query = query.eq("contact_id", filters.contactId);
  if (filters?.upcoming) query = query.gte("start_time", new Date().toISOString());

  const { data } = await query;

  return (data || []).map((m) => ({
    id: m.id,
    userId: m.user_id,
    contactId: m.contact_id,
    title: m.title,
    startTime: m.start_time,
    endTime: m.end_time,
    duration: m.duration,
    status: m.status,
    attendeeName: m.attendee_name,
    attendeeEmail: m.attendee_email,
    notes: m.notes,
    meetingLink: m.meeting_link,
  }));
}

// ─── Send Reminders (Cron) ──────────────────────────────────────────────────

export async function sendMeetingReminders(): Promise<{ sent: number }> {
  const supabase = getAdmin();

  // Find meetings in next 24 hours that haven't been reminded
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const { data: upcoming } = await supabase
    .from("meetings")
    .select("*")
    .eq("status", "scheduled")
    .gte("start_time", now)
    .lte("start_time", in24h);

  let sent = 0;
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { sent: 0 };

  for (const meeting of upcoming || []) {
    const startDate = new Date(meeting.start_time);
    const formattedTime = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "meetings@quotahit.com",
        to: meeting.attendee_email,
        subject: `Reminder: ${meeting.title} tomorrow at ${formattedTime}`,
        html: `
          <p>Hey ${meeting.attendee_name},</p>
          <p>Just a friendly reminder about our meeting tomorrow at <strong>${formattedTime}</strong>.</p>
          <p>Looking forward to speaking with you!</p>
        `,
        tags: [{ name: "type", value: "meeting_reminder" }],
      }),
    });

    // Update meeting as reminded
    await supabase
      .from("meetings")
      .update({ status: "confirmed" })
      .eq("id", meeting.id);

    sent++;
  }

  return { sent };
}
