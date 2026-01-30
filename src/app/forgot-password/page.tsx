"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = getSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-graphite border-gunmetal">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-full bg-automationgreen/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-automationgreen" />
              </div>
              <h2 className="text-xl font-semibold text-platinum mb-2">Check your email</h2>
              <p className="text-silver mb-6">
                We&apos;ve sent a password reset link to <strong className="text-platinum">{email}</strong>.
                Click the link to reset your password.
              </p>
              <Link href="/login">
                <Button className="bg-neonblue hover:bg-electricblue text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <span className="text-2xl font-bold text-platinum">
              AI<span className="text-neonblue">withDhruv</span>
            </span>
          </Link>
        </div>

        <Card className="bg-graphite border-gunmetal">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-platinum">Reset your password</CardTitle>
            <p className="text-sm text-silver mt-1">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-errorred/10 border border-errorred/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-errorred flex-shrink-0" />
                <p className="text-sm text-errorred">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-silver">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-neonblue hover:bg-electricblue text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-silver hover:text-platinum inline-flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
