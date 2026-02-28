import { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: `Affiliate Disclaimer | ${SITE_NAME}`,
  description: `Affiliate disclosure, privacy policy, and editorial policy for ${SITE_NAME}.`,
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Breadcrumbs items={[{ label: "Disclaimer" }]} />

      <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-foreground">
        Affiliate Disclaimer
      </h1>

      <div className="mt-8 prose">
        <h2>Affiliate Disclosure</h2>
        <p>
          {SITE_NAME} is a participant in the Amazon Services LLC Associates
          Program (Amazon Associates India). This is an affiliate advertising
          program designed to provide a means for sites to earn advertising fees
          by advertising and linking to Amazon.in.
        </p>
        <p>
          When you click on an affiliate link on our site and make a purchase, we
          may receive a small commission at no additional cost to you. This
          commission helps us maintain the site and continue creating book
          recommendations.
        </p>

        <h2>Editorial Independence</h2>
        <p>
          Our book recommendations are based on research, reader reviews, and
          editorial judgement. Affiliate partnerships do not influence which books
          we recommend or how we review them. We only recommend books we believe
          provide genuine value to our readers.
        </p>

        <h2>Price Information</h2>
        <p>
          Prices displayed on {SITE_NAME} are sourced from Amazon India at the
          time of publication. Prices may change at any time, and we cannot
          guarantee that the prices shown on our site are current. We encourage
          you to verify the final price on the retailer&apos;s website before
          making a purchase.
        </p>

        <h2>Privacy Policy</h2>
        <p>
          {SITE_NAME} does not collect personal information from visitors. We do
          not use cookies for tracking purposes. When you click an affiliate
          link, the destination site (Amazon India) may set their own cookies in
          accordance with their privacy policies.
        </p>
        <p>
          We may use privacy-friendly analytics to understand general site
          traffic patterns. No personally identifiable information is collected
          or stored.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions about this disclaimer or our affiliate
          relationships, please reach out to us through our website.
        </p>

        <p className="text-sm text-muted mt-8">
          Last updated: {new Date().toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
