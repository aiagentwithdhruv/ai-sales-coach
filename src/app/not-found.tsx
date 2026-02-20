import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center mb-8">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-6xl font-bold text-platinum mb-4">404</h1>
      <h2 className="text-xl text-silver mb-2">Page not found</h2>
      <p className="text-mist max-w-md mb-8">
        The page you are looking for does not exist or has been moved. Let us get you back on track.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/"
          className="px-6 py-3 rounded-lg bg-neonblue hover:bg-electricblue text-white font-medium transition-colors inline-flex items-center gap-2"
        >
          Back to Home
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/blog"
          className="px-6 py-3 rounded-lg border border-gunmetal text-silver hover:text-platinum hover:border-neonblue/40 transition-colors"
        >
          Read the Blog
        </Link>
      </div>
    </div>
  );
}
