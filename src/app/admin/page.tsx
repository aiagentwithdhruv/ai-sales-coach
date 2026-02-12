"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Users,
  Search,
  ExternalLink,
  Activity,
  Clock,
  Crown,
  UserCheck,
  Eye,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlatformUser {
  id: string;
  email: string;
  name: string;
  plan: "free" | "module" | "bundle" | string;
  status: "trial" | "active" | "cancelled" | string;
  ai_calls_this_month: number;
  created_at: string;
}

interface AuditEntry {
  id: string;
  admin_email: string;
  action: string;
  target_email: string;
  timestamp: string;
  details?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = "aiwithdhruv@gmail.com";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function planBadge(plan: string) {
  switch (plan) {
    case "bundle":
      return (
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          <Crown className="h-3 w-3 mr-1" />
          Bundle
        </Badge>
      );
    case "module":
      return (
        <Badge className="bg-neonblue/20 text-neonblue border-neonblue/30">
          Module
        </Badge>
      );
    default:
      return (
        <Badge className="bg-silver/10 text-mist border-gunmetal">Free</Badge>
      );
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-successgreen/20 text-successgreen border-successgreen/30">
          <UserCheck className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    case "trial":
      return (
        <Badge className="bg-warningamber/20 text-warningamber border-warningamber/30">
          <Clock className="h-3 w-3 mr-1" />
          Trial
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-errorred/20 text-errorred border-errorred/30">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge className="bg-silver/10 text-mist border-gunmetal">
          {status}
        </Badge>
      );
  }
}

function formatRelativeTime(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminDashboardPage() {
  // ---- Auth state ----------------------------------------------------------
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // ---- Data state ----------------------------------------------------------
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Search / filter state -----------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");

  // ---- Quick-impersonate state ---------------------------------------------
  const [quickEmail, setQuickEmail] = useState("");
  const [quickUserInfo, setQuickUserInfo] = useState<PlatformUser | null>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  // --------------------------------------------------------------------------
  // Fetch current user & admin check
  // --------------------------------------------------------------------------
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const email = user?.email ?? null;
      setCurrentEmail(email);
      setIsAdmin(email === ADMIN_EMAIL);
    };
    checkAuth();
  }, [supabase.auth]);

  // --------------------------------------------------------------------------
  // Fetch dashboard data (users + audit log)
  // --------------------------------------------------------------------------
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.status === 403) {
        setIsAdmin(false);
        setError("You don't have admin access");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to fetch admin data");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setUsers(data.users ?? []);
      setAuditLog(data.audit_log ?? []);
    } catch (err) {
      setError("Network error — could not reach the API");
    } finally {
      setLoading(false);
    }
  }, [supabase.auth]);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin, fetchDashboardData]);

  // --------------------------------------------------------------------------
  // Impersonate action (POST)
  // --------------------------------------------------------------------------
  const handleImpersonate = async (email: string) => {
    setImpersonating(email);
    setImpersonateError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setImpersonateError("Not authenticated");
      setImpersonating(null);
      return;
    }

    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setImpersonateError(data.error || "Failed to impersonate user");
        setImpersonating(null);
        return;
      }

      // Open the impersonation link in a new tab
      if (data.link) {
        window.open(data.link, "_blank");
      }

      // Refresh audit log after impersonation
      fetchDashboardData();
    } catch {
      setImpersonateError("Network error — could not impersonate");
    } finally {
      setImpersonating(null);
    }
  };

  // --------------------------------------------------------------------------
  // Quick-impersonate: resolve user info from local data
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (quickEmail.trim().length === 0) {
      setQuickUserInfo(null);
      return;
    }
    const match = users.find(
      (u) => u.email.toLowerCase() === quickEmail.trim().toLowerCase()
    );
    setQuickUserInfo(match ?? null);
  }, [quickEmail, users]);

  // --------------------------------------------------------------------------
  // Filtered users
  // --------------------------------------------------------------------------
  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(q) ||
      user.name?.toLowerCase().includes(q)
    );
  });

  // --------------------------------------------------------------------------
  // Computed stats
  // --------------------------------------------------------------------------
  const totalUsers = users.length;
  const activeSubscribers = users.filter((u) => u.status === "active").length;
  const trialUsers = users.filter((u) => u.status === "trial").length;
  const totalAiCalls = users.reduce(
    (sum, u) => sum + (u.ai_calls_this_month ?? 0),
    0
  );

  // ==========================================================================
  // RENDER — Loading
  // ==========================================================================
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-neonblue mx-auto mb-4 animate-pulse" />
          <p className="text-silver">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER — Access Denied
  // ==========================================================================
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
        <Card className="bg-graphite border-gunmetal max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-errorred mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-platinum mb-2">
              Access Denied
            </h1>
            <p className="text-silver mb-1">
              You do not have permission to access the admin dashboard.
            </p>
            {currentEmail && (
              <p className="text-mist text-sm">
                Signed in as{" "}
                <span className="text-silver">{currentEmail}</span>
              </p>
            )}
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="mt-6 bg-neonblue hover:bg-electricblue"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==========================================================================
  // RENDER — Admin Dashboard
  // ==========================================================================
  return (
    <DashboardLayout isAdmin user={{ name: "Admin", email: ADMIN_EMAIL, role: "admin" }}>
      <div className="space-y-6">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
              <Shield className="h-6 w-6 text-neonblue" />
              Admin Dashboard
            </h1>
            <p className="text-silver mt-1">
              Manage users, impersonate accounts, and monitor platform health
            </p>
          </div>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            className="border-gunmetal text-silver hover:text-platinum"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Platform Stats                                                   */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-graphite border-gunmetal">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-neonblue/10 rounded-lg">
                <Users className="h-6 w-6 text-neonblue" />
              </div>
              <div>
                <p className="text-sm text-mist">Total Users</p>
                <p className="text-2xl font-bold text-platinum">{totalUsers}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-graphite border-gunmetal">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-successgreen/10 rounded-lg">
                <UserCheck className="h-6 w-6 text-successgreen" />
              </div>
              <div>
                <p className="text-sm text-mist">Active Subscribers</p>
                <p className="text-2xl font-bold text-platinum">
                  {activeSubscribers}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-graphite border-gunmetal">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-warningamber/10 rounded-lg">
                <Clock className="h-6 w-6 text-warningamber" />
              </div>
              <div>
                <p className="text-sm text-mist">Trial Users</p>
                <p className="text-2xl font-bold text-platinum">{trialUsers}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-graphite border-gunmetal">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Activity className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-mist">AI Calls This Month</p>
                <p className="text-2xl font-bold text-platinum">
                  {totalAiCalls.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Quick Impersonation                                              */}
        {/* ---------------------------------------------------------------- */}
        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <CardTitle className="text-platinum flex items-center gap-2">
              <Eye className="h-5 w-5 text-neonblue" />
              Quick Account Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label className="text-sm text-mist mb-1 block">
                  Enter email to access
                </label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={quickEmail}
                  onChange={(e) => setQuickEmail(e.target.value)}
                  className="bg-onyx border-gunmetal text-platinum"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && quickEmail.trim()) {
                      handleImpersonate(quickEmail.trim());
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => handleImpersonate(quickEmail.trim())}
                disabled={
                  !quickEmail.trim() ||
                  impersonating === quickEmail.trim()
                }
                className="bg-neonblue hover:bg-electricblue shrink-0"
              >
                {impersonating === quickEmail.trim() ? (
                  "Accessing..."
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Access Account
                  </>
                )}
              </Button>
            </div>

            {/* Preview of resolved user */}
            {quickUserInfo && (
              <div className="mt-4 p-4 bg-onyx rounded-lg border border-gunmetal">
                <p className="text-xs text-mist mb-2 uppercase tracking-wider">
                  Target User Info
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-mist">Name</p>
                    <p className="text-sm text-platinum font-medium">
                      {quickUserInfo.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-mist">Email</p>
                    <p className="text-sm text-platinum font-medium truncate">
                      {quickUserInfo.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-mist">Plan</p>
                    <div className="mt-0.5">{planBadge(quickUserInfo.plan)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-mist">Status</p>
                    <div className="mt-0.5">
                      {statusBadge(quickUserInfo.status)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No match message */}
            {quickEmail.trim().length > 0 && !quickUserInfo && (
              <p className="mt-3 text-xs text-mist">
                No matching user found in local data. The API will still attempt
                to process this email.
              </p>
            )}

            {impersonateError && (
              <div className="mt-3 flex items-center gap-2 text-sm text-errorred">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {impersonateError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* User Management                                                  */}
        {/* ---------------------------------------------------------------- */}
        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-platinum flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
                <Badge className="bg-neonblue/20 text-neonblue border-neonblue/30 ml-2">
                  {filteredUsers.length}
                </Badge>
              </CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-onyx border-gunmetal text-platinum"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-mist">
                <RefreshCw className="h-6 w-6 mx-auto mb-3 animate-spin text-neonblue" />
                Loading users...
              </div>
            ) : error ? (
              <div className="text-center py-12 text-errorred">
                <AlertTriangle className="h-6 w-6 mx-auto mb-3" />
                {error}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-mist">
                <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-silver">No users found</p>
                {searchQuery && (
                  <p className="text-xs text-mist mt-1">
                    Try a different search query
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gunmetal">
                      <TableHead className="text-mist">Name</TableHead>
                      <TableHead className="text-mist">Email</TableHead>
                      <TableHead className="text-mist">Plan</TableHead>
                      <TableHead className="text-mist">Status</TableHead>
                      <TableHead className="text-mist text-right">
                        AI Calls
                      </TableHead>
                      <TableHead className="text-mist text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-gunmetal">
                        <TableCell className="text-platinum font-medium">
                          {user.name || (
                            <span className="text-mist italic">No name</span>
                          )}
                        </TableCell>
                        <TableCell className="text-silver">
                          {user.email}
                        </TableCell>
                        <TableCell>{planBadge(user.plan)}</TableCell>
                        <TableCell>{statusBadge(user.status)}</TableCell>
                        <TableCell className="text-right text-silver">
                          {(user.ai_calls_this_month ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleImpersonate(user.email)}
                            disabled={impersonating === user.email}
                            className="bg-neonblue/10 text-neonblue hover:bg-neonblue hover:text-white border border-neonblue/30 h-8 px-3 text-xs"
                          >
                            {impersonating === user.email ? (
                              "Opening..."
                            ) : (
                              <>
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Access Account
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Audit Log                                                        */}
        {/* ---------------------------------------------------------------- */}
        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <CardTitle className="text-platinum flex items-center gap-2">
              <Activity className="h-5 w-5 text-warningamber" />
              Audit Log
              {auditLog.length > 0 && (
                <Badge className="bg-warningamber/20 text-warningamber border-warningamber/30 ml-2">
                  {auditLog.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditLog.length === 0 ? (
              <div className="text-center py-8 text-mist">
                <Clock className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-silver">No admin actions recorded yet</p>
                <p className="text-xs text-mist mt-1">
                  Actions will appear here as you manage the platform
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {auditLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 bg-onyx rounded-lg border border-gunmetal"
                  >
                    <div className="p-2 bg-warningamber/10 rounded-lg shrink-0 mt-0.5">
                      <Eye className="h-4 w-4 text-warningamber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <p className="text-sm text-platinum font-medium">
                          {entry.action}
                        </p>
                        <span className="text-xs text-mist">
                          {formatRelativeTime(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-silver mt-1">
                        <span className="text-mist">Target: </span>
                        {entry.target_email}
                      </p>
                      {entry.details && (
                        <p className="text-xs text-mist mt-0.5">
                          {entry.details}
                        </p>
                      )}
                      <p className="text-xs text-mist mt-0.5">
                        <span className="text-mist">By: </span>
                        {entry.admin_email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
