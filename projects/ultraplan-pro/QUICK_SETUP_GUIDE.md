# zkFlow.pro Quick Setup Guide

## 🚀 15-Minute Setup

### 1. DNS Configuration (2 minutes)
```bash
# Go to porkbun.com → zkflow.pro → DNS
# Add these records:
A Record: @ → 76.76.21.21
CNAME: www → cname.vercel-dns.com
```

### 2. Supabase Setup (5 minutes)
1. Go to [supabase.com](https://supabase.com)
2. Create new project "zkflow-pro"
3. Go to SQL Editor
4. Paste contents of `supabase-schema.sql`
5. Click "Run"
6. Copy API keys from Settings → API

### 3. Stripe Setup (5 minutes)
1. Go to [stripe.com](https://stripe.com)
2. Create products:
   - **zkFlow Professional**: $9.99/month (monthly_professional)
   - **zkFlow Team**: $24.99/month (monthly_team)
3. Add webhook endpoint:
   - URL: `https://zkflow.pro/api/webhooks/stripe`
   - Events: All customer & subscription events
4. Copy API keys

### 4. Deploy Website (3 minutes)
```bash
cd ~/ae-co-system/zkFlow.pro
./deploy-website.sh
```

### 5. Environment Variables
In Vercel Dashboard → zkflow-pro → Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=[from supabase]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from supabase]
SUPABASE_SERVICE_KEY=[from supabase]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[from stripe]
STRIPE_SECRET_KEY=[from stripe]
STRIPE_WEBHOOK_SECRET=[from stripe webhook]
NEXT_PUBLIC_APP_URL=https://zkflow.pro
NEXT_PUBLIC_FREE_TRIAL_DAYS=7
```

## ✅ Verification Checklist

- [ ] DNS resolves to Vercel (check with `nslookup zkflow.pro`)
- [ ] Website loads at https://zkflow.pro
- [ ] SSL certificate active (padlock in browser)
- [ ] Supabase tables created
- [ ] Stripe products visible in dashboard
- [ ] Environment variables set in Vercel

## 🎯 Launch Tasks

1. **Submit Extension to Chrome Store**
   - Package extension: `cd extension && ./build.sh`
   - Upload to Chrome Developer Dashboard
   - Pay $5 one-time fee

2. **Test Payment Flow**
   - Use Stripe test card: 4242 4242 4242 4242
   - Verify webhook receives events
   - Check license key generation

3. **Marketing Launch**
   - Product Hunt submission ready
   - Twitter/X announcement drafted
   - Reddit posts prepared

## 🆘 Troubleshooting

**DNS not working?**
- Wait up to 48 hours for propagation
- Try clearing DNS cache: `sudo dscacheutil -flushcache`

**Vercel deployment failed?**
- Check build logs in Vercel dashboard
- Ensure all dependencies in package.json
- Try `vercel --force`

**Stripe webhooks failing?**
- Verify webhook secret is correct
- Check endpoint URL includes https://
- Use Stripe CLI for local testing

## 📞 Support

- Porkbun: support@porkbun.com
- Vercel: vercel.com/support
- Supabase: supabase.com/support
- Our team: support@aegntic.ai