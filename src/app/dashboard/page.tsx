"use client";

import { useState, useEffect } from "react";
import { WelcomeSection, QuickActions } from "@/components/features/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Clock,
  TrendingUp,
  MessageSquare,
  Phone,
  Trophy,
  Flame,
} from "lucide-react";

// Mock data - will be replaced with real data from Supabase
const mockStats = {
  winRate: 68,
  winRateChange: 12,
  pipeline: "$2.4M",
  pipelineChange: 8,
  activeDeals: 23,
  activeDealsChange: 3,
};

const mockDeals = [
  {
    id: 1,
    name: "Acme Corp Enterprise",
    value: "$125,000",
    stage: "Negotiation",
    progress: 75,
    status: "hot",
    daysInStage: 5,
  },
  {
    id: 2,
    name: "TechStart Series A",
    value: "$85,000",
    stage: "Proposal",
    progress: 50,
    status: "warm",
    daysInStage: 3,
  },
  {
    id: 3,
    name: "Global Industries",
    value: "$200,000",
    stage: "Discovery",
    progress: 25,
    status: "new",
    daysInStage: 1,
  },
];

const mockActivity = [
  {
    id: 1,
    type: "call",
    description: "Completed call with Acme Corp",
    time: "2 hours ago",
    icon: Phone,
    iconColor: "text-automationgreen",
    iconBg: "bg-automationgreen/10",
  },
  {
    id: 2,
    type: "practice",
    description: "Completed objection handling practice",
    time: "4 hours ago",
    icon: MessageSquare,
    iconColor: "text-neonblue",
    iconBg: "bg-neonblue/10",
  },
  {
    id: 3,
    type: "deal",
    description: "Deal moved to negotiation stage",
    time: "Yesterday",
    icon: TrendingUp,
    iconColor: "text-warningamber",
    iconBg: "bg-warningamber/10",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "hot":
      return (
        <Badge className="bg-errorred/20 text-errorred border-none">Hot</Badge>
      );
    case "warm":
      return (
        <Badge className="bg-warningamber/20 text-warningamber border-none">
          Warm
        </Badge>
      );
    case "new":
      return (
        <Badge className="bg-neonblue/20 text-neonblue border-none">New</Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function DashboardPage() {
  const [userName, setUserName] = useState("there");
  const supabase = getSupabaseClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get first name from full name or email
        const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "there";
        const firstName = fullName.split(" ")[0];
        setUserName(firstName);
      }
    };
    getUser();
  }, [supabase.auth]);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <WelcomeSection userName={userName} stats={mockStats} />

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold text-platinum mb-4">Quick Actions</h2>
        <QuickActions />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Deals */}
        <Card className="lg:col-span-2 bg-onyx border-gunmetal">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-platinum">
              Active Deals
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-neonblue hover:text-electricblue">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-4 rounded-lg bg-graphite border border-gunmetal hover:border-steel transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-platinum">{deal.name}</h4>
                      <p className="text-sm text-silver">{deal.value}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(deal.status)}
                      <Badge variant="secondary" className="bg-steel/50">
                        {deal.stage}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-silver">
                      <span>Progress</span>
                      <span>{deal.progress}%</span>
                    </div>
                    <Progress value={deal.progress} className="h-1.5" />
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-mist">
                    <Clock className="h-3 w-3" />
                    <span>{deal.daysInStage} days in stage</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Practice Streak */}
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warningamber/10">
                  <Flame className="h-8 w-8 text-warningamber" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-platinum">7</p>
                  <p className="text-sm text-silver">Day Streak</p>
                </div>
              </div>
              <p className="text-xs text-mist mt-4">
                Keep practicing daily to maintain your streak!
              </p>
              <Button className="w-full mt-4 bg-neonblue hover:bg-electricblue">
                Practice Now
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-onyx border-gunmetal">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-platinum">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${activity.iconBg}`}>
                      <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-platinum truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-mist">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard Preview */}
          <Card className="bg-onyx border-gunmetal">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
                <Trophy className="h-5 w-5 text-warningamber" />
                Team Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-warningamber/10 border border-warningamber/20">
                  <span className="text-lg font-bold text-warningamber">#1</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-platinum">Alex Chen</p>
                    <p className="text-xs text-silver">142% quota</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-steel/30">
                  <span className="text-lg font-bold text-silver">#2</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-platinum">Maria Garcia</p>
                    <p className="text-xs text-silver">128% quota</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-neonblue/10 border border-neonblue/20">
                  <span className="text-lg font-bold text-neonblue">#3</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-platinum">You</p>
                    <p className="text-xs text-silver">115% quota</p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-4 text-neonblue hover:text-electricblue"
              >
                View Full Leaderboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
