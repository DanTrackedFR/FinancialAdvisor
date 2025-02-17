import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <p>Last updated: February 07, 2025</p>

            <p>
              These terms and conditions ("Terms") apply when you use the services of Tracked FR or our affiliates ("Services"). 
              The Terms include our other documentation, guidelines, or policies we may provide or otherwise communicate to you. 
              By using our Services, you agree to these Terms. Our Privacy Notice explains how we collect and use personal information.
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
              <p className="font-bold">IMPORTANT NOTICE REGARDING ARBITRATION:</p>
              <p>
                WHEN YOU AGREE TO THESE TERMS YOU ARE AGREEING (WITH LIMITED EXCEPTION) TO RESOLVE ANY DISPUTE BETWEEN YOU AND TRACKED FR 
                THROUGH BINDING, INDIVIDUAL ARBITRATION RATHER THAN IN COURT. PLEASE REVIEW CAREFULLY SECTION "DISPUTE RESOLUTION" BELOW FOR DETAILS 
                REGARDING ARBITRATION.
              </p>
            </div>

            <h2>1. Registration and Access</h2>
            <p>
              You must be at least 13 years of age (or such other minimum age at which you can provide consent to data processing under the laws 
              of your territory) to use the Services, and not otherwise barred from using the Services under applicable law. If you are under 18, 
              you must have your parent or legal guardian's permission to use the Services. If you use the Services on behalf of another person or 
              entity, you must have the authority to accept the Terms on their behalf. You must provide accurate and complete information to register 
              for an account. You may not make your access credentials or account available to others, and you are responsible for all activities 
              that occur using your credentials.
            </p>

            <h2>2. Usage Requirements</h2>
            <h3>2.1. Use of Services</h3>
            <p>
              You may access, and we grant you a non-exclusive right to use, the Services in accordance with these Terms. You will comply with 
              these Terms and all applicable laws when using the Services. We and our affiliates own all rights, title, and interest in and to 
              the Services.
            </p>

            <h3>2.2. Feedback</h3>
            <p>
              We appreciate feedback, comments, ideas, proposals and suggestions for improvements. If you provide any of these things, we may 
              use it without restriction or compensation to you.
            </p>

            <h3>2.3. Restrictions</h3>
            <p>You may not:</p>
            <ul>
              <li>Use the Services in a way that infringes, misappropriates or violates any person's rights</li>
              <li>Reverse assemble, reverse compile, decompile, translate or otherwise attempt to discover the source code</li>
              <li>Use output from the Services to develop models that compete with Tracked FR</li>
              <li>Use automated methods to extract data or output from the Services</li>
              <li>Represent that output from the Services was human-generated when it is not</li>
            </ul>

            <h2>3. Content</h2>
            <p>
              You may provide input to the Services ("Input"), and receive output generated and returned by the Services based on the Input ("Output"). 
              Input and Output are collectively "Content." As between the parties and to the extent permitted by applicable law, you own all Input.
            </p>

            <h2>4. Fees and Payments</h2>
            <p>
              You will pay all fees charged to your account, plus any applicable taxes, and other charges ("Fees") according to the prices and terms 
              on the applicable pricing page, or as otherwise agreed between us.
            </p>

            <h2>5. Term and Termination</h2>
            <p>
              These Terms take effect when you first use the Services and remain in effect until terminated. You may terminate these Terms at any 
              time for any reason by discontinuing the use of the Services.
            </p>

            <h2>6. Indemnification; Disclaimer of Warranties; Limitations on Liability</h2>
            <p>
              You will defend, indemnify, and hold harmless us, our affiliates, and our personnel, from and against any claims, losses, and 
              expenses arising from or relating to your use of the Services.
            </p>

            <h2>7. Dispute Resolution</h2>
            <p>
              We each agree that any dispute, claim or controversy arising out of or relating to these Terms or the breach, termination, enforcement, 
              interpretation or validity thereof or the use of the Services will be resolved solely by binding, individual arbitration.
            </p>

            <h2>8. General Terms</h2>
            <p>
              These Terms do not create a partnership, joint venture or agency relationship between you and Tracked FR or any of Tracked FR's affiliates. 
              Tracked FR and you are independent contractors.
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
