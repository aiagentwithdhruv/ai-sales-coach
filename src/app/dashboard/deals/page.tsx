"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building2,
  Calendar,
  ArrowRight,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock deals data
const DEALS = [
  {
    id: "1",
    name: "Enterprise Platform Deal",
    company: "Acme Corporation",
    contact: "Sarah Johnson",
    value: 125000,
    stage: "Negotiation",
    probability: 75,
    closeDate: "2024-02-15",
    healthScore: 85,
    daysInStage: 12,
    meddic: {
      metrics: true,
      economicBuyer: true,
      decisionCriteria: true,
      decisionProcess: false,
      identifyPain: true,
      champion: true,
    },
    nextSteps: ["Send revised proposal", "Schedule legal review"],
    risks: ["Competitor mentioned in last call"],
  },
  {
    id: "2",
    name: "Team License Expansion",
    company: "TechStart Inc",
    contact: "Mike Chen",
    value: 48000,
    stage: "Demo",
    probability: 50,
    closeDate: "2024-03-01",
    healthScore: 62,
    daysInStage: 8,
    meddic: {
      metrics: false,
      economicBuyer: false,
      decisionCriteria: true,
      decisionProcess: false,
      identifyPain: true,
      champion: false,
    },
    nextSteps: ["Identify economic buyer", "Build internal champion"],
    risks: ["No clear champion", "Budget not confirmed"],
  },
  {
    id: "3",
    name: "Annual Contract Renewal",
    company: "Global Industries",
    contact: "Lisa Wang",
    value: 85000,
    stage: "Closing",
    probability: 90,
    closeDate: "2024-02-01",
    healthScore: 95,
    daysInStage: 5,
    meddic: {
      metrics: true,
      economicBuyer: true,
      decisionCriteria: true,
      decisionProcess: true,
      identifyPain: true,
      champion: true,
    },
    nextSteps: ["Final signature"],
    risks: [],
  },
  {
    id: "4",
    name: "New Market Entry",
    company: "Startup Labs",
    contact: "Alex Rivera",
    value: 32000,
    stage: "Discovery",
    probability: 25,
    closeDate: "2024-04-15",
    healthScore: 45,
    daysInStage: 3,
    meddic: {
      metrics: false,
      economicBuyer: false,
      decisionCriteria: false,
      decisionProcess: false,
      identifyPain: true,
      champion: false,
    },
    nextSteps: ["Complete discovery call", "Identify decision makers"],
    risks: ["Early stage", "Budget uncertainty"],
  },
];

const PIPELINE_STAGES = ["Discovery", "Demo", "Proposal", "Negotiation", "Closing"];

// Stats
const STATS = {
  totalPipeline: DEALS.reduce((sum, d) => sum + d.value, 0),
  weightedPipeline: DEALS.reduce((sum, d) => sum + d.value * (d.probability / 100), 0),
  atRisk: DEALS.filter((d) => d.healthScore < 60).length,
  closingThisMonth: DEALS.filter((d) => d.stage === "Closing" || d.stage === "Negotiation").length,
};

