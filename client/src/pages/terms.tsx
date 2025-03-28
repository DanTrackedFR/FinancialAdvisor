import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Terms() {
  const { user, logout } = useAuth();

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

      <div className="container mx-auto px-4 py-8 pt-24">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Terms and conditions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <p>
              These terms and conditions ("Terms") apply when you use the services of Tracked FR or our affiliates ("Services"). The Terms include our other documentation, guidelines, or policies we may provide or otherwise communicate to you. By using our Services, you agree to these Terms. Our Privacy Notice explains how we collect and use personal information.
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
              <p className="font-bold">IMPORTANT NOTICE REGARDING ARBITRATION:</p>
              <p>
                WHEN YOU AGREE TO THESE TERMS YOU ARE AGREEING (WITH LIMITED EXCEPTION) TO RESOLVE ANY DISPUTE BETWEEN YOU AND TRACKED FR THROUGH BINDING, INDIVIDUAL ARBITRATION RATHER THAN IN COURT. PLEASE REVIEW CAREFULLY SECTION "DISPUTE RESOLUTION" BELOW FOR DETAILS REGARDING ARBITRATION.
              </p>
            </div>

            <h2>1. Registration and Access</h2>
            <p>
              You must be at least 13 years of age (or such other minimum age at which you can provide consent to data processing under the laws of your territory) to use the Services, and not otherwise barred from using the Services under applicable law. If you are under 18, you must have your parent or legal guardian's permission to use the Services. If you use the Services on behalf of another person or entity, you must have the authority to accept the Terms on their behalf. You must provide accurate and complete information to register for an account. You may not make your access credentials or account available to others, and you are responsible for all activities that occur using your credentials.
            </p>

            <h2>2. Usage Requirements</h2>
            <h3>1. Use of Services.</h3>
            <p>
              You may access, and we grant you a non-exclusive right to use, the Services in accordance with these Terms. You will comply with these Terms and all applicable laws when using the Services. We and our affiliates own all rights, title, and interest in and to the Services.
            </p>

            <h3>2. Feedback.</h3>
            <p>
              We appreciate feedback, comments, ideas, proposals and suggestions for improvements. If you provide any of these things, we may use it without restriction or compensation to you.
            </p>

            <h3>3. Restrictions.</h3>
            <p>You may not (i) use the Services in a way that infringes, misappropriates or violates any person's rights; (ii) reverse assemble, reverse compile, decompile, translate or otherwise attempt to discover the source code or underlying components of models, algorithms, and systems of the Services (except to the extent such restrictions are contrary to applicable law); (iii) subject to applicable law, use output from the Services to develop models that compete with Tracked FR; (iv) use any automated or programmatic method to extract data or output from the Services, including scraping, web harvesting, or web data extraction; (v) represent that output from the Services was human-generated when it is not; (vii) use, display, mirror or frame the Services or any individual element within the Services, Tracked FR's name, any Tracked FR trademark, logo or other proprietary information, or the layout and design of any page or form contained on a page, without Tracked FR's express written consent; (viii) access, tamper with, or use non-public areas of the Services, Tracked FR's computer systems, or the technical delivery systems of Tracked FR's providers; (ix) attempt to probe, scan or test the vulnerability of any Tracked FR system or network or breach any security or authentication measures; (x) use the Services, or any portion thereof, for any commercial purpose or for the benefit of any third party or in any manner not permitted by these Terms; (xi) interfere with, or attempt to interfere with, the access of any user, host or network, including, without limitation, sending a virus, overloading, flooding, spamming, or mail-bombing the Services; (xii) subject to applicable law, send us any personal information of children under 18 or the applicable age of digital consent; or (xiii) encourage or enable any other individual to do any of the foregoing. You will comply with any rate limits and other requirements in our documentation. You may use Services only in geographies currently supported by Tracked FR.</p>

            <h3>4. Third Party Services.</h3>
            <p>
              The Services may allow you to access third-party websites or other resources. We provide access only as a convenience and are not responsible for the content, products or services on or available from those resources or links displayed on such websites. You acknowledge sole responsibility for and assume all risk arising from, your use of any third-party resources.
            </p>

            <h2>3. Content</h2>
            <h3>1. Your Content.</h3>
            <p>
              You may provide input to the Services ("Input"), and receive output generated and returned by the Services based on the Input ("Output"). Input and Output are collectively "Content." As between the parties and to the extent permitted by applicable law, you own all Input. Subject to your compliance with these Terms and applicable law, Tracked FR hereby assigns to you all its right, title and interest in and to Output. Tracked FR may use Content, and you grant Tracked FR all necessary rights with respect to Content, to provide and maintain the Services, comply with applicable law, and enforce our policies. You are responsible for your Input, including for ensuring that it does not violate any applicable law or these Terms.
            </p>

            <h3>2. Similarity of Content.</h3>
            <p>
              Due to the nature of machine learning, Output may not be unique across users and the Services may generate the same or similar output for Tracked FR or a third party. Other users may also ask similar questions and receive the same response. Responses that are requested by and generated for other users are not considered your Content. Accordingly, to the fullest extent permitted by applicable law, you hereby waive and agree never to assert against Tracked FR any and all rights that you may have in or with respect to any Output, during and after the term of these Terms.
            </p>

            <h3>3. Use of Content to Improve Services.</h3>
            <p>
              We may use Content from Services to help develop and improve our Services.
            </p>

            <h3>4. Accuracy.</h3>
            <p>
              Artificial intelligence and machine learning are rapidly evolving fields of study. We are constantly working to improve our Services to make them more accurate, reliable, safe and beneficial. Given the probabilistic nature of machine learning, use of our Services may in some situations result in incorrect Output that does not accurately reflect real people, places, or facts. You should evaluate the accuracy of any Output as appropriate for your use case, including by using human review of the Output.
            </p>

            <h2>4. Fees and Payments</h2>
            <h3>1. Fees and Billing.</h3>
            <p>
              You will pay all fees charged to your account, plus any applicable taxes, and other charges ("Fees") according to the prices and terms on the applicable pricing page, or as otherwise agreed between us. We have the right to correct pricing errors or mistakes even if we have already issued an invoice or received payment. You will provide complete and accurate billing information including a valid and authorized payment method. By initiating a transaction, you authorize Tracked FR and its affiliates, and our third-party payment processor(s), to charge your payment method for the Fees and you agree to the pricing, payment and billing policies applicable to such fees and charges, as posted or otherwise communicated to you. If your payment cannot be completed, we will provide you written notice and may suspend access to the Services until payment is received. Fees are payable in the currency charged and are due upon invoice issuance. Payments are nonrefundable except as provided in these Terms.
            </p>

            <h3>2. Subscriptions.</h3>
            <p>
              If you purchase a subscription ("Subscription"), you will be charged the Subscription Fee at the beginning of your Subscription and each period thereafter, at the then-current Subscription Fee. BY PURCHASING A SUBSCRIPTION, YOU AUTHORIZE TRACKED FR TO INITIATE RECURRING NON-REFUNDABLE PAYMENTS AS SET FORTH BELOW. If you purchase a Subscription, we (or our third-party payment processor) will automatically charge you each period on the anniversary of the commencement of your Subscription, using the payment information you have provided until you cancel your Subscription. In accordance with applicable law, Tracked FR will send you a reminder with the then-current Subscription Fee. By agreeing to these Terms and electing to purchase a Subscription, you acknowledge that your Subscription has recurring payment features and you accept responsibility for all recurring payment obligations prior to cancellation of your Subscription by you or Tracked FR. Your Subscription continues until cancelled by you or we terminate your access to or use of the Services or Subscription in accordance with these Terms.
            </p>

            <h3>3. Taxes.</h3>
            <p>
              Unless otherwise stated, Fees do not include federal, state, local, and foreign taxes, duties, and other similar assessments ("Taxes"). You are responsible for all Taxes associated with your purchase, excluding Taxes based on our net income, and we may invoice you for such Taxes. You agree to timely pay such Taxes and provide us with documentation showing the payment, or additional evidence that we may reasonably require. Tracked FR uses the name and address in your account registration as the place of supply for tax purposes, so you must keep this information accurate and up- to-date.
            </p>

            <h3>4. Price Changes.</h3>
            <p>
              We may change our prices by posting notice to your account and/or to our website. Subject to applicable law, price increases will be effective 14 days after they are posted, except for increases made for legal reasons or increases made to, which will be effective immediately. Any price changes will apply to the Fees charged to your account immediately after the effective date of the changes.
            </p>

            <h3>5. Disputes and Late Payments.</h3>
            <p>
              If you want to dispute any Fees, please contact info@trackedfr.com within thirty (30) days of the date of the disputed invoice. Undisputed amounts past due may be subject to a finance charge of 1.5% of the unpaid balance per month. If any amount of your Fees are past due, we may suspend your access to the Services after we provide you written notice of late payment.
            </p>

            <h3>6. Free Tier.</h3>
            <p>
              Tracked FR may, from time to time and in its sole discretion, offer certain aspects of the Services free of charge (whether for a limited period of time or otherwise). Such free aspects Services may be subject to additional terms and conditions (as will be communicated to you). Without limiting anything to the contrary in these Terms, you may not create more than one account to benefit from credits provided in the free tier of the Services. If we believe you are not using the free tier in good faith, we may charge you standard fees or stop providing access to the Services.
            </p>

            <h2>5. Term and Termination</h2>
            <h3>1. Termination; Suspension.</h3>
            <p>
              These Terms take effect when you first use the Services and remain in effect until terminated. You may terminate these Terms at any time for any reason by discontinuing the use of the Services. We may suspend your access to Services and/or terminate these Terms at any time and for any reason by providing you written notice of such termination, including without limitation immediately upon notice to you if you materially breach these Terms, if there are changes in relationships with third party technology providers outside of our control, to comply with law or government requests, if your use poses a security risk to us or any third party, or if we suspect that your use is fraudulent or could subject us or any third party to liability.
            </p>

            <h3>2. Effect on Termination.</h3>
            <p>
              Upon termination, you will promptly cease using the Services. Each section of these Terms which by their nature should survive termination or expiration should survive, including without limitation sections: Fees and Payments (for any payment obligations accrued by you prior to the date of such termination), Indemnification; Disclaimer of Warranties; Limitations on Liability, Dispute Resolution, and General Terms.
            </p>

            <h2>6. Indemnification; Disclaimer of Warranties; Limitations on Liability</h2>
            <h3>1. Indemnity.</h3>
            <p>
              You will defend, indemnify, and hold harmless us, our affiliates, and our personnel, from and against any claims, losses, and expenses (including attorneys' fees) arising from or relating to your use of the Services, including your Input, products or services you develop or offer in connection with the Services, and your breach of these Terms or violation of applicable law.
            </p>

            <h3>2. Disclaimer.</h3>
            <p>
              THE SERVICES ARE PROVIDED "AS IS." EXCEPT TO THE EXTENT PROHIBITED BY LAW, WE AND OUR AFFILIATES AND LICENSORS MAKE NO WARRANTIES (EXPRESS, IMPLIED, STATUTORY OR OTHERWISE) WITH RESPECT TO THE SERVICES, AND DISCLAIM ALL WARRANTIES INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, SATISFACTORY QUALITY, NON-INFRINGEMENT, AND QUIET ENJOYMENT, AND ANY WARRANTIES ARISING OUT OF ANY COURSE OF DEALING OR TRADE USAGE. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ACCURATE OR ERROR FREE, OR THAT ANY CONTENT WILL BE SECURE OR NOT LOST OR ALTERED.
            </p>
            <p>
              YOU ACKNOWLEDGE AND AGREE THAT THE SERVICES USE EXPERIMENTAL TECHNOLOGY LIKE GENERATIVE ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING ALGORITHMS, AND MAY SOMETIMES PROVIDE INACCURATE OR OFFENSIVE OUTPUTS. ACCORDINGLY, WE DO NOT MAKE ANY WARRANTIES REGARDING THE QUALITY, ACCURACY, TIMELINESS, TRUTHFULNESS, COMPLETENESS OR RELIABILITY OF THE OUTPUTS, INCLUDING ANY INFORMATION OR CONTENT THEREIN. YOU FURTHER ACKNOWLEDGE THAT THE OUTPUTS ARE GENERATED BY GENERATIVE ARTIFICIAL INTELLIGENCE TOOLS AND MAY NOT BE PROTECTABLE UNDER APPLICABLE INTELLECTUAL PROPERTY LAWS, AND TRACKED FR HEREBY DISCLAIMS ANY REPRESENTATIONS AND WARRANTIES WITH RESPECT TO THE OWNERSHIP OR PROTECTABILITY OF, OR APPLICABILITY OF INTELLECTUAL PROPERTY RIGHTS TO, SUCH OUTPUTS. YOUR USE AND RELIANCE OF THE OUTPUTS IS AT YOUR OWN RISK, AND TRACKED FR IS NOT LIABLE FOR ANY LOSS OR DAMAGES ARISING FROM THE USE OF OR RELIANCE ON THE OUTPUTS. DO NOT RELY ON THE SERVICES OR ANY CONTENT PROVIDED VIA THE FUNCTIONALITY OF THE SERVICES FOR PROFESSIONAL ADVICE. ANY CONTENT, INCLUDING OUTPUTS, IS PROVIDED FOR INFORMATIONAL PURPOSES ONLY AND IS NOT A SUBSTITUTE FOR ADVICE FROM A QUALIFIED PROFESSIONAL.
            </p>

            <h3>3. Limitations of Liability.</h3>
            <p>
              NEITHER WE NOR ANY OF OUR AFFILIATES OR LICENSORS WILL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR EXEMPLARY DAMAGES, INCLUDING DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, OR DATA OR OTHER LOSSES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR AGGREGATE LIABILITY UNDER THESE TERMS SHALL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID FOR THE SERVICE THAT GAVE RISE TO THE CLAIM DURING THE 12 MONTHS BEFORE THE LIABILITY AROSE OR ONE HUNDRED DOLLARS ($100). THE LIMITATIONS IN THIS SECTION APPLY ONLY TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW.
            </p>

            <h2>7. Dispute Resolution</h2>
            <h3>1. MANDATORY ARBITRATION.</h3>
            <p>
              We each agree that any dispute, claim or controversy arising out of or relating to these Terms or the breach, termination, enforcement, interpretation or validity thereof or the use of the Services (collectively, "Disputes") will be resolved solely by binding, individual arbitration and not in a class, representative or consolidated action or proceeding. You and Tracked FR agree that the U.S. Federal Arbitration Act governs the interpretation and enforcement of these Terms, and that you and Tracked FR are each waiving the right to a trial by jury or to participate in a class action. This arbitration provision shall survive termination of these Terms.
            </p>

            <h3>2. Informal Dispute Resolution.</h3>
            <p>
              We would like to understand and try to address your concerns prior to formal legal action. Before filing a claim against Tracked FR, you agree to try to resolve the dispute informally by sending us notice at info@trackedfr.com of your name, a description of the dispute, and the relief you seek. If we are unable to resolve a dispute within 60 days, you may bring a formal proceeding. Any statute of limitations will be tolled during the 60-day resolution process.
            </p>

            <h3>3. Exceptions.</h3>
            <p>
              As limited exceptions to Section "Mandatory Arbitration" above: (i) we both may seek to resolve a Dispute in small claims court if it qualifies; and (ii) we each retain the right to seek injunctive or other equitable relief from a court to prevent (or enjoin) the infringement or misappropriation of our intellectual property rights.
            </p>

            <h3>4. Conducting Arbitration and Arbitration Rules.</h3>
            <p>
              The arbitration will be conducted by the American Arbitration Association ("AAA") under its Consumer Arbitration Rules (the "AAA Rules") then in effect, except as modified by these Terms. The AAA Rules are available at www.adr.org or by calling 1-800-778-7879. A party who wishes to start arbitration must submit a written Demand for Arbitration to AAA and give notice to the other party as specified in the AAA Rules. The AAA provides a form Demand for Arbitration at www.adr.org.
            </p>

            <p>
              Any arbitration hearings will take place in the county (or parish) where you live, unless we both agree to a different location. The parties agree that the arbitrator shall have exclusive authority to decide all issues relating to the interpretation, applicability, enforceability and scope of this arbitration agreement.
            </p>

            <h3>6. Arbitration Costs.</h3>
            <p>
              Payment of all filing, administration and arbitrator fees will be governed by the AAA Rules, and we won't seek to recover the administration and arbitrator fees we are responsible for paying, unless the arbitrator finds your Dispute frivolous. If we prevail in arbitration we'll pay all of our attorneys' fees and costs and won't seek to recover them from you. If you prevail in arbitration you will be entitled to an award of attorneys' fees and expenses to the extent provided under applicable law.
            </p>

            <h3>7. Injunctive and Declaratory Relief.</h3>
            <p>
              Except as provided in Section "Mandatory Arbitration" above, the arbitrator shall determine all issues of liability on the merits of any claim asserted by either party and may award declaratory or injunctive relief only in favor of the individual party seeking relief and only to the extent necessary to provide relief warranted by that party's individual claim. To the extent that you or we prevail on a claim and seek public injunctive relief (that is, injunctive relief that has the primary purpose and effect of prohibiting unlawful acts that threaten future injury to the public), the entitlement to and extent of such relief must be litigated in a civil court of competent jurisdiction and not in arbitration. The parties agree that litigation of any issues of public injunctive relief shall be stayed pending the outcome of the merits of any individual claims in arbitration.
            </p>

            <h3>8. Class Action Waiver.</h3>
            <p>
              YOU AND TRACKED FR AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING. Further, if the parties' Dispute is resolved through arbitration, the arbitrator may not consolidate another person's claims with your claims, and may not otherwise preside over any form of a representative or class proceeding. If this specific provision is found to be unenforceable, then the entirety of this Dispute Resolution section shall be null and void.
            </p>

            <h3>9. Severability.</h3>
            <p>
              With the exception of any of the provisions in Section "Class Action Waiver" of these Terms ("Class Action Waiver"), if an arbitrator or court of competent jurisdiction decides that any part of these Terms is invalid or unenforceable, the other parts of these Terms will still apply.
            </p>

            <h2>8. General Terms</h2>
            <h3>1. Relationship of the Parties.</h3>
            <p>
              These Terms do not create a partnership, joint venture or agency relationship between you and Tracked FR or any of Tracked FR's affiliates. Tracked FR and you are independent contractors and neither party will have the power to bind the other or to incur obligations on the other's behalf without the other party's prior written consent.
            </p>

            <h3>2. Use of Brands.</h3>
            <p>
              You may not use Tracked FR's or any of its affiliates' names, logos, or trademarks, without our prior written consent.
            </p>

            <h3>3. U.S. Federal Agency Entities.</h3>
            <p>
              The Services were developed solely at private expense and are commercial computer software and related documentation within the meaning of the applicable U.S. Federal Acquisition Regulation and agency supplements thereto.
            </p>

            <h3>4. DMCA/Copyright Policy.</h3>
            <p>
              Tracked FR respects copyright law and expects its users to do the same. It is Tracked FR's policy to terminate in appropriate circumstances account holders who repeatedly infringe or are believed to be repeatedly infringing the rights of copyright holders.
            </p>

            <h3>5. Assignment and Delegation.</h3>
            <p>
              You may not assign or delegate any rights or obligations under these Terms, including in connection with a change of control. Any purported assignment and delegation shall be null and void. We may assign these Terms in connection with a merger, acquisition or sale of all or substantially all of our assets, or to any affiliate or as part of a corporate reorganization.
            </p>

            <h3>6. Changes to these Terms or the Services.</h3>
            <p>
              We may update the Terms from time to time in our sole discretion. If we do, we'll let you know by posting the updated Terms on our website and/or may also send other communications regarding the updated Terms. It's important that you review the Terms whenever we update them or you use the Services. If you continue to use the Services after we have posted updated Terms it means that you accept and agree to the changes. If you don't agree to be bound by the changes, you may not use the Services anymore. Because our Services are evolving over time we may change or discontinue all or any part of the Services, at any time and without notice, at our sole discretion.
            </p>

            <h3>7. Notices.</h3>
            <p>
              We may notify you via the Services, using the registration information you provided or the email address associated with your use of the Services. Service will be deemed given on the date of receipt if delivered by email or on the date sent via courier if delivered by post. Tracked FR accepts service of process at: info@trackedfr.com.
            </p>

            <h3>8. Waiver and Severability.</h3>
            <p>
              If you do not comply with these Terms, and Tracked FR does not take action right away, this does not mean Tracked FR is giving up any of our rights. Except as provided in previous sections, if any part of these Terms is determined to be invalid or unenforceable by a court of competent jurisdiction, that term will be enforced to the maximum extent permissible and it will not affect the enforceability of any other terms.
            </p>

            <h3>9. Export Controls.</h3>
            <p>
              The Services may not be used in or for the benefit of, exported, or re-exported (a) into any U.S. embargoed countries (collectively, the "Embargoed Countries") or (b) to anyone on the U.S. Treasury Department's list of Specially Designated Nationals, any other restricted party lists (existing now or in the future) identified by the Office of Foreign Asset Control, or the U.S. Department of Commerce Denied Persons List or Entity List, or any other restricted party lists (collectively, "Restricted Party Lists"). You represent and warrant that you are not located in any Embargoed Countries and not on any such restricted party lists. You must comply with all applicable laws related to Embargoed Countries or Restricted Party Lists, including any requirements or obligations to know your end users directly.
            </p>

            <h3>10. Equitable Remedies.</h3>
            <p>
              You acknowledge that if you violate or breach these Terms, it may cause irreparable harm to Tracked FR and its affiliates, and Tracked FR shall have the right to seek injunctive relief against you in addition to any other legal remedies.
            </p>

            <h3>11. Entire Agreement.</h3>
            <p>
              These Terms and any policies incorporated in these Terms contain the entire agreement between you and Tracked FR regarding the use of the Services and, other than any Service specific terms of use or any applicable enterprise agreements, supersedes any prior or contemporaneous agreements, communications, or understandings between you and Tracked FR on that subject.
            </p>

            <h3>12. Reservation of Rights.</h3>
            <p>
              Tracked FR and its licensors exclusively own all right, title and interest in and to the Services, including all associated intellectual property rights. You acknowledge that the Services are protected by copyright, trademark, and other laws of the United States and foreign countries. You agree not to remove, alter or obscure any copyright, trademark, service mark or other proprietary rights notices incorporated in or accompanying the Services.
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