"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  getCustomPersonas,
  saveCustomPersona,
  updateCustomPersona,
  deleteCustomPersona,
  INDUSTRIES,
  PERSONALITY_TEMPLATES,
  type CustomPersona,
} from "@/lib/custom-personas";
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DIFFICULTY_CONFIG = {
  easy: {
    label: "Easy",
    bg: "bg-automationgreen/20",
    text: "text-automationgreen",
    ring: "ring-automationgreen/40",
  },
  medium: {
    label: "Medium",
    bg: "bg-warningamber/20",
    text: "text-warningamber",
    ring: "ring-warningamber/40",
  },
  hard: {
    label: "Hard",
    bg: "bg-errorred/20",
    text: "text-errorred",
    ring: "ring-errorred/40",
  },
} as const;

interface FormState {
  name: string;
  title: string;
  company: string;
  industry: string;
  personality: string;
  difficulty: "easy" | "medium" | "hard";
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  title: "",
  company: "",
  industry: "",
  personality: "",
  difficulty: "medium",
  notes: "",
};

export default function PersonasPage() {
  const [personas, setPersonas] = useState<CustomPersona[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setPersonas(getCustomPersonas());
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setShowIndustryDropdown(false);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.title.trim()) return;

    if (editingId) {
      updateCustomPersona(editingId, {
        name: form.name.trim(),
        title: form.title.trim(),
        company: form.company.trim(),
        industry: form.industry,
        personality: form.personality.trim(),
        difficulty: form.difficulty,
        notes: form.notes.trim() || undefined,
      });
    } else {
      saveCustomPersona({
        name: form.name.trim(),
        title: form.title.trim(),
        company: form.company.trim(),
        industry: form.industry,
        personality: form.personality.trim(),
        difficulty: form.difficulty,
        notes: form.notes.trim() || undefined,
      });
    }

    setPersonas(getCustomPersonas());
    resetForm();
  };

  const handleEdit = (persona: CustomPersona) => {
    setForm({
      name: persona.name,
      title: persona.title,
      company: persona.company,
      industry: persona.industry,
      personality: persona.personality,
      difficulty: persona.difficulty,
      notes: persona.notes || "",
    });
    setEditingId(persona.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    deleteCustomPersona(id);
    setPersonas(getCustomPersonas());
    setDeleteConfirmId(null);
  };

  const easyCount = personas.filter((p) => p.difficulty === "easy").length;
  const mediumCount = personas.filter((p) => p.difficulty === "medium").length;
  const hardCount = personas.filter((p) => p.difficulty === "hard").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-neonblue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-platinum">Custom Personas</h1>
            <p className="text-sm text-silver">
              Create custom prospect personas to practice selling against
            </p>
          </div>
        </div>
        {!showForm && (
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-neonblue hover:bg-electricblue"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-neonblue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-platinum">{personas.length}</p>
              <p className="text-xs text-mist">Total Personas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-automationgreen/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-automationgreen" />
            </div>
            <div>
              <p className="text-2xl font-bold text-automationgreen">{easyCount}</p>
              <p className="text-xs text-mist">Easy</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warningamber/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-warningamber" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warningamber">{mediumCount}</p>
              <p className="text-xs text-mist">Medium</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-errorred/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-errorred" />
            </div>
            <div>
              <p className="text-2xl font-bold text-errorred">{hardCount}</p>
              <p className="text-xs text-mist">Hard</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="bg-onyx border-gunmetal">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit3 className="h-5 w-5 text-neonblue" />
                  Edit Persona
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-neonblue" />
                  Create New Persona
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-mist">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sarah Mitchell"
                  className="bg-graphite border-gunmetal text-platinum placeholder:text-mist/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-mist">Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. VP of Engineering"
                  className="bg-graphite border-gunmetal text-platinum placeholder:text-mist/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-mist">Company</label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  className="bg-graphite border-gunmetal text-platinum placeholder:text-mist/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-mist">Industry</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm",
                    "bg-graphite border border-gunmetal text-platinum",
                    "hover:border-silver/30 transition-colors"
                  )}
                >
                  <span className={form.industry ? "text-platinum" : "text-mist/50"}>
                    {form.industry || "Select an industry..."}
                  </span>
                  <ChevronDown className="h-4 w-4 text-mist" />
                </button>
                {showIndustryDropdown && (
                  <div className="absolute z-20 mt-1 w-full bg-graphite border border-gunmetal rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {INDUSTRIES.map((industry) => (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, industry });
                          setShowIndustryDropdown(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm hover:bg-onyx transition-colors",
                          form.industry === industry
                            ? "text-neonblue bg-neonblue/5"
                            : "text-silver"
                        )}
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-mist">Personality & Behavior</label>
              <Textarea
                value={form.personality}
                onChange={(e) => setForm({ ...form, personality: e.target.value })}
                placeholder="Describe how this persona behaves in sales conversations..."
                rows={3}
                className="bg-graphite border-gunmetal text-platinum placeholder:text-mist/50 resize-none"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs text-mist flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Suggestions:
                </span>
                {PERSONALITY_TEMPLATES.map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => setForm({ ...form, personality: template })}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-colors",
                      form.personality === template
                        ? "bg-neonblue/10 border-neonblue/30 text-neonblue"
                        : "bg-graphite border-gunmetal text-silver hover:border-silver/30 hover:text-platinum"
                    )}
                  >
                    {template.length > 45 ? template.slice(0, 45) + "..." : template}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-mist">Difficulty</label>
              <div className="flex gap-3">
                {(["easy", "medium", "hard"] as const).map((level) => {
                  const config = DIFFICULTY_CONFIG[level];
                  const isSelected = form.difficulty === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setForm({ ...form, difficulty: level })}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border",
                        isSelected
                          ? cn(config.bg, config.text, "border-transparent ring-2", config.ring)
                          : "bg-graphite border-gunmetal text-silver hover:text-platinum"
                      )}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-mist">Notes (optional)</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional context for this persona..."
                rows={2}
                className="bg-graphite border-gunmetal text-platinum placeholder:text-mist/50 resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={!form.name.trim() || !form.title.trim()}
                className="bg-neonblue hover:bg-electricblue disabled:opacity-40"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingId ? "Update Persona" : "Save Persona"}
              </Button>
              <Button
                onClick={resetForm}
                variant="ghost"
                className="text-silver hover:text-platinum"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {personas.length === 0 && !showForm ? (
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-graphite flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-mist" />
            </div>
            <h3 className="text-lg font-semibold text-platinum mb-1">No personas yet</h3>
            <p className="text-sm text-silver max-w-md mb-6">
              Create custom prospect personas to practice your sales skills against different buyer types and difficulty levels.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-neonblue hover:bg-electricblue"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Persona
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personas.map((persona) => {
            const diffConfig = DIFFICULTY_CONFIG[persona.difficulty];
            return (
              <Card key={persona.id} className="bg-onyx border-gunmetal group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-platinum truncate">
                        {persona.name}
                      </h3>
                      <p className="text-sm text-silver truncate">
                        {persona.title}
                        {persona.company && (
                          <span className="text-mist"> at {persona.company}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(persona)}
                        className="p-1.5 rounded-md hover:bg-graphite text-silver hover:text-platinum transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      {deleteConfirmId === persona.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(persona.id)}
                            className="p-1.5 rounded-md bg-errorred/20 text-errorred hover:bg-errorred/30 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-1.5 rounded-md hover:bg-graphite text-silver hover:text-platinum transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(persona.id)}
                          className="p-1.5 rounded-md hover:bg-graphite text-silver hover:text-errorred transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {persona.industry && (
                      <Badge
                        variant="outline"
                        className="border-gunmetal text-mist text-xs"
                      >
                        {persona.industry}
                      </Badge>
                    )}
                    <Badge
                      className={cn(
                        "text-xs border-transparent",
                        diffConfig.bg,
                        diffConfig.text
                      )}
                    >
                      {diffConfig.label}
                    </Badge>
                  </div>

                  {persona.personality && (
                    <p className="text-sm text-silver line-clamp-2 leading-relaxed">
                      {persona.personality}
                    </p>
                  )}

                  {persona.notes && (
                    <p className="text-xs text-mist mt-2 italic line-clamp-1">
                      {persona.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
