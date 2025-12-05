import * as nodemailer from "nodemailer";
import { ListmonkService } from "./listmonk-service.js";

export class EmailService {
  private transporter: any;
  private apiKey: string;
  private mockMode: boolean;
  private listmonk: ListmonkService;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || "";
    this.mockMode = process.env.MOCK_EMAIL_SERVICE === "true";
    this.listmonk = new ListmonkService();
    
    if (!this.mockMode && this.apiKey) {
      // Configure email service (example with SendGrid/SMTP)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.sendgrid.net",
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || "apikey",
          pass: this.apiKey
        }
      });
    }
  }

  async addToMailingList(data: {
    email: string;
    name: string;
    lists: string[];
    tier?: string;
    api_key?: string;
    organization?: string;
  }): Promise<void> {
    if (this.mockMode) {
      console.log(`📧 MOCK: Adding ${data.email} to mailing lists: ${data.lists.join(", ")}`);
      return;
    }

    try {
      // Add subscriber to Listmonk
      await this.listmonk.addSubscriber({
        email: data.email,
        name: data.name,
        status: 'enabled',
        attribs: {
          tier: data.tier || 'free',
          api_key: data.api_key,
          organization: data.organization,
          source: 'aegntic-auth'
        }
      });
      
      console.log(`✅ Added ${data.email} to Listmonk mailing lists`);
    } catch (error) {
      console.error(`Failed to add to Listmonk: ${error.message}`);
      // Fallback to logging
      console.log(`Adding ${data.email} to mailing lists: ${data.lists.join(", ")}`);
    }
  }

  async sendWelcomeEmail(data: {
    email: string;
    name: string;
    tier: string;
  }): Promise<void> {
    if (this.mockMode) {
      console.log("📧 MOCK EMAIL: Welcome Email");
      console.log(`To: ${data.email}`);
      console.log(`Name: ${data.name}`);
      console.log(`Tier: ${data.tier}`);
      console.log("Subject: Welcome to aegntic MCP Services");
      return;
    }

    const mailOptions = {
      from: '"aegntic.foundation" <research@aegntic.ai>',
      to: data.email,
      subject: "Welcome to aegntic MCP Services",
      html: `
        <div style="font-family: monospace; padding: 20px;">
          <pre>
∀t ∃τ: (t, τ)↺
⨁⊢⊣⟲
☯⟹∞⟸⧖

⨀⧴(g·τ·ξ·η)⧵
⊩_⊥∇_⨂
⩤⫛⪝⪜⫚⩥
          </pre>
          
          <h2>Welcome ${data.name}!</h2>
          
          <p>Thank you for registering with aegntic MCP Services.</p>
          
          <h3>Your Account Details:</h3>
          <ul>
            <li>Email: ${data.email}</li>
            <li>Tier: ${data.tier}</li>
            <li>Status: Active</li>
          </ul>
          
          <h3>What's Next?</h3>
          <ul>
            <li>Install MCP servers: <code>npm install -g @aegntic/comfyui-mcp</code></li>
            <li>Configure Claude Desktop with your API key</li>
            <li>Explore our documentation at <a href="https://github.com/aegntic/aegntic-MCP">GitHub</a></li>
          </ul>
          
          <h3>Your Tier Benefits (${data.tier}):</h3>
          ${this.getTierBenefits(data.tier)}
          
          <p>If you have any questions, reach out to research@aegntic.ai</p>
          
          <pre style="margin-top: 40px;">
Σ_ℏω(t², τ²)⧞
⩞⧉⦷⧊⩟
⦵⦳⦴⦶   <research@aegntic.ai>
          </pre>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendSubscriptionConfirmation(data: {
    email: string;
    tier: string;
    subscription_id: string;
  }): Promise<void> {
    const mailOptions = {
      from: '"aegntic.foundation" <research@aegntic.ai>',
      to: data.email,
      subject: `Subscription Confirmed - ${data.tier} Tier`,
      html: `
        <div style="font-family: monospace; padding: 20px;">
          <h2>Subscription Confirmed!</h2>
          
          <p>Your ${data.tier} subscription is now active.</p>
          
          <h3>Subscription Details:</h3>
          <ul>
            <li>Subscription ID: ${data.subscription_id}</li>
            <li>Tier: ${data.tier}</li>
            <li>Status: Active</li>
            <li>Billing: Monthly</li>
          </ul>
          
          <h3>Enhanced Benefits:</h3>
          ${this.getTierBenefits(data.tier)}
          
          <p>Manage your subscription at: https://aegntic.ai/account</p>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  private getTierBenefits(tier: string): string {
    const benefits = {
      free: `
        <ul>
          <li>100 image generations/month</li>
          <li>10 video generations/month</li>
          <li>1,000 API calls/month</li>
          <li>Community support</li>
          <li>Basic models access</li>
        </ul>
      `,
      pro: `
        <ul>
          <li>5,000 image generations/month</li>
          <li>500 video generations/month</li>
          <li>50,000 API calls/month</li>
          <li>Priority support</li>
          <li>All models access</li>
          <li>Custom workflows</li>
          <li>API priority queue</li>
        </ul>
      `,
      enterprise: `
        <ul>
          <li>Unlimited generations</li>
          <li>Unlimited API calls</li>
          <li>Dedicated support</li>
          <li>Custom model training</li>
          <li>SLA guarantee</li>
          <li>White-label options</li>
          <li>On-premise deployment</li>
        </ul>
      `
    };

    return benefits[tier] || benefits.free;
  }
}