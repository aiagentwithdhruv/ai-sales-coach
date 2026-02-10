"use client";

import { useState, useEffect } from "react";
import { useCRM } from "@/hooks/useCRM";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PipelineBoard } from "@/components/features/crm/PipelineBoard";
import { ContactsTable } from "@/components/features/crm/ContactsTable";
import { ContactQuickAdd } from "@/components/features/crm/ContactQuickAdd";
import { ContactDetailSheet } from "@/components/features/crm/ContactDetailSheet";
import { ImportDialog } from "@/components/features/crm/ImportDialog";
import {
  ACTIVE_STAGES,
  STAGE_CONFIG,
  type Contact,
  type DealStage,
  type ContactFilters,
} from "@/types/crm";
import {
  Users,
  DollarSign,
  Target,
  Clock,
  Plus,
  Search,
  Upload,
  LayoutGrid,
  List,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

export default function CRMPage() {
  const crm = useCRM();
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [stageFilter, setStageFilter] = useState<DealStage | "all">("all");

  // Fetch pipeline view on mount
  useEffect(() => {
    crm.fetchPipeline();
  }, []);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      crm.updateFilters({ search: searchInput || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Stage filter
  useEffect(() => {
    crm.updateFilters({ stage: stageFilter });
  }, [stageFilter]);

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDetail(true);
  };

  const handleSort = (sortBy: ContactFilters["sortBy"]) => {
    const newOrder =
      crm.filters.sortBy === sortBy && crm.filters.sortOrder === "asc"
        ? "desc"
        : "asc";
    crm.updateFilters({ sortBy, sortOrder: newOrder });
  };

  const handleStageChange = async (contactId: string, newStage: DealStage) => {
    await crm.changeStage(contactId, newStage);
    // Refresh pipeline
    crm.fetchPipeline();
  };

  const stats = crm.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-platinum">CRM</h1>
          <p className="text-sm text-silver">
            Manage your sales pipeline and contacts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImport(true)}
            className="border-gunmetal text-silver hover:text-platinum gap-2"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowQuickAdd(true)}
            className="bg-neonblue hover:bg-electricblue text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-neonblue" />
              </div>
              <div>
                <p className="text-2xl font-bold text-platinum">
                  {stats.totalContacts}
                </p>
                <p className="text-xs text-mist">Total Contacts</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-automationgreen/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-automationgreen" />
              </div>
              <div>
                <p className="text-2xl font-bold text-automationgreen">
                  {formatCurrency(stats.totalPipelineValue)}
                </p>
                <p className="text-xs text-mist">Pipeline Value</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warningamber/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-warningamber" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warningamber">
                  {formatCurrency(stats.weightedValue)}
                </p>
                <p className="text-xs text-mist">Weighted Value</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-errorred/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-errorred" />
              </div>
              <div>
                <p className="text-2xl font-bold text-errorred">
                  {stats.needsFollowUp}
                </p>
                <p className="text-xs text-mist">Needs Follow-Up</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
          <Input
            placeholder="Search contacts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 bg-graphite border-gunmetal text-platinum"
          />
        </div>

        {/* Stage filter */}
        <Select
          value={stageFilter}
          onValueChange={(v) => setStageFilter(v as DealStage | "all")}
        >
          <SelectTrigger className="w-[140px] bg-graphite border-gunmetal text-platinum">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent className="bg-graphite border-gunmetal">
            <SelectItem value="all">All Stages</SelectItem>
            {ACTIVE_STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                <span className={STAGE_CONFIG[stage].color}>
                  {STAGE_CONFIG[stage].label}
                </span>
              </SelectItem>
            ))}
            <SelectItem value="won">
              <span className="text-automationgreen">Won</span>
            </SelectItem>
            <SelectItem value="lost">
              <span className="text-errorred">Lost</span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-gunmetal bg-graphite p-0.5 ml-auto">
          <button
            onClick={() => setView("pipeline")}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              view === "pipeline"
                ? "bg-neonblue/10 text-neonblue"
                : "text-mist hover:text-silver"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Pipeline
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              view === "list"
                ? "bg-neonblue/10 text-neonblue"
                : "text-mist hover:text-silver"
            )}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
        </div>
      </div>

      {/* Loading */}
      {crm.isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neonblue" />
        </div>
      )}

      {/* Pipeline View */}
      {!crm.isLoading && view === "pipeline" && (
        <PipelineBoard
          pipeline={crm.pipeline}
          onStageChange={handleStageChange}
          onContactClick={handleContactClick}
        />
      )}

      {/* List View */}
      {!crm.isLoading && view === "list" && (
        <ContactsTable
          contacts={crm.contacts}
          filters={crm.filters}
          onSort={handleSort}
          onContactClick={handleContactClick}
        />
      )}

      {/* Quick Add Dialog */}
      <ContactQuickAdd
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        onSubmit={crm.createContact}
        onEnrich={crm.enrichContact}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImport={crm.importContacts}
      />

      {/* Contact Detail Sheet */}
      <ContactDetailSheet
        contact={selectedContact}
        open={showDetail}
        onOpenChange={(open) => {
          setShowDetail(open);
          if (!open) {
            // Refresh data when closing detail
            crm.fetchContacts();
            crm.fetchPipeline();
          }
        }}
        onEnrich={crm.enrichContact}
        onDelete={crm.deleteContact}
        onSuggestFollowUp={crm.suggestFollowUp}
        onLogActivity={crm.logActivity}
        getContactDetails={crm.getContact}
      />
    </div>
  );
}
