import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <p>Last updated: February 07, 2025</p>

            <h2>1. Introduction</h2>
            <p>
              Tracked Financial Reporting ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and protect your information when you use our financial statement review platform.
            </p>

            <h2>2. Information We Collect</h2>
            <ul>
              <li>Financial statements and related documents you upload</li>
              <li>Account information (if applicable)</li>
              <li>Usage data and analytics</li>
              <li>Communication preferences</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>
              We use your information to:
            </p>
            <ul>
              <li>Provide and improve our financial statement review services</li>
              <li>Process and analyze your financial documents</li>
              <li>Communicate with you about our services</li>
              <li>Ensure the security of our platform</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your data. All financial documents are encrypted and stored securely.
            </p>

            <h2>5. Contact Us</h2>
            <p>
              For any privacy-related questions, please contact us at privacy@trackedfr.com
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
