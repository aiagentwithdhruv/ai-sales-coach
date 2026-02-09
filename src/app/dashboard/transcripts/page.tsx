"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Download,
  X,
  Tag,
  Clock,
  Building2,
  User,
  Phone,
  Star,
  ChevronRight,
  FileDown,
  Upload,
  Mic,
  Calendar,
  Filter,
  ChevronDown,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToPDF } from "@/lib/export-pdf";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Transcript {
  id: string;
  date: number; // timestamp
  contact: string;
  company: string;
  duration: string; // e.g. "14:32"
  score: number; // 0–100
  tags: string[];
  text: string;
  highlights?: string[]; // key insights
}

type SortField = "date" | "score" | "contact";
type SortDirection = "asc" | "desc";

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "sales-coach-transcripts";
const TAGS_KEY = "sales-coach-transcript-tags";
const MAX_TRANSCRIPTS = 50;

function loadTranscripts(): Transcript[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTranscripts(transcripts: Transcript[]) {
  if (typeof window === "undefined") return;
  const trimmed = transcripts.slice(0, MAX_TRANSCRIPTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

function loadCustomTags(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomTags(tags: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
}

// ---------------------------------------------------------------------------
// Default tags
// ---------------------------------------------------------------------------

const DEFAULT_TAGS = [
  "Discovery",
  "Demo",
  "Negotiation",
  "Follow-up",
  "Cold Call",
  "Closing",
  "Objection",
  "Upsell",
];

// ---------------------------------------------------------------------------
// Score color helpers
// ---------------------------------------------------------------------------

function getScoreColor(score: number) {
  if (score >= 80) return { text: "text-automationgreen", bg: "bg-automationgreen/15" };
  if (score >= 60) return { text: "text-neonblue", bg: "bg-neonblue/15" };
  if (score >= 40) return { text: "text-warningamber", bg: "bg-warningamber/15" };
  return { text: "text-errorred", bg: "bg-errorred/15" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TranscriptsPage() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [selectedTranscript, setSelectedTranscript] =
    useState<Transcript | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterScoreMin, setFilterScoreMin] = useState<number>(0);
  const [filterScoreMax, setFilterScoreMax] = useState<number>(100);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(
    new Set()
  );
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Add modal form state
  const [formContact, setFormContact] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formScore, setFormScore] = useState("");
  const [formText, setFormText] = useState("");
  const [formTags, setFormTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");

  useEffect(() => {
    setTranscripts(loadTranscripts());
    setCustomTags(loadCustomTags());
  }, []);

  const allTags = useMemo(() => {
    const combined = new Set([...DEFAULT_TAGS, ...customTags]);
    // Also gather tags from existing transcripts
    for (const t of transcripts) {
      for (const tag of t.tags) combined.add(tag);
    }
    return Array.from(combined).sort();
  }, [customTags, transcripts]);

  // Filtered + sorted transcripts
  const filteredTranscripts = useMemo(() => {
    let results = transcripts.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesTags =
        filterTags.length === 0 ||
        filterTags.some((ft) => t.tags.includes(ft));
      const matchesScore =
        t.score >= filterScoreMin && t.score <= filterScoreMax;
      return matchesSearch && matchesTags && matchesScore;
    });

    results.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = a.date - b.date;
      else if (sortField === "score") cmp = a.score - b.score;
      else if (sortField === "contact")
        cmp = a.contact.localeCompare(b.contact);
      return sortDirection === "desc" ? -cmp : cmp;
    });

    return results;
  }, [
    transcripts,
    searchQuery,
    filterTags,
    filterScoreMin,
    filterScoreMax,
    sortField,
    sortDirection,
  ]);

  // Handlers
  const handleAddTranscript = useCallback(() => {
    if (!formContact.trim() || !formText.trim()) return;

    const newTranscript: Transcript = {
      id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: Date.now(),
      contact: formContact.trim(),
      company: formCompany.trim() || "Unknown",
      duration: formDuration.trim() || "0:00",
      score: Math.max(0, Math.min(100, parseInt(formScore) || 0)),
      tags: formTags,
      text: formText.trim(),
      highlights: [],
    };

    const updated = [newTranscript, ...transcripts].slice(0, MAX_TRANSCRIPTS);
    setTranscripts(updated);
    saveTranscripts(updated);

    // Reset form
    setFormContact("");
    setFormCompany("");
    setFormDuration("");
    setFormScore("");
    setFormText("");
    setFormTags([]);
    setShowAddModal(false);
  }, [
    formContact,
    formCompany,
    formDuration,
    formScore,
    formText,
    formTags,
    transcripts,
  ]);

  const handleDelete = useCallback(
    (id: string) => {
      const updated = transcripts.filter((t) => t.id !== id);
      setTranscripts(updated);
      saveTranscripts(updated);
      if (selectedTranscript?.id === id) setSelectedTranscript(null);
      selectedForExport.delete(id);
      setSelectedForExport(new Set(selectedForExport));
    },
    [transcripts, selectedTranscript, selectedForExport]
  );

  const handleExportPDF = useCallback((transcript: Transcript) => {
    exportToPDF({
      title: `Call Transcript - ${transcript.contact}`,
      content: transcript.text,
      subtitle: `${transcript.company} | Score: ${transcript.score}/100`,
      metadata: {
        Contact: transcript.contact,
        Company: transcript.company,
        Duration: transcript.duration,
        Score: `${transcript.score}/100`,
        Date: new Date(transcript.date).toLocaleString(),
        Tags: transcript.tags.join(", ") || "None",
      },
    });
  }, []);

  const handleExportTXT = useCallback((transcript: Transcript) => {
    const content = [
      `Call Transcript: ${transcript.contact}`,
      `Company: ${transcript.company}`,
      `Date: ${new Date(transcript.date).toLocaleString()}`,
      `Duration: ${transcript.duration}`,
      `Score: ${transcript.score}/100`,
      `Tags: ${transcript.tags.join(", ") || "None"}`,
      "",
      "---",
      "",
      transcript.text,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${transcript.contact.replace(/\s/g, "-").toLowerCase()}-${new Date(transcript.date).toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleBulkExport = useCallback(
    (format: "pdf" | "txt") => {
      const selected = transcripts.filter((t) => selectedForExport.has(t.id));
      for (const t of selected) {
        if (format === "pdf") handleExportPDF(t);
        else handleExportTXT(t);
      }
      setSelectedForExport(new Set());
      setShowBulkActions(false);
    },
    [transcripts, selectedForExport, handleExportPDF, handleExportTXT]
  );

  const handleAddCustomTag = useCallback(() => {
    const tag = newTagInput.trim();
    if (!tag || allTags.includes(tag)) {
      setNewTagInput("");
      return;
    }
    const updated = [...customTags, tag];
    setCustomTags(updated);
    saveCustomTags(updated);
    setNewTagInput("");
  }, [newTagInput, allTags, customTags]);

  const toggleExportSelection = (id: string) => {
    const next = new Set(selectedForExport);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedForExport(next);
    setShowBulkActions(next.size > 0);
  };

  const toggleFilterTag = (tag: string) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stats
  const avgScore =
    transcripts.length > 0
      ? Math.round(
          transcripts.reduce((sum, t) => sum + t.score, 0) /
            transcripts.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-neonblue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-platinum">
              Transcript Storage
            </h1>
            <p className="text-sm text-silver">
              Store, search, and analyze your call transcripts
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-neonblue hover:bg-neonblue/90 text-obsidian font-medium"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Transcript
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-neonblue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-platinum">
                {transcripts.length}
              </p>
              <p className="text-xs text-mist">Total Transcripts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-automationgreen/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-automationgreen" />
            </div>
            <div>
              <p className="text-2xl font-bold text-automationgreen">
                {avgScore}
              </p>
              <p className="text-xs text-mist">Avg Score</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warningamber/10 flex items-center justify-center">
              <Tag className="h-5 w-5 text-warningamber" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warningamber">
                {allTags.length}
              </p>
              <p className="text-xs text-mist">Tags</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-400/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">
                {MAX_TRANSCRIPTS - transcripts.length}
              </p>
              <p className="text-xs text-mist">Slots Remaining</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transcripts by keyword, contact, company..."
              className="pl-10 bg-onyx border-gunmetal text-platinum placeholder:text-mist/50"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "border-gunmetal text-silver hover:text-platinum",
              showFilters && "border-neonblue/50 text-neonblue"
            )}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            Filters
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 ml-1 transition-transform",
                showFilters && "rotate-180"
              )}
            />
          </Button>

          {/* Sort */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-onyx border border-gunmetal">
            {(
              [
                { value: "date", label: "Date" },
                { value: "score", label: "Score" },
                { value: "contact", label: "Name" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  if (sortField === opt.value) {
                    setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
                  } else {
                    setSortField(opt.value);
                    setSortDirection("desc");
                  }
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  sortField === opt.value
                    ? "bg-neonblue/10 text-neonblue"
                    : "text-silver hover:text-platinum"
                )}
              >
                {opt.label}
                {sortField === opt.value && (
                  <span className="ml-1">
                    {sortDirection === "desc" ? "↓" : "↑"}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {showFilters && (
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 space-y-4">
              {/* Tag Filter */}
              <div>
                <label className="text-xs text-mist mb-2 block">
                  Filter by Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleFilterTag(tag)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                        filterTags.includes(tag)
                          ? "bg-neonblue/10 text-neonblue border-neonblue/50"
                          : "bg-graphite text-silver border-gunmetal hover:border-neonblue/30"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Score Range */}
              <div>
                <label className="text-xs text-mist mb-2 block">
                  Score Range: {filterScoreMin} - {filterScoreMax}
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={filterScoreMin}
                    onChange={(e) =>
                      setFilterScoreMin(
                        Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                      )
                    }
                    className="w-20 bg-graphite border-gunmetal text-platinum text-center text-sm"
                  />
                  <span className="text-mist">to</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={filterScoreMax}
                    onChange={(e) =>
                      setFilterScoreMax(
                        Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                      )
                    }
                    className="w-20 bg-graphite border-gunmetal text-platinum text-center text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterScoreMin(0);
                      setFilterScoreMax(100);
                      setFilterTags([]);
                    }}
                    className="text-mist hover:text-platinum text-xs"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && selectedForExport.size > 0 && (
        <Card className="bg-neonblue/5 border-neonblue/20">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm text-neonblue font-medium">
              {selectedForExport.size} transcript
              {selectedForExport.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleBulkExport("pdf")}
                className="bg-neonblue hover:bg-neonblue/90 text-obsidian text-xs"
              >
                <FileDown className="h-3.5 w-3.5 mr-1" />
                Export PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkExport("txt")}
                className="border-neonblue/50 text-neonblue hover:bg-neonblue/10 text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Export TXT
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedForExport(new Set());
                  setShowBulkActions(false);
                }}
                className="text-mist hover:text-platinum"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {transcripts.length === 0 && !showAddModal ? (
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-graphite flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-mist" />
            </div>
            <h3 className="text-lg font-semibold text-platinum mb-1">
              No transcripts yet
            </h3>
            <p className="text-sm text-silver max-w-md mb-6">
              Add your first call transcript to start building your transcript
              library. Paste text or upload audio for transcription.
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-neonblue hover:bg-neonblue/90 text-obsidian font-medium"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Your First Transcript
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transcript List */}
          <div className="lg:col-span-1">
            <Card className="bg-onyx border-gunmetal">
              <CardContent className="p-3 space-y-1 max-h-[650px] overflow-y-auto">
                {filteredTranscripts.length === 0 ? (
                  <div className="py-8 text-center">
                    <AlertCircle className="h-8 w-8 text-mist mx-auto mb-2" />
                    <p className="text-sm text-silver">
                      No matching transcripts
                    </p>
                    <p className="text-xs text-mist mt-1">
                      Try adjusting your search or filters
                    </p>
                  </div>
                ) : (
                  filteredTranscripts.map((transcript) => {
                    const scoreColor = getScoreColor(transcript.score);
                    const isSelected =
                      selectedTranscript?.id === transcript.id;

                    return (
                      <div
                        key={transcript.id}
                        className={cn(
                          "relative group rounded-lg transition-all border cursor-pointer",
                          isSelected
                            ? "bg-graphite border-neonblue/50"
                            : "border-transparent hover:bg-graphite/50"
                        )}
                      >
                        <button
                          onClick={() => setSelectedTranscript(transcript)}
                          className="w-full p-3 text-left"
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox for bulk */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExportSelection(transcript.id);
                              }}
                              className="mt-0.5 shrink-0"
                            >
                              {selectedForExport.has(transcript.id) ? (
                                <CheckSquare className="h-4 w-4 text-neonblue" />
                              ) : (
                                <Square className="h-4 w-4 text-mist hover:text-silver" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-platinum truncate">
                                  {transcript.contact}
                                </p>
                                <Badge
                                  className={cn(
                                    "text-[10px] px-1.5 py-0 border-transparent shrink-0",
                                    scoreColor.bg,
                                    scoreColor.text
                                  )}
                                >
                                  {transcript.score}
                                </Badge>
                              </div>
                              <p className="text-xs text-silver truncate mt-0.5">
                                {transcript.company}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-mist flex items-center gap-1">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {formatDate(transcript.date)}
                                </span>
                                <span className="text-[10px] text-mist flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {transcript.duration}
                                </span>
                              </div>
                              {transcript.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {transcript.tags.slice(0, 3).map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="text-[9px] px-1.5 py-0 border-gunmetal text-mist"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {transcript.tags.length > 3 && (
                                    <span className="text-[9px] text-mist">
                                      +{transcript.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <ChevronRight className="h-4 w-4 text-mist shrink-0 mt-1" />
                          </div>
                        </button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transcript Detail */}
          <div className="lg:col-span-2">
            {selectedTranscript ? (
              <div className="space-y-4">
                {/* Detail Header */}
                <Card className="bg-onyx border-gunmetal">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-platinum">
                          {selectedTranscript.contact}
                        </h2>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-sm text-silver flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 text-mist" />
                            {selectedTranscript.company}
                          </span>
                          <span className="text-sm text-silver flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-mist" />
                            {selectedTranscript.duration}
                          </span>
                          <span className="text-sm text-silver flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-mist" />
                            {formatDate(selectedTranscript.date)}{" "}
                            {formatTime(selectedTranscript.date)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Score badge */}
                        {(() => {
                          const sc = getScoreColor(selectedTranscript.score);
                          return (
                            <div
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                                sc.bg
                              )}
                            >
                              <Star className={cn("h-4 w-4", sc.text)} />
                              <span
                                className={cn(
                                  "text-lg font-bold",
                                  sc.text
                                )}
                              >
                                {selectedTranscript.score}
                              </span>
                              <span className="text-xs text-mist">/100</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Tags */}
                    {selectedTranscript.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {selectedTranscript.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs border-gunmetal text-silver"
                          >
                            <Tag className="h-2.5 w-2.5 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gunmetal">
                      <Button
                        size="sm"
                        onClick={() => handleExportPDF(selectedTranscript)}
                        className="bg-neonblue hover:bg-neonblue/90 text-obsidian text-xs"
                      >
                        <FileDown className="h-3.5 w-3.5 mr-1" />
                        Export PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportTXT(selectedTranscript)}
                        className="border-gunmetal text-silver hover:text-platinum text-xs"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Export TXT
                      </Button>
                      <div className="flex-1" />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(selectedTranscript.id)}
                        className="text-mist hover:text-errorred text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Transcript Text */}
                <Card className="bg-onyx border-gunmetal">
                  <CardHeader>
                    <CardTitle className="text-sm text-mist flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Full Transcript
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-graphite rounded-lg p-4 max-h-[500px] overflow-y-auto">
                      <pre className="text-sm text-silver whitespace-pre-wrap font-sans leading-relaxed">
                        {selectedTranscript.text}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-onyx border-gunmetal h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center py-16">
                  <FileText className="h-12 w-12 text-mist mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-platinum mb-2">
                    Select a Transcript
                  </h3>
                  <p className="text-sm text-silver">
                    Click on a transcript to view the full content and analysis
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Add Transcript Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="bg-onyx border-gunmetal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
                  <Plus className="h-5 w-5 text-neonblue" />
                  Add Transcript
                </CardTitle>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-md hover:bg-graphite text-mist hover:text-platinum transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Contact + Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-mist flex items-center gap-1">
                    <User className="h-3 w-3" /> Contact Name *
                  </label>
                  <Input
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="bg-graphite border-gunmetal text-platinum placeholder:text-mist/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-mist flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Company
                  </label>
                  <Input
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="bg-graphite border-gunmetal text-platinum placeholder:text-mist/50"
                  />
                </div>
              </div>

              {/* Duration + Score */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-mist flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Duration
                  </label>
                  <Input
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="e.g. 14:32"
                    className="bg-graphite border-gunmetal text-platinum placeholder:text-mist/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-mist flex items-center gap-1">
                    <Star className="h-3 w-3" /> Score (0-100)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formScore}
                    onChange={(e) => setFormScore(e.target.value)}
                    placeholder="e.g. 78"
                    className="bg-graphite border-gunmetal text-platinum placeholder:text-mist/50"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-sm text-mist flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setFormTags((prev) =>
                          prev.includes(tag)
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag]
                        )
                      }
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                        formTags.includes(tag)
                          ? "bg-neonblue/10 text-neonblue border-neonblue/50"
                          : "bg-graphite text-silver border-gunmetal hover:border-silver/30"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {/* Add custom tag */}
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddCustomTag()
                    }
                    placeholder="Add custom tag..."
                    className="bg-graphite border-gunmetal text-platinum placeholder:text-mist/50 h-8 text-xs flex-1 max-w-[200px]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddCustomTag}
                    className="border-gunmetal text-silver hover:text-platinum h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Tag
                  </Button>
                </div>
              </div>

              {/* Transcript Text */}
              <div className="space-y-1.5">
                <label className="text-sm text-mist flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Transcript Text *
                </label>
                <textarea
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Paste your call transcript here..."
                  rows={10}
                  className="w-full rounded-md bg-graphite border border-gunmetal text-platinum placeholder:text-mist/50 text-sm p-3 resize-y focus:border-neonblue focus:outline-none focus:ring-1 focus:ring-neonblue/50"
                />
              </div>

              {/* Audio Upload Notice */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-graphite border border-gunmetal">
                <Mic className="h-5 w-5 text-warningamber mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-platinum font-medium">
                    Audio Transcription
                  </p>
                  <p className="text-xs text-silver mt-0.5">
                    To transcribe audio recordings, use the{" "}
                    <code className="text-neonblue bg-neonblue/10 px-1 py-0.5 rounded text-[10px]">
                      /api/ai/transcribe
                    </code>{" "}
                    endpoint. Upload your audio file and the transcript will
                    appear here automatically.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="mt-2 border-gunmetal text-mist text-xs cursor-not-allowed"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload Audio (Coming Soon)
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2 border-t border-gunmetal">
                <Button
                  onClick={handleAddTranscript}
                  disabled={!formContact.trim() || !formText.trim()}
                  className="bg-neonblue hover:bg-neonblue/90 text-obsidian font-medium disabled:opacity-40"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Save Transcript
                </Button>
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="ghost"
                  className="text-silver hover:text-platinum"
                >
                  Cancel
                </Button>
                {transcripts.length >= MAX_TRANSCRIPTS && (
                  <p className="text-xs text-errorred ml-auto">
                    Storage full ({MAX_TRANSCRIPTS}/{MAX_TRANSCRIPTS}). Oldest
                    will be removed.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
