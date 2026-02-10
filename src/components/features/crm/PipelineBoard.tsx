"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ACTIVE_STAGES,
  STAGE_CONFIG,
  type Contact,
  type DealStage,
} from "@/types/crm";
import {
  GripVertical,
  Building2,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
  Trophy,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineBoardProps {
  pipeline: Record<string, Contact[]>;
  onStageChange: (contactId: string, newStage: DealStage) => Promise<unknown>;
  onContactClick: (contact: Contact) => void;
}

function formatDaysSince(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

function ContactCard({
  contact,
  onClick,
  onDragStart,
}: {
  contact: Contact;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const scoreColor =
    contact.lead_score >= 70
      ? "text-automationgreen"
      : contact.lead_score >= 40
        ? "text-warningamber"
        : "text-silver";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="p-3 rounded-lg bg-graphite border border-gunmetal hover:border-neonblue/30 cursor-pointer transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-platinum truncate">
            {contact.first_name} {contact.last_name || ""}
          </p>
          {contact.company && (
            <p className="text-xs text-silver flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{contact.company}</span>
            </p>
          )}
        </div>
        <GripVertical className="h-4 w-4 text-mist opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>

      <div className="flex items-center justify-between mt-2 gap-2">
        {contact.deal_value > 0 && (
          <span className="text-xs text-automationgreen flex items-center gap-0.5">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(contact.deal_value)}
          </span>
        )}
        <span className={cn("text-xs font-medium", scoreColor)}>
          {contact.lead_score}pts
        </span>
        <span className="text-xs text-mist flex items-center gap-0.5 ml-auto">
          <Clock className="h-3 w-3" />
          {formatDaysSince(contact.last_contacted_at)}
        </span>
      </div>
    </div>
  );
}

export function PipelineBoard({
  pipeline,
  onStageChange,
  onContactClick,
}: PipelineBoardProps) {
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [dragContactId, setDragContactId] = useState<string | null>(null);
  const [showWon, setShowWon] = useState(false);
  const [showLost, setShowLost] = useState(false);

  const handleDragStart = (contactId: string) => (e: React.DragEvent) => {
    setDragContactId(contactId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (stage: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (stage: DealStage) => async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverStage(null);
    if (dragContactId) {
      await onStageChange(dragContactId, stage);
      setDragContactId(null);
    }
  };

  const stageTotal = (stage: string) => {
    const contacts = pipeline[stage] || [];
    return contacts.reduce((sum, c) => sum + (c.deal_value || 0), 0);
  };

  const wonContacts = pipeline["won"] || [];
  const lostContacts = pipeline["lost"] || [];

  return (
    <div className="space-y-4">
      {/* Active stages - horizontal scrollable */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {ACTIVE_STAGES.map((stage) => {
          const config = STAGE_CONFIG[stage];
          const contacts = pipeline[stage] || [];
          const isOver = dragOverStage === stage;

          return (
            <div
              key={stage}
              className={cn(
                "flex-shrink-0 w-[260px] rounded-xl border transition-colors",
                isOver
                  ? "border-neonblue bg-neonblue/5"
                  : "border-gunmetal bg-onyx"
              )}
              onDragOver={handleDragOver(stage)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop(stage)}
            >
              {/* Column header */}
              <div className="p-3 border-b border-gunmetal">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        config.bgColor.replace("/10", "")
                      )}
                      style={{
                        backgroundColor: `var(--${config.color.replace("text-", "")}, currentColor)`,
                      }}
                    />
                    <span className={cn("text-sm font-medium", config.color)}>
                      {config.label}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-graphite text-mist text-xs px-1.5 py-0"
                    >
                      {contacts.length}
                    </Badge>
                  </div>
                  {stageTotal(stage) > 0 && (
                    <span className="text-xs text-silver">
                      {formatCurrency(stageTotal(stage))}
                    </span>
                  )}
                </div>
              </div>

              {/* Contact cards */}
              <div className="p-2 space-y-2 min-h-[100px] max-h-[60vh] overflow-y-auto">
                {contacts.length === 0 ? (
                  <p className="text-xs text-mist text-center py-6">
                    Drop contacts here
                  </p>
                ) : (
                  contacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onClick={() => onContactClick(contact)}
                      onDragStart={handleDragStart(contact.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Won / Lost collapsed sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Won */}
        <Card
          className="bg-onyx border-gunmetal cursor-pointer"
          onClick={() => setShowWon(!showWon)}
          onDragOver={handleDragOver("won")}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop("won")}
        >
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-automationgreen" />
              <span className="text-sm font-medium text-automationgreen">
                Won
              </span>
              <Badge
                variant="secondary"
                className="bg-automationgreen/10 text-automationgreen text-xs"
              >
                {wonContacts.length}
              </Badge>
              {stageTotal("won") > 0 && (
                <span className="text-xs text-silver ml-2">
                  {formatCurrency(stageTotal("won"))}
                </span>
              )}
            </div>
            {showWon ? (
              <ChevronUp className="h-4 w-4 text-mist" />
            ) : (
              <ChevronDown className="h-4 w-4 text-mist" />
            )}
          </div>
          {showWon && wonContacts.length > 0 && (
            <div className="px-3 pb-3 space-y-2">
              {wonContacts.map((c) => (
                <ContactCard
                  key={c.id}
                  contact={c}
                  onClick={() => onContactClick(c)}
                  onDragStart={handleDragStart(c.id)}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Lost */}
        <Card
          className="bg-onyx border-gunmetal cursor-pointer"
          onClick={() => setShowLost(!showLost)}
          onDragOver={handleDragOver("lost")}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop("lost")}
        >
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-errorred" />
              <span className="text-sm font-medium text-errorred">Lost</span>
              <Badge
                variant="secondary"
                className="bg-errorred/10 text-errorred text-xs"
              >
                {lostContacts.length}
              </Badge>
            </div>
            {showLost ? (
              <ChevronUp className="h-4 w-4 text-mist" />
            ) : (
              <ChevronDown className="h-4 w-4 text-mist" />
            )}
          </div>
          {showLost && lostContacts.length > 0 && (
            <div className="px-3 pb-3 space-y-2">
              {lostContacts.map((c) => (
                <ContactCard
                  key={c.id}
                  contact={c}
                  onClick={() => onContactClick(c)}
                  onDragStart={handleDragStart(c.id)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
