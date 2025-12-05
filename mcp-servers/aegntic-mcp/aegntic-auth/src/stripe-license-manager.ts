import Stripe from 'stripe';
import { SupabaseAuthManager } from './supabase-client.js';

export class StripeLicenseManager {
  private stripe: Stripe | null = null;
  private mockMode: boolean;
  private authManager: SupabaseAuthManager;
  
  // Pricing configuration
  private readonly PRICES = {
    pro: {
      monthly: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
      yearly: process.env.STRIPE_PRO_PRICE_YEARLY_ID || 'price_pro_yearly'
    },
    enterprise: {
      monthly: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
      yearly: process.env.STRIPE_ENTERPRISE_PRICE_YEARLY_ID || 'price_enterprise_yearly'
    }
  };

  constructor(stripeKey?: string, authManager?: SupabaseAuthManager) {
    // Use the live key from environment
    const actualStripeKey = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') 
      ? process.env.STRIPE_SECRET_KEY 
      : (stripeKey || process.env.STRIPE_SECRET_KEY);
    
    this.mockMode = !actualStripeKey || process.env.MOCK_PAYMENT_SERVICE === "true";
    this.authManager = authManager || new SupabaseAuthManager(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    
    if (!this.mockMode && actualStripeKey) {
      this.stripe = new Stripe(actualStripeKey, {
        apiVersion: '2023-10-16',
        typescript: true
      });
    }
  }

  async verifyFeatureAccess(email: string, feature: string): Promise<boolean> {
    // Get user from database
    const user = await this.authManager.getUserByEmail(email);
    if (!user) return false;

    // Check tier-based access
    return this.checkTierAccess(user.tier, feature);
  }

  async createSubscription(data: {
    email: string;
    tier: 'pro' | 'enterprise';
    payment_method: string;
    billing_cycle?: 'monthly' | 'yearly';
  }): Promise<any> {
    const user = await this.authManager.getUserByEmail(data.email);
    if (!user) {
      throw new Error('User not found');
    }

    if (this.mockMode) {
      console.log(`📧 MOCK: Creating ${data.tier} subscription for ${data.email}`);
      
      // Update user tier in database
      await this.authManager.updateUserTier(data.email, data.tier);
      
      return {
        id: `sub_mock_${Date.now()}`,
        customer: `cus_mock_${Date.now()}`,
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        items: {
          data: [{
            price: {
              id: this.PRICES[data.tier][data.billing_cycle || 'monthly']
            }
          }]
        }
      };
    }

    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      // Create or get Stripe customer
      let customer: Stripe.Customer;
      if (user.stripe_customer_id) {
        customer = await this.stripe.customers.retrieve(user.stripe_customer_id) as Stripe.Customer;
      } else {
        customer = await this.stripe.customers.create({
          email: data.email,
          name: user.name,
          metadata: {
            user_id: user.id,
            tier: data.tier
          }
        });
        
        // Save customer ID
        await this.authManager.updateUser(data.email, {
          stripe_customer_id: customer.id
        });
      }

      // Attach payment method
      await this.stripe.paymentMethods.attach(data.payment_method, {
        customer: customer.id
      });

      // Set as default payment method
      await this.stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: data.payment_method
        }
      });

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: this.PRICES[data.tier][data.billing_cycle || 'monthly']
        }],
        metadata: {
          user_email: data.email,
          tier: data.tier
        }
      });

      // Update user tier and subscription info in database
      await this.authManager.createSubscription({
        user_id: user.id,
        stripe_subscription_id: subscription.id,
        tier: data.tier,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000)
      });

      await this.authManager.updateUserTier(data.email, data.tier);

      return subscription;
    } catch (error) {
      console.error('Stripe subscription error:', error);
      throw error;
    }
  }

  async cancelSubscription(email: string): Promise<void> {
    const user = await this.authManager.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const subscription = await this.authManager.getUserSubscription(user.id);
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    if (this.mockMode) {
      console.log(`📧 MOCK: Canceling subscription for ${email}`);
      await this.authManager.updateUserTier(email, 'free');
      return;
    }

    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      // Cancel at period end
      await this.stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true
      });

      // Update database
      await this.authManager.updateSubscriptionStatus(
        subscription.stripe_subscription_id,
        'canceled'
      );
    } catch (error) {
      console.error('Stripe cancellation error:', error);
      throw error;
    }
  }

  async updateSubscription(email: string, newTier: 'pro' | 'enterprise'): Promise<any> {
    const user = await this.authManager.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const subscription = await this.authManager.getUserSubscription(user.id);
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    if (this.mockMode) {
      console.log(`📧 MOCK: Updating subscription to ${newTier} for ${email}`);
      await this.authManager.updateUserTier(email, newTier);
      return { id: subscription.stripe_subscription_id, status: 'active' };
    }

    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      // Get current subscription
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      // Update subscription
      const updated = await this.stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: this.PRICES[newTier]['monthly']
          }],
          metadata: {
            tier: newTier
          }
        }
      );

      // Update database
      await this.authManager.updateUserTier(email, newTier);
      await this.authManager.updateSubscriptionTier(
        subscription.stripe_subscription_id,
        newTier
      );

      return updated;
    } catch (error) {
      console.error('Stripe update error:', error);
      throw error;
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<any> {
    if (this.mockMode) {
      return {
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_secret_${Date.now()}`,
        amount,
        currency
      };
    }

    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return await this.stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true
      }
    });
  }

  private checkTierAccess(tier: string, feature: string): boolean {
    const tierFeatures = {
      free: [
        'basic_image_generation',
        'basic_text_processing',
        'limited_api_access'
      ],
      pro: [
        'advanced_image_generation',
        'video_generation',
        'batch_processing',
        'custom_workflows',
        'api_priority',
        'all_free_features'
      ],
      enterprise: [
        'unlimited_access',
        'custom_models',
        'white_label',
        'dedicated_support',
        'all_features'
      ]
    };

    if (tier === 'enterprise') return true;
    
    if (tier === 'pro') {
      return tierFeatures.pro.includes(feature) || 
             tierFeatures.pro.includes('all_free_features') && 
             tierFeatures.free.includes(feature);
    }
    
    return tierFeatures.free.includes(feature);
  }

  async handleWebhook(signature: string, payload: string): Promise<void> {
    if (!this.stripe || this.mockMode) {
      console.log('📧 MOCK: Webhook received');
      return;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
      }
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const email = subscription.metadata.user_email;
    if (!email) return;

    await this.authManager.updateSubscriptionStatus(
      subscription.id,
      subscription.status
    );

    if (subscription.status === 'active') {
      const tier = subscription.metadata.tier as 'pro' | 'enterprise';
      await this.authManager.updateUserTier(email, tier);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const email = subscription.metadata.user_email;
    if (!email) return;

    await this.authManager.updateUserTier(email, 'free');
    await this.authManager.updateSubscriptionStatus(
      subscription.id,
      'canceled'
    );
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    // Log payment failure for follow-up
    console.error(`Payment failed for customer: ${invoice.customer}`);
  }
}