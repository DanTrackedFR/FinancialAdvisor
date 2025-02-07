import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { SiReadthedocs } from "react-icons/si";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 -z-10 blur-3xl bg-primary/20 rounded-full" />
            <SiReadthedocs className="w-24 h-24 mx-auto text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Automated Financial Reporting
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your general ledger data into compliant financial statements ready to meet your filing obligations
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button asChild size="lg" className="px-8">
              <Link href="/analysis">Start Analysis</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Effortless Financial Statement Generation</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Automated & Accurate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Generate accurate financial statements from trial balances, saving time and reducing errors.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost-Efficient Solution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Streamline your financial reporting process while reducing costs.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seamless ERP Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Integrate effortlessly with popular ERPs like Netsuite, Xero, Quickbooks for smoother financial reporting.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Customers Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Who are our customers?</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Accounting Firms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Generate accurate financial statements from trial balances, saving time so you can add value to your clients' day, not just gather signatures.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Internal Finance Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Automate the work that adds no value, so you can get on with driving business performance.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto">
            <CardContent className="p-8">
              <blockquote className="text-xl text-muted-foreground italic text-center">
                "We expect Tracked Financial Reporting to transform how we manage preparing financial statements. The accuracy and speed of the platform will significantly improved our processes."
              </blockquote>
              <p className="text-center mt-4 font-medium">Sarah Johnson - CFO at Datum Consulting</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Experience automated financial statements</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start using our AI-powered platform today
          </p>
          <Button asChild size="lg" className="px-8">
            <Link href="/analysis">Start Analysis</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">© 2025 Tracked Financial Reporting</p>
            <div className="space-x-4">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="text-sm text-muted-foreground hover:text-primary">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}