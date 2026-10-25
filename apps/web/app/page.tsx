import type { Metadata } from "next";
import { Faq } from "./_components/Faq";
import { Features } from "./_components/Features";
import { Finale } from "./_components/Finale";
import { Hero } from "./_components/Hero";
import { HowItWorksSection } from "./_components/HowItWorks";
import { LogoStrip } from "./_components/LogoStrip";
import { Nav } from "./_components/Nav";
import { Problem } from "./_components/Problem";
import { Proof } from "./_components/Proof";
import { Solution } from "./_components/Solution";
import { Stories } from "./_components/Stories";
import { SiteFrame } from "./_components/SiteFrame";
import { ScrollProgress } from "./_components/ui/scroll-progress";
import { SITE_ORIGIN } from "./site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_ORIGIN}/#software`,
      name: "Postdiff",
      description:
        "A local-first CLI that turns meaningful git commits into reviewable posts in the developer's voice.",
      url: SITE_ORIGIN,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Windows, macOS, Linux",
      softwareVersion: "0.0.1",
      downloadUrl: "https://www.npmjs.com/package/postdiff",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_ORIGIN}/#organization`,
      name: "Postdiff",
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/logo.webp`,
      sameAs: ["https://github.com/ankitdey01/postdiff"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "ankitdey450@gmail.com",
      },
      address: {
        "@type": "PostalAddress",
        addressCountry: "US",
      },
    },
  ],
};

export default function LandingPage() {
  return (
    <SiteFrame>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <Nav />
      <main id="main">
        <Hero />
        <LogoStrip />
        <Stories />
        <Problem />
        <Solution />
        <HowItWorksSection />
        <Features />
        <Proof />
        <Faq />
      </main>
      <ScrollProgress
        sections={[
          { id: "stories", label: "Stories" },
          { id: "problem", label: "Problem" },
          { id: "solution", label: "Solution" },
          { id: "how", label: "How" },
          { id: "features", label: "Everything" },
          { id: "proof", label: "Proof" },
          { id: "faq", label: "FAQ" },
        ]}
      />
      <Finale />
    </SiteFrame>
  );
}
