"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle, ChevronDown } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!agreeTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
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
                We&apos;ve sent a confirmation link to <strong className="text-platinum">{email}</strong>.
                Click the link to verify your account and get started.
              </p>
              <Button
                onClick={() => router.push("/login")}
                className="bg-neonblue hover:bg-electricblue text-white"
              >
                Back to Sign In
              </Button>
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
            <CardTitle className="text-xl text-platinum">Create your account</CardTitle>
            <p className="text-sm text-silver mt-1">
              Start your AI-powered sales coaching journey
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-errorred/10 border border-errorred/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-errorred flex-shrink-0" />
                <p className="text-sm text-errorred">{error}</p>
              </div>
            )}

            {/* Google Sign Up — Primary */}
            <Button
              type="button"
              onClick={handleGoogleSignUp}
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
              Sign up with Google
            </Button>

            <p className="text-xs text-mist text-center mt-3">
              One click — no password, no email verification needed
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
              Sign up with email & password
              <ChevronDown className={`h-4 w-4 transition-transform ${showEmailForm ? "rotate-180" : ""}`} />
            </button>

            {showEmailForm && (
              <form onSubmit={handleSubmit} className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <label className="text-sm text-silver">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

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
                  <label className="text-sm text-silver">Password</label>
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
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-mist">Must be at least 6 characters</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-silver">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                    className="mt-1 border-gunmetal data-[state=checked]:bg-neonblue data-[state=checked]:border-neonblue"
                  />
                  <label htmlFor="terms" className="text-xs text-silver leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" className="text-neonblue hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-neonblue hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neonblue hover:bg-electricblue text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-silver">
                Already have an account?{" "}
                <Link href="/login" className="text-neonblue hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
