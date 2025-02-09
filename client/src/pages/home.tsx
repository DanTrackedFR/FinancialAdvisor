import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  const { logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with logo and text */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <img
                  src="/assets/Color logo - no background.png"
                  alt="TrackedFR Logo"
                  className="h-8 w-auto"
                />
                <div className="hidden sm:flex flex-col">
                  <span className="text-lg font-bold leading-none">Tracked</span>
                  <span className="text-sm text-muted-foreground leading-none">Financial Reporting</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/privacy">Privacy</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/cookies">Cookies</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/auth">Sign Up</Link>
              </Button>
              <Button asChild>
                <Link href="/auth">Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with padding for fixed banner */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-white to-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl font-bold tracking-tight mb-6">
                Transform Your Financial Statement Preparation
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Automated generation of financial statements from trial balances, ensuring accuracy and freeing up your time.
              </p>
              <div className="flex justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/auth">Sign Up</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/auth">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Tracked?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Automated & Accurate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our AI-powered platform ensures precise financial statement generation, eliminating manual errors and saving valuable time.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Time-Saving Solution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Reduce the time spent on financial statement preparation by up to 80%, allowing you to focus on value-added analysis.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Assured</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Stay compliant with the latest accounting standards while maintaining consistency across all your financial reports.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-8">
                  <p className="text-muted-foreground mb-4">
                    "Tracked has revolutionized how we prepare financial statements. The automation and accuracy are game-changing."
                  </p>
                  <p className="font-medium">Sarah Chen - Financial Controller</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <p className="text-muted-foreground mb-4">
                    "The time savings are incredible. What used to take days now takes hours, with better accuracy."
                  </p>
                  <p className="font-medium">James Wilson - Senior Accountant</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <p className="text-muted-foreground mb-4">
                    "Excellent platform for maintaining consistency across all our financial reporting requirements."
                  </p>
                  <p className="font-medium">Emily Thompson - CFO</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Financial Reporting?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join the growing number of professionals who trust Tracked for their financial statement preparation.
            </p>
            <Button size="lg" asChild className="px-8">
              <Link href="/auth">Sign Up Now</Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/Color logo - no background.png"
                  alt="TrackedFR Logo"
                  className="h-8 w-auto"
                />
                <span className="text-sm text-muted-foreground">
                  © 2024 Tracked Financial Reporting
                </span>
              </div>
              <div className="flex gap-4">
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
    </div>
  );
}