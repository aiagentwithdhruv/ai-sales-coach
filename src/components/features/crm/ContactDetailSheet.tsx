"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  STAGE_CONFIG,
  type Contact,
  type Activity,
  type DealStage,
} from "@/types/crm";
import {
  Mail,
  Phone,
  Globe,
  Sparkles,
  Loader2,
  Building2,
  Lightbulb,
  MessageSquare,
  FileText,
  Mic,
  Search,
  Trash2,
  ExternalLink,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  PenLine,
  Calendar,
  Zap,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ContactDetailSheetProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrich: (id: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<boolean>;
  onSuggestFollowUp: (id: string) => Promise<{
    urgency: string;
    reason: string;
    suggested_action: string;
    suggested_channel: string;
    draft_message: string;
  } | null>;
  onLogActivity: (
    contactId: string,
    type: string,
    title: string,
    description?: string
  ) => Promise<unknown>;
  getContactDetails: (
    id: string
  ) => Promise<{ contact: Contact; activities: Activity[] } | null>;
  allContacts?: Contact[];
}

const ACTIVITY_ICONS: Record<string, typeof Mail> = {
  note: PenLine,
  call: Phone,
  email_sent: Send,
  email_opened: Mail,
  meeting: Calendar,
  research: Search,
  quote_sent: FileText,
  stage_change: Zap,
  enrichment: Sparkles,
  practice: Mic,
  system: MessageSquare,
  task: Clock,
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ContactDetailSheet({
  contact,
  open,
  onOpenChange,
  onEnrich,
  onDelete,
  onSuggestFollowUp,
  onLogActivity,
  getContactDetails,
  allContacts,
}: ContactDetailSheetProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [enriching, setEnriching] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<{
    urgency: string;
    reason: string;
    suggested_action: string;
    suggested_channel: string;
    draft_message: string;
  } | null>(null);
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [freshContact, setFreshContact] = useState<Contact | null>(null);

  const c = freshContact || contact;

  // Load details when opened
  useEffect(() => {
    if (open && contact?.id) {
      getContactDetails(contact.id).then((data) => {
        if (data) {
          setActivities(data.activities);
          setFreshContact(data.contact);
        }
      });
      setSuggestion(null);
      setShowEnrichment(false);
      setNoteText("");
    }
    if (!open) {
      setFreshContact(null);
    }
  }, [open, contact?.id, getContactDetails]);

  if (!c) return null;

  const stageConfig = STAGE_CONFIG[c.deal_stage];
  const enrichment = c.enrichment_data || {};
  const hasEnrichment = c.enrichment_status === "enriched";

  const handleEnrich = async () => {
    setEnriching(true);
    await onEnrich(c.id);
    // Refresh
    const data = await getContactDetails(c.id);
    if (data) {
      setFreshContact(data.contact);
    }
    setEnriching(false);
  };

  const handleSuggest = async () => {
    setSuggesting(true);
    const result = await onSuggestFollowUp(c.id);
    setSuggestion(result);
    setSuggesting(false);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    await onLogActivity(c.id, "note", "Note added", noteText.trim());
    // Refresh
    const data = await getContactDetails(c.id);
    if (data) setActivities(data.activities);
    setNoteText("");
    setSavingNote(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this contact? This cannot be undone.")) return;
    setDeleting(true);
    const success = await onDelete(c.id);
    setDeleting(false);
    if (success) onOpenChange(false);
  };

  // Build action URLs
  const contactName = `${c.first_name} ${c.last_name || ""}`.trim();
  const researchUrl = `/dashboard/research?contactId=${c.id}&company=${encodeURIComponent(c.company || "")}`;
  const followUpUrl = `/dashboard/follow-ups?contactId=${c.id}&name=${encodeURIComponent(contactName)}&company=${encodeURIComponent(c.company || "")}&email=${encodeURIComponent(c.email || "")}`;
  const quoteUrl = `/dashboard/quotations?contactId=${c.id}&name=${encodeURIComponent(contactName)}&company=${encodeURIComponent(c.company || "")}&email=${encodeURIComponent(c.email || "")}`;
  const practiceUrl = `/dashboard/practice?persona=custom&name=${encodeURIComponent(contactName)}&role=${encodeURIComponent(c.title || "")}&company=${encodeURIComponent(c.company || "")}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-onyx border-gunmetal w-full sm:max-w-lg overflow-y-auto"
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="text-platinum text-lg">
            {contactName}
          </SheetTitle>
          <SheetDescription className="text-silver">
            {c.title && `${c.title} `}
            {c.company && `at ${c.company}`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-4 px-4 pb-6">
          {/* Top badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              className={cn(
                "text-xs",
                stageConfig.bgColor,
                stageConfig.color,
                "border-transparent"
              )}
            >
              {stageConfig.label}
            </Badge>
            {c.deal_value > 0 && (
              <Badge className="bg-automationgreen/10 text-automationgreen border-transparent text-xs">
                ${c.deal_value.toLocaleString()}
              </Badge>
            )}
            <Badge
              className={cn(
                "border-transparent text-xs",
                c.lead_score >= 70
                  ? "bg-automationgreen/10 text-automationgreen"
                  : c.lead_score >= 40
                    ? "bg-warningamber/10 text-warningamber"
                    : "bg-silver/10 text-silver"
              )}
            >
              Score: {c.lead_score}
            </Badge>
          </div>

          {/* Contact info */}
          <div className="space-y-2">
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className="flex items-center gap-2 text-sm text-silver hover:text-neonblue transition-colors"
              >
                <Mail className="h-4 w-4" />
                {c.email}
              </a>
            )}
            {c.phone && (
              <a
                href={`tel:${c.phone}`}
                className="flex items-center gap-2 text-sm text-silver hover:text-neonblue transition-colors"
              >
                <Phone className="h-4 w-4" />
                {c.phone}
              </a>
            )}
            {c.company && (
              <p className="flex items-center gap-2 text-sm text-silver">
                <Building2 className="h-4 w-4" />
                {c.company}
              </p>
            )}
          </div>

          {/* 1-Click Actions */}
          <div>
            <h4 className="text-xs font-medium text-mist uppercase tracking-wider mb-2">
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link href={researchUrl}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-gunmetal text-silver hover:text-platinum hover:border-neonblue justify-start gap-2"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Research
                </Button>
              </Link>
              <Link href={followUpUrl}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-gunmetal text-silver hover:text-platinum hover:border-neonblue justify-start gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  Follow-Up
                </Button>
              </Link>
              <Link href={quoteUrl}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-gunmetal text-silver hover:text-platinum hover:border-neonblue justify-start gap-2"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Quote
                </Button>
              </Link>
              <Link href={practiceUrl}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-gunmetal text-silver hover:text-platinum hover:border-neonblue justify-start gap-2"
                >
                  <Mic className="h-3.5 w-3.5" />
                  Practice
                </Button>
              </Link>
            </div>
          </div>

          {/* AI Follow-Up Suggestion */}
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSuggest}
              disabled={suggesting}
              className="w-full border-gunmetal text-neonblue hover:bg-neonblue/10 gap-2"
            >
              {suggesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4" />
              )}
              {suggesting ? "Generating..." : "AI Follow-Up Suggestion"}{" "}
              <span className="text-mist text-xs">(1 credit)</span>
            </Button>
            {suggestion && (
              <div className="mt-2 p-3 rounded-lg bg-graphite border border-gunmetal space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "text-xs border-transparent",
                      suggestion.urgency === "high"
                        ? "bg-errorred/10 text-errorred"
                        : suggestion.urgency === "medium"
                          ? "bg-warningamber/10 text-warningamber"
                          : "bg-silver/10 text-silver"
                    )}
                  >
                    {suggestion.urgency} urgency
                  </Badge>
                  <span className="text-xs text-mist">
                    via {suggestion.suggested_channel}
                  </span>
                </div>
                <p className="text-sm text-platinum">{suggestion.reason}</p>
                <p className="text-xs text-silver">
                  {suggestion.suggested_action}
                </p>
                {suggestion.draft_message && (
                  <div className="mt-1 p-2 rounded bg-onyx text-xs text-silver italic">
                    &ldquo;{suggestion.draft_message}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enrichment */}
          <div>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowEnrichment(!showEnrichment)}
            >
              <h4 className="text-xs font-medium text-mist uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Enrichment
                {hasEnrichment && (
                  <Badge className="bg-automationgreen/10 text-automationgreen border-transparent text-[10px] ml-1">
                    Done
                  </Badge>
                )}
              </h4>
              {showEnrichment ? (
                <ChevronUp className="h-4 w-4 text-mist" />
              ) : (
                <ChevronDown className="h-4 w-4 text-mist" />
              )}
            </div>

            {showEnrichment && (
              <div className="mt-2 space-y-2">
                {hasEnrichment ? (
                  <div className="p-3 rounded-lg bg-graphite border border-gunmetal space-y-3 text-sm">
                    {enrichment.company_overview && (
                      <div>
                        <p className="text-xs text-mist font-medium mb-1">
                          Overview
                        </p>
                        <p className="text-silver">
                          {enrichment.company_overview}
                        </p>
                      </div>
                    )}
                    {enrichment.pain_points &&
                      enrichment.pain_points.length > 0 && (
                        <div>
                          <p className="text-xs text-mist font-medium mb-1">
                            Pain Points
                          </p>
                          <ul className="space-y-1">
                            {enrichment.pain_points.map((p, i) => (
                              <li
                                key={i}
                                className="text-silver flex items-start gap-1"
                              >
                                <span className="text-errorred mt-1">*</span>{" "}
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    {enrichment.conversation_starters &&
                      enrichment.conversation_starters.length > 0 && (
                        <div>
                          <p className="text-xs text-mist font-medium mb-1">
                            Conversation Starters
                          </p>
                          <ul className="space-y-1">
                            {enrichment.conversation_starters.map((s, i) => (
                              <li key={i} className="text-silver text-xs">
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    {enrichment.tech_stack &&
                      enrichment.tech_stack.length > 0 && (
                        <div>
                          <p className="text-xs text-mist font-medium mb-1">
                            Tech Stack
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {enrichment.tech_stack.map((t, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="bg-onyx text-silver text-xs"
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    {enrichment.website && (
                      <a
                        href={enrichment.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-neonblue flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {enrichment.website}
                      </a>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEnrich}
                      disabled={enriching}
                      className="w-full border-gunmetal text-silver mt-2"
                    >
                      {enriching ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      Re-Enrich (1 credit)
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnrich}
                    disabled={
                      enriching || c.enrichment_status === "enriching"
                    }
                    className="w-full border-gunmetal text-neonblue hover:bg-neonblue/10 gap-2"
                  >
                    {enriching || c.enrichment_status === "enriching" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {enriching || c.enrichment_status === "enriching"
                      ? "Enriching..."
                      : "Enrich with AI (1 credit)"}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Add Note */}
          <div>
            <h4 className="text-xs font-medium text-mist uppercase tracking-wider mb-2">
              Add Note
            </h4>
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="bg-graphite border-gunmetal text-platinum text-sm min-h-[60px] resize-none"
              />
            </div>
            {noteText.trim() && (
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={savingNote}
                className="mt-2 bg-neonblue hover:bg-electricblue text-white"
              >
                {savingNote ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <PenLine className="h-3 w-3 mr-1" />
                )}
                Save Note
              </Button>
            )}
          </div>

          {/* Activity Timeline */}
          <div>
            <h4 className="text-xs font-medium text-mist uppercase tracking-wider mb-2">
              Activity Timeline
            </h4>
            {activities.length === 0 ? (
              <p className="text-sm text-mist py-4 text-center">
                No activity yet
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => {
                  const Icon =
                    ACTIVITY_ICONS[activity.type] || MessageSquare;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3"
                    >
                      <div className="p-1.5 rounded-lg bg-graphite">
                        <Icon className="h-3.5 w-3.5 text-silver" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-platinum">
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-mist mt-0.5 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                        <p className="text-xs text-mist mt-1">
                          {formatTimeAgo(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Related Contacts (same company) */}
          {c.company && allContacts && (() => {
            const related = allContacts.filter(
              (rc) => rc.id !== c.id && rc.company && rc.company.toLowerCase() === c.company!.toLowerCase()
            );
            if (related.length === 0) return null;
            return (
              <div>
                <h4 className="text-xs font-medium text-mist uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Same Company ({related.length})
                </h4>
                <div className="space-y-2">
                  {related.slice(0, 5).map((rc) => {
                    const rcStage = STAGE_CONFIG[rc.deal_stage];
                    return (
                      <div
                        key={rc.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-graphite/50 border border-gunmetal/30"
                      >
                        <div>
                          <p className="text-sm text-platinum">
                            {rc.first_name} {rc.last_name || ""}
                          </p>
                          {rc.title && (
                            <p className="text-xs text-mist">{rc.title}</p>
                          )}
                        </div>
                        <Badge
                          className={cn(
                            "text-[10px]",
                            rcStage.bgColor,
                            rcStage.color,
                            "border-transparent"
                          )}
                        >
                          {rcStage.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Tags */}
          {c.tags && c.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-mist uppercase tracking-wider mb-2">
                Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {c.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-neonblue/10 text-neonblue text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Delete */}
          <div className="pt-4 border-t border-gunmetal">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full border-errorred/30 text-errorred hover:bg-errorred/10"
            >
              {deleting ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-3 w-3 mr-1" />
              )}
              Delete Contact
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
