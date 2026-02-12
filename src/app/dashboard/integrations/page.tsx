"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
  Key,
  Download,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/auth-token";
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

  // Zoho setup dialog
  const [zohoSetup, setZohoSetup] = useState(false);
  const [zohoCredentials, setZohoCredentials] = useState({
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    apiDomain: "https://www.zohoapis.com",
  });

  // Sync result feedback
  const [syncResult, setSyncResult] = useState<{
    provider: string;
    imported: number;
    updated: number;
    skipped: number;
    errors: number;
    total: number;
  } | null>(null);

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
    // For Zoho, show setup dialog first
    if (provider === "zoho") {
      setZohoSetup(true);
      return;
    }

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

  const handleZohoConnect = async () => {
    if (!zohoCredentials.refreshToken) return;
    setActionLoading("zoho");
    try {
      await authFetch("/api/integrations", {
        method: "POST",
        body: JSON.stringify({
          action: "connect",
          provider: "zoho",
          config: {
            instance_url: zohoCredentials.apiDomain,
            refresh_token: zohoCredentials.refreshToken,
            access_token: `${zohoCredentials.clientId}:${zohoCredentials.clientSecret}`, // Store both for server use
          },
        }),
      });
      setZohoSetup(false);
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
    setSyncResult(null);
    try {
      const res = await authFetch("/api/integrations", {
        method: "POST",
        body: JSON.stringify({
          action: "sync",
          provider,
          sync_options: { phoneOnly: true },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSyncResult({
          provider,
          imported: data.imported || 0,
          updated: data.updated || 0,
          skipped: data.skipped || 0,
          errors: data.errors || 0,
          total: data.total || data.synced || 0,
        });
      }
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

      {/* Zoho Setup Dialog */}
      {zohoSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-onyx border border-gunmetal rounded-xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#E42527]/10 flex items-center justify-center">
                <Key className="h-5 w-5 text-[#E42527]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-platinum">Connect Zoho CRM</h2>
                <p className="text-xs text-mist">Self-Client OAuth — one-time setup</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-neonblue/5 border border-neonblue/20 text-xs text-silver space-y-1">
                <p className="font-medium text-neonblue">Setup Steps:</p>
                <p>1. Go to <span className="text-platinum">api-console.zoho.com</span> → Create Self Client</p>
                <p>2. Copy Client ID & Client Secret below</p>
                <p>3. Generate grant token with scopes: <span className="text-mist font-mono text-[10px]">ZohoCRM.modules.leads.ALL,ZohoCRM.coql.READ</span></p>
                <p>4. Exchange grant token for refresh token using curl</p>
              </div>

              <div>
                <label className="text-xs text-mist mb-1 block">Client ID</label>
                <Input
                  placeholder="1000.XXXXXXXXXX.YYYYYYYYYY"
                  value={zohoCredentials.clientId}
                  onChange={(e) => setZohoCredentials((p) => ({ ...p, clientId: e.target.value }))}
                  className="bg-graphite border-gunmetal text-platinum text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-mist mb-1 block">Client Secret</label>
                <Input
                  type="password"
                  placeholder="XXXXXXXXXXXXXXXX"
                  value={zohoCredentials.clientSecret}
                  onChange={(e) => setZohoCredentials((p) => ({ ...p, clientSecret: e.target.value }))}
                  className="bg-graphite border-gunmetal text-platinum text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-mist mb-1 block">Refresh Token</label>
                <Input
                  type="password"
                  placeholder="1000.XXXXXXXX.YYYYYYYY"
                  value={zohoCredentials.refreshToken}
                  onChange={(e) => setZohoCredentials((p) => ({ ...p, refreshToken: e.target.value }))}
                  className="bg-graphite border-gunmetal text-platinum text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-mist mb-1 block">API Domain</label>
                <select
                  value={zohoCredentials.apiDomain}
                  onChange={(e) => setZohoCredentials((p) => ({ ...p, apiDomain: e.target.value }))}
                  className="w-full bg-graphite border border-gunmetal text-platinum text-sm rounded-md px-3 py-2"
                >
                  <option value="https://www.zohoapis.com">US (zohoapis.com)</option>
                  <option value="https://www.zohoapis.in">India (zohoapis.in)</option>
                  <option value="https://www.zohoapis.eu">EU (zohoapis.eu)</option>
                  <option value="https://www.zohoapis.com.au">Australia (zohoapis.com.au)</option>
                  <option value="https://www.zohoapis.jp">Japan (zohoapis.jp)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZohoSetup(false)}
                className="flex-1 border-gunmetal text-silver"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleZohoConnect}
                disabled={!zohoCredentials.refreshToken || actionLoading === "zoho"}
                className="flex-1 bg-[#E42527] text-white hover:bg-[#E42527]/80 gap-1.5"
              >
                {actionLoading === "zoho" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
                Connect Zoho
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Result Banner */}
      {syncResult && (
        <div className="p-4 rounded-lg bg-automationgreen/5 border border-automationgreen/20 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-automationgreen mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-platinum">
              Sync Complete — {INTEGRATION_PROVIDERS[syncResult.provider as IntegrationProvider]?.label}
            </p>
            <div className="flex items-center gap-4 mt-1 text-xs text-silver">
              <span className="text-automationgreen">{syncResult.imported} imported</span>
              <span className="text-neonblue">{syncResult.updated} updated</span>
              {syncResult.skipped > 0 && <span className="text-mist">{syncResult.skipped} skipped</span>}
              {syncResult.errors > 0 && <span className="text-errorred">{syncResult.errors} errors</span>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSyncResult(null)}
            className="text-mist hover:text-platinum h-6 w-6 p-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

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
