import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/navigation";

export default function Cookies() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Use the shared Navigation component */}
      {user && <Navigation />}

      <div className="container mx-auto px-4 py-8 pt-24">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Cookie Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <h2>1. Summary</h2>
            <p>
              When using our website/app ("Platform"), we may use certain cookies and online tracking technologies ("cookies") for various purposes, including ensuring seamless use of our Platform, analyzing traffic, and, if permitted, for advertising. These cookies help improve our services.
            </p>

            <h2>2. Details</h2>
            <p>
              Below is more detailed information about the types of cookies and tracking technologies used by Tracked and how they are used. Section 3 outlines your choices.
            </p>

            <h3>2.1 What are cookies and online tracking technologies?</h3>
            <p>
              A cookie is a small text file that websites place on your computer or mobile device. These cookies store information about the content you view, remember preferences, and analyze how you use our services.
            </p>

            <p>Types of cookies:</p>
            <ul>
              <li>First-party cookies: Placed by Tracked.</li>
              <li>Third-party cookies: Placed by trusted partners (e.g., social media, advertising, security).</li>
            </ul>

            <p>Categories:</p>
            <ul>
              <li>Session cookies: Deleted when you close your browser.</li>
              <li>Persistent cookies: Remain on your device after closing the browser, with a limited lifespan for most.</li>
            </ul>

            <p>
              In addition to cookies, we use tracking technologies such as web beacons, scripts, tracking URLs, and Software Development Kits (SDKs):
            </p>
            <ul>
              <li>Beacons: Small images that retrieve information from your device, such as IP address and device type.</li>
              <li>Scripts: Embedded programs that enable additional functionality on the Platform, like analytics and ads.</li>
              <li>Tracking URLs: Links with unique identifiers to track the source of visits.</li>
              <li>SDKs: Part of app source code that gathers data like device ID and location.</li>
            </ul>

            <h3>2.2 How are cookies used?</h3>
            <p>Cookies help us collect information, such as:</p>
            <ul>
              <li>IP address</li>
              <li>Device ID</li>
              <li>Pages viewed</li>
              <li>Browser type</li>
              <li>Operating system</li>
              <li>Timestamp and geolocation</li>
              <li>Ad responses</li>
              <li>Referrer URL</li>
            </ul>

            <p>They allow us to recognize you across sessions and devices. The purposes of these cookies fall into three categories:</p>

            <h4>2.2.1 Functional cookies</h4>
            <p>Necessary for the functioning of our Platform. They enable:</p>
            <ul>
              <li>Account creation, login, and transaction viewing.</li>
              <li>Remembering your preferences, like currency and language settings.</li>
              <li>Storing login details (encrypted) for convenience.</li>
            </ul>

            <h4>2.2.2 Analytical cookies</h4>
            <p>Help us understand how our Platform is used and improve our services. They:</p>
            <ul>
              <li>Measure how visitors and customers interact with Tracked.</li>
              <li>Provide insights into the effectiveness of advertising.</li>
              <li>Track interactions after seeing an online ad, including clicks, mouse movements, and keywords used.</li>
            </ul>

            <h4>2.2.3 Marketing cookies</h4>
            <p>Used by Tracked and partners to show you interest-based ads on and off our Platform. They:</p>
            <ul>
              <li>Build interest profiles based on browsing behavior.</li>
              <li>Display personalized ads and retargeting content.</li>
              <li>Integrate social media functions (e.g., "like" and "share" buttons).</li>
            </ul>

            <p>
              We work with trusted partners and may share data for tailored advertising. Check their privacy policies to understand how they use your data.
            </p>

            <h3>2.3 Non-Cookie Techniques – Email Pixels</h3>
            <p>
              We may use pixels in emails to see if you open and interact with them. This helps us optimize our communication.
            </p>

            <h2>3. WHAT ARE YOUR CHOICES?</h2>
            <p>
              For more information on cookies and how to manage or delete them, visit allaboutcookies.org or the help section of your browser.
            </p>

            <p>
              You can adjust your cookie settings in browsers like Safari, Edge, Firefox, or Chrome. Blocking certain cookies may limit Platform functionality.
            </p>

            <p>Options to opt out:</p>
            <ul>
              <li>Analysis: Use Google Analytics Opt-out Browser Add-on to prevent data collection.</li>
              <li>Advertising: Visit NAI and IAB to opt out of behavioral advertising.</li>
            </ul>

            <p>
              Some devices allow you to limit retargeting via settings. Note that opting out doesn't stop all ads, just tailored ones.
            </p>

            <h2>4. HOW TO CONTACT US?</h2>
            <p>
              For questions about this cookie statement, email us at info@trackedfr.com
            </p>

            <p>
              We may update this cookie statement periodically. Please check this page regularly for the latest version.
            </p>

            <div className="mt-8">
              <Link to="/" className="text-primary hover:underline">
                Return to Home
              </Link>
            </div>
            <div className="space-x-4 mt-4">
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary">
                Terms & Conditions
              </Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary">
                Privacy Policy
              </Link>
              <Link to="/cookies" className="text-sm text-muted-foreground hover:text-primary">
                Cookie Policy
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}