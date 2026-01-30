"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login - in production, connect to Supabase Auth
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);
  };

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
            <CardTitle className="text-xl text-platinum">Welcome Back</CardTitle>
            <p className="text-sm text-silver mt-1">
              Sign in to continue to your AI Sales Coach
            </p>
          </CardHeader>
          <CardContent>
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
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-neonblue hover:bg-electricblue text-white"
              >
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-silver">
                Don't have an account?{" "}
                <Link href="/signup" className="text-neonblue hover:underline">
                  Sign up free
                </Link>
              </p>
            </div>

            {/* Demo Login */}
            <div className="mt-6 pt-6 border-t border-gunmetal">
              <p className="text-xs text-mist text-center mb-3">
                Or continue with demo account
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full border-gunmetal text-silver hover:text-platinum hover:bg-onyx"
              >
                <Sparkles className="h-4 w-4 mr-2 text-neonblue" />
                Continue as Demo User
              </Button>
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
