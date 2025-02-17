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
            <h2>0. EXECUTIVE SUMMARY</h2>
            <h3>0.1 Why, what, where, when, who and how (long)</h3>

            <ul>
              <li>
                <strong>Why:</strong> Your personal data is needed to create an account so you (or the company or enterprise you represent) can use our services. We also use your personal data for account management (including customer service and invoicing). We do not ask for additional personal data beyond what is necessary for account creation and service provision.
              </li>
              <li>
                <strong>What (personal data):</strong> We collect and process limited personal data, including the full name, email address, and mobile phone number of the person signing up on behalf of their company or enterprise.
              </li>
              <li>
                <strong>What else - cookies:</strong> We may use cookies to recognize visitors, remember preferences, and deliver a better user experience. See our cookie statement for more information.
              </li>
              <li>
                <strong>What else – rights:</strong> You have all rights granted by applicable law, such as the right to know what information we hold, the right to be forgotten, and the right to amend or delete your personal information.
              </li>
              <li>
                <strong>What else – security:</strong> We have implemented a range of procedures and controls to prevent unauthorized access to, and misuse of, your personal data, including encryption, access control, and network security.
              </li>
              <li>
                <strong>Where:</strong> We collect and process information through our website and app, where you can manage your personal information and cookie settings.
              </li>
              <li>
                <strong>When:</strong> Upon registration (or at any time thereafter), we may ask you to provide, update, or complete relevant required information in your account.
              </li>
              <li>
                <strong>Who:</strong> Tracked is responsible for the data it collects, acting as the data controller (see paragraph 1.1 below for more information).
              </li>
              <li>
                <strong>How (long):</strong> We retain personal data as long as necessary to manage our business relationship with you, provide services, and comply with applicable laws.
              </li>
            </ul>

            <hr className="my-8" />

            <h2>1. INTRODUCTION AND DEFINITIONS</h2>
            <h3>1.1 About us</h3>
            <p>1.1.1 We are Tracked Financial Reporting, a company incorporated in the Netherlands ("Tracked", 'we', 'us', 'our').</p>
            <p>1.1.2 We collect personal data via our platform (website and app) and cookies (see our cookie statement for more information).</p>
            <p>1.1.3 Personal data is collected solely for sign-up and registration purposes, account management, customer service, invoicing, and fee collection.</p>

            <h3>1.2 Privacy statement</h3>
            <p>1.2.1 This privacy statement explains how Tracked processes your personal data. "You", "your" or "User" refers to the user of our services on our website/app.</p>
            <p>1.2.2 This privacy statement applies to all group companies of Tracked that are responsible for processing User data.</p>

            <hr className="my-8" />

            <h2>2. DATA COLLECTION</h2>
            <h3>2.1 Personal data Tracked collects</h3>
            <p>2.1.1 We may request the following personal data:</p>
            <ul>
              <li>Contact details: First and last name, email address, mobile phone number, and (if required) credit card details.</li>
              <li>Financial data: Data for billing purposes, including bank details, credit/debit card information, and VAT number.</li>
              <li>Other data: Information from communications with Tracked.</li>
            </ul>

            <h3>2.2 Information We Collect Automatically</h3>
            <p>2.2.1 Tracked may automatically collect information based on your device settings and business relationship. This may include:</p>
            <ul>
              <li>Name, email address, language settings, IP address, geo location, device settings, operating system, log information, and other usage data.</li>
            </ul>

            <h3>2.3 Other information from other sources</h3>
            <ul>
              <li>Data from governmental authorities: We may receive additional information in connection with investigations.</li>
              <li>Fraud detection: Data may be collected from third-party sources for fraud detection and compliance purposes.</li>
            </ul>

            <hr className="my-8" />

            <h2>3. PROCESSING PURPOSES AND SHARING</h2>
            <h3>3.1 Purposes</h3>
            <p>3.1.1 Tracked uses User information, including personal data, for the following:</p>
            <ul>
              <li>A. Registration and administration: Account management, customer service, invoicing, and verification.</li>
              <li>B. Marketing: Reminders, newsletters, surveys, and other marketing communications.</li>
              <li>C. Communication with or among Users: Customer engagement, safety, fraud prevention, compliance, and support.</li>
              <li>D. Legal, regulatory, and compliance: Supporting investigations and compliance with legal obligations.</li>
            </ul>

            <h3>3.2 Legal grounds</h3>
            <p>3.2.1 Tracked relies on legal bases, such as the necessity to execute agreements with Users, compliance with legal obligations, and legitimate interests for fraud prevention and service improvement.</p>

            <h3>3.3 Sharing with affiliated group companies</h3>
            <p>Tracked may share data within its group companies for the following purposes: account management, fraud prevention, product improvement, marketing, communication, and legal compliance.</p>

            <h3>3.4 Sharing with third parties</h3>
            <p>3.4.1 Tracked may share User information with:</p>
            <ul>
              <li>Service providers: To support business operations, billing, and fraud detection.</li>
              <li>Legal compliance: As required by law or legal proceedings.</li>
            </ul>

            <hr className="my-8" />

            <h2>4. SECURITY AND PROTECTION</h2>
            <p>4.1 You can access your personal data via your account.</p>
            <p>4.2 We have procedures to prevent unauthorized access to and misuse of personal data.</p>
            <p>4.3 We use security systems and procedures to protect information, including restricted access for authorized personnel only.</p>

            <hr className="my-8" />

            <h2>5. DATA RETENTION</h2>
            <p>5.1 We retain personal data as long as necessary for managing business relationships, providing services, complying with legal requirements, and resolving disputes.</p>
            <p>5.2 If you have questions about retention periods, please contact Tracked.</p>

            <hr className="my-8" />

            <h2>6. YOUR CHOICES AND RIGHTS</h2>
            <p>6.1 You have rights related to the personal data we hold about you, including the rights to access, correct, delete, block, and transfer data.</p>
            <p>6.2 You may withdraw consent or object to processing based on legitimate interests, subject to applicable law.</p>
            <p>6.3 We rely on Users to ensure the personal information we hold is accurate and current.</p>

            <hr className="my-8" />

            <h2>7. CONTACT US</h2>
            <p>7.1 If you have questions about how we process your data or want to exercise any rights under this Privacy Statement, please contact us.</p>
            <p>7.2 We handle privacy-specific questions, requests, and concerns based on applicable laws and regularly review this policy.</p>

            <hr className="my-8" />

            <h2>8. CHANGES TO THIS PRIVACY STATEMENT</h2>
            <p>This privacy statement may be updated from time to time. We will inform you in advance of any material changes affecting you.</p>

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