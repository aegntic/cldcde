import { EmailCaptureForm } from '@/components/EmailCaptureForm';
import { SkoolCommunityLink } from '@/components/SkoolCommunityLink';
import { ToolShowcase } from '@/components/ToolShowcase';
import { MCPShowcase } from '@/components/MCPShowcase';
import { PricingSection } from '@/components/PricingSection';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Section 1: Hero */}
      <section id="hero" className="section-full min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background grid effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, #C0C0C0 1px, transparent 1px),
              linear-gradient(to bottom, #C0C0C0 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }} />
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="mb-8">
            <span className="label-wireframe text-sm tracking-widest">CLDCDE ECOSYSTEM</span>
          </div>
          <h1 className="heading-section mb-6 text-6xl md:text-7xl lg:text-8xl">
            CREATIVE
            <br />
            <span className="text-gold-base">DEVELOPMENT</span>
          </h1>
          <p className="body-large mx-auto mb-8 max-w-3xl">
            Premium plugins and MCP servers for the modern creator ecosystem.
            Media automation, AI tools, workflow orchestration, and knowledge management.
            Built with precision. Designed for elegance.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="#tools" className="button-noir text-lg px-8 py-4">
              EXPLORE PLUGINS
            </a>
            <a href="#mcp-servers" className="button-noir text-lg px-8 py-4">
              MCP SERVERS
            </a>
            <a href="#pricing" className="button-noir text-lg px-8 py-4">
              VIEW PRICING
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
            <div>
              <div className="text-4xl font-display text-gold-base mb-2">11+</div>
              <div className="label-wireframe text-xs">PLUGINS</div>
            </div>
            <div>
              <div className="text-4xl font-display text-gold-base mb-2">6</div>
              <div className="label-wireframe text-xs">MCP SERVERS</div>
            </div>
            <div>
              <div className="text-4xl font-display text-gold-base mb-2">10K+</div>
              <div className="label-wireframe text-xs">STARS</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Tools Grid */}
      <ToolShowcase />

      {/* Section 3: MCP Servers */}
      <MCPShowcase />

      {/* Section 4: Features */}
      <section id="features" className="section-full bg-noir-near-black">
        <div className="container mx-auto px-6">
          <h2 className="heading-section text-center mb-12">ECOSYSTEM FEATURES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="wireframe-element p-6">
              <h3 className="heading-card mb-4">Semantic Search</h3>
              <p className="body-base">
                Powered by RuVector DB for intelligent tool discovery. 150x faster search with HNSW indexing.
              </p>
            </div>
            <div className="wireframe-element p-6">
              <h3 className="heading-card mb-4">PPP Pricing</h3>
              <p className="body-base">
                Purchasing Power Parity adjusted pricing via Dodo Payments for global accessibility.
              </p>
            </div>
            <div className="wireframe-element p-6">
              <h3 className="heading-card mb-4">Automated Content</h3>
              <p className="body-base">
                NotebookLM + n8n workflows for fresh AI-generated insights daily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Pricing */}
      <PricingSection />

      {/* Section 5: Newsletter */}
      <section id="newsletter" className="section-full bg-noir-near-black">
        <div className="container mx-auto px-6 text-center">
          <h2 className="heading-section mb-6">STAY INFORMED</h2>
          <p className="body-large mx-auto mb-8 max-w-2xl">
            Weekly insights on developer tools, AI automation, and creative workflows.
            No spam, ever.
          </p>
          <EmailCaptureForm />
        </div>
      </section>

      {/* Section 6: Community */}
      <section id="community" className="section-full">
        <div className="container mx-auto px-6 text-center">
          <h2 className="heading-section mb-6">JOIN THE COLLECTIVE</h2>
          <p className="body-large mx-auto mb-8 max-w-2xl">
            Connect with other developers, share workflows, and get exclusive content.
          </p>
          <SkoolCommunityLink href="https://skool.com" />
        </div>
      </section>

      {/* Section 7: Footer */}
      <footer className="border-t border-noir-platinum/30 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="heading-card mb-4">Noir Showcase</h3>
              <p className="body-small">
                Curated developer tools with monochrome noir aesthetic
              </p>
            </div>
            <div>
              <h4 className="tech-label mb-4">NAVIGATION</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#tools" className="body-small hover:text-gold-base">
                    Tools
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="body-small hover:text-gold-base">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#newsletter" className="body-small hover:text-gold-base">
                    Newsletter
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="tech-label mb-4">RESOURCES</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="body-small hover:text-gold-base">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="body-small hover:text-gold-base">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="#" className="body-small hover:text-gold-base">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-noir-platinum/30 pt-8 text-center">
            <p className="body-small">
              &copy; {new Date().getFullYear()} Noir Showcase. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
