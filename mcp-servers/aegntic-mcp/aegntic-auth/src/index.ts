#!/usr/bin/env bun

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { SupabaseAuthManager } from "./supabase-client.js";
import { EmailService } from "./email-service.js";
import { LicenseManager } from "./license-manager.js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const EMAIL_API_KEY = process.env.EMAIL_API_KEY;
const MOCK_SERVICES = process.env.MOCK_EMAIL_SERVICE === "true";

class AegnticAuthServer {
  private server: Server;
  private authManager: SupabaseAuthManager;
  private emailService: EmailService;
  private licenseManager: LicenseManager;

  constructor() {
    this.server = new Server(
      {
        name: "aegntic-auth",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.authManager = new SupabaseAuthManager(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.emailService = new EmailService(EMAIL_API_KEY);
    this.licenseManager = new LicenseManager(STRIPE_SECRET_KEY);

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "register_user",
          description: "Register a new user for aegntic services and add to email list",
          inputSchema: {
            type: "object",
            properties: {
              email: { type: "string", description: "User email address" },
              name: { type: "string", description: "User full name" },
              organization: { type: "string", description: "Organization name (optional)" },
              subscribe_newsletter: { type: "boolean", default: true },
              tier: { 
                type: "string", 
                enum: ["free", "pro", "enterprise"],
                default: "free",
                description: "Subscription tier"
              }
            },
            required: ["email", "name"]
          }
        },
        {
          name: "verify_license",
          description: "Verify user license for premium features",
          inputSchema: {
            type: "object",
            properties: {
              email: { type: "string" },
              feature: { type: "string", description: "Feature to check access for" }
            },
            required: ["email", "feature"]
          }
        },
        {
          name: "subscribe_tier",
          description: "Subscribe to a paid tier",
          inputSchema: {
            type: "object",
            properties: {
              email: { type: "string" },
              tier: { type: "string", enum: ["pro", "enterprise"] },
              payment_method: { type: "string", description: "Stripe payment method ID" }
            },
            required: ["email", "tier", "payment_method"]
          }
        },
        {
          name: "track_usage",
          description: "Track feature usage for analytics and limits",
          inputSchema: {
            type: "object",
            properties: {
              email: { type: "string" },
              feature: { type: "string" },
              usage_count: { type: "number", default: 1 }
            },
            required: ["email", "feature"]
          }
        },
        {
          name: "get_user_status",
          description: "Get user registration and subscription status",
          inputSchema: {
            type: "object",
            properties: {
              email: { type: "string" }
            },
            required: ["email"]
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "register_user":
          return await this.handleRegisterUser(request.params.arguments);
        case "verify_license":
          return await this.handleVerifyLicense(request.params.arguments);
        case "subscribe_tier":
          return await this.handleSubscribeTier(request.params.arguments);
        case "track_usage":
          return await this.handleTrackUsage(request.params.arguments);
        case "get_user_status":
          return await this.handleGetUserStatus(request.params.arguments);
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }
    });
  }

  private async handleRegisterUser(args: any) {
    try {
      // Register user in database
      const user = await this.authManager.registerUser({
        email: args.email,
        name: args.name,
        organization: args.organization,
        tier: args.tier || "free"
      });

      // Add to email list if subscribed
      if (args.subscribe_newsletter !== false) {
        await this.emailService.addToMailingList({
          email: args.email,
          name: args.name,
          lists: ["newsletter", "product-updates"],
          tier: args.tier || "free",
          api_key: user.api_key,
          organization: args.organization
        });
      }

      // Send welcome email
      await this.emailService.sendWelcomeEmail({
        email: args.email,
        name: args.name,
        tier: args.tier || "free"
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "User registered successfully",
              user_id: user.id,
              tier: user.tier,
              api_key: user.api_key
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Registration failed: ${error.message}`
          }
        ]
      };
    }
  }

  private async handleVerifyLicense(args: any) {
    try {
      const hasAccess = await this.licenseManager.verifyFeatureAccess(
        args.email,
        args.feature
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              has_access: hasAccess,
              feature: args.feature,
              email: args.email
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `License verification failed: ${error.message}`
          }
        ]
      };
    }
  }

  private async handleSubscribeTier(args: any) {
    try {
      const subscription = await this.licenseManager.createSubscription({
        email: args.email,
        tier: args.tier,
        payment_method: args.payment_method
      });

      await this.emailService.sendSubscriptionConfirmation({
        email: args.email,
        tier: args.tier,
        subscription_id: subscription.id
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              subscription_id: subscription.id,
              tier: args.tier,
              status: "active"
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Subscription failed: ${error.message}`
          }
        ]
      };
    }
  }

  private async handleTrackUsage(args: any) {
    try {
      const usage = await this.authManager.trackUsage({
        email: args.email,
        feature: args.feature,
        count: args.usage_count || 1
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              feature: args.feature,
              total_usage: usage.total,
              limit: usage.limit,
              remaining: usage.limit - usage.total
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Usage tracking failed: ${error.message}`
          }
        ]
      };
    }
  }

  private async handleGetUserStatus(args: any) {
    try {
      const status = await this.authManager.getUserStatus(args.email);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(status, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Status check failed: ${error.message}`
          }
        ]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error("∀t ∃τ: (t, τ)↺");
    console.error("⨁⊢⊣⟲");
    console.error("☯⟹∞⟸⧖");
    console.error("");
    console.error("aegntic-auth MCP Server");
    console.error("User registration & licensing system");
    console.error("");
  }
}

const server = new AegnticAuthServer();
server.run().catch(console.error);