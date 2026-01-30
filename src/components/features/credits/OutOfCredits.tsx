"use client";

import { AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface OutOfCreditsProps {
  credits?: number;
  totalUsed?: number;
}

export function OutOfCredits({ credits = 0, totalUsed = 0 }: OutOfCreditsProps) {
  const handleRequestCredits = () => {
    // Open email client to request more credits
    const subject = encodeURIComponent("Request for More AI Credits - AI Sales Coach");
    const body = encodeURIComponent(`Hi,

I've used all my free trial credits (${totalUsed} total) on the AI Sales Coach platform and would like to request additional credits.

Please let me know the next steps.

Thank you!`);
    window.open(`mailto:support@aiwithdruv.com?subject=${subject}&body=${body}`);
  };

  return (
    <Card className="bg-onyx/50 border-errorred/30">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-errorred/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-errorred" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-platinum">
              Out of Credits
            </h3>
            <p className="text-silver max-w-md">
              You&apos;ve used all {totalUsed} of your free trial credits.
              To continue using AI features, please request additional credits.
            </p>
          </div>

          <div className="bg-graphite rounded-lg p-4 w-full max-w-sm">
            <div className="flex justify-between items-center text-sm">
              <span className="text-mist">Remaining Credits</span>
              <span className="text-errorred font-semibold">{credits}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-mist">Total Used</span>
              <span className="text-silver font-semibold">{totalUsed}</span>
            </div>
          </div>

          <Button
            onClick={handleRequestCredits}
            className="bg-neonblue hover:bg-electricblue text-white gap-2"
          >
            <Mail className="h-4 w-4" />
            Request More Credits
          </Button>

          <p className="text-xs text-mist">
            As a new user, you received 5 free credits to test the platform.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
