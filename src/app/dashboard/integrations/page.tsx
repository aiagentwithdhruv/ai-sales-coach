"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Globe,
  RefreshCw,
  Check,
  X,
  Loader2,
  Link2,
  Unlink,
  Clock,
  AlertCircle,
  Settings,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/hooks/useCredits";
import type { CRMIntegration, IntegrationProvider } from "@/types/teams";
import { INTEGRATION_PROVIDERS } from "@/types/teams";

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

const STATUS_BADGE: Record<string, { label: string; color: string; bgColor: string; icon: typeof Check }> = {
  connected: { label: "Connected", color: "text-automationgreen", bgColor: "bg-automationgreen/10", icon: Check },
  disconnected: { label: "Not Connected", color: "text-silver", bgColor: "bg-silver/10", icon: X },
  error: { label: "Error", color: "text-errorred", bgColor: "bg-errorred/10", icon: AlertCircle },
  syncing: { label: "Syncing...", color: "text-neonblue", bgColor: "bg-neonblue/10", icon: RefreshCw },
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<CRMIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/integrations");
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  const getIntegration = (provider: IntegrationProvider) =>
    integrations.find((i) => i.provider === provider);

  const handleConnect = async (provider: IntegrationProvider) => {
    setActionLoading(provider);
    try {
      await authFetch("/api/integrations", {
        method: "POST",
        body: JSON.stringify({ action: "connect", provider }),
      });
      await fetchIntegrations();
    } catch {
      // silent
    }
    setActionLoading(null);
  };

  const handleDisconnect = async (provider: IntegrationProvider) => {
    setActionLoading(provider);
    try {
      await authFetch("/api/integrations", {
        method: "POST",
        body: JSON.stringify({ action: "disconnect", provider }),
      });
      await fetchIntegrations();
    } catch {
      // silent
    }
    setActionLoading(null);
  };

  const handleSync = async (provider: IntegrationProvider) => {
    setActionLoading(`sync-${provider}`);
    try {
      await authFetch("/api/integrations", {
        method: "POST",
        body: JSON.stringify({ action: "sync", provider }),
      });
      await fetchIntegrations();
    } catch {
      // silent
    }
    setActionLoading(null);
  };

  const handleToggleSync = async (provider: IntegrationProvider, field: string, value: boolean) => {
    await authFetch("/api/integrations", {
      method: "POST",
      body: JSON.stringify({
        action: "update_config",
        provider,
        sync_config: { [field]: value },
      }),
    });
    await fetchIntegrations();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
          <Globe className="h-5 w-5 text-neonblue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-platinum">Integrations</h1>
          <p className="text-sm text-silver">Connect your CRM tools for bidirectional sync</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-neonblue" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(Object.keys(INTEGRATION_PROVIDERS) as IntegrationProvider[]).map((provider) => {
            const config = INTEGRATION_PROVIDERS[provider];
            const integration = getIntegration(provider);
            const isConnected = integration?.status === "connected";
            const statusKey = integration?.status || "disconnected";
            const statusBadge = STATUS_BADGE[statusKey] || STATUS_BADGE.disconnected;
            const StatusIcon = statusBadge.icon;
            const isLoading = actionLoading === provider || actionLoading === `sync-${provider}`;

            return (
              <Card key={provider} className={cn("bg-onyx border-gunmetal transition-all", isConnected && "border-automationgreen/20")}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", config.bgColor)}>
                        <Globe className={cn("h-5 w-5", config.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-platinum text-base">{config.label}</CardTitle>
                        <p className="text-[11px] text-mist mt-0.5">{config.description}</p>
                      </div>
                    </div>
                    <Badge className={cn("text-[10px] border-transparent", statusBadge.bgColor, statusBadge.color)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusBadge.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Last sync */}
                  {integration?.last_sync_at && (
                    <div className="flex items-center gap-2 text-xs text-mist">
                      <Clock className="h-3 w-3" />
                      Last synced: {new Date(integration.last_sync_at).toLocaleString()}
                    </div>
                  )}

                  {/* Error */}
                  {integration?.error_message && (
                    <div className="flex items-center gap-2 text-xs text-errorred bg-errorred/5 p-2 rounded">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {integration.error_message}
                    </div>
                  )}

                  {/* Sync Config */}
                  {isConnected && integration && (
                    <div className="space-y-3 p-3 rounded-lg bg-graphite/50 border border-gunmetal/30">
                      <p className="text-xs text-mist font-medium uppercase tracking-wider flex items-center gap-1">
                        <Settings className="h-3 w-3" />
                        Sync Settings
                      </p>
                      {(["contacts", "deals", "activities"] as const).map((field) => (
                        <div key={field} className="flex items-center justify-between">
                          <span className="text-sm text-silver capitalize">{field}</span>
                          <Switch
                            checked={integration.sync_config?.[field] ?? true}
                            onCheckedChange={(v) => handleToggleSync(provider, field, v)}
                          />
                        </div>
                      ))}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-silver">Auto Sync</span>
                        <Switch
                          checked={integration.sync_config?.auto_sync ?? false}
                          onCheckedChange={(v) => handleToggleSync(provider, "auto_sync", v)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSync(provider)}
                          disabled={isLoading}
                          className="border-gunmetal text-silver hover:text-platinum gap-1.5 flex-1"
                        >
                          {actionLoading === `sync-${provider}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                          )}
                          Sync Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDisconnect(provider)}
                          disabled={isLoading}
                          className="border-errorred/30 text-errorred hover:bg-errorred/10 gap-1.5"
                        >
                          <Unlink className="h-3.5 w-3.5" />
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(provider)}
                        disabled={isLoading}
                        className={cn("gap-1.5 flex-1", config.bgColor, config.color, "hover:opacity-80 border-transparent")}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Link2 className="h-3.5 w-3.5" />
                        )}
                        Connect {config.label}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
