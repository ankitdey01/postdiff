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

export default function LandingPage() {
  return (
    <SiteFrame>
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
