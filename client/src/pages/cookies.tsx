import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Cookie Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <p>Last updated: February 07, 2025</p>

            <h2>1. About Cookies</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience and enable certain features of our platform.
            </p>

            <h2>2. Types of Cookies We Use</h2>
            <ul>
              <li>Essential cookies: Required for basic website functionality</li>
              <li>Analytics cookies: Help us understand how you use our platform</li>
              <li>Preference cookies: Remember your settings and choices</li>
            </ul>

            <h2>3. Managing Cookies</h2>
            <p>
              You can control and manage cookies through your browser settings. Please note that disabling certain cookies may affect the functionality of our platform.
            </p>

            <h2>4. Updates to This Policy</h2>
            <p>
              We may update this cookie policy periodically. Any changes will be posted on this page.
            </p>

            <div className="mt-8">
              <Link href="/" className="text-primary hover:underline">
                Return to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
