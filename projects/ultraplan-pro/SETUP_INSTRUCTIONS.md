# 🚀 zkFlow.pro Services Setup Instructions

## Option 1: Automated API Setup (5 minutes)

### Get API Keys:
1. **Supabase**: Go to https://supabase.com/dashboard/account/tokens
   - Click "Generate new token"
   - Copy the token

2. **Stripe**: Go to https://dashboard.stripe.com/apikeys  
   - Copy "Secret key" (starts with sk_test_ or sk_live_)

### Run Automated Setup:
```bash
cd /home/tabs/ae-co-system/zkFlow.pro

# Set environment variables
export SUPABASE_ACCESS_TOKEN="your_supabase_token"
export STRIPE_SECRET_KEY="sk_test_your_stripe_key"

# Run automated setup
./setup-services.sh
```

**This will automatically:**
- ✅ Create Supabase project
- ✅ Run database schema  
- ✅ Create Stripe products ($9.99 & $24.99)
- ✅ Set up webhook endpoints
- ✅ Generate all environment variables

## Option 2: Manual Setup (15 minutes)

### Supabase Manual Setup:
1. Go to https://supabase.com
2. Create new project "zkflow-pro-prod"
3. Go to SQL Editor
4. Paste contents of `supabase-schema.sql`
5. Click "Run"
6. Copy API keys from Settings → API

### Stripe Manual Setup:
1. Go to https://stripe.com
2. Create products:
   - **zkFlow Professional**: $9.99/month
   - **zkFlow Team**: $24.99/month
3. Add webhook: `https://zkflow.pro/api/webhooks/stripe`
4. Copy API keys

## Environment Variables for Vercel

Add these to Vercel dashboard (vercel.com/dashboard):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret
NEXT_PUBLIC_APP_URL=https://zkflow.pro
NEXT_PUBLIC_FREE_TRIAL_DAYS=7
```

## Current Status

✅ **GitHub Repository**: https://github.com/aegntic/zkflow-pro  
✅ **Auto-Deployment**: GitHub Actions configured  
✅ **Domain**: zkflow.pro (DNS configured)  
✅ **Website**: Building automatically via GitHub Actions  

## Next: Chrome Extension Submission

After services are set up:
1. Package extension: `cd extension && ./build.sh`
2. Submit to Chrome Web Store
3. Test complete payment flow

**Choose your setup method and let's get zkFlow.pro live! 🚀**