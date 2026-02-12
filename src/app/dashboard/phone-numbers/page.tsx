"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Phone,
  Plus,
  Search,
  Loader2,
  Bot,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Globe,
  PhoneCall,
  ShoppingCart,
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
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/auth-token";
import type { PhoneNumber, AIAgent } from "@/types/teams";

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

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  capabilities: { voice: boolean; sms: boolean };
}

export default function PhoneNumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);

  // Search dialog
  const [showSearch, setShowSearch] = useState(false);
  const [searchCountry, setSearchCountry] = useState("US");
  const [searchAreaCode, setSearchAreaCode] = useState("");
  const [searchContains, setSearchContains] = useState("");
  const [searching, setSearching] = useState(false);
  const [available, setAvailable] = useState<AvailableNumber[]>([]);
  const [buying, setBuying] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [numRes, agentRes] = await Promise.all([
        authFetch("/api/phone-numbers"),
        authFetch("/api/agents"),
      ]);
      if (numRes.ok) {
        const d = await numRes.json();
        setNumbers(d.numbers || []);
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

  const handleSearch = async () => {
    setSearching(true);
    setAvailable([]);
    try {
      const params = new URLSearchParams({ country: searchCountry });
      if (searchAreaCode) params.set("areaCode", searchAreaCode);
      if (searchContains) params.set("contains", searchContains);
      const res = await authFetch(`/api/phone-numbers/search?${params}`);
      if (res.ok) {
        const d = await res.json();
        setAvailable(d.numbers || []);
      }
    } catch {
      // silent
    }
    setSearching(false);
  };

  const handleBuy = async (phoneNumber: string) => {
    setBuying(phoneNumber);
    try {
      const res = await authFetch("/api/phone-numbers", {
        method: "POST",
        body: JSON.stringify({ phoneNumber, countryCode: searchCountry }),
      });
      if (res.ok) {
        setAvailable((prev) => prev.filter((n) => n.phoneNumber !== phoneNumber));
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to buy number");
      }
    } catch {
      alert("Network error");
    }
    setBuying(null);
  };

  const handleAssign = async (numberId: string, agentId: string | null) => {
    await authFetch(`/api/phone-numbers/${numberId}`, {
      method: "PUT",
      body: JSON.stringify({ assigned_agent_id: agentId || null }),
    });
    fetchData();
  };

  const handleToggle = async (numberId: string, isActive: boolean) => {
    await authFetch(`/api/phone-numbers/${numberId}`, {
      method: "PUT",
      body: JSON.stringify({ is_active: isActive }),
    });
    fetchData();
  };

  const handleRelease = async (numberId: string, phoneNumber: string) => {
    if (!confirm(`Release ${phoneNumber}? This will remove it from your Twilio account.`)) return;
    await authFetch(`/api/phone-numbers/${numberId}`, { method: "DELETE" });
    fetchData();
  };

  // Count env number
  const envNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
            <Phone className="h-5 w-5 text-neonblue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-platinum">Phone Numbers</h1>
            <p className="text-xs text-silver">Manage Twilio numbers for AI calling campaigns</p>
          </div>
        </div>
        <Button
          onClick={() => { setShowSearch(true); setAvailable([]); }}
          className="bg-neonblue text-white hover:bg-neonblue/90"
        >
          <Plus className="h-4 w-4 mr-2" /> Buy Number
        </Button>
      </div>

      {/* Current Numbers */}
      <Card className="bg-onyx border-gunmetal">
        <CardHeader>
          <CardTitle className="text-platinum flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-neonblue" />
            Your Numbers ({numbers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-neonblue" />
            </div>
          ) : numbers.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-10 w-10 text-gunmetal mx-auto mb-3" />
              <p className="text-silver text-sm">No phone numbers yet.</p>
              <p className="text-mist text-xs mt-1">
                Buy a Twilio number to start making AI calls.
                {envNumber && (
                  <span className="block mt-1 text-warningamber">
                    Note: Your .env has TWILIO_PHONE_NUMBER={envNumber} — this is used as the default caller ID.
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {numbers.map((num) => {
                const assignedAgent = agents.find((a) => a.id === num.assigned_agent_id);
                return (
                  <div
                    key={num.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-graphite border border-gunmetal"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        num.is_active ? "bg-automationgreen/10" : "bg-gunmetal"
                      )}>
                        <Phone className={cn(
                          "h-4 w-4",
                          num.is_active ? "text-automationgreen" : "text-mist"
                        )} />
                      </div>
                      <div>
                        <h3 className="text-sm font-mono font-medium text-platinum">{num.phone_number}</h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-mist">{num.friendly_name || num.country_code}</span>
                          <span className="text-[10px] text-mist">{num.total_calls} calls</span>
                          {assignedAgent && (
                            <span className="text-[10px] text-electricblue flex items-center gap-0.5">
                              <Bot className="h-2.5 w-2.5" /> {assignedAgent.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "text-[10px] border-transparent",
                        num.is_active
                          ? "bg-automationgreen/10 text-automationgreen"
                          : "bg-gunmetal text-mist"
                      )}>
                        {num.is_active ? "Active" : "Inactive"}
                      </Badge>

                      {/* Assign to Agent */}
                      <Select
                        value={num.assigned_agent_id || "none"}
                        onValueChange={(v) => handleAssign(num.id, v === "none" ? null : v)}
                      >
                        <SelectTrigger className="h-8 w-[140px] bg-graphite border-gunmetal text-xs text-silver">
                          <SelectValue placeholder="Assign agent" />
                        </SelectTrigger>
                        <SelectContent className="bg-graphite border-gunmetal">
                          <SelectItem value="none" className="text-mist text-xs">No Agent</SelectItem>
                          {agents.map((a) => (
                            <SelectItem key={a.id} value={a.id} className="text-silver text-xs">
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Toggle */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(num.id, !num.is_active)}
                        className="h-8 w-8 p-0"
                      >
                        {num.is_active ? (
                          <ToggleRight className="h-4 w-4 text-automationgreen" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-mist" />
                        )}
                      </Button>

                      {/* Delete */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRelease(num.id, num.phone_number)}
                        className="h-8 w-8 p-0 text-errorred/60 hover:text-errorred hover:bg-errorred/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buy Number Dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="bg-onyx border-gunmetal max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-platinum flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-neonblue" />
              Buy Phone Number
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search Filters */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-mist mb-1 block">Country</label>
                <Select value={searchCountry} onValueChange={setSearchCountry}>
                  <SelectTrigger className="bg-graphite border-gunmetal text-silver text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-graphite border-gunmetal">
                    <SelectItem value="US" className="text-silver text-xs">US (+1)</SelectItem>
                    <SelectItem value="GB" className="text-silver text-xs">UK (+44)</SelectItem>
                    <SelectItem value="CA" className="text-silver text-xs">Canada (+1)</SelectItem>
                    <SelectItem value="AU" className="text-silver text-xs">Australia (+61)</SelectItem>
                    <SelectItem value="IN" className="text-silver text-xs">India (+91)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-mist mb-1 block">Area Code</label>
                <Input
                  value={searchAreaCode}
                  onChange={(e) => setSearchAreaCode(e.target.value)}
                  placeholder="e.g. 415"
                  className="bg-graphite border-gunmetal text-silver text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-mist mb-1 block">Contains</label>
                <Input
                  value={searchContains}
                  onChange={(e) => setSearchContains(e.target.value)}
                  placeholder="e.g. SALE"
                  className="bg-graphite border-gunmetal text-silver text-xs"
                />
              </div>
            </div>
            <Button
              onClick={handleSearch}
              disabled={searching}
              className="w-full bg-electricblue text-white hover:bg-electricblue/90"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Search Available Numbers
            </Button>

            {/* Results */}
            {available.length > 0 && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {available.map((num) => (
                  <div
                    key={num.phoneNumber}
                    className="flex items-center justify-between p-3 rounded-lg bg-graphite border border-gunmetal"
                  >
                    <div>
                      <p className="text-sm font-mono text-platinum">{num.phoneNumber}</p>
                      <p className="text-[10px] text-mist">
                        {num.locality ? `${num.locality}, ${num.region}` : num.friendlyName}
                        {num.capabilities.sms && " · SMS"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={buying === num.phoneNumber}
                      onClick={() => handleBuy(num.phoneNumber)}
                      className="bg-automationgreen text-white hover:bg-automationgreen/90 text-xs"
                    >
                      {buying === num.phoneNumber ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>Buy</>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searching && (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-neonblue mx-auto mb-2" />
                <p className="text-xs text-silver">Searching Twilio...</p>
              </div>
            )}

            {!searching && available.length === 0 && (
              <div className="text-center py-4">
                <Globe className="h-8 w-8 text-gunmetal mx-auto mb-2" />
                <p className="text-xs text-silver">Search for available phone numbers above</p>
                <p className="text-[10px] text-mist mt-1">~$1/month per number · $0.04/min for calls</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
