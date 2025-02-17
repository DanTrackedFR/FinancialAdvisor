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
            <p>Effective Date: February 7, 2025</p>

            <h2>1. Introduction</h2>
            <p>
              At Tracked Financial Reporting ("we," "us," or "our"), we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our financial statement review platform and related services (collectively, the "Services"). Please read this Privacy Policy carefully. By using our Services, you agree to the practices described in this policy.
            </p>

            <h2>2. Information We Collect</h2>
            <p>We collect several types of information, including:</p>
            <h3>2.1. Information You Provide</h3>
            <ul>
              <li>Account information (name, email, company details)</li>
              <li>Financial statements and related documents you upload</li>
              <li>Payment information</li>
              <li>Communication preferences</li>
              <li>Any other information you choose to provide</li>
            </ul>

            <h3>2.2. Automatically Collected Information</h3>
            <ul>
              <li>Usage data (how you interact with our Services)</li>
              <li>Device information</li>
              <li>IP addresses and location data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide and improve our Services</li>
              <li>Process and analyze your financial documents</li>
              <li>Communicate with you about our Services</li>
              <li>Process your payments</li>
              <li>Comply with legal obligations</li>
              <li>Detect and prevent fraud</li>
              <li>Analyze and improve our platform's performance</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your information. These measures include encryption, access controls, and secure data storage practices. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2>5. Data Retention</h2>
            <p>
              We retain your information for as long as necessary to provide our Services and comply with our legal obligations. When we no longer need your information, we securely delete or anonymize it.
            </p>

            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>

            <h2>7. Third-Party Services</h2>
            <p>
              Our Services may integrate with or contain links to third-party services. This Privacy Policy does not apply to third-party services, and we are not responsible for their privacy practices. We encourage you to review their privacy policies.
            </p>

            <h2>8. Children's Privacy</h2>
            <p>
              Our Services are not intended for children under 13. We do not knowingly collect or maintain information from children under 13. If we learn we have collected such information, we will delete it.
            </p>

            <h2>9. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of material changes through our Services or by other means. Your continued use of our Services after such updates constitutes acceptance of the updated policy.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              For questions about this Privacy Policy or our privacy practices, please contact us at:
              <br />
              Email: privacy@trackedfr.com
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