"""
QuotaHit MCP Server — AI Sales Department control plane.

15 tools + 6 prompts for managing the entire QuotaHit pipeline:

Tools (Actions):
  - list_contacts, get_contact, create_contact, update_contact
  - enrich_lead, score_lead, qualify_lead
  - list_campaigns, create_campaign, execute_campaign
  - get_pipeline, get_analytics, get_forecast
  - list_sequences, send_followup

Prompts (AI Reasoning):
  - qualify_lead, handle_objection, write_outreach
  - summarize_deal, score_conversation, suggest_next_action

Uses FastMCP (stdio transport) + Supabase service role for data access.
"""

import os
import json
from datetime import datetime

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("QuotaHit Sales Department")

# ─── Config ──────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Lazy Supabase client
_supabase = None


def _get_supabase():
    """Get or create Supabase client (lazy init)."""
    global _supabase
    if _supabase is None:
        try:
            from supabase import create_client
            _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        except ImportError:
            raise RuntimeError(
                "supabase-py not installed. Run: pip3 install supabase"
            )
        except Exception as e:
            raise RuntimeError(f"Failed to connect to Supabase: {e}")
    return _supabase


def _json(data) -> str:
    """Format data as indented JSON string."""
    return json.dumps(data, indent=2, default=str)


# ─── Contact Tools ───────────────────────────────────────────────────────────


@mcp.tool()
def list_contacts(
    search: str = "",
    stage: str = "",
    sort_by: str = "created_at",
    limit: int = 25,
    offset: int = 0,
    user_id: str = "",
) -> str:
    """List contacts with optional filters.

    Args:
        search: Search by name, email, or company
        stage: Filter by deal stage (lead, contacted, qualified, proposal, negotiation, won, lost)
        sort_by: Sort field (created_at, lead_score, deal_value, last_contacted)
        limit: Max results (default 25, max 100)
        offset: Pagination offset
        user_id: Required — the user's ID
    """
    if not user_id:
        return "Error: user_id is required"

    sb = _get_supabase()
    query = sb.table("contacts").select("*").eq("user_id", user_id)

    if search:
        query = query.or_(
            f"first_name.ilike.%{search}%,"
            f"last_name.ilike.%{search}%,"
            f"email.ilike.%{search}%,"
            f"company.ilike.%{search}%"
        )
    if stage:
        query = query.eq("deal_stage", stage)

    query = query.order(sort_by, desc=True).range(offset, offset + min(limit, 100) - 1)
    result = query.execute()
    contacts = result.data or []

    return _json({
        "count": len(contacts),
        "contacts": [
            {
                "id": c["id"],
                "name": f"{c.get('first_name', '')} {c.get('last_name', '')}".strip(),
                "email": c.get("email"),
                "company": c.get("company"),
                "title": c.get("title"),
                "stage": c.get("deal_stage"),
                "score": c.get("lead_score"),
                "deal_value": c.get("deal_value"),
                "source": c.get("source"),
                "last_contacted": c.get("last_contacted_at"),
            }
            for c in contacts
        ],
    })


