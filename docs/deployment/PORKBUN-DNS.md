# Porkbun DNS Configuration for cldcde.cc

## Step 1: Log into Porkbun
Go to https://porkbun.com and log into your account

## Step 2: Find Your Domain
Click on "Domain Management" and find `cldcde.cc`

## Step 3: Configure DNS Records

You have two options:

### Option A: Use Cloudflare's Nameservers (Recommended)
This gives you full Cloudflare features including DDoS protection, caching, and analytics.

1. In Cloudflare, add your domain:
   - Go to https://dash.cloudflare.com/548a933e3812ca9cd840b787ca7e1eb1
   - Click "Add a Site"
   - Enter `cldcde.cc`
   - Choose the Free plan
   - Cloudflare will give you 2 nameservers like:
     - `xxx.ns.cloudflare.com`
     - `yyy.ns.cloudflare.com`

2. In Porkbun:
   - Click "NS" (Nameservers) for your domain
   - Remove Porkbun's nameservers
   - Add Cloudflare's nameservers
   - Save changes

3. Wait for propagation (5 minutes to 48 hours, usually within 1 hour)

### Option B: Direct DNS Records (Faster but less features)
If you want to keep using Porkbun's DNS:

1. In Porkbun DNS settings, add these records:

For the frontend (cldcde.cc):
- Type: CNAME
- Host: (leave blank for root domain)
- Answer: cldcde.pages.dev
- TTL: 600

For www redirect:
- Type: CNAME
- Host: www
- Answer: cldcde.pages.dev
- TTL: 600

For the API:
- Type: CNAME
- Host: api
- Answer: cldcde-api.aegntic.workers.dev
- TTL: 600

## Step 4: Verify in Cloudflare

After DNS propagates:
1. Go back to Cloudflare Workers/Pages settings
2. The custom domain should show as "Active"
3. SSL certificates will be automatically provisioned

## DNS Propagation Check

You can check if DNS has propagated using:
- https://www.whatsmydns.net/
- Or run: `dig cldcde.cc`

## Troubleshooting

If custom domains show errors in Cloudflare:
1. Make sure DNS has propagated (can take up to 48 hours)
2. Ensure no conflicting records exist
3. Try removing and re-adding the custom domain

## Final Result

Once configured:
- https://cldcde.cc → Your frontend
- https://api.cldcde.cc → Your API
- Both with automatic SSL certificates!