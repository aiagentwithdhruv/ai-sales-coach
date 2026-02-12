/**
 * Phone Number Management
 * CRUD for Twilio phone numbers — search, buy, assign to agents, release.
 */

import { createClient } from "@supabase/supabase-js";
import type { PhoneNumber } from "@/types/teams";
import {
  searchAvailableNumbers as twilioSearch,
  purchaseNumber as twilioBuy,
  isTwilioConfigured,
} from "@/lib/calling/twilio";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── List User's Phone Numbers ──────────────────────────────────────────────

export async function getPhoneNumbers(userId: string): Promise<PhoneNumber[]> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("phone_numbers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

// ─── Get Single Phone Number ────────────────────────────────────────────────

export async function getPhoneNumber(userId: string, id: string): Promise<PhoneNumber | null> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("phone_numbers")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  return data;
}

// ─── Search Available Numbers (Twilio) ──────────────────────────────────────

export async function searchNumbers(params: {
  countryCode?: string;
  areaCode?: string;
  contains?: string;
  limit?: number;
}) {
  if (!isTwilioConfigured()) {
    throw new Error("Twilio not configured");
  }
  return twilioSearch(params);
}

// ─── Buy a Number (Twilio → save to DB) ─────────────────────────────────────

export async function buyNumber(
  userId: string,
  phoneNumber: string,
  countryCode: string
): Promise<PhoneNumber | null> {
  if (!isTwilioConfigured()) {
    throw new Error("Twilio not configured");
  }

  const webhookBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  // Purchase on Twilio
  const purchased = await twilioBuy(phoneNumber, webhookBaseUrl);

  // Save to DB
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("phone_numbers")
    .insert({
      user_id: userId,
      phone_number: purchased.phoneNumber,
      friendly_name: purchased.friendlyName,
      provider: "twilio",
      twilio_sid: purchased.sid,
      country_code: countryCode || "US",
      capabilities: { voice: true, sms: true },
      is_active: true,
    })
    .select()
    .single();

  return error ? null : data;
}

// ─── Assign Number to Agent ─────────────────────────────────────────────────

export async function assignNumberToAgent(
  userId: string,
  numberId: string,
  agentId: string | null
): Promise<PhoneNumber | null> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("phone_numbers")
    .update({
      assigned_agent_id: agentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", numberId)
    .eq("user_id", userId)
    .select()
    .single();
  return error ? null : data;
}

// ─── Toggle Active Status ───────────────────────────────────────────────────

export async function toggleNumberActive(
  userId: string,
  numberId: string,
  isActive: boolean
): Promise<PhoneNumber | null> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("phone_numbers")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", numberId)
    .eq("user_id", userId)
    .select()
    .single();
  return error ? null : data;
}

// ─── Release (Delete) a Number ──────────────────────────────────────────────

export async function releaseNumber(userId: string, numberId: string): Promise<boolean> {
  const supabase = getAdmin();

  // Get the number first for Twilio SID
  const { data: num } = await supabase
    .from("phone_numbers")
    .select("twilio_sid")
    .eq("id", numberId)
    .eq("user_id", userId)
    .single();

  if (!num) return false;

  // Release on Twilio if we have a SID
  if (num.twilio_sid && isTwilioConfigured()) {
    try {
      const twilio = await import("twilio");
      const client = twilio.default(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      );
      await client.incomingPhoneNumbers(num.twilio_sid).remove();
    } catch {
      // Twilio release failed — still remove from DB
    }
  }

  const { error } = await supabase
    .from("phone_numbers")
    .delete()
    .eq("id", numberId)
    .eq("user_id", userId);

  return !error;
}

// ─── Increment Call Count ───────────────────────────────────────────────────

export async function incrementPhoneNumberCalls(phoneNumber: string): Promise<void> {
  const supabase = getAdmin();
  const { data: num } = await supabase
    .from("phone_numbers")
    .select("id, total_calls, monthly_calls")
    .eq("phone_number", phoneNumber)
    .single();

  if (!num) return;

  await supabase
    .from("phone_numbers")
    .update({
      total_calls: num.total_calls + 1,
      monthly_calls: num.monthly_calls + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", num.id);
}
