"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  PhoneOutgoing,
  PhoneIncoming,
  Plus,
  Play,
  Pause,
  Trash2,
  BarChart3,
  Calendar,
  Clock,
  Loader2,
  Mic,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  Bot,
  CheckCircle,
  PhoneCall,
  Upload,
  FileSpreadsheet,
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/auth-token";
import type {
  AICallCampaign,
  AICall,
  AIAgent,
  CallDashboardStats,
  CampaignStatus,
} from "@/types/teams";
import { VOICE_OPTIONS } from "@/types/teams";

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Draft", color: "text-silver", bgColor: "bg-silver/10" },
  active: { label: "Active", color: "text-automationgreen", bgColor: "bg-automationgreen/10" },
  paused: { label: "Paused", color: "text-warningamber", bgColor: "bg-warningamber/10" },
  completed: { label: "Completed", color: "text-neonblue", bgColor: "bg-neonblue/10" },
};

async function authFetch(url: string, opts?: RequestInit) {
  const token = await getAuthToken();
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...opts?.headers,
    },
  });
}

export default function AICallingPage() {
  const [campaigns, setCampaigns] = useState<AICallCampaign[]>([]);
  const [calls, setCalls] = useState<AICall[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [stats, setStats] = useState<CallDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  // Create campaign dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"outbound" | "inbound">("outbound");
  const [newVoice, setNewVoice] = useState("alloy");
  const [newObjective, setNewObjective] = useState("");
  const [newAgentId, setNewAgentId] = useState("");
  const [creating, setCreating] = useState(false);
  // Quick call dialog
  const [showQuickCall, setShowQuickCall] = useState(false);
  const [quickCallTo, setQuickCallTo] = useState("");
  const [quickCallAgent, setQuickCallAgent] = useState("");
  const [quickCallName, setQuickCallName] = useState("");
  const [quickCalling, setQuickCalling] = useState(false);
  const [quickCallResult, setQuickCallResult] = useState<{ success: boolean; message: string } | null>(null);
  // Import contacts dialog
  const [showImport, setShowImport] = useState(false);
  const [importCampaignId, setImportCampaignId] = useState("");
  const [importSource, setImportSource] = useState<"csv" | "google_sheets" | "crm" | "zoho">("csv");
  const [importCSV, setImportCSV] = useState("");
  const [importSheetsUrl, setImportSheetsUrl] = useState("");
  const [importCrmStage, setImportCrmStage] = useState("all");
  const [zohoLeadStatus, setZohoLeadStatus] = useState("all");
  const [zohoSyncing, setZohoSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  // Direct call bar
  const [directPhone, setDirectPhone] = useState("");
  const [directAgent, setDirectAgent] = useState("");
  const [directName, setDirectName] = useState("");
  const [directCalling, setDirectCalling] = useState(false);
  const [directResult, setDirectResult] = useState<{ success: boolean; message: string } | null>(null);
  // Call detail expand
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  // Campaign execution state
  const [executingCampaignId, setExecutingCampaignId] = useState<string | null>(null);
  const [campaignProgress, setCampaignProgress] = useState<Record<string, {
    total: number; completed: number; failed: number; skipped: number;
    remaining: number; inProgress: boolean; currentContact?: string;
  }>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [campRes, callRes, agentRes] = await Promise.all([
        authFetch("/api/calling/campaigns"),
        authFetch("/api/calling?limit=10"),
        authFetch("/api/agents"),
      ]);
      if (campRes.ok) {
        const d = await campRes.json();
        setCampaigns(d.campaigns || []);
      }
      if (callRes.ok) {
        const d = await callRes.json();
        setCalls(d.calls || []);
        setStats(d.stats || null);
      }
      if (agentRes.ok) {
        const d = await agentRes.json();
        setAgents(d.agents || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await authFetch("/api/calling/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: newName,
          type: newType,
          voice_id: newVoice,
          objective: newObjective || undefined,
          agent_id: newAgentId || undefined,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewName("");
        setNewObjective("");
        setNewAgentId("");
        fetchData();
      }
    } catch {
      // silent
    }
    setCreating(false);
  };

  const handleQuickCall = async () => {
    if (!quickCallTo || !quickCallAgent) return;
    setQuickCalling(true);
    setQuickCallResult(null);
    try {
      const res = await authFetch("/api/calls/outbound", {
        method: "POST",
        body: JSON.stringify({
          to: quickCallTo,
          agentId: quickCallAgent,
          contactName: quickCallName || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuickCallResult({
          success: true,
          message: `Call initiated! Agent "${data.agent}" is calling ${quickCallTo}...`,
        });
        fetchData();
      } else {
        setQuickCallResult({
          success: false,
          message: data.error || "Failed to initiate call",
        });
      }
    } catch (err) {
      setQuickCallResult({
        success: false,
        message: err instanceof Error ? err.message : "Network error",
      });
    }
    setQuickCalling(false);
  };

  const handleImportContacts = async () => {
    if (!importCampaignId) return;
    setImporting(true);
    setImportResult(null);
    try {
      // For Zoho: first sync leads from Zoho → CRM, then import from CRM
      if (importSource === "zoho") {
        setZohoSyncing(true);
        // Step 1: Sync Zoho leads to local contacts
        const syncRes = await authFetch("/api/integrations", {
          method: "POST",
          body: JSON.stringify({
            action: "sync",
            provider: "zoho",
            sync_options: {
              phoneOnly: true,
              status: zohoLeadStatus === "all" ? undefined : zohoLeadStatus,
              limit: 200,
            },
          }),
        });
        const syncData = await syncRes.json();
        setZohoSyncing(false);

        if (!syncRes.ok || syncData.errors > 0) {
          setImportResult({
            success: false,
            message: syncData.error || `Sync had ${syncData.errors} errors. Check Integrations page.`,
          });
          setImporting(false);
          return;
        }

        // Step 2: Import synced contacts from CRM into campaign
        const res = await authFetch("/api/calling/contacts", {
          method: "POST",
          body: JSON.stringify({
            source: "crm",
            campaignId: importCampaignId,
            data: { crmFilter: { stage: zohoLeadStatus === "all" ? undefined : zohoLeadStatus } },
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setImportResult({
            success: true,
            message: `Synced ${syncData.synced} leads from Zoho → Imported ${data.imported} contacts to campaign (${data.total} total).`,
          });
        } else {
          setImportResult({ success: false, message: data.error || "Campaign import failed" });
        }
      } else {
        // Standard import (CSV, Google Sheets, CRM)
        const importData: Record<string, unknown> = {};
        if (importSource === "csv") importData.csv = importCSV;
        if (importSource === "google_sheets") importData.sheetsUrl = importSheetsUrl;
        if (importSource === "crm") importData.crmFilter = { stage: importCrmStage === "all" ? undefined : importCrmStage };

        const res = await authFetch("/api/calling/contacts", {
          method: "POST",
          body: JSON.stringify({
            source: importSource,
            campaignId: importCampaignId,
            data: importData,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setImportResult({
            success: true,
            message: `Imported ${data.imported} contacts (${data.total} total). ${data.skippedDuplicate > 0 ? `${data.skippedDuplicate} duplicates skipped.` : ""}`,
          });
          setImportCSV("");
          setImportSheetsUrl("");
        } else {
          setImportResult({ success: false, message: data.error || "Import failed" });
        }
      }
    } catch (err) {
      setImportResult({ success: false, message: err instanceof Error ? err.message : "Network error" });
    }
    setImporting(false);
  };

  const handleDirectCall = async () => {
    if (!directPhone || !directAgent) return;
    setDirectCalling(true);
    setDirectResult(null);
    try {
      const res = await authFetch("/api/calls/outbound", {
        method: "POST",
        body: JSON.stringify({
          to: directPhone,
          agentId: directAgent,
          contactName: directName || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDirectResult({
          success: true,
          message: `Calling ${directPhone}... Agent "${data.agent}" connected.`,
        });
        setDirectPhone("");
        setDirectName("");
        fetchData();
      } else {
        setDirectResult({ success: false, message: data.error || "Failed to initiate call" });
      }
    } catch (err) {
      setDirectResult({ success: false, message: err instanceof Error ? err.message : "Network error" });
    }
    setDirectCalling(false);
    setTimeout(() => setDirectResult(null), 6000);
  };

  const handleStartCampaign = async (id: string) => {
    setExecutingCampaignId(id);
    try {
      // Start campaign execution
      const res = await authFetch(`/api/calling/campaigns/${id}/execute`, {
        method: "POST",
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to start campaign");
        setExecutingCampaignId(null);
        return;
      }
      // Start polling for progress
      startProgressPolling(id);
      fetchData();
    } catch {
      alert("Failed to start campaign");
      setExecutingCampaignId(null);
    }
  };

  const handlePauseCampaign = async (id: string) => {
    await authFetch(`/api/calling/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "paused" }),
    });
    setExecutingCampaignId(null);
    fetchData();
  };

  const startProgressPolling = useCallback((campaignId: string) => {
    const poll = async () => {
      try {
        const res = await authFetch(`/api/calling/campaigns/${campaignId}/progress`);
        if (res.ok) {
          const progress = await res.json();
          setCampaignProgress((prev) => ({ ...prev, [campaignId]: progress }));

          // Continue polling if campaign is still active
          if (progress.remaining > 0 && progress.inProgress) {
            setTimeout(poll, 3000);
          } else {
            setExecutingCampaignId(null);
            fetchData();
          }
        }
      } catch {
        // Polling error — retry
        setTimeout(poll, 5000);
      }
    };
    poll();
  }, [fetchData]);

  // Auto-poll for active campaigns on mount
  useEffect(() => {
    const activeCampaign = campaigns.find((c) => c.status === "active");
    if (activeCampaign && !executingCampaignId) {
      setExecutingCampaignId(activeCampaign.id);
      startProgressPolling(activeCampaign.id);
    }
  }, [campaigns, executingCampaignId, startProgressPolling]);

  const handleStatusChange = async (id: string, status: CampaignStatus) => {
    if (status === "active") {
      handleStartCampaign(id);
    } else if (status === "paused") {
      handlePauseCampaign(id);
    } else {
      await authFetch(`/api/calling/campaigns/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    await authFetch(`/api/calling/campaigns/${id}`, { method: "DELETE" });
    fetchData();
  };

  const hasAgents = agents.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
            <Phone className="h-5 w-5 text-neonblue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-platinum">AI Calling</h1>
            <p className="text-sm text-silver">Automated outbound & inbound AI-powered calls</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setShowQuickCall(true);
              setQuickCallResult(null);
            }}
            disabled={!hasAgents}
            variant="outline"
            className="border-automationgreen/30 text-automationgreen hover:bg-automationgreen/10 gap-2"
          >
            <PhoneCall className="h-4 w-4" />
            Quick Call
          </Button>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-neonblue hover:bg-electricblue text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Direct Call Bar */}
      {hasAgents && (
        <Card className="bg-graphite border-gunmetal">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-automationgreen/10 shrink-0">
                <PhoneCall className="h-4 w-4 text-automationgreen" />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={directPhone}
                  onChange={(e) => setDirectPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="bg-onyx border-gunmetal text-platinum h-9 max-w-[200px]"
                  onKeyDown={(e) => { if (e.key === "Enter") handleDirectCall(); }}
                />
                <Input
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  placeholder="Contact name (optional)"
                  className="bg-onyx border-gunmetal text-platinum h-9 max-w-[180px]"
                />
                <Select value={directAgent} onValueChange={setDirectAgent}>
                  <SelectTrigger className="bg-onyx border-gunmetal text-platinum h-9 max-w-[180px]">
                    <SelectValue placeholder="Select agent..." />
                  </SelectTrigger>
                  <SelectContent className="bg-graphite border-gunmetal">
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="flex items-center gap-1.5">
                          <Bot className="h-3 w-3 text-electricblue" /> {a.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleDirectCall}
                  disabled={directCalling || !directPhone || !directAgent}
                  className="bg-automationgreen hover:bg-automationgreen/80 text-white h-9 gap-1.5 shrink-0"
                >
                  {directCalling ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <PhoneCall className="h-3.5 w-3.5" />
                  )}
                  {directCalling ? "Calling..." : "Call Now"}
                </Button>
              </div>
            </div>
            {directResult && (
              <div className={cn(
                "mt-3 p-2.5 rounded-lg text-xs",
                directResult.success
                  ? "bg-automationgreen/10 text-automationgreen border border-automationgreen/20"
                  : "bg-errorred/10 text-errorred border border-errorred/20"
              )}>
                {directResult.message}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Setup Banner — Conditional on Agents */}
      {!hasAgents ? (
        <Card className="bg-gradient-to-r from-warningamber/5 via-onyx to-onyx border-warningamber/20">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-warningamber/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-warningamber" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-platinum mb-1">Setup Required</h3>
                <p className="text-xs text-silver leading-relaxed">
                  Create an AI Agent first, then set up Twilio credentials to enable live calls.
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge className="bg-warningamber/10 text-warningamber border-transparent text-[10px]">AI Agent: Not Created</Badge>
                  <Badge className="bg-warningamber/10 text-warningamber border-transparent text-[10px]">Twilio: Not Connected</Badge>
                </div>
                <Button
                  size="sm"
                  className="mt-3 bg-neonblue hover:bg-neonblue/80 text-white gap-1.5"
                  onClick={() => window.location.href = "/dashboard/agents"}
                >
                  <Bot className="h-3.5 w-3.5" />
                  Create AI Agent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-automationgreen/5 via-onyx to-onyx border-automationgreen/20">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-automationgreen/10 shrink-0">
                <CheckCircle className="h-5 w-5 text-automationgreen" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-platinum mb-1">Ready to Call</h3>
                <p className="text-xs text-silver leading-relaxed">
                  {agents.length} AI Agent{agents.length > 1 ? "s" : ""} configured.
                  {" "}Use Quick Call for single calls or create a Campaign for batch calling.
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge className="bg-automationgreen/10 text-automationgreen border-transparent text-[10px]">
                    {agents.length} Agent{agents.length > 1 ? "s" : ""} Ready
                  </Badge>
                  <Badge className="bg-automationgreen/10 text-automationgreen border-transparent text-[10px]">Campaigns Ready</Badge>
                  <Badge className="bg-neonblue/10 text-neonblue border-transparent text-[10px]">
                    Twilio: Required for live calls
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Calls", value: stats?.totalCalls || 0, icon: Phone, color: "text-neonblue" },
          { label: "Connected", value: stats?.connectedCalls || 0, icon: Zap, color: "text-automationgreen" },
          { label: "Meetings", value: stats?.meetingsBooked || 0, icon: Calendar, color: "text-warningamber" },
          { label: "Avg Duration", value: `${stats?.avgDuration || 0}s`, icon: Clock, color: "text-purple-400" },
          { label: "Connect Rate", value: `${stats?.connectRate || 0}%`, icon: Target, color: "text-neonblue" },
          { label: "Meeting Rate", value: `${stats?.meetingRate || 0}%`, icon: TrendingUp, color: "text-automationgreen" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-graphite border-gunmetal">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <p className="text-2xl font-bold text-platinum">{stat.value}</p>
              <p className="text-[10px] text-mist mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-neonblue" />
        </div>
      ) : (
        <>
          {/* Campaigns */}
          <Card className="bg-onyx border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-neonblue" />
                Campaigns ({campaigns.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <Phone className="h-10 w-10 text-gunmetal mx-auto mb-3" />
                  <p className="text-silver text-sm">No campaigns yet. Create your first AI calling campaign.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((camp) => {
                    const statusCfg = STATUS_CONFIG[camp.status];
                    const assignedAgent = agents.find((a) => a.id === camp.agent_id);
                    return (
                      <div
                        key={camp.id}
                        className="p-4 rounded-lg bg-graphite border border-gunmetal hover:border-gunmetal/80 transition-colors space-y-3"
                      >
                        <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("p-2 rounded-lg", camp.type === "outbound" ? "bg-neonblue/10" : "bg-automationgreen/10")}>
                            {camp.type === "outbound" ? (
                              <PhoneOutgoing className="h-4 w-4 text-neonblue" />
                            ) : (
                              <PhoneIncoming className="h-4 w-4 text-automationgreen" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-platinum">{camp.name}</h3>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] text-mist capitalize">{camp.type}</span>
                              {assignedAgent && (
                                <span className="text-[10px] text-electricblue flex items-center gap-0.5">
                                  <Bot className="h-2.5 w-2.5" /> {assignedAgent.name}
                                </span>
                              )}
                              {camp.objective && (
                                <span className="text-[10px] text-mist truncate max-w-[200px]">{camp.objective}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right text-xs text-mist space-y-0.5">
                            <p>{camp.stats.total_calls} calls</p>
                            <p>{camp.stats.meetings_booked} meetings</p>
                          </div>
                          {(camp.contact_list_filter as { contacts?: unknown[] })?.contacts?.length ? (
                            <Badge className="text-[10px] bg-electricblue/10 text-electricblue border-transparent">
                              <Users className="h-2.5 w-2.5 mr-0.5" />
                              {(camp.contact_list_filter as { contacts?: unknown[] }).contacts!.length} contacts
                            </Badge>
                          ) : null}
                          <Badge className={cn("text-[10px]", statusCfg.bgColor, statusCfg.color, "border-transparent")}>
                            {statusCfg.label}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setImportCampaignId(camp.id);
                                setShowImport(true);
                                setImportResult(null);
                              }}
                              title="Import Contacts"
                              className="h-8 w-8 p-0 text-electricblue hover:text-electricblue hover:bg-electricblue/10"
                            >
                              <Upload className="h-3.5 w-3.5" />
                            </Button>
                            {camp.status === "draft" || camp.status === "paused" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(camp.id, "active")}
                                className="h-8 w-8 p-0 text-automationgreen hover:text-automationgreen hover:bg-automationgreen/10"
                              >
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                            ) : camp.status === "active" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(camp.id, "paused")}
                                className="h-8 w-8 p-0 text-warningamber hover:text-warningamber hover:bg-warningamber/10"
                              >
                                <Pause className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(camp.id)}
                              className="h-8 w-8 p-0 text-errorred/60 hover:text-errorred hover:bg-errorred/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                        {/* Campaign Progress Bar */}
                        {(() => {
                          const progress = campaignProgress[camp.id];
                          const contacts = (camp.contact_list_filter as { contacts?: unknown[] })?.contacts;
                          const totalContacts = progress?.total || contacts?.length || 0;
                          if (totalContacts === 0 || camp.status === "draft") return null;
                          const done = progress?.completed || 0;
                          const failed = progress?.failed || 0;
                          const pct = totalContacts > 0 ? Math.round(((done + failed) / totalContacts) * 100) : 0;
                          const isActive = camp.status === "active" && executingCampaignId === camp.id;
                          return (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-mist">
                                  {isActive && progress?.currentContact ? (
                                    <span className="text-automationgreen flex items-center gap-1">
                                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                      Calling {progress.currentContact}...
                                    </span>
                                  ) : camp.status === "completed" ? (
                                    "Campaign completed"
                                  ) : camp.status === "paused" ? (
                                    "Paused"
                                  ) : (
                                    `${done} of ${totalContacts} called`
                                  )}
                                </span>
                                <span className="text-mist">
                                  {done} done · {failed} failed · {progress?.remaining || totalContacts - done - failed} remaining
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-gunmetal overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    isActive ? "bg-automationgreen" : camp.status === "completed" ? "bg-neonblue" : "bg-warningamber"
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Calls */}
          <Card className="bg-onyx border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2">
                <Phone className="h-5 w-5 text-neonblue" />
                Recent Calls ({calls.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {calls.length === 0 ? (
                <div className="text-center py-12">
                  <Mic className="h-10 w-10 text-gunmetal mx-auto mb-3" />
                  <p className="text-silver text-sm">No calls yet. Use Quick Call or start a campaign.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {calls.map((call) => {
                    const isExpanded = expandedCallId === call.id;
                    return (
                      <div key={call.id} className="rounded-lg bg-graphite/50 border border-gunmetal/50 overflow-hidden">
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-graphite/80 transition-colors"
                          onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("p-1.5 rounded", call.direction === "outbound" ? "bg-neonblue/10" : "bg-automationgreen/10")}>
                              {call.direction === "outbound" ? (
                                <PhoneOutgoing className="h-3.5 w-3.5 text-neonblue" />
                              ) : (
                                <PhoneIncoming className="h-3.5 w-3.5 text-automationgreen" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-platinum">{call.contact_name || call.phone_number || "Unknown"}</p>
                              <p className="text-[10px] text-mist">
                                {call.duration_seconds}s · {call.status}
                                {call.to_number && ` · ${call.to_number}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {call.outcome && (
                              <Badge className={cn(
                                "text-[10px] border-transparent",
                                call.outcome === "meeting_booked" ? "bg-automationgreen/10 text-automationgreen"
                                  : call.outcome === "interested" ? "bg-neonblue/10 text-neonblue"
                                  : call.outcome === "callback_scheduled" ? "bg-warningamber/10 text-warningamber"
                                  : "bg-silver/10 text-silver"
                              )}>
                                {call.outcome.replace(/_/g, " ")}
                              </Badge>
                            )}
                            {call.ai_score !== null && call.ai_score !== undefined && (
                              <span className={cn(
                                "text-xs font-semibold",
                                call.ai_score >= 80 ? "text-automationgreen"
                                  : call.ai_score >= 60 ? "text-warningamber"
                                  : "text-errorred"
                              )}>
                                {call.ai_score}%
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-mist" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-mist" />
                            )}
                          </div>
                        </div>
                        {/* Expanded Detail Panel */}
                        {isExpanded && (
                          <div className="border-t border-gunmetal/50 p-4 space-y-3 bg-onyx/50">
                            {/* Summary */}
                            {call.summary && (
                              <div>
                                <p className="text-[10px] text-mist uppercase tracking-wide mb-1">Summary</p>
                                <p className="text-xs text-silver leading-relaxed">{call.summary}</p>
                              </div>
                            )}
                            {/* Score + Sentiment + Outcome Row */}
                            <div className="flex flex-wrap gap-3">
                              {call.sentiment && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-mist">Sentiment:</span>
                                  <Badge className={cn(
                                    "text-[10px] border-transparent",
                                    call.sentiment === "positive" ? "bg-automationgreen/10 text-automationgreen"
                                      : call.sentiment === "negative" ? "bg-errorred/10 text-errorred"
                                      : "bg-silver/10 text-silver"
                                  )}>
                                    {call.sentiment}
                                  </Badge>
                                </div>
                              )}
                              {call.ai_score !== null && call.ai_score !== undefined && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-mist">AI Score:</span>
                                  <span className={cn(
                                    "text-xs font-bold",
                                    call.ai_score >= 80 ? "text-automationgreen"
                                      : call.ai_score >= 60 ? "text-warningamber"
                                      : "text-errorred"
                                  )}>{call.ai_score}/100</span>
                                </div>
                              )}
                              {call.duration_seconds > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-mist">Duration:</span>
                                  <span className="text-xs text-silver">
                                    {Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* Key Topics */}
                            {call.key_topics && (call.key_topics as string[]).length > 0 && (
                              <div>
                                <p className="text-[10px] text-mist uppercase tracking-wide mb-1">Topics</p>
                                <div className="flex flex-wrap gap-1">
                                  {(call.key_topics as string[]).map((t, i) => (
                                    <Badge key={i} className="text-[10px] bg-neonblue/10 text-neonblue border-transparent">{t}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Objections */}
                            {call.objections_detected && (call.objections_detected as string[]).length > 0 && (
                              <div>
                                <p className="text-[10px] text-mist uppercase tracking-wide mb-1">Objections Detected</p>
                                <div className="flex flex-wrap gap-1">
                                  {(call.objections_detected as string[]).map((o, i) => (
                                    <Badge key={i} className="text-[10px] bg-warningamber/10 text-warningamber border-transparent">{o}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Next Steps */}
                            {call.next_steps && (
                              <div>
                                <p className="text-[10px] text-mist uppercase tracking-wide mb-1">Next Steps</p>
                                <p className="text-xs text-silver">{call.next_steps}</p>
                              </div>
                            )}
                            {/* Transcript */}
                            {call.transcript && (
                              <div>
                                <p className="text-[10px] text-mist uppercase tracking-wide mb-1">Transcript</p>
                                <div className="max-h-40 overflow-y-auto rounded bg-graphite p-2 text-[11px] text-silver leading-relaxed whitespace-pre-wrap font-mono">
                                  {call.transcript}
                                </div>
                              </div>
                            )}
                            {/* Recording link */}
                            {call.recording_url && (
                              <a
                                href={call.recording_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-electricblue hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" /> Listen to Recording
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-onyx border-gunmetal text-platinum max-w-md">
          <DialogHeader>
            <DialogTitle>New AI Calling Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-mist block mb-1.5">Campaign Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Q1 Outbound Blitz"
                className="bg-graphite border-gunmetal text-platinum"
              />
            </div>
            <div>
              <label className="text-xs text-mist block mb-1.5">AI Agent</label>
              <Select value={newAgentId} onValueChange={setNewAgentId}>
                <SelectTrigger className="bg-graphite border-gunmetal text-platinum">
                  <SelectValue placeholder="Select an AI agent..." />
                </SelectTrigger>
                <SelectContent className="bg-graphite border-gunmetal">
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5 text-electricblue" /> {a.name}
                      </span>
                    </SelectItem>
                  ))}
                  {agents.length === 0 && (
                    <SelectItem value="none" disabled>No agents — create one first</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-mist block mb-1.5">Type</label>
              <Select value={newType} onValueChange={(v) => setNewType(v as "outbound" | "inbound")}>
                <SelectTrigger className="bg-graphite border-gunmetal text-platinum">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-graphite border-gunmetal">
                  <SelectItem value="outbound">
                    <span className="flex items-center gap-2">
                      <PhoneOutgoing className="h-3.5 w-3.5 text-neonblue" /> Outbound
                    </span>
                  </SelectItem>
                  <SelectItem value="inbound">
                    <span className="flex items-center gap-2">
                      <PhoneIncoming className="h-3.5 w-3.5 text-automationgreen" /> Inbound
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-mist block mb-1.5">AI Voice</label>
              <Select value={newVoice} onValueChange={setNewVoice}>
                <SelectTrigger className="bg-graphite border-gunmetal text-platinum">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-graphite border-gunmetal">
                  {VOICE_OPTIONS.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <span>{v.name} — <span className="text-mist">{v.description}</span></span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-mist block mb-1.5">Objective (optional)</label>
              <Input
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Book discovery calls with SaaS companies"
                className="bg-graphite border-gunmetal text-platinum"
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="w-full bg-neonblue hover:bg-electricblue text-white"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Call Dialog */}
      <Dialog open={showQuickCall} onOpenChange={(open) => { setShowQuickCall(open); if (!open) setQuickCallResult(null); }}>
        <DialogContent className="bg-onyx border-gunmetal text-platinum max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-automationgreen" />
              Quick AI Call
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-mist block mb-1.5">Phone Number *</label>
              <Input
                value={quickCallTo}
                onChange={(e) => setQuickCallTo(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="bg-graphite border-gunmetal text-platinum"
              />
            </div>
            <div>
              <label className="text-xs text-mist block mb-1.5">AI Agent *</label>
              <Select value={quickCallAgent} onValueChange={setQuickCallAgent}>
                <SelectTrigger className="bg-graphite border-gunmetal text-platinum">
                  <SelectValue placeholder="Select an agent..." />
                </SelectTrigger>
                <SelectContent className="bg-graphite border-gunmetal">
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5 text-electricblue" /> {a.name}
                        <span className="text-mist text-[10px]">({a.voice_id})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-mist block mb-1.5">Contact Name (optional)</label>
              <Input
                value={quickCallName}
                onChange={(e) => setQuickCallName(e.target.value)}
                placeholder="John Doe"
                className="bg-graphite border-gunmetal text-platinum"
              />
            </div>

            {quickCallResult && (
              <div className={cn(
                "p-3 rounded-lg text-sm",
                quickCallResult.success
                  ? "bg-automationgreen/10 text-automationgreen border border-automationgreen/20"
                  : "bg-errorred/10 text-errorred border border-errorred/20"
              )}>
                {quickCallResult.message}
              </div>
            )}

            <Button
              onClick={handleQuickCall}
              disabled={quickCalling || !quickCallTo || !quickCallAgent}
              className="w-full bg-automationgreen hover:bg-automationgreen/80 text-white"
            >
              {quickCalling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PhoneCall className="h-4 w-4 mr-2" />
              )}
              {quickCalling ? "Initiating Call..." : "Start Call"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Contacts Dialog */}
      <Dialog open={showImport} onOpenChange={(open) => { setShowImport(open); if (!open) setImportResult(null); }}>
        <DialogContent className="bg-onyx border-gunmetal text-platinum max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-electricblue" />
              Import Contacts to Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Source Selector */}
            <div>
              <label className="text-xs text-mist block mb-1.5">Import Source</label>
              <div className="flex gap-2">
                {[
                  { key: "csv" as const, label: "CSV / Paste", icon: FileSpreadsheet },
                  { key: "google_sheets" as const, label: "Google Sheets", icon: FileSpreadsheet },
                  { key: "crm" as const, label: "From CRM", icon: Users },
                  { key: "zoho" as const, label: "Zoho CRM", icon: Zap },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setImportSource(key)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-xs transition-colors",
                      importSource === key
                        ? "border-electricblue bg-electricblue/10 text-electricblue"
                        : "border-gunmetal bg-graphite text-silver hover:border-gunmetal/80"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* CSV Input */}
            {importSource === "csv" && (
              <div>
                <label className="text-xs text-mist block mb-1.5">
                  Paste CSV data (must have &apos;name&apos; and &apos;phone&apos; columns)
                </label>
                <textarea
                  value={importCSV}
                  onChange={(e) => setImportCSV(e.target.value)}
                  placeholder={"name,phone,email,company\nJohn Doe,+1234567890,john@example.com,Acme Inc\nJane Smith,+0987654321,jane@test.com,Widget Co"}
                  rows={6}
                  className="w-full bg-graphite border border-gunmetal rounded-lg p-3 text-xs text-platinum placeholder:text-mist/50 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-electricblue"
                />
                <p className="text-[10px] text-mist mt-1">
                  Supported columns: name/first_name, phone/mobile/cell, email, company, notes
                </p>
              </div>
            )}

            {/* Google Sheets Input */}
            {importSource === "google_sheets" && (
              <div>
                <label className="text-xs text-mist block mb-1.5">Google Sheets URL</label>
                <Input
                  value={importSheetsUrl}
                  onChange={(e) => setImportSheetsUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="bg-graphite border-gunmetal text-platinum"
                />
                <p className="text-[10px] text-mist mt-1">
                  Sheet must be shared publicly (Anyone with the link → Viewer). First row = headers with name &amp; phone columns.
                </p>
              </div>
            )}

            {/* CRM Filter Input */}
            {importSource === "crm" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-mist block mb-1.5">Filter by Deal Stage</label>
                  <Select value={importCrmStage} onValueChange={setImportCrmStage}>
                    <SelectTrigger className="bg-graphite border-gunmetal text-platinum">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-graphite border-gunmetal">
                      <SelectItem value="all">All Contacts</SelectItem>
                      <SelectItem value="new">New Leads</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal Sent</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[10px] text-mist">
                  Pulls contacts from your CRM that have a phone number. Sorted by lead score (highest first), max 100.
                </p>
              </div>
            )}

            {/* Zoho CRM Import */}
            {importSource === "zoho" && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#E42527]/5 border border-[#E42527]/20 text-xs text-silver">
                  <p className="font-medium text-[#E42527] mb-1">Zoho CRM → Campaign</p>
                  <p>Syncs leads from your Zoho CRM, then imports them into this campaign. Requires Zoho to be connected in Integrations.</p>
                </div>
                <div>
                  <label className="text-xs text-mist block mb-1.5">Filter by Zoho Lead Status</label>
                  <Select value={zohoLeadStatus} onValueChange={setZohoLeadStatus}>
                    <SelectTrigger className="bg-graphite border-gunmetal text-platinum">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-graphite border-gunmetal">
                      <SelectItem value="all">All Leads (with phone)</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Not Contacted">Not Contacted</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="Contact in Future">Contact in Future</SelectItem>
                      <SelectItem value="Attempted to Contact">Attempted to Contact</SelectItem>
                      <SelectItem value="Pre-Qualified">Pre-Qualified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {zohoSyncing && (
                  <div className="flex items-center gap-2 text-xs text-neonblue">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Syncing leads from Zoho CRM...
                  </div>
                )}
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div className={cn(
                "p-3 rounded-lg text-sm",
                importResult.success
                  ? "bg-automationgreen/10 text-automationgreen border border-automationgreen/20"
                  : "bg-errorred/10 text-errorred border border-errorred/20"
              )}>
                {importResult.message}
              </div>
            )}

            {/* Import Button */}
            <Button
              onClick={handleImportContacts}
              disabled={
                importing ||
                (importSource === "csv" && !importCSV.trim()) ||
                (importSource === "google_sheets" && !importSheetsUrl.trim())
              }
              className="w-full bg-electricblue hover:bg-electricblue/80 text-white"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {importing ? "Importing..." : "Import Contacts"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