@mcp.tool()
def get_contact(contact_id: str, user_id: str) -> str:
    """Get full details for a single contact including enrichment data and recent activities.

    Args:
        contact_id: The contact's UUID
        user_id: The user's UUID
    """
    sb = _get_supabase()

    # Contact
    contact = (
        sb.table("contacts")
        .select("*")
        .eq("id", contact_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    ).data

    if not contact:
        return f"Contact {contact_id} not found"

    # Recent activities
    activities = (
        sb.table("activities")
        .select("*")
        .eq("contact_id", contact_id)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    ).data or []

    return _json({
        "contact": contact,
        "activities": activities,
    })


@mcp.tool()
def create_contact(
    first_name: str,
    user_id: str,
    last_name: str = "",
    email: str = "",
    phone: str = "",
    company: str = "",
    title: str = "",
    source: str = "mcp",
    deal_stage: str = "lead",
    deal_value: float = 0,
    notes: str = "",
) -> str:
    """Create a new contact in the CRM.

    Args:
        first_name: Contact's first name (required)
        user_id: The user's UUID (required)
        last_name: Contact's last name
        email: Email address
        phone: Phone number
        company: Company name
        title: Job title
        source: Lead source (manual, import, linkedin, website, referral, cold, mcp)
        deal_stage: Initial stage (lead, contacted, qualified, proposal, negotiation)
        deal_value: Estimated deal value in USD
        notes: Initial notes
    """
    sb = _get_supabase()

    data = {
        "user_id": user_id,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone": phone,
        "company": company,
        "title": title,
        "source": source,
        "deal_stage": deal_stage,
        "deal_value": deal_value,
        "notes": notes,
    }

    result = sb.table("contacts").insert(data).execute()
    contact = result.data[0] if result.data else None

    if not contact:
        return "Error: Failed to create contact"

    # Log activity
    sb.table("activities").insert({
        "user_id": user_id,
        "contact_id": contact["id"],
        "activity_type": "contact_created",
        "title": "Contact created via MCP",
        "description": f"Created {first_name} {last_name} from {source}",
    }).execute()

    return _json({"created": True, "contact": contact})


@mcp.tool()
def update_contact(
    contact_id: str,
    user_id: str,
    updates: str = "{}",
) -> str:
    """Update a contact's fields.

    Args:
        contact_id: The contact's UUID
        user_id: The user's UUID
        updates: JSON string of fields to update, e.g. '{"deal_stage": "qualified", "deal_value": 5000}'
    """
    sb = _get_supabase()

    try:
        update_data = json.loads(updates)
    except json.JSONDecodeError:
        return "Error: updates must be valid JSON"

    # Prevent changing user_id or id
    update_data.pop("user_id", None)
    update_data.pop("id", None)

    result = (
        sb.table("contacts")
        .update(update_data)
        .eq("id", contact_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        return f"Contact {contact_id} not found or update failed"

    return _json({"updated": True, "contact": result.data[0]})


# ─── Lead Intelligence Tools ────────────────────────────────────────────────


@mcp.tool()
def enrich_lead(contact_id: str, user_id: str) -> str:
    """Trigger AI enrichment for a contact (uses Perplexity/OpenRouter for research).

    Args:
        contact_id: The contact's UUID
        user_id: The user's UUID

    Returns enrichment status. Full results arrive asynchronously.
    """
    sb = _get_supabase()

    # Mark as enriching
    sb.table("contacts").update(
        {"enrichment_status": "enriching"}
    ).eq("id", contact_id).eq("user_id", user_id).execute()

    return _json({
        "status": "enriching",
        "contact_id": contact_id,
        "message": "Enrichment triggered. Use get_contact() to check results.",
        "note": "For real-time enrichment, call POST /api/contacts/{id}/enrich via the API",
    })


@mcp.tool()
def score_lead(contact_id: str, user_id: str) -> str:
    """Calculate and update lead score (0-100) for a contact.

    Scoring weights: completeness (20), enrichment (15), deal signals (15),
    engagement (20), pipeline stage (15), source quality (10).

    Args:
        contact_id: The contact's UUID
        user_id: The user's UUID
    """
    sb = _get_supabase()

    # Fetch contact
    contact = (
        sb.table("contacts")
        .select("*")
        .eq("id", contact_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    ).data

    if not contact:
        return f"Contact {contact_id} not found"

    # Count activities
    activities = (
        sb.table("activities")
        .select("id", count="exact")
        .eq("contact_id", contact_id)
        .eq("user_id", user_id)
        .execute()
    )
    activity_count = activities.count or 0

    # Calculate score
    score = 0

    # Completeness (20)
    if contact.get("email"):
        score += 5
    if contact.get("phone"):
        score += 5
    if contact.get("company"):
        score += 5
    if contact.get("title"):
        score += 5

    # Enrichment (15)
    if contact.get("enrichment_status") == "enriched":
        score += 15

    # Deal signals (15)
    deal_value = contact.get("deal_value") or 0
    if deal_value > 0:
        score += 10
    if deal_value > 10000:
        score += 5

    # Engagement (20)
    score += min(activity_count * 4, 20)

    # Pipeline stage (15)
    stage_bonus = {
        "lead": 0, "contacted": 3, "qualified": 8,
        "proposal": 12, "negotiation": 15,
    }
    stage = contact.get("deal_stage", "")
    score += stage_bonus.get(stage, 0)

    # Source quality (10)
    source_bonus = {
        "referral": 10, "inbound": 8, "linkedin": 6,
        "website": 5, "import": 3, "manual": 2, "cold": 1, "mcp": 3,
    }
    source = contact.get("source", "")
    score += source_bonus.get(source, 0)

    # DNC penalty
    if contact.get("do_not_call") and contact.get("do_not_email"):
        score -= 20

    score = max(0, min(score, 100))

    # Update
    sb.table("contacts").update(
        {"lead_score": score}
    ).eq("id", contact_id).eq("user_id", user_id).execute()

    # Log
    sb.table("activities").insert({
        "user_id": user_id,
        "contact_id": contact_id,
        "activity_type": "lead_scored",
        "title": f"Lead scored: {score}/100",
        "details": {"score": score, "source": "mcp"},
    }).execute()

    return _json({
        "contact_id": contact_id,
        "score": score,
        "breakdown": {
            "completeness": min(sum([
                5 if contact.get("email") else 0,
                5 if contact.get("phone") else 0,
                5 if contact.get("company") else 0,
                5 if contact.get("title") else 0,
            ]), 20),
            "enrichment": 15 if contact.get("enrichment_status") == "enriched" else 0,
            "deal_signals": min(10 + (5 if deal_value > 10000 else 0), 15) if deal_value > 0 else 0,
            "engagement": min(activity_count * 4, 20),
            "stage": stage_bonus.get(stage, 0),
            "source": source_bonus.get(source, 0),
        },
    })


@mcp.tool()
def qualify_lead(contact_id: str, user_id: str) -> str:
    """Get qualification status or trigger BANT+ qualification for a contact.

    Args:
        contact_id: The contact's UUID
        user_id: The user's UUID
    """
    sb = _get_supabase()

    contact = (
        sb.table("contacts")
        .select("first_name, last_name, company, title, deal_stage, lead_score, custom_fields")
        .eq("id", contact_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    ).data

    if not contact:
        return f"Contact {contact_id} not found"

    custom = contact.get("custom_fields") or {}
    qualification_status = custom.get("qualification_status", "none")

    return _json({
        "contact_id": contact_id,
        "name": f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip(),
        "company": contact.get("company"),
        "current_stage": contact.get("deal_stage"),
        "lead_score": contact.get("lead_score"),
        "qualification_status": qualification_status,
        "bant_scores": custom.get("bant_scores"),
        "qualification_outcome": custom.get("qualification_outcome"),
        "note": "Qualification runs automatically via Inngest when score > 40. "
                "To trigger manually, call POST /api/leads/score with this contactId.",
    })


# ─── Campaign Tools ─────────────────────────────────────────────────────────


@mcp.tool()
def list_campaigns(user_id: str, limit: int = 20) -> str:
    """List all calling/outreach campaigns.

    Args:
        user_id: The user's UUID
        limit: Max results
    """
    sb = _get_supabase()

    result = (
        sb.table("campaigns")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    campaigns = result.data or []
    return _json({
        "count": len(campaigns),
        "campaigns": [
            {
                "id": c["id"],
                "name": c.get("name"),
                "type": c.get("type"),
                "status": c.get("status"),
                "total_contacts": c.get("total_contacts", 0),
                "completed": c.get("completed_contacts", 0),
                "created": c.get("created_at"),
            }
            for c in campaigns
        ],
    })


@mcp.tool()
def create_campaign(
    name: str,
    user_id: str,
    campaign_type: str = "outbound",
    description: str = "",
) -> str:
    """Create a new calling/outreach campaign.

    Args:
        name: Campaign name
        user_id: The user's UUID
        campaign_type: Type (outbound, inbound, nurture, reactivation)
        description: Campaign description
    """
    sb = _get_supabase()

    result = sb.table("campaigns").insert({
        "user_id": user_id,
        "name": name,
        "type": campaign_type,
        "description": description,
        "status": "draft",
    }).execute()

    campaign = result.data[0] if result.data else None
    if not campaign:
        return "Error: Failed to create campaign"

    return _json({"created": True, "campaign": campaign})


@mcp.tool()
def execute_campaign(campaign_id: str, user_id: str) -> str:
    """Start executing a campaign (changes status to active).

    Args:
        campaign_id: The campaign's UUID
        user_id: The user's UUID
    """
    sb = _get_supabase()

    result = (
        sb.table("campaigns")
        .update({"status": "active", "started_at": datetime.utcnow().isoformat()})
        .eq("id", campaign_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        return f"Campaign {campaign_id} not found"

    return _json({
        "started": True,
        "campaign": result.data[0],
        "note": "Campaign is now active. Contacts will be processed automatically.",
    })


# ─── Analytics Tools ────────────────────────────────────────────────────────


@mcp.tool()
def get_pipeline(user_id: str) -> str:
    """Get current pipeline status — contacts by stage with total values.

    Args:
        user_id: The user's UUID
    """
    sb = _get_supabase()

    contacts = (
        sb.table("contacts")
        .select("deal_stage, deal_value")
        .eq("user_id", user_id)
        .execute()
    ).data or []

    # Aggregate by stage
    stages = {}
    for c in contacts:
        stage = c.get("deal_stage", "lead")
        if stage not in stages:
            stages[stage] = {"count": 0, "total_value": 0}
        stages[stage]["count"] += 1
        stages[stage]["total_value"] += c.get("deal_value") or 0

    return _json({
        "total_contacts": len(contacts),
        "total_pipeline_value": sum(s["total_value"] for s in stages.values()),
        "by_stage": stages,
    })


@mcp.tool()
def get_analytics(user_id: str) -> str:
    """Get full dashboard analytics — KPIs, conversion rates, scoring distribution.

    Args:
        user_id: The user's UUID
    """
    sb = _get_supabase()

    contacts = (
        sb.table("contacts")
        .select("deal_stage, deal_value, lead_score, source, created_at, enrichment_status")
        .eq("user_id", user_id)
        .execute()
    ).data or []

    total = len(contacts)
    if total == 0:
        return _json({"message": "No contacts yet", "total": 0})

    # Score distribution
    score_buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for c in contacts:
        s = c.get("lead_score") or 0
        if s <= 20:
            score_buckets["0-20"] += 1
        elif s <= 40:
            score_buckets["21-40"] += 1
        elif s <= 60:
            score_buckets["41-60"] += 1
        elif s <= 80:
            score_buckets["61-80"] += 1
        else:
            score_buckets["81-100"] += 1

    # By source
    by_source = {}
    for c in contacts:
        src = c.get("source", "unknown")
        by_source[src] = by_source.get(src, 0) + 1

    # Stage conversion
    stage_order = ["lead", "contacted", "qualified", "proposal", "negotiation", "won"]
    by_stage = {}
    for c in contacts:
        stage = c.get("deal_stage", "lead")
        by_stage[stage] = by_stage.get(stage, 0) + 1

    won = by_stage.get("won", 0)
    won_value = sum(c.get("deal_value", 0) for c in contacts if c.get("deal_stage") == "won")
    enriched = sum(1 for c in contacts if c.get("enrichment_status") == "enriched")

    return _json({
        "total_contacts": total,
        "enriched": enriched,
        "enrichment_rate": round(enriched / total * 100, 1) if total else 0,
        "won_deals": won,
        "won_value": won_value,
        "win_rate": round(won / total * 100, 1) if total else 0,
        "avg_deal_value": round(won_value / won, 2) if won else 0,
        "score_distribution": score_buckets,
        "by_source": by_source,
        "by_stage": by_stage,
    })


@mcp.tool()
def get_forecast(user_id: str) -> str:
    """Revenue forecast based on pipeline stage probabilities.

    Args:
        user_id: The user's UUID
    """
    sb = _get_supabase()

    contacts = (
        sb.table("contacts")
        .select("deal_stage, deal_value, first_name, last_name, company")
        .eq("user_id", user_id)
        .not_.is_("deal_value", "null")
        .gt("deal_value", 0)
        .execute()
    ).data or []

    # Stage → probability
    stage_prob = {
        "lead": 0.05,
        "contacted": 0.10,
        "qualified": 0.30,
        "proposal": 0.60,
        "negotiation": 0.80,
        "won": 1.00,
        "lost": 0.00,
    }

    total_weighted = 0
    total_pipeline = 0
    deals = []

    for c in contacts:
        value = c.get("deal_value", 0)
        stage = c.get("deal_stage", "lead")
        prob = stage_prob.get(stage, 0.05)
        weighted = value * prob
        total_weighted += weighted
        total_pipeline += value

        deals.append({
            "name": f"{c.get('first_name', '')} {c.get('last_name', '')}".strip(),
            "company": c.get("company"),
            "stage": stage,
            "value": value,
            "probability": prob,
            "weighted_value": round(weighted, 2),
        })

    deals.sort(key=lambda d: -d["weighted_value"])

    return _json({
        "total_pipeline": total_pipeline,
        "weighted_forecast": round(total_weighted, 2),
        "deal_count": len(deals),
        "top_deals": deals[:10],
    })


# ─── Sequence Tools ─────────────────────────────────────────────────────────


@mcp.tool()
def list_sequences(user_id: str) -> str:
    """List all follow-up sequences and their status.

    Args:
        user_id: The user's UUID
    """
    sb = _get_supabase()

    sequences = (
        sb.table("follow_up_sequences")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    ).data or []

    return _json({
        "count": len(sequences),
        "sequences": [
            {
                "id": s["id"],
                "name": s.get("name"),
                "trigger": s.get("trigger_event"),
                "steps": len(s.get("steps") or []),
                "active": s.get("is_active", False),
                "created": s.get("created_at"),
            }
            for s in sequences
        ],
    })


@mcp.tool()
def update_deal_stage(
    contact_id: str,
    user_id: str,
    new_stage: str,
) -> str:
    """Move a deal to a new pipeline stage.

    Args:
        contact_id: The contact's UUID
        user_id: The user's UUID
        new_stage: Target stage (lead, contacted, qualified, proposal, negotiation, won, lost)
    """
    valid_stages = ["lead", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]
    if new_stage not in valid_stages:
        return f"Invalid stage '{new_stage}'. Valid: {', '.join(valid_stages)}"

    sb = _get_supabase()

    # Get current stage
    contact = (
        sb.table("contacts")
        .select("deal_stage, first_name, last_name")
        .eq("id", contact_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    ).data

    if not contact:
        return f"Contact {contact_id} not found"

    old_stage = contact.get("deal_stage", "lead")

    # Update
    sb.table("contacts").update(
        {"deal_stage": new_stage}
    ).eq("id", contact_id).eq("user_id", user_id).execute()

    # Log
    name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip()
    sb.table("activities").insert({
        "user_id": user_id,
        "contact_id": contact_id,
        "activity_type": "stage_changed",
        "title": f"Stage: {old_stage} → {new_stage}",
        "description": f"{name} moved from {old_stage} to {new_stage} via MCP",
    }).execute()

    return _json({
        "updated": True,
        "contact_id": contact_id,
        "old_stage": old_stage,
        "new_stage": new_stage,
    })


# ─── MCP Prompts ────────────────────────────────────────────────────────────


@mcp.prompt()
def qualify_lead_prompt(contact_name: str, company: str, title: str = "", notes: str = "") -> str:
    """BANT+ qualification prompt for AI-driven lead qualification."""
    return f"""You are QuotaHit's AI Qualifier. Qualify this lead using BANT+ framework.

Lead: {contact_name}
Company: {company}
Title: {title}
Notes: {notes}

Score each dimension 0-100:
- **Budget**: Can they afford the solution? Do they have purchasing power?
- **Authority**: Are they a decision maker or influencer?
- **Need**: How strong is their pain point? Is it urgent?
- **Timeline**: When do they plan to buy? Is there a deadline?
- **Competition**: Are they evaluating alternatives? How far along?

Return a JSON object:
{{
  "budget": <0-100>,
  "authority": <0-100>,
  "need": <0-100>,
  "timeline": <0-100>,
  "competition": <0-100>,
  "outcome": "qualified" | "nurture" | "disqualified",
  "reasoning": "<1-2 sentences>",
  "next_action": "<recommended next step>"
}}"""


@mcp.prompt()
def handle_objection_prompt(objection: str, context: str = "") -> str:
    """Generate a response to a sales objection."""
    return f"""You are QuotaHit's AI Sales Coach. Help handle this objection.

Objection: "{objection}"
Context: {context}

Provide:
1. **Acknowledge** — Show you understand their concern
2. **Reframe** — Shift perspective without being pushy
3. **Evidence** — Share a relevant data point or case study
4. **Next Step** — Suggest a concrete next action

Keep it conversational, not scripted. Max 150 words."""


@mcp.prompt()
def write_outreach_prompt(
    contact_name: str,
    company: str,
    channel: str = "email",
    context: str = "",
) -> str:
    """Generate personalized outreach message."""
    return f"""You are QuotaHit's AI Outreach Agent. Write a personalized {channel} message.

To: {contact_name} at {company}
Channel: {channel}
Context: {context}

Guidelines:
- First line must be personalized (not "I hope this finds you well")
- Reference something specific about their company or role
- Clear value proposition in 1 sentence
- One specific CTA (not "let me know if you're interested")
- If email: subject line + body (under 150 words)
- If LinkedIn: connection request + follow-up (under 300 chars each)
- If WhatsApp: casual, direct, under 100 words"""


@mcp.prompt()
def summarize_deal_prompt(contact_data: str) -> str:
    """Summarize a deal for a sales rep briefing."""
    return f"""You are QuotaHit's AI Deal Analyst. Summarize this deal for a quick rep briefing.

Contact/Deal Data:
{contact_data}

Provide a 5-line briefing:
1. **Who**: Contact name, role, company (1 line)
2. **Status**: Current stage, score, last activity
3. **Opportunity**: Deal value, timeline, key need
4. **Risk**: Main objection or blocker
5. **Next Step**: Recommended immediate action"""


@mcp.prompt()
def score_conversation_prompt(transcript: str) -> str:
    """Score a sales conversation quality."""
    return f"""You are QuotaHit's AI Call Analyst. Score this sales conversation.

Transcript:
{transcript}

Score each dimension 1-10:
- **Discovery**: Did they ask good questions? Understand the prospect's needs?
- **Value Prop**: Did they articulate clear value? Connect features to pain points?
- **Objection Handling**: Did they handle pushback effectively?
- **Closing**: Did they move toward a next step? Was the CTA clear?
- **Rapport**: Was the tone appropriate? Did they build trust?

Return:
{{
  "scores": {{"discovery": X, "value_prop": X, "objection_handling": X, "closing": X, "rapport": X}},
  "overall": <average>,
  "top_strength": "<what they did best>",
  "top_improvement": "<biggest area to improve>",
  "coaching_tip": "<1 specific, actionable tip>"
}}"""


@mcp.prompt()
def suggest_next_action_prompt(contact_data: str, recent_activities: str = "") -> str:
    """Suggest the optimal next action for a contact."""
    return f"""You are QuotaHit's AI Orchestrator. Given this contact's data and recent activities, suggest the single best next action.

Contact:
{contact_data}

Recent Activities:
{recent_activities}

Consider:
- Current pipeline stage and score
- Time since last contact
- Deal value and timeline urgency
- Available channels (email, call, WhatsApp, LinkedIn)

Return:
{{
  "action": "<specific action>",
  "channel": "<email|call|whatsapp|linkedin>",
  "urgency": "high" | "medium" | "low",
  "reasoning": "<why this action, why now>",
  "draft": "<draft message or talking points if applicable>"
}}"""


# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    mcp.run(transport="stdio")
