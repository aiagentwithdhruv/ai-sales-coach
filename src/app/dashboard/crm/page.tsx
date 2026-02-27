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
  BarChart3,
  Trash2,
  Tag,
  ArrowRightLeft,
  Webhook,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/auth-token";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<{ webhook_url: string; webhook_key: string; n8n_setup: Record<string, string> } | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showScout, setShowScout] = useState(false);
  const [scoutLoading, setScoutLoading] = useState(false);
  const [scoutCount, setScoutCount] = useState(10);
  const [scoutResult, setScoutResult] = useState<{ count: number; message: string; error?: string } | null>(null);

  const handleScoutDiscover = async () => {
    setScoutLoading(true);
    setScoutResult(null);
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/scout/discover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          count: scoutCount,
          product_description: localStorage.getItem("icp_product") || undefined,
          target_customer: localStorage.getItem("icp_customer") || undefined,
          website_url: localStorage.getItem("icp_website") || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setScoutResult({ count: data.count, message: data.message });
        // Refresh CRM data to show new leads
        crm.fetchContacts();
        crm.fetchPipeline();
      } else {
        setScoutResult({ count: 0, message: data.error || "Failed to discover leads", error: data.error });
      }
    } catch {
      setScoutResult({ count: 0, message: "Network error. Check your connection.", error: "Network error" });
    }
    setScoutLoading(false);
  };

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

  const handleBulkStageChange = async (stage: DealStage) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    await crm.bulkAction({
      type: "stage_change",
      contactIds: Array.from(selectedIds),
      payload: { stage },
    });
    setSelectedIds(new Set());
    crm.fetchPipeline();
    setBulkLoading(false);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    await crm.bulkAction({
      type: "delete",
      contactIds: Array.from(selectedIds),
    });
    setSelectedIds(new Set());
    crm.fetchPipeline();
    setBulkLoading(false);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === crm.contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(crm.contacts.map((c) => c.id)));
    }
  };

  const fetchWebhookInfo = async () => {
    setWebhookLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/contacts/webhook", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWebhookInfo(data);
      }
    } catch { /* silent */ }
    setWebhookLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <Link href="/dashboard/crm/analytics">
            <Button
              variant="outline"
              size="sm"
              className="border-gunmetal text-silver hover:text-platinum gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowWebhook((v) => !v); if (!webhookInfo) fetchWebhookInfo(); }}
            className={cn("border-gunmetal text-silver hover:text-platinum gap-2", showWebhook && "border-neonblue text-neonblue")}
          >
            <Webhook className="h-4 w-4" />
            <span className="hidden sm:inline">Webhook</span>
          </Button>
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
            onClick={() => setShowScout(!showScout)}
            className={cn(
              "gap-2",
              showScout
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-gradient-to-r from-purple-600 to-neonblue hover:from-purple-700 hover:to-electricblue text-white"
            )}
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Find Leads</span>
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

      {/* Webhook Info Card */}
      {showWebhook && (
        <Card className="bg-onyx border-neonblue/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-neonblue" />
                <h3 className="text-sm font-semibold text-platinum">Lead Capture Webhook</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowWebhook(false)} className="h-7 w-7 p-0 text-silver">
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-silver">
              Send leads from any form, n8n workflow, or Zapier to this URL. They&apos;ll appear in your CRM instantly.
            </p>
            {webhookLoading ? (
              <div className="flex items-center gap-2 text-mist text-xs">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading webhook URL...
              </div>
            ) : webhookInfo ? (
              <div className="space-y-3">
                {/* Webhook URL */}
                <div>
                  <label className="text-[10px] text-mist uppercase tracking-wider block mb-1">Webhook URL (copy this)</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-graphite border border-gunmetal rounded px-3 py-2 text-neonblue font-mono break-all select-all">
                      {webhookInfo.webhook_url}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(webhookInfo.webhook_url)}
                      className="border-gunmetal text-silver hover:text-platinum shrink-0"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-automationgreen" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* n8n Setup */}
                <div className="bg-graphite/50 rounded-lg p-3 border border-gunmetal/30">
                  <p className="text-xs text-platinum font-medium mb-2">n8n Setup (5 steps)</p>
                  <ol className="text-[11px] text-silver space-y-1 list-decimal list-inside">
                    <li>Add an <strong className="text-platinum">HTTP Request</strong> node</li>
                    <li>Method: <strong className="text-platinum">POST</strong></li>
                    <li>Paste the webhook URL above</li>
                    <li>Body Type: <strong className="text-platinum">JSON</strong></li>
                    <li>Map fields: <code className="text-neonblue">name, email, phone, company, source</code></li>
                  </ol>
                </div>

                {/* Supported Fields */}
                <div>
                  <p className="text-[10px] text-mist uppercase tracking-wider mb-1">Supported Fields</p>
                  <div className="flex flex-wrap gap-1">
                    {["name", "email", "phone", "company", "title", "source", "notes", "tags", "deal_value"].map((f) => (
                      <span key={f} className="text-[10px] bg-graphite border border-gunmetal/50 rounded px-1.5 py-0.5 text-silver font-mono">{f}</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-mist mt-1">Also accepts: first_name, last_name, full_name, mobile, organization, message, utm_source, utm_campaign</p>
                </div>

                {/* Batch */}
                <p className="text-[10px] text-mist">
                  Batch import: Send <code className="text-neonblue">{"{ \"leads\": [...] }"}</code> for multiple leads at once.
                </p>
              </div>
            ) : (
              <p className="text-xs text-errorred">Failed to load webhook info. Try again.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scout AI Discovery Panel */}
      {showScout && (
        <Card className="bg-onyx border-purple-500/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm font-semibold text-platinum">Scout AI — Find Leads</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowScout(false)} className="h-7 w-7 p-0 text-silver">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-silver">
              Scout AI uses your Ideal Customer Profile to discover matching companies and contacts. Leads are saved directly to your CRM.
            </p>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-mist uppercase tracking-wider block mb-1">Number of leads</label>
                <div className="flex items-center gap-2">
                  {[10, 25, 50].map((n) => (
                    <button
                      key={n}
                      onClick={() => setScoutCount(n)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        scoutCount === n
                          ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                          : "bg-graphite text-silver border border-gunmetal hover:border-silver/30"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleScoutDiscover}
                disabled={scoutLoading}
                className="bg-gradient-to-r from-purple-600 to-neonblue hover:from-purple-700 hover:to-electricblue text-white gap-2"
              >
                {scoutLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Discovering...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Find {scoutCount} Leads
                  </>
                )}
              </Button>
            </div>

            {scoutResult && (
              <div className={cn(
                "p-3 rounded-lg text-sm",
                scoutResult.error
                  ? "bg-errorred/10 border border-errorred/20 text-errorred"
                  : "bg-automationgreen/10 border border-automationgreen/20 text-automationgreen"
              )}>
                {scoutResult.error ? (
                  <p>{scoutResult.message}</p>
                ) : (
                  <p>{scoutResult.message} — they&apos;re now in your pipeline below.</p>
                )}
              </div>
            )}

            <p className="text-[10px] text-mist">
              Tip: Configure your ICP in Settings for better results. Scout uses your product description, target customer, and industry to find relevant leads.
            </p>
          </CardContent>
        </Card>
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

        {/* Per page selector */}
        <Select
          value={String(crm.filters.limit || 50)}
          onValueChange={(v) => crm.updateFilters({ limit: Number(v), page: 1 })}
        >
          <SelectTrigger className="w-[90px] bg-graphite border-gunmetal text-platinum text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-graphite border-gunmetal">
            {[10, 20, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} / page
              </SelectItem>
            ))}
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

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-neonblue/5 border border-neonblue/20">
          <span className="text-sm text-platinum font-medium">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-gunmetal" />
          <Select onValueChange={(v) => handleBulkStageChange(v as DealStage)}>
            <SelectTrigger className="w-[150px] h-8 text-xs bg-graphite border-gunmetal">
              <div className="flex items-center gap-1.5">
                <ArrowRightLeft className="h-3 w-3" />
                Move to Stage
              </div>
            </SelectTrigger>
            <SelectContent className="bg-graphite border-gunmetal">
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
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkDelete}
            disabled={bulkLoading}
            className="h-8 text-xs border-errorred/30 text-errorred hover:bg-errorred/10 gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-mist hover:text-silver ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      {/* Loading */}
      {crm.isLoading && !crm.error && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neonblue" />
        </div>
      )}

      {/* Error State */}
      {crm.error && (
        <Card className="bg-onyx border-errorred/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-errorred/10 flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-errorred" />
            </div>
            <h3 className="text-lg text-platinum font-medium mb-1">Connection Issue</h3>
            <p className="text-sm text-silver mb-4 max-w-sm">
              {crm.error}
            </p>
            <Button
              onClick={() => { crm.fetchPipeline(); crm.fetchContacts(); }}
              className="bg-neonblue hover:bg-electricblue text-white gap-2"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pipeline View */}
      {!crm.isLoading && !crm.error && view === "pipeline" && (
        <PipelineBoard
          pipeline={crm.pipeline}
          onStageChange={handleStageChange}
          onContactClick={handleContactClick}
        />
      )}

      {/* List View */}
      {!crm.isLoading && !crm.error && view === "list" && (
        <ContactsTable
          contacts={crm.contacts}
          filters={crm.filters}
          onSort={handleSort}
          onContactClick={handleContactClick}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleSelectAll={toggleSelectAll}
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
        allContacts={crm.contacts}
      />
    </div>
  );
}