export default function DealsPage() {
  const [selectedDeal, setSelectedDeal] = useState<string | null>(DEALS[0].id);

  const selectedDealData = DEALS.find((d) => d.id === selectedDeal);

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-automationgreen";
    if (score >= 60) return "text-warningamber";
    return "text-errorred";
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return "bg-automationgreen/20";
    if (score >= 60) return "bg-warningamber/20";
    return "bg-errorred/20";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-neonblue" />
              Deal Intelligence
            </h1>
            <p className="text-silver mt-1">
              AI-powered analysis of your pipeline deals
            </p>
          </div>
          <Button className="bg-neonblue hover:bg-electricblue text-white">
            <Sparkles className="h-4 w-4 mr-2" />
            Analyze All Deals
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-neonblue" />
              </div>
              <div>
                <p className="text-xs text-mist">Total Pipeline</p>
                <p className="text-lg font-semibold text-platinum">
                  {formatCurrency(STATS.totalPipeline)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-automationgreen/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-automationgreen" />
              </div>
              <div>
                <p className="text-xs text-mist">Weighted Value</p>
                <p className="text-lg font-semibold text-platinum">
                  {formatCurrency(STATS.weightedPipeline)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-errorred/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-errorred" />
              </div>
              <div>
                <p className="text-xs text-mist">At Risk</p>
                <p className="text-lg font-semibold text-errorred">
                  {STATS.atRisk} deals
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warningamber/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warningamber" />
              </div>
              <div>
                <p className="text-xs text-mist">Closing Soon</p>
                <p className="text-lg font-semibold text-platinum">
                  {STATS.closingThisMonth} deals
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deal List */}
          <div className="lg:col-span-1">
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum">Active Deals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {DEALS.map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => setSelectedDeal(deal.id)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-all",
                      "border",
                      selectedDeal === deal.id
                        ? "bg-neonblue/10 border-neonblue"
                        : "bg-onyx border-gunmetal hover:border-neonblue/50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-platinum text-sm truncate">
                          {deal.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-mist mt-1">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">{deal.company}</span>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "text-xs",
                          getHealthBg(deal.healthScore),
                          getHealthColor(deal.healthScore)
                        )}
                      >
                        {deal.healthScore}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-automationgreen font-medium">
                        {formatCurrency(deal.value)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {deal.stage}
                      </Badge>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Deal Details */}
          <div className="lg:col-span-2">
            {selectedDealData ? (
              <div className="space-y-6">
                {/* Deal Header */}
                <Card className="bg-graphite border-gunmetal">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-platinum">
                          {selectedDealData.name}
                        </h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-silver">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {selectedDealData.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {selectedDealData.contact}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-automationgreen">
                          {formatCurrency(selectedDealData.value)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{selectedDealData.stage}</Badge>
                          <span className="text-xs text-mist">
                            {selectedDealData.probability}% likely
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stage Progress */}
                    <div className="mt-4">
                      <div className="flex justify-between mb-2">
                        {PIPELINE_STAGES.map((stage, index) => (
                          <div
                            key={stage}
                            className={cn(
                              "text-xs",
                              PIPELINE_STAGES.indexOf(selectedDealData.stage) >= index
                                ? "text-neonblue"
                                : "text-mist"
                            )}
                          >
                            {stage}
                          </div>
                        ))}
                      </div>
                      <Progress
                        value={
                          ((PIPELINE_STAGES.indexOf(selectedDealData.stage) + 1) /
                            PIPELINE_STAGES.length) *
                          100
                        }
                        className="h-2 bg-onyx"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* MEDDIC Analysis */}
                <Card className="bg-graphite border-gunmetal">
                  <CardHeader>
                    <CardTitle className="text-platinum flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-neonblue" />
                      MEDDIC Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(selectedDealData.meddic).map(([key, value]) => (
                        <div
                          key={key}
                          className={cn(
                            "p-3 rounded-lg flex items-center gap-2",
                            value ? "bg-automationgreen/10" : "bg-errorred/10"
                          )}
                        >
                          {value ? (
                            <CheckCircle className="h-4 w-4 text-automationgreen" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-errorred" />
                          )}
                          <span
                            className={cn(
                              "text-sm capitalize",
                              value ? "text-automationgreen" : "text-errorred"
                            )}
                          >
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Next Steps */}
                  <Card className="bg-graphite border-gunmetal">
                    <CardHeader>
                      <CardTitle className="text-platinum text-base">
                        Recommended Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedDealData.nextSteps.map((step, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded-lg bg-onyx"
                        >
                          <ArrowRight className="h-4 w-4 text-neonblue" />
                          <span className="text-sm text-platinum">{step}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Risks */}
                  <Card className="bg-graphite border-gunmetal">
                    <CardHeader>
                      <CardTitle className="text-platinum text-base">
                        Risk Factors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedDealData.risks.length > 0 ? (
                        selectedDealData.risks.map((risk, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 rounded-lg bg-errorred/10"
                          >
                            <AlertTriangle className="h-4 w-4 text-errorred" />
                            <span className="text-sm text-platinum">{risk}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-automationgreen/10">
                          <CheckCircle className="h-4 w-4 text-automationgreen" />
                          <span className="text-sm text-platinum">
                            No significant risks identified
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="bg-graphite border-gunmetal h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-mist mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-platinum mb-2">
                    Select a Deal
                  </h3>
                  <p className="text-sm text-silver">
                    Choose a deal from the list to view AI analysis
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
