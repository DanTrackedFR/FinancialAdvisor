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
import { 
  Menu, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  AlertCircle,
  MessageCircle,
  User as UserIcon,
  LogOut,
  BarChart2,
  Star
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FeedbackDialog } from "@/components/feedback-dialog";

export default function Home() {
  const { user, logout } = useAuth();
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const { 
    data: profile, 
    isLoading: isLoadingProfile,
    error: profileError
  } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!user) return null;
      try {
        // Get the ID token for more secure authentication
        const idToken = await user.getIdToken();
        
        // Use the /me endpoint which is protected by the isAuthenticated middleware
        const response = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${idToken}`,
            "firebase-uid": user.uid,
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          console.error("Profile fetch failed:", response.status, response.statusText);
          
          // If this is a 401 or 403 error, attempt to use the users/profile endpoint as fallback
          // which might have less strict authentication requirements
          if (response.status === 401 || response.status === 403) {
            console.log("Attempting to fetch profile using alternative endpoint");
            const fallbackResponse = await fetch("/api/auth/users/profile", {
              headers: {
                "firebase-uid": user.uid,
                "Content-Type": "application/json",
              },
            });
            
            if (fallbackResponse.ok) {
              return fallbackResponse.json();
            }
          }
          
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        console.error("Profile fetch error:", error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 3,
    retryDelay: 1000
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
      setIsLoadingCheckout(true);

      const response = await apiRequest("POST", "/api/subscriptions/manage");
      const data = await response.json();

      if (!data.url) {
        throw new Error("No checkout URL received from server");
      }

      try {
        new URL(data.url);
      } catch (e) {
        throw new Error("Invalid checkout URL received from server");
      }

      const checkoutWindow = window.open(data.url, "_blank");

      if (!checkoutWindow) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      setSubscriptionError(error.message || "Failed to start checkout process");
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Feedback Dialog */}
      <FeedbackDialog 
        open={feedbackOpen} 
        onOpenChange={setFeedbackOpen} 
      />
      
      {/* Non-authenticated landing page */}
      {!user ? (
        <div className="pt-16">
          {/* Landing page header */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <Link to="/" className="flex items-center">
                    <img
                      src="/assets/Black logo - no background.png"
                      alt="TrackedFR Logo"
                      className="h-8 w-auto"
                    />
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" asChild>
                    <Link to="/auth?mode=signup">Sign up now for a free trial!</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth?mode=login">Login</Link>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Hero Section with mobile optimization */}
          <section className="container mx-auto px-4 py-8 md:py-16">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col items-center mb-6 md:mb-8">
                <div className="flex justify-center">
                  <img
                    src="/assets/Black logo - no background.png"
                    alt="TrackedFR Logo"
                    className="h-16 md:h-24 w-auto"
                  />
                </div>
              </div>

              {/* Hero section with responsive text */}
              <div className="text-center space-y-6 md:space-y-8">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 leading-tight">
                  Automated Financial Reporting
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                  Transform your general ledger data into compliant financial statements ready to meet your filing obligations
                </p>
                <div className="flex justify-center gap-4 pt-4">
                  <Button
                    asChild
                    size="lg"
                    className="w-full md:w-auto px-4 md:px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    <Link to="/auth?mode=signup">Sign up now for a free trial!</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section with mobile optimization */}
          <section className="py-8 md:py-16 bg-slate-100">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
                Effortless Financial Statement Generation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                <Card className="p-4">
                  <CardHeader>
                    <CardTitle className="text-xl">Automated & Accurate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Based on prior-year financial statements, Tracked will create fully compliant financial statements instantly.
                    </p>
                  </CardContent>
                </Card>
                <Card className="p-4">
                  <CardHeader>
                    <CardTitle className="text-xl">Cost-Efficient Solution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Streamline your financial reporting process while reducing costs. Our solution offers a cost-efficient approach to generating compliant financial statements.
                    </p>
                  </CardContent>
                </Card>
                <Card className="p-4">
                  <CardHeader>
                    <CardTitle className="text-xl">Seamless ERP Integration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Integrate effortlessly with popular ERPs like Netsuite, Xero, Quickbooks for smoother financial reporting.
                    </p>
                  </CardContent>
                </Card>
                <Card className="p-4">
                  <CardHeader>
                    <CardTitle className="text-xl">Automated Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Automate compliance checks for financial records, ensuring accuracy and efficiency.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Our Roadmap Section - Replaces Enhanced Financial Understanding */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-8">
                Our Roadmap
              </h2>
              <div className="max-w-5xl mx-auto">
                <div className="grid md:grid-cols-4 gap-4 md:gap-8">
                  {/* Current Live Feature */}
                  <Card className="border-blue-600 border-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">LIVE NOW</span>
                        <CheckCircle2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <CardTitle>Review & Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Upload financial statement drafts for immediate review points, feedback, and talking points from our AI-powered platform.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Phase 1 */}
                  <Card className="relative">
                    <div className="absolute -left-4 top-1/2 hidden md:block">
                      <ArrowRight className="h-6 w-6 text-blue-400" />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">PHASE 1</span>
                        <Clock className="h-6 w-6 text-slate-500" />
                      </div>
                      <CardTitle>Instant Drafts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Upload prior-year financial statements and current year trial balance to receive instant fully compliant financial statement drafts.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Phase 2 */}
                  <Card className="relative">
                    <div className="absolute -left-4 top-1/2 hidden md:block">
                      <ArrowRight className="h-6 w-6 text-blue-400" />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">PHASE 2</span>
                        <Clock className="h-6 w-6 text-slate-500" />
                      </div>
                      <CardTitle>ERP Integration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Tracked FR will plug directly into your ERP, allowing fully compliant financial statement drafts to be prepared with one click.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Phase 3 */}
                  <Card className="relative">
                    <div className="absolute -left-4 top-1/2 hidden md:block">
                      <ArrowRight className="h-6 w-6 text-blue-400" />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">PHASE 3</span>
                        <Clock className="h-6 w-6 text-slate-500" />
                      </div>
                      <CardTitle>Automated Filing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Seamlessly submit finalized financial statements to the relevant companies office via automated filing systems such as iXBRL.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-10 text-center">
                  <p className="text-lg text-muted-foreground mb-6 max-w-3xl mx-auto">
                    Join us on our journey to revolutionize financial reporting. Start with our current tools while we build towards a completely automated future.
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Link to="/auth?mode=signup">Get Started Today with a free trial!</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="py-16 bg-slate-100">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-8">
                Security You Can Trust
              </h2>
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                  <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-6">
                    At Tracked, we take security seriously. Your financial data is sensitive, and we implement enterprise-grade security measures to ensure it stays protected.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="bg-white border-t-4 border-t-blue-600">
                    <CardHeader className="pb-2">
                      <div className="flex items-center mb-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 mr-2" />
                        <CardTitle className="text-lg">Data Protection</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>End-to-end encryption for all data</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Continuous application monitoring</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Password-based authentication with Firebase</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-t-4 border-t-blue-600">
                    <CardHeader className="pb-2">
                      <div className="flex items-center mb-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 mr-2" />
                        <CardTitle className="text-lg">Compliance</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Privacy-focused data handling</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Role-based access controls</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Working towards SOC2 certification</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-t-4 border-t-blue-600">
                    <CardHeader className="pb-2">
                      <div className="flex items-center mb-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 mr-2" />
                        <CardTitle className="text-lg">Infrastructure</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Firebase JWT authentication tokens</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Continuous security monitoring</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>High-availability cloud infrastructure</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-10 text-center">
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    We're committed to achieving SOC2 certification to further validate our security practices and provide you with additional assurance that your data is protected according to industry standards.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* About Tracked Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">
                About Tracked
              </h2>
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

          {/* Partners Section with responsive logos */}
          <section className="py-8 md:py-16 bg-slate-100">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
                Built by alumni who know what great looks like
              </h2>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                <img
                  src="https://static.wixstatic.com/media/67030e_cdc0b65dd0684915bb65c25bd4bb7033~mv2.jpg/v1/crop/x_15,y_0,w_347,h_282/fill/w_128,h_104,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/pwc_JPG.jpg"
                  alt="PwC"
                  className="h-12 md:h-16 object-contain"
                />
                <img
                  src="https://static.wixstatic.com/media/67030e_9a22a0432937434c9a193ce5826f26f3~mv2.jpg/v1/crop/x_0,y_36,w_397,h_245/fill/w_165,h_102,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/amazon_JPG.jpg"
                  alt="Amazon"
                  className="h-12 md:h-16 object-contain"
                />
                <img
                  src="https://static.wixstatic.com/media/67030e_213a9d2e46d74951af9851a380d1c33a~mv2.jpg/v1/crop/x_0,y_39,w_904,h_477/fill/w_180,h_95,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/deloitte_JPG.jpg"
                  alt="Deloitte"
                  className="h-12 md:h-16 object-contain"
                />
              </div>
            </div>
          </section>

          {/* Customers Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">
                Who are our customers?
              </h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Accounting Firms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Generate accurate financial statements from trial balances, saving time so you can add value to your clients' day, not just gather signatures.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Internal Finance Teams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Automate the work that adds no value, so you can get on with driving business performance.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Testimonials Section with mobile optimization */}
          <section className="py-8 md:py-16 bg-slate-100">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
                What Our Users Say
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <Card>
                  <CardContent className="p-6 md:p-8">
                    <blockquote className="text-base md:text-lg text-muted-foreground italic">
                      "We expect Tracked Financial Reporting to transform how we manage preparing financial statements. The accuracy and speed of the platform will significantly improve our processes."
                    </blockquote>
                    <p className="mt-4 font-medium text-sm md:text-base">
                      Georgia Wigley - CFO at Datum Consulting
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 md:p-8">
                    <blockquote className="text-base md:text-lg text-muted-foreground italic">
                      "The automated compliance checks and seamless ERP integration have revolutionized our financial reporting workflow."
                    </blockquote>
                    <p className="mt-4 font-medium text-sm md:text-base">
                      Rebecca Peters - Head of Finance Taurus Built Construction
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 md:p-8">
                    <blockquote className="text-base md:text-lg text-muted-foreground italic">
                      "This platform has significantly reduced the time we spend on financial statement preparation, allowing us to focus on value-added analysis."
                    </blockquote>
                    <p className="mt-4 font-medium text-sm md:text-base">
                      Tiarnan Stack - Financial Controller Irish Housing
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Experience automated financial statements
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Start using our AI-powered platform today
              </p>
              <Button asChild size="lg" className="px-8">
                <Link to="/auth?mode=signup">Sign up now for a free trial!</Link>
              </Button>
            </div>
          </section>

          {/* Footer with mobile optimization */}
          <footer className="py-6 md:py-8 border-t">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
                <p className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
                  © 2025 Tracked Financial Reporting
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-xs md:text-sm">
                  <Link
                    to="/terms"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Terms & Conditions
                  </Link>
                  <Link
                    to="/privacy"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    to="/cookies"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Cookie Policy
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        // Authenticated user dashboard
        <div className="flex flex-col min-h-screen">
          <div className="container mx-auto px-4 py-12 flex-grow">
            {isLoadingProfile ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : profile ? (
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">
                  Welcome, {profile.firstName}! What would you like to work on?
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Feedback Button Card */}
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div 
                        className="flex flex-col items-center text-center cursor-pointer py-6"
                        onClick={() => setFeedbackOpen(true)}
                      >
                        <div className="bg-blue-100 p-4 rounded-full mb-4">
                          <Star className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">Feedback</h3>
                        <p className="text-muted-foreground">
                          Share your thoughts and help us improve
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Chat Link Card */}
                  <Card className="hover:shadow-md transition-shadow">
                    <Link to="/chat" className="block">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center py-6">
                          <div className="bg-green-100 p-4 rounded-full mb-4">
                            <MessageCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <h3 className="text-xl font-medium mb-2">Chat</h3>
                          <p className="text-muted-foreground">
                            Start a conversation with our AI assistant
                          </p>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                  
                  {/* Analysis Link Card */}
                  <Card className="hover:shadow-md transition-shadow">
                    <Link to="/analysis" className="block">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center py-6">
                          <div className="bg-purple-100 p-4 rounded-full mb-4">
                            <BarChart2 className="h-8 w-8 text-purple-600" />
                          </div>
                          <h3 className="text-xl font-medium mb-2">Analysis</h3>
                          <p className="text-muted-foreground">
                            View and manage your financial analyses
                          </p>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                  
                  {/* Profile Link Card */}
                  <Card className="hover:shadow-md transition-shadow">
                    <Link to="/profile" className="block">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center py-6">
                          <div className="bg-amber-100 p-4 rounded-full mb-4">
                            <UserIcon className="h-8 w-8 text-amber-600" />
                          </div>
                          <h3 className="text-xl font-medium mb-2">Profile</h3>
                          <p className="text-muted-foreground">
                            Manage your account information
                          </p>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                  
                  {/* Sign Out Card */}
                  <Card className="md:col-span-2 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div 
                        className="flex flex-col items-center text-center cursor-pointer py-6"
                        onClick={handleSignOut}
                      >
                        <div className="bg-red-100 p-4 rounded-full mb-4">
                          <LogOut className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">Sign Out</h3>
                        <p className="text-muted-foreground">
                          Securely log out of your account
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="p-6 max-w-xl mx-auto">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-amber-500">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-medium">Syncing your profile</h3>
                  </div>
                  
                  {profileError ? (
                    <>
                      <p className="text-muted-foreground">
                        We're having trouble accessing your profile information. This is common for new accounts.
                      </p>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => window.location.reload()}
                          variant="outline"
                        >
                          Refresh page
                        </Button>
                        <Button
                          onClick={() => {
                            // Force a new authentication cycle and profile sync
                            if (user) {
                              user.getIdToken(true)
                                .then(() => window.location.reload())
                                .catch(err => console.error("Error refreshing token:", err));
                            } else {
                              window.location.reload();
                            }
                          }}
                        >
                          Sync profile
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground">
                        Creating and initializing your account. This should only take a moment...
                      </p>
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}
          </div>
          
          {/* Footer with mobile optimization */}
          <footer className="py-6 md:py-8 border-t mt-auto">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
                <p className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
                  © 2025 Tracked Financial Reporting
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-xs md:text-sm">
                  <Link
                    to="/terms"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Terms & Conditions
                  </Link>
                  <Link
                    to="/privacy"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    to="/cookies"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Cookie Policy
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}