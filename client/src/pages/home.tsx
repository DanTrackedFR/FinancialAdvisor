import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { SiReadthedocs } from "react-icons/si";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 -z-10 blur-3xl bg-primary/20 rounded-full" />
            <SiReadthedocs className="w-24 h-24 mx-auto text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Tracked Financial Reporting
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Expert AI-powered financial statement review and analysis platform supporting
            IFRS, US GAAP, and UK GAAP standards.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button asChild size="lg" className="px-8">
              <Link href="/analysis">Start Analysis</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}