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
import { getAuthToken } from "@/hooks/useCredits";
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

  const handleStatusChange = async (id: string, status: CampaignStatus) => {
    await authFetch(`/api/calling/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    fetchData();
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
                        className="flex items-center justify-between p-4 rounded-lg bg-graphite border border-gunmetal hover:border-gunmetal/80 transition-colors"
                      >
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
                          <Badge className={cn("text-[10px]", statusCfg.bgColor, statusCfg.color, "border-transparent")}>
                            {statusCfg.label}
                          </Badge>
                          <div className="flex items-center gap-1">
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
                  {calls.map((call) => (
                    <div
                      key={call.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-graphite/50 border border-gunmetal/50"
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
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}
