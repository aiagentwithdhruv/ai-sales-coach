"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getSavedObjections,
  saveObjection,
  toggleFavorite,
  deleteObjection,
  OBJECTION_CATEGORIES,
  type SavedObjection,
} from "@/lib/objection-library";
import { getAuthToken } from "@/lib/auth-token";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen,
  Search,
  Star,
  Trash2,
  Plus,
  Send,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ObjectionsPage() {
  const [savedObjections, setSavedObjections] = useState<SavedObjection[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddNew, setShowAddNew] = useState(false);
  const [newObjection, setNewObjection] = useState("");
  const [newCategory, setNewCategory] = useState("price");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const responseRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSavedObjections(getSavedObjections());
  }, []);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [generatedResponse]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const filteredObjections = savedObjections.filter((obj) => {
    const matchesCategory =
      selectedCategory === "all" || obj.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      obj.objection.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.response.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleGenerateResponse = async () => {
    if (!newObjection.trim() || isGenerating) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsGenerating(true);
    setGeneratedResponse("");

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "objection",
          message: newObjection,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 402) {
          throw new Error("Usage limit reached. Upgrade your plan to continue.");
        }
        throw new Error(
          errorData.details ||
            errorData.error ||
            `Request failed with status ${res.status}`
        );
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          fullResponse += text;
          setGeneratedResponse((prev) => prev + text);
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      setGeneratedResponse(
        `Error generating response: ${errorMessage}. Please try again.`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToLibrary = () => {
    if (!newObjection.trim() || !generatedResponse.trim()) return;

    const saved = saveObjection({
      category: newCategory,
      objection: newObjection.trim(),
      response: generatedResponse.trim(),
    });

    setSavedObjections((prev) => [saved, ...prev]);
    setNewObjection("");
    setNewCategory("price");
    setGeneratedResponse("");
    setShowAddNew(false);
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    setSavedObjections(getSavedObjections());
  };

  const handleDelete = (id: string) => {
    deleteObjection(id);
    setSavedObjections(getSavedObjections());
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const getCategoryInfo = (categoryId: string) => {
    return (
      OBJECTION_CATEGORIES.find((c) => c.id === categoryId) || {
        id: "custom",
        name: "Custom",
        icon: "\u270F\uFE0F",
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-neonblue" />
              Objection Library
            </h1>
            <p className="text-silver mt-1">
              Save and organize AI-powered responses to common objections
            </p>
          </div>
          <Button
            onClick={() => setShowAddNew(!showAddNew)}
            className={cn(
              showAddNew
                ? "bg-gunmetal hover:bg-gunmetal/80 text-silver"
                : "bg-neonblue hover:bg-electricblue text-white"
            )}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showAddNew ? "Cancel" : "Add New"}
          </Button>
        </div>

        {showAddNew && (
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-neonblue" />
                Generate New Response
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-mist">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-onyx border border-gunmetal text-platinum text-sm focus:outline-none focus:border-neonblue"
                >
                  {OBJECTION_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-mist">Objection</label>
                <textarea
                  value={newObjection}
                  onChange={(e) => setNewObjection(e.target.value)}
                  placeholder='e.g., "Your product is too expensive for our budget..."'
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-onyx border border-gunmetal text-platinum text-sm placeholder:text-mist focus:outline-none focus:border-neonblue resize-none"
                />
              </div>

              <Button
                onClick={handleGenerateResponse}
                disabled={!newObjection.trim() || isGenerating}
                className="bg-neonblue hover:bg-electricblue text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Generate Response
                  </>
                )}
              </Button>

              {(generatedResponse || isGenerating) && (
                <div className="space-y-3">
                  <div className="border-t border-gunmetal pt-4">
                    <label className="text-sm text-mist">
                      AI Generated Response
                    </label>
                  </div>
                  <div
                    ref={responseRef}
                    className="bg-onyx rounded-lg p-4 max-h-[400px] overflow-y-auto"
                  >
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200">
                      {generatedResponse ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {generatedResponse}
                        </ReactMarkdown>
                      ) : (
                        <div className="flex items-center gap-2 text-mist">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing objection...
                        </div>
                      )}
                    </div>
                  </div>
                  {generatedResponse && !isGenerating && (
                    <Button
                      onClick={handleSaveToLibrary}
                      className="bg-automationgreen hover:bg-automationgreen/80 text-white"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Save to Library
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search objections..."
                className="w-full h-10 pl-10 pr-4 rounded-md bg-onyx border border-gunmetal text-platinum text-sm placeholder:text-mist focus:outline-none focus:border-neonblue"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-mist" />
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                selectedCategory === "all"
                  ? "bg-neonblue text-white"
                  : "bg-onyx text-silver hover:text-platinum border border-gunmetal"
              )}
            >
              All
            </button>
            {OBJECTION_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  selectedCategory === cat.id
                    ? "bg-neonblue text-white"
                    : "bg-onyx text-silver hover:text-platinum border border-gunmetal"
                )}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {filteredObjections.length === 0 ? (
          <Card className="bg-graphite border-gunmetal">
            <CardContent className="py-16 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-neonblue/10 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-neonblue" />
              </div>
              <h3 className="text-lg font-medium text-platinum mb-2">
                {savedObjections.length === 0
                  ? "No Saved Objections Yet"
                  : "No Matching Objections"}
              </h3>
              <p className="text-sm text-silver max-w-md mb-6">
                {savedObjections.length === 0
                  ? 'Build your objection library by clicking "Add New" to generate AI-powered responses to common sales objections.'
                  : "Try adjusting your search or category filter to find what you're looking for."}
              </p>
              {savedObjections.length === 0 && (
                <Button
                  onClick={() => setShowAddNew(true)}
                  className="bg-neonblue hover:bg-electricblue text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Objection
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredObjections.map((obj) => {
              const category = getCategoryInfo(obj.category);
              return (
                <Card key={obj.id} className="bg-graphite border-gunmetal">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center shrink-0 text-lg">
                          {category.icon}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs text-mist">
                            {category.name}
                          </span>
                          <p className="text-sm font-medium text-platinum truncate">
                            {obj.objection}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleFavorite(obj.id)}
                          className="p-1.5 rounded-md hover:bg-onyx transition-colors"
                        >
                          <Star
                            className={cn(
                              "h-4 w-4 transition-colors",
                              obj.isFavorite
                                ? "text-warningamber fill-warningamber"
                                : "text-mist hover:text-warningamber"
                            )}
                          />
                        </button>
                        <button
                          onClick={() => handleCopy(obj.id, obj.response)}
                          className="p-1.5 rounded-md hover:bg-onyx transition-colors"
                        >
                          {copiedId === obj.id ? (
                            <Check className="h-4 w-4 text-automationgreen" />
                          ) : (
                            <Copy className="h-4 w-4 text-mist hover:text-platinum" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(obj.id)}
                          className="p-1.5 rounded-md hover:bg-onyx transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-mist hover:text-errorred" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-onyx rounded-lg p-4">
                      <div className="prose prose-invert prose-sm max-w-none prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {obj.response}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-mist">
                        {new Date(obj.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {obj.model && (
                        <span className="text-xs text-mist">{obj.model}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
