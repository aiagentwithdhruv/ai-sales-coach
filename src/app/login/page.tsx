"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Mail, Lock, ArrowRight, Loader2, AlertCircle, ChevronDown, Phone, Smartphone } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();
  const { signInWithPhone, verifyOTP } = useAuth();

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
      // If email not confirmed, auto-confirm and retry
      if (error.message.toLowerCase().includes("email not confirmed")) {
        await fetch("/api/auth/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        // Retry login after confirmation
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (retryError) {
          setError(retryError.message);
          setIsLoading(false);
        } else {
          router.push(redirectTo);
          router.refresh();
        }
      } else {
        setError(error.message);
        setIsLoading(false);
      }
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

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter a phone number");
      return;
    }
    setPhoneLoading(true);
    setError(null);
    const { error } = await signInWithPhone(phoneNumber);
    if (error) {
      setError(error.message);
    } else {
      setOtpSent(true);
    }
    setPhoneLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError("Please enter the OTP code");
      return;
    }
    setPhoneLoading(true);
    setError(null);
    const { error } = await verifyOTP(phoneNumber, otpCode);
    if (error) {
      setError(error.message);
      setPhoneLoading(false);
    } else {
      router.push(redirectTo);
      router.refresh();
    }
  };

  const handleResendOTP = async () => {
    setPhoneLoading(true);
    setError(null);
    const { error } = await signInWithPhone(phoneNumber);
    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setOtpCode("");
    }
    setPhoneLoading(false);
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

        <Card className="glow-card bg-graphite border-gunmetal">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-platinum">Welcome Back</CardTitle>
            <p className="text-sm text-silver mt-1">
              Sign in to your AI Sales Department
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-errorred/10 border border-errorred/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-errorred flex-shrink-0" />
                <p className="text-sm text-errorred">{error}</p>
              </div>
            )}

            {/* Login Method Tabs */}
            <div className="flex mb-6 rounded-lg bg-onyx p-1">
              <button
                type="button"
                onClick={() => { setLoginMethod("email"); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === "email"
                    ? "bg-graphite text-platinum shadow-sm"
                    : "text-mist hover:text-silver"
                }`}
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod("phone"); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === "phone"
                    ? "bg-graphite text-platinum shadow-sm"
                    : "text-mist hover:text-silver"
                }`}
              >
                <Phone className="h-4 w-4" />
                Phone
              </button>
            </div>

            {/* Email/Password Form */}
            {loginMethod === "email" && (
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

            {/* Phone/OTP Form */}
            {loginMethod === "phone" && (
              <div className="space-y-4">
                {!otpSent ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm text-silver">Phone Number</label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                        <Input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="pl-10 bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                          disabled={phoneLoading}
                        />
                      </div>
                      <p className="text-xs text-mist">Include country code (e.g. +91 for India, +1 for US)</p>
                    </div>

                    <Button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={phoneLoading || !phoneNumber.trim()}
                      className="w-full bg-neonblue hover:bg-electricblue text-white"
                    >
                      {phoneLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Send OTP
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-silver">
                        Enter the 6-digit code sent to{" "}
                        <span className="text-platinum font-medium">{phoneNumber}</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                        <Input
                          type="text"
                          placeholder="000000"
                          value={otpCode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setOtpCode(val);
                          }}
                          className="pl-10 bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue text-center text-lg tracking-widest"
                          maxLength={6}
                          disabled={phoneLoading}
                          autoFocus
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={phoneLoading || otpCode.length !== 6}
                      className="w-full bg-neonblue hover:bg-electricblue text-white"
                    >
                      {phoneLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify OTP
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtpCode(""); setError(null); }}
                        className="text-silver hover:text-platinum transition-colors"
                      >
                        Change number
                      </button>
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={phoneLoading}
                        className="text-neonblue hover:underline disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </form>
                )}
              </div>
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
