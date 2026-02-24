/**
 * Inngest Client — QuotaHit Agent Workflow Engine
 *
 * Central event bus for durable agent workflows.
 * All events are typed for safety across the pipeline:
 *   contact.created → lead.scored → lead.qualified → lead.routed → followup.send
 */

import { Inngest } from "inngest";

// ─── Event Definitions ─────────────────────────────────────────────────────

type Events = {
  /** Fired when a new contact is created or imported */
  "contact/created": {
    data: {
      contactId: string;
      userId: string;
      source: string; // manual, import, webhook, scout
    };
  };

  /** Fired when contact enrichment completes */
  "contact/enriched": {
    data: {
      contactId: string;
      userId: string;
      enrichmentData: Record<string, unknown>;
    };
  };

  /** Fired after lead scoring completes */
  "lead/scored": {
    data: {
      contactId: string;
      userId: string;
      score: number;
      previousScore: number;
      signals: Record<string, number>; // breakdown by category
    };
  };

  /** Fired after AI qualification conversation completes */
  "lead/qualified": {
    data: {
      contactId: string;
      userId: string;
      outcome: "qualified" | "nurture" | "disqualified";
      bant: {
        budget: number; // 0-100
        authority: number;
        need: number;
        timeline: number;
        competition: number;
      };
      notes: string;
    };
  };

  /** Fired after lead is routed to a mode */
  "lead/routed": {
    data: {
      contactId: string;
      userId: string;
      mode: "A" | "B" | "C"; // autonomous, hybrid, self-service
      assignedTo?: string; // rep userId for Mode B
      reason: string;
    };
  };

  /** Fired to send a single follow-up message */
  "followup/send": {
    data: {
      messageId: string;
      userId: string;
      contactId: string;
      channel: "email" | "sms" | "whatsapp";
    };
  };

  /** Fired after a call completes (from Twilio webhook) */
  "call/completed": {
    data: {
      callId: string;
      userId: string;
      contactId: string;
      outcome: string;
      duration: number;
      summary?: string;
    };
  };

  /** Fired to trigger follow-up sequence for a contact */
  "followup/trigger": {
    data: {
      userId: string;
      contactId: string;
      callId: string;
      outcome: string;
      contactName: string;
      contactEmail?: string;
      contactPhone?: string;
      callSummary: string;
      nextSteps: string;
      agentName: string;
    };
  };
};

// ─── Client Instance ────────────────────────────────────────────────────────

export const inngest = new Inngest({ id: "quotahit" });

// Re-export event type for function definitions
export type { Events };
