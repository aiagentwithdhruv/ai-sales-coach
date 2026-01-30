"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Coins, Plus, RefreshCw, Search, Shield } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  credits: number;
  total_used: number;
}

export default function AdminCreditsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addCredits, setAddCredits] = useState("10");
  const [addLoading, setAddLoading] = useState(false);
  const [addMessage, setAddMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const supabase = getSupabaseClient();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setError("Not authenticated");
      setLoading(false);
      setIsAdmin(false);
      return;
    }

    const response = await fetch("/api/admin/credits", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.status === 403) {
      setError("You don't have admin access");
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to fetch users");
      setLoading(false);
      return;
    }

    const data = await response.json();
    setUsers(data.users);
    setIsAdmin(true);
    setLoading(false);
  }, [supabase.auth]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddMessage(null);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setAddMessage({ type: "error", text: "Not authenticated" });
      setAddLoading(false);
      return;
    }

    const response = await fetch("/api/admin/credits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: addEmail,
        credits: parseInt(addCredits),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setAddMessage({ type: "error", text: data.error || "Failed to add credits" });
    } else {
      setAddMessage({ type: "success", text: data.message });
      setAddEmail("");
      setAddCredits("10");
      fetchUsers();
    }

    setAddLoading(false);
  };

  const handleQuickAdd = async (email: string, credits: number) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    await fetch("/api/admin/credits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email, credits }),
    });

    fetchUsers();
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
        <Card className="bg-graphite border-gunmetal max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-errorred mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-platinum mb-2">Access Denied</h1>
            <p className="text-silver">
              {error || "You don't have permission to access the admin panel."}
            </p>
            <Button
              onClick={() => window.location.href = "/dashboard"}
              className="mt-6 bg-neonblue hover:bg-electricblue"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
              <Shield className="h-6 w-6 text-neonblue" />
              Admin: Credit Management
            </h1>
            <p className="text-silver mt-1">Manage user credits for AI features</p>
          </div>
          <Button
            onClick={fetchUsers}
            variant="outline"
            className="border-gunmetal text-silver hover:text-platinum"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-graphite border-gunmetal">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-neonblue/10 rounded-lg">
                <Users className="h-6 w-6 text-neonblue" />
              </div>
              <div>
                <p className="text-sm text-mist">Total Users</p>
                <p className="text-2xl font-bold text-platinum">{users.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-graphite border-gunmetal">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-successgreen/10 rounded-lg">
                <Coins className="h-6 w-6 text-successgreen" />
              </div>
              <div>
                <p className="text-sm text-mist">Total Credits</p>
                <p className="text-2xl font-bold text-platinum">
                  {users.reduce((sum, u) => sum + u.credits, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-graphite border-gunmetal">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-warningamber/10 rounded-lg">
                <Coins className="h-6 w-6 text-warningamber" />
              </div>
              <div>
                <p className="text-sm text-mist">Total Used</p>
                <p className="text-2xl font-bold text-platinum">
                  {users.reduce((sum, u) => sum + u.total_used, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Credits Form */}
        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <CardTitle className="text-platinum flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Credits by Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCredits} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-mist mb-1 block">User Email</label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="bg-onyx border-gunmetal text-platinum"
                  required
                />
              </div>
              <div className="w-32">
                <label className="text-sm text-mist mb-1 block">Credits</label>
                <Input
                  type="number"
                  placeholder="10"
                  value={addCredits}
                  onChange={(e) => setAddCredits(e.target.value)}
                  className="bg-onyx border-gunmetal text-platinum"
                  min="1"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={addLoading}
                className="bg-neonblue hover:bg-electricblue"
              >
                {addLoading ? "Adding..." : "Add Credits"}
              </Button>
            </form>
            {addMessage && (
              <p className={`mt-3 text-sm ${addMessage.type === "success" ? "text-successgreen" : "text-errorred"}`}>
                {addMessage.text}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-platinum">All Users</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-onyx border-gunmetal text-platinum"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-mist">Loading users...</div>
            ) : error ? (
              <div className="text-center py-8 text-errorred">{error}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gunmetal">
                    <TableHead className="text-mist">User</TableHead>
                    <TableHead className="text-mist">Email</TableHead>
                    <TableHead className="text-mist text-right">Credits</TableHead>
                    <TableHead className="text-mist text-right">Used</TableHead>
                    <TableHead className="text-mist text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-gunmetal">
                      <TableCell className="text-platinum font-medium">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-silver">{user.email}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={
                            user.credits > 0
                              ? "bg-successgreen/20 text-successgreen"
                              : "bg-errorred/20 text-errorred"
                          }
                        >
                          {user.credits}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-mist">
                        {user.total_used}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuickAdd(user.email, 5)}
                            className="text-neonblue hover:text-electricblue h-7 px-2"
                          >
                            +5
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuickAdd(user.email, 10)}
                            className="text-neonblue hover:text-electricblue h-7 px-2"
                          >
                            +10
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuickAdd(user.email, 50)}
                            className="text-successgreen hover:text-successgreen h-7 px-2"
                          >
                            +50
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
