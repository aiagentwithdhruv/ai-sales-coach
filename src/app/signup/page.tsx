"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle, ChevronDown, Mic, MessageSquare, Phone, Zap, UserSearch, Target, Globe, ChevronRight } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPersonalize, setShowPersonalize] = useState(false);
  const [productDescription, setProductDescription] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
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
          phone: phoneNumber || undefined,
          product_description: productDescription || undefined,
          target_customer: targetCustomer || undefined,
          website_url: websiteUrl || undefined,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      // Auto-confirm the email so user can login immediately (no email verification)
      await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Sign in immediately after confirmation
      await supabase.auth.signInWithPassword({ email, password });
      router.push("/dashboard");
      router.refresh();
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
          <Card className="glow-card bg-graphite border-gunmetal">
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
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-neonblue/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-automationgreen/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-platinum">
              Quota<span className="text-neonblue">Hit</span>
            </span>
          </Link>
        </div>

        {/* Motivational headline */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-platinum mb-2">
            Your <span className="text-neonblue">AI sales department</span> awaits
          </h1>
          <p className="text-sm text-silver">
            7 AI agents that find, qualify, and close deals. Set it up in 60 seconds.
          </p>
        </div>

        {/* What you get - mini feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neonblue/10 border border-neonblue/20">
            <UserSearch className="h-3 w-3 text-neonblue" />
            <span className="text-xs text-neonblue font-medium">AI Finds Leads</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-automationgreen/10 border border-automationgreen/20">
            <Target className="h-3 w-3 text-automationgreen" />
            <span className="text-xs text-automationgreen font-medium">AI Qualifies & Closes</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warningamber/10 border border-warningamber/20">
            <Zap className="h-3 w-3 text-warningamber" />
            <span className="text-xs text-warningamber font-medium">24/7. Every Channel.</span>
          </div>
        </div>

        <Card className="glow-card bg-graphite border-gunmetal">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-platinum">Create your account</CardTitle>
            <p className="text-sm text-silver mt-1">
              14-day free trial. No credit card required.
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-errorred/10 border border-errorred/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-errorred flex-shrink-0" />
                <p className="text-sm text-errorred">{error}</p>
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="text-sm text-silver">Phone Number (optional)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10 bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Personalize your AI — collapsible ICP fields */}
                <div className="border border-gunmetal/60 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowPersonalize(!showPersonalize)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-silver hover:text-platinum transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-neonblue" />
                      Personalize your AI (optional)
                    </span>
                    <ChevronRight className={cn("h-4 w-4 transition-transform", showPersonalize && "rotate-90")} />
                  </button>
                  {showPersonalize && (
                    <div className="px-3 pb-3 space-y-3 border-t border-gunmetal/40">
                      <div className="space-y-1.5 pt-3">
                        <label className="text-xs text-mist">What do you sell?</label>
                        <Input
                          type="text"
                          placeholder="e.g. CRM software for mid-market companies"
                          value={productDescription}
                          onChange={(e) => setProductDescription(e.target.value)}
                          className="bg-onyx border-gunmetal text-platinum placeholder:text-mist/60 focus:border-neonblue text-sm"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-mist">Who&apos;s your ideal customer?</label>
                        <Input
                          type="text"
                          placeholder="e.g. VP Sales at 50-500 person SaaS companies"
                          value={targetCustomer}
                          onChange={(e) => setTargetCustomer(e.target.value)}
                          className="bg-onyx border-gunmetal text-platinum placeholder:text-mist/60 focus:border-neonblue text-sm"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-mist">Your website</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mist" />
                          <Input
                            type="url"
                            placeholder="https://yourcompany.com"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            className="pl-9 bg-onyx border-gunmetal text-platinum placeholder:text-mist/60 focus:border-neonblue text-sm"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  )}
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

        {/* Trust signals */}
        <div className="mt-6 flex items-center justify-center gap-6 text-mist">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-neonblue" />
            <span className="text-xs">Setup in 30s</span>
          </div>
          <div className="w-px h-3 bg-gunmetal" />
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-automationgreen" />
            <span className="text-xs">Encrypted</span>
          </div>
          <div className="w-px h-3 bg-gunmetal" />
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-warningamber" />
            <span className="text-xs">14-Day Trial</span>
          </div>
        </div>
      </div>
    </div>
  );
}
