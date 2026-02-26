"use client";

/**
 * ROI Dashboard
 *
 * Shows the return on investment of the AI sales team:
 *   - Cost per lead, per meeting, per deal
 *   - Agent contribution breakdown
 *   - ROI multiple (revenue / cost)
 *   - LTV:CAC ratio
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Users,
  Phone,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  BarChart3,
  PieChart,
  RefreshCw,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth-token";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ROIData {
  commission: {
    period: { start: string; end: string };
    subscription: { tier: string; monthlyCost: number; agentCount: number };
    agents: Array<{
      agent_type: string;
      agent_label: string;
      allocated_cost: number;
      revenue_generated: number;
      deals_contributed: number;
      deals_won: number;
      roi_multiple: number;
      cost_per_deal: number;
      efficiency_score: number;
    }>;
    totals: {
      totalCost: number;
      totalRevenue: number;
      netROI: number;
      roiMultiple: number;
    };
  };
  roi: {
    cost_per_lead: number;
    cost_per_qualified: number;
    cost_per_meeting: number;
    cost_per_deal_won: number;
    avg_deal_size: number;
    ltv_to_cac_ratio: number;
    payback_period_days: number;
    monthly_roi_percent: number;
  };
}

type Period = "month" | "quarter" | "year";

export default function ROIDashboardPage() {
  const [data, setData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  const fetchData = async (p: Period) => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch(`/api/analytics/roi?period=${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("ROI fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-neonblue animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="h-12 w-12 text-mist mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-platinum">No data yet</h2>
        <p className="text-silver mt-2">
          Start using your AI sales team to see ROI metrics.
        </p>
        <Link href="/dashboard">
          <Button className="mt-4 bg-neonblue hover:bg-electricblue text-white">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const { commission, roi } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-platinum">
            ROI Dashboard
          </h1>
          <p className="text-silver text-sm mt-1">
            Track the return on your AI sales team investment
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["month", "quarter", "year"] as Period[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
              className={cn(
                period === p
                  ? "bg-neonblue hover:bg-electricblue text-white"
                  : "border-gunmetal text-silver hover:text-platinum"
              )}
            >
              {p === "month" ? "This Month" : p === "quarter" ? "Quarter" : "Year"}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchData(period)}
            className="border-gunmetal text-silver hover:text-platinum"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ROI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="ROI Multiple"
          value={`${commission.totals.roiMultiple}x`}
          sublabel="Revenue / Cost"
          icon={TrendingUp}
          color="neonblue"
          trend={commission.totals.roiMultiple >= 1 ? "up" : "down"}
        />
        <MetricCard
          label="Net ROI"
          value={`$${commission.totals.netROI.toLocaleString()}`}
          sublabel={`${roi.monthly_roi_percent}% monthly`}
          icon={DollarSign}
          color={commission.totals.netROI >= 0 ? "automationgreen" : "errorred"}
          trend={commission.totals.netROI >= 0 ? "up" : "down"}
        />
        <MetricCard
          label="Cost per Lead"
          value={`$${roi.cost_per_lead}`}
          sublabel="All leads generated"
          icon={Users}
          color="warningamber"
        />
        <MetricCard
          label="Cost per Deal"
          value={`$${roi.cost_per_deal_won}`}
          sublabel="Won deals only"
          icon={Target}
          color="purple-400"
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unit Economics */}
        <Card className="card-metallic">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
              <PieChart className="h-5 w-5 text-neonblue" />
              Unit Economics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <EconomicRow
                label="Cost per Lead"
                value={`$${roi.cost_per_lead}`}
                benchmark="< $50"
                good={roi.cost_per_lead < 50}
              />
              <EconomicRow
                label="Cost per Qualified Lead"
                value={`$${roi.cost_per_qualified}`}
                benchmark="< $150"
                good={roi.cost_per_qualified < 150}
              />
              <EconomicRow
                label="Cost per Meeting"
                value={`$${roi.cost_per_meeting}`}
                benchmark="< $200"
                good={roi.cost_per_meeting < 200}
              />
              <EconomicRow
                label="Cost per Deal Won"
                value={`$${roi.cost_per_deal_won}`}
                benchmark="< $500"
                good={roi.cost_per_deal_won < 500}
              />
              <div className="pt-3 border-t border-gunmetal">
                <EconomicRow
                  label="Avg Deal Size"
                  value={`$${roi.avg_deal_size.toLocaleString()}`}
                  benchmark=""
                  good={true}
                />
                <EconomicRow
                  label="LTV:CAC Ratio"
                  value={`${roi.ltv_to_cac_ratio}:1`}
                  benchmark="> 3:1"
                  good={roi.ltv_to_cac_ratio >= 3}
                />
                <EconomicRow
                  label="Payback Period"
                  value={`${roi.payback_period_days} days`}
                  benchmark="< 90 days"
                  good={roi.payback_period_days < 90}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Breakdown */}
        <Card className="card-metallic">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-automationgreen" />
              Investment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-graphite">
                <span className="text-sm text-silver">Plan</span>
                <span className="text-sm font-medium text-platinum capitalize">
                  {commission.subscription.tier} (${commission.subscription.monthlyCost}/mo)
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-graphite">
                <span className="text-sm text-silver">Period Cost</span>
                <span className="text-sm font-medium text-platinum">
                  ${commission.totals.totalCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-graphite">
                <span className="text-sm text-silver">Revenue Generated</span>
                <span className="text-sm font-medium text-automationgreen">
                  ${commission.totals.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-onyx border border-gunmetal">
                <span className="text-sm font-medium text-platinum">Net Return</span>
                <span
                  className={cn(
                    "text-lg font-bold",
                    commission.totals.netROI >= 0
                      ? "text-automationgreen"
                      : "text-errorred"
                  )}
                >
                  {commission.totals.netROI >= 0 ? "+" : ""}$
                  {commission.totals.netROI.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      {commission.agents.length > 0 && (
        <Card className="card-metallic">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-warningamber" />
              Agent Performance & Attribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gunmetal">
                    <th className="text-left py-3 px-4 text-xs font-medium text-mist uppercase">
                      Agent
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-mist uppercase">
                      Deals Touched
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-mist uppercase">
                      Won
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-mist uppercase">
                      Revenue
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-mist uppercase">
                      Cost
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-mist uppercase">
                      ROI
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-mist uppercase">
                      Efficiency
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {commission.agents.map((agent) => (
                    <tr
                      key={agent.agent_type}
                      className="border-b border-gunmetal/50 hover:bg-graphite/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-platinum">
                          {agent.agent_label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-silver">
                        {agent.deals_contributed}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-automationgreen font-medium">
                        {agent.deals_won}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-platinum">
                        ${agent.revenue_generated.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-silver">
                        ${agent.allocated_cost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            agent.roi_multiple >= 1
                              ? "text-automationgreen"
                              : "text-warningamber"
                          )}
                        >
                          {agent.roi_multiple}x
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gunmetal rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                agent.efficiency_score >= 70
                                  ? "bg-automationgreen"
                                  : agent.efficiency_score >= 40
                                    ? "bg-warningamber"
                                    : "bg-errorred"
                              )}
                              style={{ width: `${agent.efficiency_score}%` }}
                            />
                          </div>
                          <span className="text-xs text-mist w-8 text-right">
                            {agent.efficiency_score}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  sublabel: string;
  icon: typeof DollarSign;
  color: string;
  trend?: "up" | "down";
}) {
  return (
    <Card className="card-metallic">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg bg-${color}/10`}>
            <Icon className={`h-5 w-5 text-${color}`} />
          </div>
          {trend && (
            trend === "up" ? (
              <ArrowUpRight className="h-4 w-4 text-automationgreen" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-errorred" />
            )
          )}
        </div>
        <p className="text-2xl font-bold text-platinum">{value}</p>
        <p className="text-xs text-mist mt-1">{sublabel}</p>
        <p className="text-xs text-silver mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

function EconomicRow({
  label,
  value,
  benchmark,
  good,
}: {
  label: string;
  value: string;
  benchmark: string;
  good: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-silver">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-platinum">{value}</span>
        {benchmark && (
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              good
                ? "bg-automationgreen/10 text-automationgreen"
                : "bg-warningamber/10 text-warningamber"
            )}
          >
            {benchmark}
          </span>
        )}
      </div>
    </div>
  );
}
