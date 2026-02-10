"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Mail, Lock, ArrowRight, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push(redirectTo);
      router.refresh();
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-platinum">
              Quota<span className="text-neonblue">Hit</span>
            </span>
          </Link>
        </div>

        <Card className="bg-graphite border-gunmetal">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-platinum">Welcome Back</CardTitle>
            <p className="text-sm text-silver mt-1">
              Sign in to continue to your AI Sales Coach
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-errorred/10 border border-errorred/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-errorred flex-shrink-0" />
                <p className="text-sm text-errorred">{error}</p>
              </div>
            )}

            {/* Google Sign In — Primary */}
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-gray-100 text-gray-800 font-medium text-base border border-gray-300 shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            <p className="text-xs text-mist text-center mt-3">
              Fastest way to sign in — one click, no password needed
            </p>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gunmetal"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-graphite px-2 text-mist">Or</span>
                </div>
              </div>
            </div>

            {/* Email/Password — Secondary (collapsible) */}
            <button
              type="button"
              onClick={() => setShowEmailForm(!showEmailForm)}
              className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-silver hover:text-platinum transition-colors py-2"
            >
              <Mail className="h-4 w-4" />
              Sign in with email & password
              <ChevronDown className={`h-4 w-4 transition-transform ${showEmailForm ? "rotate-180" : ""}`} />
            </button>

            {showEmailForm && (
              <form onSubmit={handleSubmit} className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-silver">Password</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-neonblue hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-silver">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-neonblue hover:underline">
                  Sign up free
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-mist mt-6">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-silver hover:text-platinum">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-silver hover:text-platinum">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neonblue" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
