import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';

export interface User {
  id: string;
  email: string;
  name: string;
  organization?: string;
  tier: 'free' | 'pro' | 'enterprise';
  api_key: string;
  stripe_customer_id?: string;
  created_at: Date;
}

export class SupabaseAuthManager {
  private supabase: any;
  private jwtSecret: string;

  constructor(supabaseUrl: string, supabaseKey: string, jwtSecret: string = 'aegntic-secret') {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.jwtSecret = jwtSecret;
  }

  async registerUser(data: {
    email: string;
    name: string;
    organization?: string;
    tier?: 'free' | 'pro' | 'enterprise';
  }): Promise<User> {
    // Check if user exists
    const { data: existingUser } = await this.supabase
      .from('aegntic_users')
      .select('*')
      .eq('email', data.email)
      .single();

    if (existingUser) {
      return existingUser;
    }

    // Generate API key
    const apiKey = this.generateApiKey(data.email);

    // Create new user
    const newUser = {
      email: data.email,
      name: data.name,
      organization: data.organization,
      tier: data.tier || 'free',
      api_key: apiKey
    };

    const { data: user, error } = await this.supabase
      .from('aegntic_users')
      .insert(newUser)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to register user: ${error.message}`);
    }

    return user;
  }

  async getUserStatus(email: string): Promise<any> {
    // Get user
    const { data: user, error } = await this.supabase
      .from('aegntic_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return { registered: false, email };
    }

    // Get usage summary
    const { data: usage } = await this.supabase
      .rpc('get_user_usage_summary', { user_email: email });

    // Get active subscription
    const { data: subscription } = await this.supabase
      .from('aegntic_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    return {
      registered: true,
      ...user,
      usage_summary: usage || [],
      active_subscription: subscription
    };
  }

  async trackUsage(data: {
    email: string;
    feature: string;
    count?: number;
    metadata?: any;
  }): Promise<{ total: number; limit: number; remaining: number }> {
    // Get user
    const { data: user } = await this.supabase
      .from('aegntic_users')
      .select('id, tier')
      .eq('email', data.email)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Track usage
    const { error } = await this.supabase
      .from('aegntic_usage')
      .insert({
        user_id: user.id,
        feature: data.feature,
        count: data.count || 1,
        metadata: data.metadata || {}
      });

    if (error) {
      throw new Error(`Failed to track usage: ${error.message}`);
    }

    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyUsage } = await this.supabase
      .from('aegntic_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('feature', data.feature)
      .gte('timestamp', startOfMonth.toISOString());

    const total = monthlyUsage?.reduce((sum, row) => sum + row.count, 0) || 0;
    const limit = this.getFeatureLimit(user.tier, data.feature);
    
    return {
      total,
      limit,
      remaining: limit === -1 ? -1 : Math.max(0, limit - total)
    };
  }

  async createSubscription(data: {
    email: string;
    tier: 'pro' | 'enterprise';
    stripe_subscription_id?: string;
    stripe_price_id?: string;
  }): Promise<any> {
    // Get user
    const { data: user } = await this.supabase
      .from('aegntic_users')
      .select('id')
      .eq('email', data.email)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Create subscription
    const subscription = {
      id: `sub_${Date.now()}`,
      user_id: user.id,
      tier: data.tier,
      status: 'active',
      stripe_subscription_id: data.stripe_subscription_id,
      stripe_price_id: data.stripe_price_id,
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    const { data: newSub, error } = await this.supabase
      .from('aegntic_subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    // Update user tier
    await this.supabase
      .from('aegntic_users')
      .update({ tier: data.tier })
      .eq('id', user.id);

    return newSub;
  }

  async logEmail(data: {
    email: string;
    email_type: string;
    subject: string;
    metadata?: any;
  }): Promise<void> {
    const { data: user } = await this.supabase
      .from('aegntic_users')
      .select('id')
      .eq('email', data.email)
      .single();

    if (user) {
      await this.supabase
        .from('aegntic_email_log')
        .insert({
          user_id: user.id,
          email_type: data.email_type,
          subject: data.subject,
          metadata: data.metadata || {}
        });
    }
  }

  private generateApiKey(email: string): string {
    return jwt.sign(
      { email, type: 'api_key', iat: Date.now() },
      this.jwtSecret,
      { expiresIn: '1y' }
    );
  }

  private getFeatureLimit(tier: string, feature: string): number {
    const limits: any = {
      free: {
        image_generation: 100,
        logo_generation: 25,
        video_generation: 0,
        background_removal: 50,
        api_calls: 1000
      },
      pro: {
        image_generation: 5000,
        logo_generation: 1000,
        video_generation: 100,
        background_removal: 2000,
        api_calls: 50000
      },
      enterprise: {
        image_generation: -1,
        logo_generation: -1,
        video_generation: -1,
        background_removal: -1,
        api_calls: -1
      }
    };

    return limits[tier]?.[feature] || 0;
  }
}