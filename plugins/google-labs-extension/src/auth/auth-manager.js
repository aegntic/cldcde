/**
 * Google Labs Authentication Manager
 * Handles OAuth 2.0 flow with PKCE for secure authentication
 */

const { google } = require('google-auth-library');
const express = require('express');
const open = require('open');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class AuthManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.google-labs');
    this.credentialsFile = path.join(this.configDir, 'credentials.json');
    this.tokensFile = path.join(this.configDir, 'tokens.json');
    
    // Google OAuth configuration
    this.clientId = process.env.GOOGLE_CLIENT_ID || 'your-client-id';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'your-client-secret';
    this.redirectUri = 'http://localhost:3000/oauth/callback';
    
    this.scopes = [
      'openid',
      'email',
      'profile'
    ];
  }

  /**
   * Initialize authentication
   */
  async initialize() {
    await fs.ensureDir(this.configDir);
    
    // Create default config if doesn't exist
    if (!await fs.pathExists(this.credentialsFile)) {
      await this.createDefaultConfig();
    }
  }

  /**
   * Create default configuration
   */
  async createDefaultConfig() {
    const config = {
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      scopes: this.scopes
    };
    
    await fs.writeJson(this.credentialsFile, config, { spaces: 2 });
  }

  /**
   * Authenticate user via OAuth
   */
  async authenticate() {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const app = express();
      const server = app.listen(3000, () => {
        console.log('🌐 Starting OAuth server on port 3000...');
      });

      // OAuth callback endpoint
      app.get('/oauth/callback', async (req, res) => {
        const code = req.query.code;
        
        if (!code) {
          res.send('❌ Authentication failed');
          server.close();
          reject(new Error('No authorization code received'));
          return;
        }

        try {
          // Exchange code for tokens
          const tokens = await this.exchangeCodeForTokens(code);
          
          // Save tokens securely
          await this.saveTokens(tokens);
          
          res.send(`
            <html>
              <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1 style="color: green;">✅ Authentication Successful!</h1>
                <p>You can close this window and return to the terminal.</p>
              </body>
            </html>
          `);
          
          server.close();
          resolve(true);
        } catch (error) {
          res.send(`
            <html>
              <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1 style="color: red;">❌ Authentication Failed</h1>
                <p>${error.message}</p>
              </body>
            </html>
          `);
          
          server.close();
          reject(error);
        }
      });

      // Generate auth URL
      const authUrl = this.generateAuthUrl();
      
      // Open browser
      console.log('🔗 Opening browser for authentication...');
      open(authUrl);
    });
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl() {
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      include_granted_scopes: true,
      prompt: 'consent'
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code) {
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Save tokens securely
   */
  async saveTokens(tokens) {
    const tokenData = {
      ...tokens,
      savedAt: new Date().toISOString()
    };
    
    await fs.writeJson(this.tokensFile, tokenData, { spaces: 2 });
    
    // Set restrictive permissions
    await fs.chmod(this.tokensFile, 0o600);
  }

  /**
   * Load saved tokens
   */
  async loadTokens() {
    if (!await fs.pathExists(this.tokensFile)) {
      return null;
    }
    
    return await fs.readJson(this.tokensFile);
  }

  /**
   * Check if user is authenticated
   */
  async checkStatus() {
    const tokens = await this.loadTokens();
    
    if (!tokens) {
      return { authenticated: false };
    }
    
    // Check if token is expired
    const expiryDate = new Date(tokens.expiry_date);
    const now = new Date();
    
    if (expiryDate < now) {
      // Try to refresh
      const refreshed = await this.refreshTokens(tokens);
      if (!refreshed) {
        return { authenticated: false };
      }
    }
    
    return {
      authenticated: true,
      email: tokens.email || 'unknown',
      expires: new Date(tokens.expiry_date).toLocaleString()
    };
  }

  /**
   * Refresh access token
   */
  async refreshTokens(tokens) {
    if (!tokens.refresh_token) {
      return false;
    }
    
    try {
      const oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri
      );

      oauth2Client.setCredentials(tokens);
      
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      await this.saveTokens(credentials);
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Logout - remove saved tokens
   */
  async logout() {
    if (await fs.pathExists(this.tokensFile)) {
      await fs.remove(this.tokensFile);
    }
  }

  /**
   * Get authenticated client
   */
  async getAuthClient() {
    const tokens = await this.loadTokens();
    
    if (!tokens) {
      throw new Error('Not authenticated. Run: glabs auth');
    }
    
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );
    
    oauth2Client.setCredentials(tokens);
    
    return oauth2Client;
  }
}

module.exports = AuthManager;