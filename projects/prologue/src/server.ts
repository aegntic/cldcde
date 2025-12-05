/**
 * Prologue Email Registration Server
 * Simple Express server for handling email registration with Resend
 */

import express from 'express';
import cors from 'cors';
import { emailService, EmailRegistration } from './email-registration';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Email registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, interests, source } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Create registration object
    const registration: EmailRegistration = {
      email: email.trim(),
      name: name?.trim() || undefined,
      source: source || 'website',
      timestamp: new Date(),
      interests: interests || []
    };

    // Register the email
    const result = await emailService.registerEmail(registration);

    // Return response
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get registration statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await emailService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Serve the email capture form
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/../email-capture.html');
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🎭 Prologue Email Registration API',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/register - Register email for early access',
      stats: 'GET /api/stats - Get registration statistics',
      form: 'GET /register - Email registration form',
      health: 'GET /health - Health check'
    }
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🎭 Prologue Email Registration Server running on port ${PORT}`);
    console.log(`📧 Registration form: http://localhost:${PORT}/register`);
    console.log(`🔗 API endpoint: http://localhost:${PORT}/api/register`);
    console.log(`📊 Stats endpoint: http://localhost:${PORT}/api/stats`);
    console.log(`❤️ Health check: http://localhost:${PORT}/health`);
  });
}

export default app;