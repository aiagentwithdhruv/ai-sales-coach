"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2, AlertCircle, CheckCircle, Sparkles } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseClient();

  useEffect(() => {
    // Supabase automatically picks up the recovery token from the URL hash
    // and establishes a session. We just need to wait for it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // Also check if already in a session (e.g. user refreshed the page)
    supabase.auth.getSession().then(({ data }: { data: { session: unknown } }) => {
      if (data.session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 3000);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-platinum">
            Quota<span className="text-neonblue">Hit</span>
          </span>
        </div>

        <Card className="bg-onyx border-gunmetal">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-neonblue/20 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-neonblue" />
            </div>
            <CardTitle className="text-xl text-platinum">
              {success ? "Password Updated" : "Set New Password"}
            </CardTitle>
            <p className="text-sm text-mist mt-1">
              {success
                ? "Your password has been updated successfully."
                : "Enter your new password below."}
            </p>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-automationgreen/10 border border-automationgreen/20">
                  <CheckCircle className="w-5 h-5 text-automationgreen flex-shrink-0" />
                  <p className="text-sm text-automationgreen">
                    Password updated. Redirecting to dashboard...
                  </p>
                </div>
                <Link href="/dashboard">
                  <Button className="w-full bg-neonblue hover:bg-electricblue">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            ) : !sessionReady ? (
              <div className="text-center py-6 space-y-3">
                <Loader2 className="w-8 h-8 text-neonblue animate-spin mx-auto" />
                <p className="text-sm text-mist">Verifying reset link...</p>
                <p className="text-xs text-mist/60">
                  If this takes too long, your reset link may have expired.{" "}
                  <Link href="/forgot-password" className="text-neonblue hover:underline">
                    Request a new one
                  </Link>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-silver">
                    New Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-graphite border-gunmetal text-platinum placeholder:text-mist"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-silver">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-graphite border-gunmetal text-platinum placeholder:text-mist"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neonblue hover:bg-electricblue"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-mist mt-6">
          <Link href="/login" className="text-neonblue hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
