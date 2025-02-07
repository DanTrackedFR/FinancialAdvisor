import { Button } from "@/components/ui/button";
import { Link } from "wouter";
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
              <Button asChild>
                <Link href="/analysis">Start Analysis</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with padding for fixed banner */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col items-center mb-8">
              <div className="flex justify-center">
                <img
                  src="/assets/Color logo - no background.png"
                  alt="TrackedFR Logo"
                  style={{ height: '96px', width: '192px' }}
                />
              </div>
              <div className="text-center mt-4">
                <h2 className="text-2xl font-bold">Tracked</h2>
                <p className="text-xl text-muted-foreground">Financial Reporting</p>
              </div>
            </div>

            <div className="text-center space-y-8">
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
        </section>

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

        {/* Partners Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Built by alumni who know what great looks like</h2>
            <div className="flex justify-center items-center gap-12 flex-wrap">
              <img
                src="https://static.wixstatic.com/media/67030e_cdc0b65dd0684915bb65c25bd4bb7033~mv2.jpg/v1/crop/x_15,y_0,w_347,h_282/fill/w_128,h_104,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/pwc_JPG.jpg"
                alt="PwC"
                className="h-16 object-contain"
              />
              <img
                src="https://static.wixstatic.com/media/67030e_9a22a0432937434c9a193ce5826f26f3~mv2.jpg/v1/crop/x_0,y_36,w_397,h_245/fill/w_165,h_102,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/amazon_JPG.jpg"
                alt="Amazon"
                className="h-16 object-contain"
              />
              <img
                src="https://static.wixstatic.com/media/67030e_213a9d2e46d74951af9851a380d1c33a~mv2.jpg/v1/crop/x_0,y_39,w_904,h_477/fill/w_180,h_95,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/deloitte_JPG.jpg"
                alt="Deloitte"
                className="h-16 object-contain"
              />
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

        {/* Testimonials Section */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-8">
                  <blockquote className="text-lg text-muted-foreground italic">
                    "We expect Tracked Financial Reporting to transform how we manage preparing financial statements. The accuracy and speed of the platform will significantly improve our processes."
                  </blockquote>
                  <p className="mt-4 font-medium">Sarah Johnson - CFO at Datum Consulting</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <blockquote className="text-lg text-muted-foreground italic">
                    "The automated compliance checks and seamless ERP integration have revolutionized our financial reporting workflow."
                  </blockquote>
                  <p className="mt-4 font-medium">Michael Chen - Senior Manager at PwC</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <blockquote className="text-lg text-muted-foreground italic">
                    "This platform has significantly reduced the time we spend on financial statement preparation, allowing us to focus on value-added analysis."
                  </blockquote>
                  <p className="mt-4 font-medium">Emma Thompson - Finance Director</p>
                </CardContent>
              </Card>
            </div>
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
    </div>
  );
}