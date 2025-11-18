# 🔐 Supabase Configuration Guide

## 1. Enable Authentication Providers

Go to your Supabase Dashboard: https://supabase.com/dashboard/project/giuyocjmgwzfbkammehu/auth/providers

### Email/Password Auth
1. Click on "Email" provider
2. Enable "Enable Email Signup"
3. Configure email templates if needed

### GitHub OAuth (Recommended)
1. Click on "GitHub" provider
2. Enable it
3. You'll need:
   - Client ID (from GitHub OAuth App)
   - Client Secret (from GitHub OAuth App)
   - Redirect URL: `https://giuyocjmgwzfbkammehu.supabase.co/auth/v1/callback`

To create GitHub OAuth App:
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: `cldcde.cc`
   - Homepage URL: `https://cldcde.cc`
   - Authorization callback URL: `https://giuyocjmgwzfbkammehu.supabase.co/auth/v1/callback`

### Google OAuth (Optional)
Similar process with Google Cloud Console

## 2. Enable Row Level Security (RLS)

Go to: https://supabase.com/dashboard/project/giuyocjmgwzfbkammehu/editor

Run these commands to enable RLS on all tables:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
```

The policies are already created in the schema!

## 3. Configure Email Templates

Go to: https://supabase.com/dashboard/project/giuyocjmgwzfbkammehu/auth/email-templates

Customize:
- Confirmation Email
- Password Reset Email
- Magic Link Email

## 4. Set up Storage Buckets (Optional)

If you want file uploads:

1. Go to Storage section
2. Create buckets:
   - `avatars` - for user profile pictures
   - `extensions` - for extension files
   - `screenshots` - for extension screenshots

## 5. Configure CORS

The CORS is already configured in the Worker, but if needed:

1. Go to API Settings
2. Add allowed origins:
   - `https://cldcde.cc`
   - `https://api.cldcde.cc`
   - `http://localhost:3000` (for development)

## 6. Monitor Usage

Keep an eye on:
- Database size (500MB free)
- Auth users (10k free)
- Storage (1GB free)
- Bandwidth (2GB free)

## 7. API Configuration

Your API endpoints:
- REST API: `https://giuyocjmgwzfbkammehu.supabase.co/rest/v1`
- Auth API: `https://giuyocjmgwzfbkammehu.supabase.co/auth/v1`
- Realtime: `wss://giuyocjmgwzfbkammehu.supabase.co/realtime/v1`

## 🚀 That's it!

Your Supabase backend is now fully configured. The combination of:
- PostgreSQL database
- Built-in Auth
- Row Level Security
- Full-text search
- Realtime subscriptions

Gives you everything you need for a modern web app with just 2 services!