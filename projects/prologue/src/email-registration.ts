/**
 * Email Registration Service
 * Handles email collection for Prologue early access using Resend
 */

export interface EmailRegistration {
  email: string;
  name?: string;
  source: string;
  timestamp: Date;
  interests?: string[];
}

export interface EmailRegistrationResponse {
  success: boolean;
  message: string;
  id?: string;
}

export class EmailRegistrationService {
  private resendApiKey: string;
  private fromEmail: string;
  private fromName: string;
  private adminEmail: string;

  constructor() {
    // Initialize with environment variables
    this.resendApiKey = process.env.RESEND_API_KEY || 're_your_resend_api_key';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@logue.pro';
    this.fromName = process.env.FROM_NAME || 'Prologue Team';
    this.adminEmail = process.env.ADMIN_EMAIL || 'team@logue.pro';
  }

  /**
   * Register email for early access
   */
  async registerEmail(registration: EmailRegistration): Promise<EmailRegistrationResponse> {
    try {
      // Validate email
      if (!this.isValidEmail(registration.email)) {
        return {
          success: false,
          message: 'Invalid email address'
        };
      }

      // Check for duplicate registration
      const isDuplicate = await this.checkDuplicate(registration.email);
      if (isDuplicate) {
        return {
          success: false,
          message: 'This email is already registered for early access'
        };
      }

      // Send confirmation to user
      await this.sendConfirmationEmail(registration);

      // Send notification to admin
      await this.sendAdminNotification(registration);

      // Store registration (in production, this would save to a database)
      await this.storeRegistration(registration);

      return {
        success: true,
        message: 'Successfully registered for early access! Check your email for confirmation.',
        id: this.generateId()
      };

    } catch (error) {
      console.error('Email registration failed:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again later.'
      };
    }
  }

  /**
   * Send confirmation email to user
   */
  private async sendConfirmationEmail(registration: EmailRegistration): Promise<void> {
    const emailContent = this.generateConfirmationEmail(registration);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [registration.email],
        subject: '🎭 Welcome to Prologue - Your Creative Journey Begins!',
        html: emailContent
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send confirmation email: ${response.statusText}`);
    }
  }

  /**
   * Send notification to admin team
   */
  private async sendAdminNotification(registration: EmailRegistration): Promise<void> {
    const notificationContent = this.generateAdminNotification(registration);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [this.adminEmail],
        subject: `🎉 New Prologue Early Access Registration: ${registration.email}`,
        html: notificationContent
      })
    });

    if (!response.ok) {
      console.warn(`Failed to send admin notification: ${response.statusText}`);
    }
  }

  /**
   * Generate confirmation email content
   */
  private generateConfirmationEmail(registration: EmailRegistration): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Prologue</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: bold; color: #6366f1; margin-bottom: 10px; }
        .welcome { font-size: 24px; font-weight: 600; margin-bottom: 20px; }
        .message { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .features { margin: 30px 0; }
        .feature { display: flex; align-items: center; margin: 15px 0; }
        .feature-icon { font-size: 20px; margin-right: 10px; }
        .cta { background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎭 Prologue</div>
            <h1 class="welcome">Welcome to Your Creative Revolution!</h1>
        </div>

        <div class="message">
            <p>Hey${registration.name ? ' ' + registration.name : ''}!</p>
            <p>You've successfully secured your spot in the Prologue early access program! 🎉</p>
            <p>We're building something extraordinary - the world's first AI-powered creative framework that will transform how you bring ideas to life.</p>
        </div>

        <div class="features">
            <h3>What to Expect:</h3>
            <div class="feature">
                <span class="feature-icon">🤖</span>
                <span><strong>6 Specialized AI Agents</strong> working as your creative team</span>
            </div>
            <div class="feature">
                <span class="feature-icon">⚡</span>
                <span><strong>Lightning-Fast Development</strong> from idea to working prototype</span>
            </div>
            <div class="feature">
                <span class="feature-icon">🎨</span>
                <span><strong>Multi-Disciplinary Creation</strong> - websites, games, art, apps, and more</span>
            </div>
            <div class="feature">
                <span class="feature-icon">🌐</span>
                <span><strong>Cross-Platform Excellence</strong> with one-click deployment</span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="https://logue.pro" class="cta">Visit Prologue</a>
        </div>

        <div class="message">
            <p><strong>What's Next?</strong></p>
            <ul>
                <li>We'll send you updates as we approach launch</li>
                <li>You'll be among the first to get access to the beta</li>
                <li>Exclusive early-bird pricing and bonuses</li>
                <li>Invitation to our private Discord community</li>
            </ul>
        </div>

        <div class="footer">
            <p>Questions? Reply to this email or contact us at team@logue.pro</p>
            <p>You're receiving this email because you signed up for Prologue early access.</p>
            <p>© 2024 Prologue by AEGNTIC.ai. Begin Your Story.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate admin notification content
   */
  private generateAdminNotification(registration: EmailRegistration): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New Prologue Registration</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1;">🎉 New Early Access Registration!</h2>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${registration.email}</p>
            ${registration.name ? `<p><strong>Name:</strong> ${registration.name}</p>` : ''}
            <p><strong>Source:</strong> ${registration.source}</p>
            <p><strong>Timestamp:</strong> ${registration.timestamp.toISOString()}</p>
            ${registration.interests ? `<p><strong>Interests:</strong> ${registration.interests.join(', ')}</p>` : ''}
        </div>

        <p>This is an automated notification from the Prologue email registration system.</p>

        <div style="margin-top: 30px; padding: 20px; background: #6366f1; color: white; border-radius: 8px;">
            <h3>📊 Registration Stats</h3>
            <p>Total registrations today: <strong>Update with database query</strong></p>
            <p>This week: <strong>Update with database query</strong></p>
            <p>All time: <strong>Update with database query</strong></p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Store registration (in production, save to database)
   */
  private async storeRegistration(registration: EmailRegistration): Promise<void> {
    // For now, log to console
    console.log('Storing registration:', registration);

    // In production, this would save to a database like:
    // await db.collection('registrations').insertOne(registration);

    // For demo purposes, you could also append to a local file:
    const fs = require('fs').promises;
    try {
      await fs.appendFile(
        './registrations.log',
        `${JSON.stringify(registration)}\n`,
        'utf8'
      );
    } catch (error) {
      console.warn('Failed to store registration locally:', error);
    }
  }

  /**
   * Check for duplicate registration
   */
  private async checkDuplicate(email: string): Promise<boolean> {
    // In production, query database:
    // const existing = await db.collection('registrations').findOne({ email });
    // return !!existing;

    // For demo, return false (no duplicates)
    return false;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate unique ID for registration
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get registration statistics
   */
  async getStats(): Promise<{
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  }> {
    // In production, query database for real stats
    // For now, return mock data
    return {
      total: 147,
      today: 12,
      thisWeek: 68,
      thisMonth: 147
    };
  }
}

// Export singleton instance
export const emailService = new EmailRegistrationService();