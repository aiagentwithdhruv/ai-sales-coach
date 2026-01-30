"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Sparkles } from "lucide-react";

interface Persona {
  id: string;
  name: string;
  title: string;
  company: string;
  personality: string;
  difficulty: "easy" | "medium" | "hard";
  industry: string;
}

interface PersonaSelectorProps {
  personas: Persona[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const difficultyColors = {
  easy: "bg-automationgreen/20 text-automationgreen",
  medium: "bg-warningamber/20 text-warningamber",
  hard: "bg-errorred/20 text-errorred",
};

const difficultyLabels = {
  easy: "Beginner",
  medium: "Intermediate",
  hard: "Advanced",
};

export function PersonaSelector({
  personas,
  selectedId,
  onSelect,
}: PersonaSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-silver">
        <Sparkles className="h-4 w-4 text-neonblue" />
        <span>Select a persona to practice with</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {personas.map((persona) => (
          <Card
            key={persona.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:border-neonblue",
              selectedId === persona.id
                ? "border-neonblue bg-neonblue/5"
                : "bg-onyx border-gunmetal"
            )}
            onClick={() => onSelect(persona.id)}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-graphite text-platinum text-sm">
                    {persona.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-platinum truncate">
                      {persona.name}
                    </h4>
                    <Badge className={cn("text-xs", difficultyColors[persona.difficulty])}>
                      {difficultyLabels[persona.difficulty]}
                    </Badge>
                  </div>
                  <p className="text-xs text-mist truncate">{persona.title}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-silver">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{persona.company}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-silver mt-2 line-clamp-2">
                {persona.personality}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
