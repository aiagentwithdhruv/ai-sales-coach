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

  // ─── Phase 2: Outreach Engine Events ────────────────────────────────────────

  /** Fired when a multi-channel outreach sequence step is due */
  "outreach/step.due": {
    data: {
      sequenceId: string;
      stepIndex: number;
      contactId: string;
      userId: string;
      channel: "email" | "linkedin" | "whatsapp" | "call" | "sms";
      templateId?: string;
    };
  };

  /** Fired when a prospect replies to any outreach channel */
  "outreach/reply.received": {
    data: {
      contactId: string;
      userId: string;
      channel: "email" | "linkedin" | "whatsapp" | "call" | "sms";
      messageId?: string;
      sentiment?: "positive" | "neutral" | "negative";
      body?: string;
    };
  };

  /** Fired when a full outreach sequence completes (all steps done or paused) */
  "outreach/sequence.completed": {
    data: {
      sequenceId: string;
      contactId: string;
      userId: string;
      outcome: "completed" | "replied" | "bounced" | "unsubscribed";
    };
  };

  /** Fired to enroll a contact in a multi-channel outreach sequence */
  "outreach/enroll": {
    data: {
      contactId: string;
      userId: string;
      sequenceTemplate: string; // preset name or custom sequence ID
      priority?: "normal" | "high";
    };
  };

  // ─── Phase 3: The Brain Events ──────────────────────────────────────────────

  /** Fired when a deal is won */
  "deal/won": {
    data: {
      contactId: string;
      userId: string;
      outcome: "won";
      dealValue?: number;
    };
  };

  /** Fired when a deal is lost */
  "deal/lost": {
    data: {
      contactId: string;
      userId: string;
      outcome: "lost";
      dealValue?: number;
      lostReason?: string;
    };
  };

  /** Fired to trigger scoring recalibration based on outcomes */
  "feedback/recalibrate": {
    data: {
      userId: string;
    };
  };

  /** Fired to initiate an autonomous call */
  "call/initiated": {
    data: {
      contactId: string;
      userId: string;
      agentId: string;
      priority?: "normal" | "high" | "urgent";
    };
  };

  /** Fired to execute a composition chain step */
  "chain/step.execute": {
    data: {
      userId: string;
      contactId: string;
      chainId: string;
      stepIndex: number;
      context: Record<string, unknown>;
    };
  };

  /** Fired when a voice command is processed */
  "voice/command.processed": {
    data: {
      userId: string;
      action: string;
      params: Record<string, unknown>;
    };
  };
};

// ─── Client Instance ────────────────────────────────────────────────────────

export const inngest = new Inngest({ id: "quotahit" });

// Re-export event type for function definitions
export type { Events };
