"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCRM } from "@/hooks/useCRM";
import type {
  PipelineAnalytics,
  DealForecast,
  CRMNotification,
  Contact,
} from "@/types/crm";
import { STAGE_CONFIG, type DealStage } from "@/types/crm";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  CheckCircle,
  XCircle,
  Zap,
  Bell,
  BellOff,
  ChevronRight,
  Loader2,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const crm = useCRM();
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);
  const [forecast, setForecast] = useState<DealForecast | null>(null);
  const [notifications, setNotifications] = useState<CRMNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "forecast" | "alerts">("overview");

  const loadData = async () => {
    setLoading(true);
    const [analyticsData, forecastData, notifsData] = await Promise.all([
      crm.fetchAnalytics(),
      crm.fetchForecast(),
      crm.fetchNotifications(),
    ]);
    if (analyticsData) setAnalytics(analyticsData);
    if (forecastData) setForecast(forecastData);
    setNotifications(notifsData.notifications);
    setUnreadCount(notifsData.unreadCount);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateAlerts = async () => {
    const count = await crm.generateNotifications();
    if (count > 0) {
      const notifsData = await crm.fetchNotifications();
      setNotifications(notifsData.notifications);
      setUnreadCount(notifsData.unreadCount);
    }
  };

  const handleMarkAllRead = async () => {
    await crm.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDismiss = async (id: string) => {
    await crm.dismissNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-errorred bg-errorred/10 border-errorred/30";
      case "warning":
        return "text-warningamber bg-warningamber/10 border-warningamber/30";
      case "success":
        return "text-automationgreen bg-automationgreen/10 border-automationgreen/30";
      default:
        return "text-neonblue bg-neonblue/10 border-neonblue/30";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/crm">
              <Button variant="ghost" size="icon" className="text-silver hover:text-platinum">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-platinum">Pipeline Analytics</h1>
              <p className="text-sm text-mist">Conversion funnels, deal velocity, forecasting & alerts</p>
            </div>
          </div>
          <Button
            onClick={loadData}
            variant="outline"
            className="border-gunmetal text-silver hover:text-platinum gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(
            [
              { id: "overview" as const, label: "Overview", icon: BarChart3, badge: 0 },
              { id: "forecast" as const, label: "Forecast", icon: TrendingUp, badge: 0 },
              { id: "alerts" as const, label: "Alerts", icon: Bell, badge: unreadCount },
            ]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-neonblue/10 text-neonblue border border-neonblue/30"
                  : "text-silver hover:text-platinum hover:bg-white/5 border border-transparent"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.badge ? (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-errorred text-white">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-neonblue" />
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && analytics && (
              <div className="space-y-6">
                {/* Win/Loss Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="stat-card-premium rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-automationgreen/10">
                          <Target className="h-5 w-5 text-automationgreen" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-platinum">
                            {analytics.winLoss.winRate}%
                          </p>
                          <p className="text-xs text-mist">Win Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                  <div className="stat-card-premium rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-neonblue/10">
                          <CheckCircle className="h-5 w-5 text-neonblue" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-platinum">
                            {analytics.winLoss.totalWon}
                          </p>
                          <p className="text-xs text-mist">Deals Won</p>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                  <div className="stat-card-premium rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-errorred/10">
                          <XCircle className="h-5 w-5 text-errorred" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-platinum">
                            {analytics.winLoss.totalLost}
                          </p>
                          <p className="text-xs text-mist">Deals Lost</p>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                  <div className="stat-card-premium rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warningamber/10">
                          <Clock className="h-5 w-5 text-warningamber" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-platinum">
                            {analytics.winLoss.avgDaysToWin}d
                          </p>
                          <p className="text-xs text-mist">Avg Days to Win</p>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </div>

                {/* Conversion Funnel */}
                <div className="card-metallic rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-neonblue" />
                      Conversion Funnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.funnel.map((stage, i) => {
                        const maxCount = Math.max(
                          ...analytics.funnel.map((f) => f.count),
                          1
                        );
                        const width = Math.max(
                          (stage.count / maxCount) * 100,
                          8
                        );
                        const config =
                          STAGE_CONFIG[stage.stage as DealStage];

                        return (
                          <div key={stage.stage} className="flex items-center gap-4">
                            <div className="w-28 text-sm text-silver shrink-0">
                              {stage.label}
                            </div>
                            <div className="flex-1">
                              <div className="relative h-8 bg-onyx rounded-lg overflow-hidden">
                                <div
                                  className={cn(
                                    "absolute inset-y-0 left-0 rounded-lg transition-all duration-500 flex items-center px-3",
                                    config?.bgColor || "bg-neonblue/10"
                                  )}
                                  style={{ width: `${width}%` }}
                                >
                                  <span className="text-xs font-bold text-platinum">
                                    {stage.count}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="w-20 text-right text-xs text-mist shrink-0">
                              {formatCurrency(stage.value)}
                            </div>
                            {i < analytics.funnel.length - 1 && (
                              <div className="w-16 text-right shrink-0">
                                <span
                                  className={cn(
                                    "text-xs font-medium",
                                    stage.conversionRate >= 50
                                      ? "text-automationgreen"
                                      : stage.conversionRate >= 25
                                        ? "text-warningamber"
                                        : "text-errorred"
                                  )}
                                >
                                  {stage.conversionRate}%
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </div>

                {/* Deal Velocity */}
                <div className="card-metallic rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
                      <Clock className="h-5 w-5 text-warningamber" />
                      Deal Velocity (Avg Days per Stage)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {analytics.velocity.map((v) => (
                        <div
                          key={v.stage}
                          className="text-center p-4 rounded-lg bg-onyx/50"
                        >
                          <p className="text-2xl font-bold text-platinum">
                            {v.avgDaysInStage || "—"}
                          </p>
                          <p className="text-xs text-mist mt-1">{v.label}</p>
                          <p className="text-xs text-silver mt-1">
                            {v.dealsCount} deal{v.dealsCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                {/* Monthly Trend */}
                <div className="card-metallic rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-automationgreen" />
                      Monthly Trend (Last 6 Months)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.monthlyTrend.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-mist border-b border-gunmetal">
                              <th className="text-left py-2 px-3">Month</th>
                              <th className="text-center py-2 px-3">New</th>
                              <th className="text-center py-2 px-3">Won</th>
                              <th className="text-center py-2 px-3">Lost</th>
                              <th className="text-right py-2 px-3">Won Value</th>
                              <th className="text-right py-2 px-3">Lost Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.monthlyTrend.map((m) => (
                              <tr
                                key={m.month}
                                className="border-b border-gunmetal/50"
                              >
                                <td className="py-2 px-3 text-platinum">
                                  {new Date(m.month + "-01").toLocaleDateString(
                                    "en-US",
                                    { month: "short", year: "numeric" }
                                  )}
                                </td>
                                <td className="text-center py-2 px-3 text-neonblue">
                                  {m.newDeals}
                                </td>
                                <td className="text-center py-2 px-3 text-automationgreen font-medium">
                                  {m.won}
                                </td>
                                <td className="text-center py-2 px-3 text-errorred">
                                  {m.lost}
                                </td>
                                <td className="text-right py-2 px-3 text-automationgreen">
                                  {formatCurrency(m.wonValue)}
                                </td>
                                <td className="text-right py-2 px-3 text-errorred">
                                  {formatCurrency(m.lostValue)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-mist text-center py-8">
                        No trend data yet. Start closing deals to see your monthly performance.
                      </p>
                    )}
                  </CardContent>
                </div>

                {/* Stalled Deals */}
                {analytics.stalledDeals.length > 0 && (
                  <div className="card-metallic rounded-xl border-l-2 border-l-warningamber">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-warningamber" />
                        Stalled Deals ({analytics.stalledDeals.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.stalledDeals.slice(0, 5).map((deal) => (
                          <div
                            key={deal.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-onyx/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-warningamber/10">
                                <AlertTriangle className="h-4 w-4 text-warningamber" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-platinum">
                                  {deal.first_name} {deal.last_name || ""}
                                </p>
                                <p className="text-xs text-mist">
                                  {deal.company || "No company"} •{" "}
                                  {STAGE_CONFIG[deal.deal_stage]?.label}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-warningamber">
                                {deal.daysSinceActivity}d inactive
                              </p>
                              {deal.deal_value > 0 && (
                                <p className="text-xs text-mist">
                                  {formatCurrency(deal.deal_value)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </div>
                )}
              </div>
            )}

            {/* FORECAST TAB */}
            {activeTab === "forecast" && forecast && (
              <div className="space-y-6">
                {/* Forecast Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="stat-card-premium rounded-xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-neonblue/10">
                          <DollarSign className="h-5 w-5 text-neonblue" />
                        </div>
                        <p className="text-xs text-mist">Expected Revenue</p>
                      </div>
                      <p className="text-3xl font-bold text-platinum">
                        {formatCurrency(forecast.expectedRevenue)}
                      </p>
                    </CardContent>
                  </div>
                  <div className="stat-card-premium rounded-xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-automationgreen/10">
                          <TrendingUp className="h-5 w-5 text-automationgreen" />
                        </div>
                        <p className="text-xs text-mist">Best Case</p>
                      </div>
                      <p className="text-3xl font-bold text-automationgreen">
                        {formatCurrency(forecast.bestCase)}
                      </p>
                    </CardContent>
                  </div>
                  <div className="stat-card-premium rounded-xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-warningamber/10">
                          <TrendingDown className="h-5 w-5 text-warningamber" />
                        </div>
                        <p className="text-xs text-mist">Worst Case</p>
                      </div>
                      <p className="text-3xl font-bold text-warningamber">
                        {formatCurrency(forecast.worstCase)}
                      </p>
                    </CardContent>
                  </div>
                </div>

                {/* Monthly Forecast */}
                <div className="card-metallic rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-neonblue" />
                      3-Month Revenue Forecast
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {forecast.byMonth.map((m) => (
                        <div
                          key={m.month}
                          className="p-4 rounded-lg bg-onyx/50 border border-gunmetal/30"
                        >
                          <p className="text-sm font-medium text-platinum mb-3">
                            {new Date(m.month + "-01").toLocaleDateString(
                              "en-US",
                              { month: "long", year: "numeric" }
                            )}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-mist">Expected</span>
                              <span className="text-platinum font-medium">
                                {formatCurrency(m.expected)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-mist">Best Case</span>
                              <span className="text-automationgreen">
                                {formatCurrency(m.bestCase)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-mist">Worst Case</span>
                              <span className="text-warningamber">
                                {formatCurrency(m.worstCase)}
                              </span>
                            </div>
                            <div className="pt-2 border-t border-gunmetal/30">
                              <span className="text-xs text-mist">
                                {m.deals} active deal{m.deals !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                {/* At-Risk Deals */}
                {forecast.atRisk.length > 0 && (
                  <div className="card-metallic rounded-xl border-l-2 border-l-errorred">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-errorred" />
                        At-Risk Deals ({forecast.atRisk.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {forecast.atRisk.map((risk) => (
                          <div
                            key={risk.contact.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-onyx/50"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold",
                                  risk.riskScore >= 70
                                    ? "bg-errorred/20 text-errorred"
                                    : risk.riskScore >= 50
                                      ? "bg-warningamber/20 text-warningamber"
                                      : "bg-neonblue/20 text-neonblue"
                                )}
                              >
                                {risk.riskScore}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-platinum">
                                  {risk.contact.first_name}{" "}
                                  {risk.contact.last_name || ""}
                                </p>
                                <p className="text-xs text-mist">
                                  {risk.contact.company || "No company"}
                                  {risk.contact.deal_value > 0 &&
                                    ` • ${formatCurrency(risk.contact.deal_value)}`}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-silver max-w-xs text-right">
                              {risk.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </div>
                )}
              </div>
            )}

            {/* ALERTS TAB */}
            {activeTab === "alerts" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleGenerateAlerts}
                      className="bg-neonblue hover:bg-electricblue text-white gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Scan Pipeline
                    </Button>
                    {unreadCount > 0 && (
                      <Button
                        onClick={handleMarkAllRead}
                        variant="outline"
                        className="border-gunmetal text-silver hover:text-platinum gap-2"
                      >
                        <BellOff className="h-4 w-4" />
                        Mark All Read
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-mist">
                    {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}
                  </p>
                </div>

                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          "p-4 rounded-xl border transition-all",
                          notif.is_read
                            ? "bg-onyx/30 border-gunmetal/30"
                            : "bg-onyx/60 border-gunmetal/60",
                          getSeverityColor(notif.severity)
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {!notif.is_read && (
                                <div className="h-2 w-2 rounded-full bg-neonblue" />
                              )}
                              <p className="text-sm font-medium text-platinum">
                                {notif.title}
                              </p>
                              <Badge
                                className={cn(
                                  "text-[10px] px-1.5",
                                  getSeverityColor(notif.severity)
                                )}
                              >
                                {notif.severity}
                              </Badge>
                            </div>
                            {notif.description && (
                              <p className="text-xs text-silver mt-1">
                                {notif.description}
                              </p>
                            )}
                            <p className="text-xs text-mist mt-2">
                              {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {notif.action_url && (
                              <Link href={notif.action_url}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-gunmetal text-silver hover:text-platinum h-7 text-xs"
                                >
                                  View
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </Link>
                            )}
                            <button
                              onClick={() => handleDismiss(notif.id)}
                              className="text-mist hover:text-silver transition-colors"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bell className="h-10 w-10 text-mist mx-auto mb-3" />
                    <p className="text-silver">No alerts yet</p>
                    <p className="text-xs text-mist mt-1">
                      Click &quot;Scan Pipeline&quot; to check for stalled deals and overdue follow-ups
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
