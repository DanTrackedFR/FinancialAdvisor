import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { user, logout } = useAuth();
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const { data: profile, isLoading: isLoadingProfile } = useQuery<User>({
    queryKey: ["/api/users/profile"],
    enabled: !!user,
  });

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setSubscriptionError(null);
      console.log('Starting subscription management process...');

      const response = await apiRequest('POST', '/api/subscriptions/manage');
      const data = await response.json();
      console.log('Received response from server:', data);

      if (data.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        // Use window.location.assign for more reliable redirection
        window.location.assign(data.url);
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      setSubscriptionError(error.message || 'Failed to start checkout process');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with logo and text */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <img
                  src="/assets/Black logo - no background.png"
                  alt="TrackedFR Logo"
                  className="h-8 w-auto"
                />
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/chat">Chat</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/analysis">Analysis</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/profile">Profile</Link>
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/auth?mode=signup">Sign Up</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth?mode=login">Login</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {!user && (
        <div className="pt-16">
          {/* Hero Section */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col items-center mb-8">
                <div className="flex justify-center">
                  <img
                    src="/assets/Black logo - no background.png"
                    alt="TrackedFR Logo"
                    className="h-24 w-auto"
                  />
                </div>
              </div>

              {/* Hero section styles update */}
              <div className="text-center space-y-8">
                <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 leading-tight">
                  Automated Financial Reporting
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Transform your general ledger data into compliant financial statements ready to meet your filing obligations
                </p>
                <div className="flex justify-center gap-4 pt-4">
                  <Button
                    asChild
                    size="lg"
                    className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    <Link href="/auth?mode=signup">Sign Up Now</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 bg-slate-100">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Effortless Financial Statement Generation</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Automated & Accurate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Based on prior-year financial statements, Tracked will create fully compliant financial statements instantly.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cost-Efficient Solution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Streamline your financial reporting process while reducing costs. Our solution offers a cost-efficient approach to generating compliant financial statements.</p>
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

                <Card>
                  <CardHeader>
                    <CardTitle>Automated Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Automate compliance checks for financial records, ensuring accuracy and efficiency.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Enhanced Financial Understanding Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Enhanced Financial Understanding</h2>
              <Card className="max-w-3xl mx-auto">
                <CardContent className="p-8">
                  <p className="text-lg text-muted-foreground">
                    Deepen your understanding of financial statements and their impact on your business. Our tool provides valuable insights to help you make informed financial decisions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* About Tracked Section */}
          <section className="py-16 bg-slate-100">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">About Tracked</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Our Story</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Frustrated by work that added no value, we are building the ability to automatically create compliant financial statements- at speed, perfectly accurate.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Our Vision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Our vision is to revolutionize financial statement creation and empower accounting professionals and finance teams with a seamless and efficient solution. Be the reviewer, not the preparer.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Technology</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Explore the advanced technology that drives Tracked Financial Reporting. Our commitment to innovation ensures a robust and reliable platform for our users.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Partners Section */}
          <section className="py-16 bg-white">
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
          <section className="py-16 bg-slate-100">
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
          <section className="py-16 bg-white">
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
          <section className="py-16 bg-slate-100">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-4">Experience automated financial statements</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Start using our AI-powered platform today
              </p>
              <Button asChild size="lg" className="px-8">
                <Link href="/auth?mode=signup">Sign Up Now</Link>
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
      )}

      {user && (
        <div className="pt-16 container mx-auto px-4">
          <div className="py-8">
            {isLoadingProfile ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : profile ? (
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back, {profile.firstName}!</CardTitle>
                  <CardDescription>Your Profile Information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p>{profile.firstName} {profile.surname}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{profile.email}</p>
                  </div>
                  {profile.company && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Company</p>
                      <p>{profile.company}</p>
                    </div>
                  )}
                  <div className="pt-4 space-y-4">
                    <Button onClick={handleManageSubscription}>
                      Manage Subscription
                    </Button>
                    {subscriptionError && (
                      <p className="text-sm text-red-500">{subscriptionError}</p>
                    )}
                  </div>
                  <div className="pt-4">
                    <Button asChild>
                      <Link href="/analysis">Start Analysis</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <p>Error loading profile information</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}