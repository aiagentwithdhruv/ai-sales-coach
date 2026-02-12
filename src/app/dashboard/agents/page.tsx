"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bot,
  Plus,
  Loader2,
  Phone,
  Trash2,
  Edit3,
  Copy,
  MoreVertical,
  Sparkles,
  Star,
  Volume2,
  Settings,
  PhoneOutgoing,
  MessageSquare,
  Calendar,
  ClipboardCheck,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/auth-token";
import type { AIAgent, AgentCreateInput } from "@/types/teams";
import { VOICE_OPTIONS, AGENT_TEMPLATES } from "@/types/teams";

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

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  cold_call: PhoneOutgoing,
  qualification: ClipboardCheck,
  booking: Calendar,
  follow_up: ArrowRight,
  survey: MessageSquare,
  saas_demo: BarChart3,
  appointment_confirm: Calendar,
  win_back: Star,
  referral_request: Star,
  event_invite: Calendar,
  payment_reminder: Phone,
  real_estate: Phone,
  insurance_upsell: ClipboardCheck,
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<AIAgent | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<AgentCreateInput>({
    name: "",
    description: "",
    voice_id: "alloy",
    voice_provider: "openai",
    language: "en",
    system_prompt: "You are a professional sales representative.",
    greeting: "Hi {{contact_name}}, this is {{agent_name}} from {{company}}. How are you today?",
    model: "gpt-4o-mini",
    temperature: 0.7,
    objective: "",
    template_id: null,
    max_call_duration_seconds: 300,
    silence_timeout_seconds: 10,
    interrupt_sensitivity: "medium",
  });

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      voice_id: "alloy",
      voice_provider: "openai",
      language: "en",
      system_prompt: "You are a professional sales representative.",
      greeting: "Hi {{contact_name}}, this is {{agent_name}} from {{company}}. How are you today?",
      model: "gpt-4o-mini",
      temperature: 0.7,
      objective: "",
      template_id: null,
      max_call_duration_seconds: 300,
      silence_timeout_seconds: 10,
      interrupt_sensitivity: "medium",
    });
  };

  const applyTemplate = (templateId: string) => {
    const template = AGENT_TEMPLATES[templateId];
    if (template) {
      setForm((prev) => ({
        ...prev,
        name: template.name + " Agent",
        system_prompt: template.system_prompt,
        greeting: template.greeting,
        objective: template.objective,
        template_id: templateId as AgentCreateInput["template_id"],
        voice_id: template.recommended_voice || prev.voice_id,
        model: template.recommended_model || prev.model,
        temperature: template.temperature ?? prev.temperature,
        max_call_duration_seconds: template.max_call_duration_seconds || prev.max_call_duration_seconds,
      }));
    }
  };

  const handleCreate = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const res = await authFetch("/api/agents", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setCreateOpen(false);
        resetForm();
        await fetchAgents();
      }
    } catch {
      // silent
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editAgent) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/agents/${editAgent.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setEditAgent(null);
        resetForm();
        await fetchAgents();
      }
    } catch {
      // silent
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await authFetch(`/api/agents/${id}`, { method: "DELETE" });
      await fetchAgents();
    } catch {
      // silent
    }
    setDeleting(null);
  };

  const openEdit = (agent: AIAgent) => {
    setForm({
      name: agent.name,
      description: agent.description || "",
      voice_id: agent.voice_id,
      voice_provider: agent.voice_provider,
      language: agent.language,
      system_prompt: agent.system_prompt,
      greeting: agent.greeting,
      model: agent.model,
      temperature: agent.temperature,
      objective: agent.objective || "",
      template_id: agent.template_id,
      max_call_duration_seconds: agent.max_call_duration_seconds,
      silence_timeout_seconds: agent.silence_timeout_seconds,
      interrupt_sensitivity: agent.interrupt_sensitivity,
    });
    setEditAgent(agent);
  };

  const duplicateAgent = async (agent: AIAgent) => {
    setSaving(true);
    try {
      await authFetch("/api/agents", {
        method: "POST",
        body: JSON.stringify({
          name: `${agent.name} (Copy)`,
          description: agent.description,
          voice_id: agent.voice_id,
          voice_provider: agent.voice_provider,
          language: agent.language,
          system_prompt: agent.system_prompt,
          greeting: agent.greeting,
          model: agent.model,
          temperature: agent.temperature,
          objective: agent.objective,
          template_id: agent.template_id,
          knowledge_base: agent.knowledge_base,
          tools_enabled: agent.tools_enabled,
          objection_responses: agent.objection_responses,
          max_call_duration_seconds: agent.max_call_duration_seconds,
          silence_timeout_seconds: agent.silence_timeout_seconds,
          interrupt_sensitivity: agent.interrupt_sensitivity,
          end_call_phrases: agent.end_call_phrases,
        }),
      });
      await fetchAgents();
    } catch {
      // silent
    }
    setSaving(false);
  };

  // Agent form JSX (render function, NOT a component — avoids remount/focus-loss on state change)
  const renderAgentForm = (onSubmit: () => void, submitLabel: string) => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Templates */}
      {!editAgent && (
        <div>
          <Label className="text-silver text-xs mb-2 block">Start from Template ({Object.keys(AGENT_TEMPLATES).length} templates)</Label>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
            {Object.entries(AGENT_TEMPLATES).map(([id, template]) => {
              const Icon = TEMPLATE_ICONS[id] || Bot;
              const catColor = template.category === "sales" ? "text-neonblue" : template.category === "scheduling" ? "text-automationgreen" : template.category === "retention" ? "text-warningamber" : template.category === "support" ? "text-purple-400" : "text-silver";
              return (
                <button
                  key={id}
                  onClick={() => applyTemplate(id)}
                  className={cn(
                    "p-2 rounded-lg border text-left transition-all",
                    form.template_id === id
                      ? "border-neonblue bg-neonblue/10"
                      : "border-gunmetal bg-graphite/50 hover:border-silver/30"
                  )}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <Icon className={cn("h-3.5 w-3.5", form.template_id === id ? "text-neonblue" : "text-silver")} />
                    <span className={cn("text-[9px] uppercase tracking-wide", catColor)}>{template.category}</span>
                  </div>
                  <p className="text-xs text-platinum font-medium line-clamp-1">{template.name}</p>
                  <p className="text-[10px] text-mist line-clamp-1">{template.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-silver text-xs">Agent Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Sales SDR Bot"
            className="bg-graphite border-gunmetal text-platinum mt-1"
          />
        </div>
        <div>
          <Label className="text-silver text-xs">Objective</Label>
          <Input
            value={form.objective || ""}
            onChange={(e) => setForm((p) => ({ ...p, objective: e.target.value }))}
            placeholder="e.g. Book a demo meeting"
            className="bg-graphite border-gunmetal text-platinum mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-silver text-xs">Description</Label>
        <Input
          value={form.description || ""}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Brief description of what this agent does"
          className="bg-graphite border-gunmetal text-platinum mt-1"
        />
      </div>

      {/* Voice & Model */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-silver text-xs">Voice</Label>
          <Select value={form.voice_id} onValueChange={(v) => setForm((p) => ({ ...p, voice_id: v }))}>
            <SelectTrigger className="bg-graphite border-gunmetal text-platinum mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICE_OPTIONS.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name} — {v.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-silver text-xs">Model</Label>
          <Select value={form.model} onValueChange={(v) => setForm((p) => ({ ...p, model: v }))}>
            <SelectTrigger className="bg-graphite border-gunmetal text-platinum mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o (Smart)</SelectItem>
              <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-silver text-xs">Temperature</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={form.temperature}
            onChange={(e) => setForm((p) => ({ ...p, temperature: parseFloat(e.target.value) || 0.7 }))}
            className="bg-graphite border-gunmetal text-platinum mt-1"
          />
        </div>
      </div>

      {/* Greeting */}
      <div>
        <Label className="text-silver text-xs">
          Greeting <span className="text-mist">(Variables: {"{{contact_name}}, {{agent_name}}, {{company}}"})</span>
        </Label>
        <Textarea
          value={form.greeting}
          onChange={(e) => setForm((p) => ({ ...p, greeting: e.target.value }))}
          rows={2}
          className="bg-graphite border-gunmetal text-platinum mt-1 text-sm"
        />
      </div>

      {/* System Prompt */}
      <div>
        <Label className="text-silver text-xs">System Prompt (Agent Personality & Rules)</Label>
        <Textarea
          value={form.system_prompt}
          onChange={(e) => setForm((p) => ({ ...p, system_prompt: e.target.value }))}
          rows={6}
          className="bg-graphite border-gunmetal text-platinum mt-1 text-sm font-mono"
        />
      </div>

      {/* Call Settings */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-silver text-xs">Max Duration (sec)</Label>
          <Input
            type="number"
            value={form.max_call_duration_seconds}
            onChange={(e) => setForm((p) => ({ ...p, max_call_duration_seconds: parseInt(e.target.value) || 300 }))}
            className="bg-graphite border-gunmetal text-platinum mt-1"
          />
        </div>
        <div>
          <Label className="text-silver text-xs">Silence Timeout (sec)</Label>
          <Input
            type="number"
            value={form.silence_timeout_seconds}
            onChange={(e) => setForm((p) => ({ ...p, silence_timeout_seconds: parseInt(e.target.value) || 10 }))}
            className="bg-graphite border-gunmetal text-platinum mt-1"
          />
        </div>
        <div>
          <Label className="text-silver text-xs">Interrupt Sensitivity</Label>
          <Select
            value={form.interrupt_sensitivity}
            onValueChange={(v) => setForm((p) => ({ ...p, interrupt_sensitivity: v as "low" | "medium" | "high" }))}
          >
            <SelectTrigger className="bg-graphite border-gunmetal text-platinum mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={onSubmit}
        disabled={saving || !form.name}
        className="w-full bg-neonblue hover:bg-neonblue/80 text-white"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-neonblue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-platinum">AI Agents</h1>
            <p className="text-sm text-silver">Create and manage AI calling agents</p>
          </div>
        </div>

        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-neonblue hover:bg-neonblue/80 text-white gap-1.5">
              <Plus className="h-4 w-4" />
              New Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-onyx border-gunmetal max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-platinum">Create AI Agent</DialogTitle>
            </DialogHeader>
            {renderAgentForm(handleCreate, "Create Agent")}
          </DialogContent>
        </Dialog>
      </div>

      {/* Agent List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-neonblue" />
        </div>
      ) : agents.length === 0 ? (
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bot className="h-12 w-12 text-silver/30 mb-4" />
            <h3 className="text-lg text-platinum font-medium mb-1">No AI Agents Yet</h3>
            <p className="text-sm text-silver mb-4 max-w-sm">
              Create your first AI agent to start making intelligent sales calls.
              Choose a template or build from scratch.
            </p>
            <Button onClick={() => setCreateOpen(true)} className="bg-neonblue hover:bg-neonblue/80 text-white gap-1.5">
              <Plus className="h-4 w-4" />
              Create First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const voiceOption = VOICE_OPTIONS.find((v) => v.id === agent.voice_id);
            const templateConfig = agent.template_id ? AGENT_TEMPLATES[agent.template_id] : null;
            const TemplateIcon = agent.template_id ? (TEMPLATE_ICONS[agent.template_id] || Bot) : Bot;

            return (
              <Card key={agent.id} className="bg-onyx border-gunmetal hover:border-silver/20 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-electricblue/10 flex items-center justify-center">
                        <TemplateIcon className="h-5 w-5 text-electricblue" />
                      </div>
                      <div>
                        <CardTitle className="text-platinum text-base">{agent.name}</CardTitle>
                        <p className="text-[11px] text-mist mt-0.5 line-clamp-1">
                          {agent.description || agent.objective || "Custom agent"}
                        </p>
                      </div>
                    </div>
                    <Badge className={cn(
                      "text-[10px] border-transparent",
                      agent.is_active ? "bg-automationgreen/10 text-automationgreen" : "bg-silver/10 text-silver"
                    )}>
                      {agent.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-mist">
                      <Phone className="h-3 w-3" />
                      <span>{agent.total_calls} calls</span>
                    </div>
                    <div className="flex items-center gap-1 text-mist">
                      <Star className="h-3 w-3" />
                      <span>{agent.avg_score > 0 ? `${agent.avg_score}/100` : "No score"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-mist">
                      <Volume2 className="h-3 w-3" />
                      <span>{voiceOption?.name || agent.voice_id}</span>
                    </div>
                  </div>

                  {/* Template Badge */}
                  {templateConfig && (
                    <Badge className="text-[10px] bg-neonblue/10 text-neonblue border-transparent">
                      {templateConfig.name} Template
                    </Badge>
                  )}

                  {/* Objective */}
                  {agent.objective && (
                    <p className="text-xs text-silver bg-graphite/50 rounded px-2 py-1.5 line-clamp-2">
                      Objective: {agent.objective}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(agent)}
                      className="border-gunmetal text-silver hover:text-platinum flex-1 gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => duplicateAgent(agent)}
                      disabled={saving}
                      className="border-gunmetal text-silver hover:text-platinum gap-1"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(agent.id)}
                      disabled={deleting === agent.id}
                      className="border-errorred/30 text-errorred hover:bg-errorred/10 gap-1"
                    >
                      {deleting === agent.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editAgent} onOpenChange={(open) => { if (!open) { setEditAgent(null); resetForm(); } }}>
        <DialogContent className="bg-onyx border-gunmetal max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-platinum">Edit Agent: {editAgent?.name}</DialogTitle>
          </DialogHeader>
          {renderAgentForm(handleUpdate, "Save Changes")}
        </DialogContent>
      </Dialog>
    </div>
  );
}
