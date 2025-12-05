import { v4 as uuidv4 } from "uuid";
import * as jwt from "jsonwebtoken";

interface User {
  id: string;
  email: string;
  name: string;
  organization?: string;
  tier: "free" | "pro" | "enterprise";
  api_key: string;
  created_at: Date;
  usage: Record<string, number>;
}

export class AuthManager {
  private users: Map<string, User> = new Map();
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || "default-key";
    // In production, this would connect to a database
  }

  async registerUser(data: {
    email: string;
    name: string;
    organization?: string;
    tier: "free" | "pro" | "enterprise";
  }): Promise<User> {
    // Check if user already exists
    if (this.users.has(data.email)) {
      throw new Error("User already registered");
    }

    const user: User = {
      id: uuidv4(),
      email: data.email,
      name: data.name,
      organization: data.organization,
      tier: data.tier,
      api_key: this.generateApiKey(data.email),
      created_at: new Date(),
      usage: {}
    };

    this.users.set(data.email, user);
    return user;
  }

  async getUserStatus(email: string): Promise<any> {
    const user = this.users.get(email);
    if (!user) {
      return {
        registered: false,
        email: email
      };
    }

    return {
      registered: true,
      email: user.email,
      name: user.name,
      organization: user.organization,
      tier: user.tier,
      created_at: user.created_at,
      usage_summary: this.getUsageSummary(user)
    };
  }

  async trackUsage(data: {
    email: string;
    feature: string;
    count: number;
  }): Promise<{ total: number; limit: number }> {
    const user = this.users.get(data.email);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.usage[data.feature]) {
      user.usage[data.feature] = 0;
    }
    user.usage[data.feature] += data.count;

    const limit = this.getFeatureLimit(user.tier, data.feature);
    return {
      total: user.usage[data.feature],
      limit: limit
    };
  }

  private generateApiKey(email: string): string {
    return jwt.sign(
      { email, type: "api_key" },
      this.apiKey,
      { expiresIn: "1y" }
    );
  }

  private getFeatureLimit(tier: string, feature: string): number {
    const limits = {
      free: {
        image_generation: 100,
        video_generation: 10,
        api_calls: 1000
      },
      pro: {
        image_generation: 5000,
        video_generation: 500,
        api_calls: 50000
      },
      enterprise: {
        image_generation: -1, // unlimited
        video_generation: -1,
        api_calls: -1
      }
    };

    return limits[tier]?.[feature] || 0;
  }

  private getUsageSummary(user: User): Record<string, any> {
    const summary = {};
    for (const [feature, count] of Object.entries(user.usage)) {
      const limit = this.getFeatureLimit(user.tier, feature);
      summary[feature] = {
        used: count,
        limit: limit,
        percentage: limit > 0 ? (count / limit) * 100 : 0
      };
    }
    return summary;
  }
}