"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getSessions,
  getSessionStats,
  deleteSession,
  clearSessions,
  type Session,
} from "@/lib/session-history";
import {
  History,
  MessageSquare,
  Mic,
  Phone,
  Swords,
  Trash2,
  Search,
  Clock,
  ChevronRight,
  X,
  AlertCircle,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { exportToPDF } from "@/lib/export-pdf";

const TYPE_CONFIG: Record<
  Session["type"],
  { icon: typeof MessageSquare; label: string; color: string; bg: string }
> = {
  coach: {
    icon: MessageSquare,
    label: "AI Chat",
    color: "text-neonblue",
    bg: "bg-neonblue/10",
  },
  practice: {
    icon: Mic,
    label: "Simulation",
    color: "text-automationgreen",
    bg: "bg-automationgreen/10",
  },
  call: {
    icon: Phone,
    label: "Call Analysis",
    color: "text-warningamber",
    bg: "bg-warningamber/10",
  },
  tool: {
    icon: Swords,
    label: "Tool",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState(getSessionStats());
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [filterType, setFilterType] = useState<Session["type"] | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSessions(getSessions());
    setStats(getSessionStats());
  }, []);

  const filteredSessions = sessions.filter((s) => {
    const matchesType = filterType === "all" || s.type === filterType;
    const matchesSearch =
      !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.input.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleDelete = (id: string) => {
    deleteSession(id);
    setSessions(getSessions());
    setStats(getSessionStats());
    if (selectedSession?.id === id) setSelectedSession(null);
  };

  const handleClearAll = () => {
    if (confirm("Delete all session history? This cannot be undone.")) {
      clearSessions();
      setSessions([]);
      setStats(getSessionStats());
      setSelectedSession(null);
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
              <History className="h-6 w-6 text-neonblue" />
              Activity History
            </h1>
            <p className="text-silver mt-1">
              Review your past coaching sessions and tool outputs
            </p>
          </div>
          {sessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="border-gunmetal text-silver hover:text-errorred hover:border-errorred"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-platinum">{stats.total}</p>
              <p className="text-xs text-mist">Total Activities</p>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-neonblue">{stats.byType.coach}</p>
              <p className="text-xs text-mist">Coaching</p>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-automationgreen">{stats.byType.practice}</p>
              <p className="text-xs text-mist">Practice</p>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-warningamber">{stats.byType.call}</p>
              <p className="text-xs text-mist">Calls</p>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.byType.tool}</p>
              <p className="text-xs text-mist">Tools</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-onyx border border-gunmetal text-platinum placeholder:text-mist text-sm focus:border-neonblue focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            {(["all", "coach", "practice", "call", "tool"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  filterType === type
                    ? "bg-neonblue/10 text-neonblue border border-neonblue/50"
                    : "bg-onyx text-silver border border-gunmetal hover:border-neonblue/30"
                )}
              >
                {type === "all" ? "All" : TYPE_CONFIG[type].label}
              </button>
            ))}
          </div>
        </div>

        {sessions.length === 0 ? (
          <Card className="bg-graphite border-gunmetal">
            <CardContent className="py-16 text-center">
              <History className="h-12 w-12 text-mist mx-auto mb-4" />
              <h3 className="text-lg font-medium text-platinum mb-2">No Activity Yet</h3>
              <p className="text-sm text-silver">
                Your coaching sessions, practice runs, and tool outputs will appear here automatically.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Session List */}
            <div className="lg:col-span-1">
              <Card className="bg-graphite border-gunmetal">
                <CardContent className="p-3 space-y-1 max-h-[600px] overflow-y-auto">
                  {filteredSessions.length === 0 ? (
                    <div className="py-8 text-center">
                      <AlertCircle className="h-8 w-8 text-mist mx-auto mb-2" />
                      <p className="text-sm text-silver">No matching sessions</p>
                    </div>
                  ) : (
                    filteredSessions.map((session) => {
                      const config = TYPE_CONFIG[session.type];
                      const Icon = config.icon;
                      return (
                        <button
                          key={session.id}
                          onClick={() => setSelectedSession(session)}
                          className={cn(
                            "w-full p-3 rounded-lg text-left transition-all border",
                            selectedSession?.id === session.id
                              ? "bg-onyx border-neonblue/50"
                              : "border-transparent hover:bg-onyx/50"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("p-1.5 rounded-lg shrink-0", config.bg)}>
                              <Icon className={cn("h-3.5 w-3.5", config.color)} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-platinum truncate">
                                {session.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gunmetal text-mist">
                                  {config.label}
                                </Badge>
                                <span className="text-[10px] text-mist flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {formatTime(session.timestamp)}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-mist shrink-0 mt-1" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Session Detail */}
            <div className="lg:col-span-2">
              {selectedSession ? (
                <div className="space-y-4">
                  <Card className="bg-graphite border-gunmetal">
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-platinum text-lg">
                          {selectedSession.title}
                        </CardTitle>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className={cn("text-xs", TYPE_CONFIG[selectedSession.type].bg, TYPE_CONFIG[selectedSession.type].color)}>
                            {TYPE_CONFIG[selectedSession.type].label}
                          </Badge>
                          {selectedSession.model && (
                            <span className="text-xs text-mist">Model: {selectedSession.model}</span>
                          )}
                          <span className="text-xs text-mist">
                            {new Date(selectedSession.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            exportToPDF({
                              title: selectedSession.title,
                              content: selectedSession.output,
                              subtitle: `${TYPE_CONFIG[selectedSession.type].label} Session`,
                              metadata: {
                                Date: new Date(selectedSession.timestamp).toLocaleString(),
                                ...(selectedSession.model ? { Model: selectedSession.model } : {}),
                              },
                            })
                          }
                          className="text-mist hover:text-neonblue"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(selectedSession.id)}
                          className="text-mist hover:text-errorred"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="bg-graphite border-gunmetal">
                    <CardHeader>
                      <CardTitle className="text-sm text-mist">Your Input</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-silver whitespace-pre-wrap">
                        {selectedSession.input}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-graphite border-gunmetal">
                    <CardHeader>
                      <CardTitle className="text-sm text-mist">AI Response</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-invert prose-sm max-w-none max-h-[500px] overflow-y-auto prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200 prose-td:text-gray-300 prose-th:text-platinum prose-th:bg-onyx prose-a:text-neonblue prose-code:text-automationgreen prose-blockquote:text-gray-300 prose-blockquote:border-neonblue/50">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedSession.output}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="bg-graphite border-gunmetal h-full flex items-center justify-center">
                  <CardContent className="text-center py-16">
                    <History className="h-12 w-12 text-mist mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-platinum mb-2">
                      Select an Activity
                    </h3>
                    <p className="text-sm text-silver">
                      Click on a session to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
