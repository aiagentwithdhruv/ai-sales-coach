import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Target,
  Phone,
  BarChart3,
  MessageSquare,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Objection Handler",
    description:
      "Get instant, context-aware responses to common sales objections.",
  },
  {
    icon: Phone,
    title: "Call Analysis",
    description:
      "Upload recordings and get AI-powered insights on your sales calls.",
  },
  {
    icon: Target,
    title: "Pitch Practice",
    description:
      "Role-play with AI characters to sharpen your pitch and closing skills.",
  },
  {
    icon: BarChart3,
    title: "Deal Intelligence",
    description: "AI-powered analysis of your pipeline with risk assessment.",
  },
];

const benefits = [
  "Improve win rates by up to 30%",
  "Reduce ramp time for new reps",
  "Consistent coaching at scale",
  "24/7 AI-powered practice partner",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-obsidian">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism border-b border-gunmetal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-ai flex items-center justify-center text-white font-bold">
                A
              </div>
              <span className="text-xl font-bold text-platinum">
                AI<span className="text-neonblue">withDhruv</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-silver hover:text-platinum transition-colors">
                Features
              </a>
              <Link href="/pricing" className="text-silver hover:text-platinum transition-colors">
                Pricing
              </Link>
              <a href="#about" className="text-silver hover:text-platinum transition-colors">
                About
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-silver hover:text-platinum">
                  Sign In
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="bg-neonblue hover:bg-electricblue text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background gradient mesh */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(0, 179, 255, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(45, 255, 142, 0.05) 0%, transparent 50%)",
          }}
        />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neonblue/10 border border-neonblue/20 mb-8">
            <Sparkles className="h-4 w-4 text-neonblue" />
            <span className="text-sm text-neonblue">
              Powered by Advanced AI
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-platinum mb-6 animate-fade-in-up">
            Your AI Sales Coach.
            <br />
            <span className="text-neonblue">Always On.</span>
          </h1>

          <p className="text-lg sm:text-xl text-silver max-w-2xl mx-auto mb-10">
            Transform your sales performance with AI-powered coaching, real-time
            call analysis, and personalized practice sessions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-neonblue hover:bg-electricblue text-white px-8 py-6 text-lg glow-blue"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-gunmetal text-silver hover:text-platinum hover:bg-onyx px-8 py-6 text-lg"
            >
              Watch Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-silver">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-automationgreen" />
              <span>10,000+ Sales Reps</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-automationgreen" />
              <span>30% Avg Win Rate Increase</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-automationgreen" />
              <span>Enterprise Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-graphite">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-platinum mb-4">
              Everything You Need to{" "}
              <span className="text-neonblue">Close More Deals</span>
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              A complete AI-powered sales coaching platform designed to help you
              win more deals and grow faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-onyx border border-gunmetal hover:border-neonblue transition-all duration-300 group hover-lift"
              >
                <div className="w-12 h-12 rounded-lg bg-neonblue/10 flex items-center justify-center mb-4 group-hover:bg-neonblue/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-neonblue" />
                </div>
                <h3 className="text-lg font-semibold text-platinum mb-2">
                  {feature.title}
                </h3>
                <p className="text-silver text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-platinum mb-6">
                Supercharge Your
                <br />
                <span className="text-automationgreen">Sales Performance</span>
              </h2>
              <p className="text-lg text-silver mb-8">
                Our AI coach learns from the best sales practices and provides
                personalized guidance to help you improve every day.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-automationgreen/20 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-automationgreen" />
                    </div>
                    <span className="text-platinum">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats Card */}
            <div className="p-8 rounded-2xl gradient-surface border border-gunmetal">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4">
                  <p className="text-4xl font-bold text-neonblue mb-2">30%</p>
                  <p className="text-sm text-silver">Avg Win Rate Increase</p>
                </div>
                <div className="text-center p-4">
                  <p className="text-4xl font-bold text-automationgreen mb-2">
                    2x
                  </p>
                  <p className="text-sm text-silver">Faster Ramp Time</p>
                </div>
                <div className="text-center p-4">
                  <p className="text-4xl font-bold text-warningamber mb-2">
                    50K+
                  </p>
                  <p className="text-sm text-silver">Practice Sessions</p>
                </div>
                <div className="text-center p-4">
                  <p className="text-4xl font-bold text-infocyan mb-2">98%</p>
                  <p className="text-sm text-silver">User Satisfaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-graphite">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-platinum mb-6">
            Ready to Transform Your Sales?
          </h2>
          <p className="text-lg text-silver mb-8">
            Join thousands of sales professionals using AI to close more deals.
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-neonblue hover:bg-electricblue text-white px-8 py-6 text-lg glow-blue"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-mist mt-4">
            No credit card required · 14-day free trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gunmetal">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-ai flex items-center justify-center text-white font-bold">
                A
              </div>
              <span className="text-lg font-bold text-platinum">
                AI<span className="text-neonblue">withDhruv</span>
              </span>
            </div>
            <p className="text-sm text-mist">
              © 2024 AIwithDhruv. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
