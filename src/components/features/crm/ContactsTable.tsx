"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { STAGE_CONFIG, type Contact, type ContactFilters } from "@/types/crm";
import {
  ArrowUpDown,
  Building2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactsTableProps {
  contacts: Contact[];
  filters: ContactFilters;
  onSort: (sortBy: ContactFilters["sortBy"]) => void;
  onContactClick: (contact: Contact) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = now - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCurrency(value: number): string {
  if (!value) return "—";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

function SortableHead({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  field: ContactFilters["sortBy"];
  currentSort?: ContactFilters["sortBy"];
  currentOrder?: string;
  onSort: (field: ContactFilters["sortBy"]) => void;
}) {
  return (
    <TableHead
      className="cursor-pointer hover:text-platinum transition-colors select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={cn(
            "h-3 w-3",
            currentSort === field ? "text-neonblue" : "text-mist"
          )}
        />
        {currentSort === field && (
          <span className="text-[10px] text-neonblue">
            {currentOrder === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </TableHead>
  );
}

export function ContactsTable({
  contacts,
  filters,
  onSort,
  onContactClick,
}: ContactsTableProps) {
  return (
    <div className="rounded-xl border border-gunmetal bg-onyx overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-gunmetal hover:bg-transparent">
            <SortableHead
              label="Name"
              field="name"
              currentSort={filters.sortBy}
              currentOrder={filters.sortOrder}
              onSort={onSort}
            />
            <SortableHead
              label="Company"
              field="company"
              currentSort={filters.sortBy}
              currentOrder={filters.sortOrder}
              onSort={onSort}
            />
            <TableHead>Stage</TableHead>
            <SortableHead
              label="Deal Value"
              field="deal_value"
              currentSort={filters.sortBy}
              currentOrder={filters.sortOrder}
              onSort={onSort}
            />
            <SortableHead
              label="Score"
              field="lead_score"
              currentSort={filters.sortBy}
              currentOrder={filters.sortOrder}
              onSort={onSort}
            />
            <SortableHead
              label="Last Contact"
              field="last_contacted_at"
              currentSort={filters.sortBy}
              currentOrder={filters.sortOrder}
              onSort={onSort}
            />
            <SortableHead
              label="Follow Up"
              field="next_follow_up_at"
              currentSort={filters.sortBy}
              currentOrder={filters.sortOrder}
              onSort={onSort}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-12 text-silver"
              >
                No contacts found. Add your first contact to get started.
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => {
              const stageConfig = STAGE_CONFIG[contact.deal_stage];
              const scoreColor =
                contact.lead_score >= 70
                  ? "text-automationgreen"
                  : contact.lead_score >= 40
                    ? "text-warningamber"
                    : "text-silver";

              // Check if follow-up is overdue
              const isOverdue =
                contact.next_follow_up_at &&
                new Date(contact.next_follow_up_at) < new Date();

              return (
                <TableRow
                  key={contact.id}
                  className="border-gunmetal cursor-pointer hover:bg-graphite/50 transition-colors"
                  onClick={() => onContactClick(contact)}
                >
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-platinum">
                        {contact.first_name} {contact.last_name || ""}
                      </p>
                      {contact.title && (
                        <p className="text-xs text-mist">{contact.title}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.company ? (
                      <span className="text-sm text-silver flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {contact.company}
                      </span>
                    ) : (
                      <span className="text-mist">—</span>
                    )}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-sm text-silver">
                    {formatCurrency(contact.deal_value)}
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-sm font-medium", scoreColor)}>
                      {contact.lead_score}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-mist">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(contact.last_contacted_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {contact.next_follow_up_at ? (
                      <span
                        className={cn(
                          "text-sm",
                          isOverdue ? "text-errorred font-medium" : "text-mist"
                        )}
                      >
                        {formatDate(contact.next_follow_up_at)}
                        {isOverdue && " (overdue)"}
                      </span>
                    ) : (
                      <span className="text-mist">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
