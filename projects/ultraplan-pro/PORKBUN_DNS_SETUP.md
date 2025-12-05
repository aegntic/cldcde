# Porkbun DNS Configuration for zkFlow.pro

## Quick Setup Guide

### 1. Login to Porkbun
Go to https://porkbun.com and login to your account.

### 2. Navigate to DNS Management
- Click on "Domain Management"
- Find `zkflow.pro`
- Click "DNS"

### 3. Delete Default Records
Remove any existing A, AAAA, or CNAME records for @ and www.

### 4. Add Vercel Records

#### A Record (Root Domain)
- **Type**: A
- **Host**: (leave blank for root)
- **Answer**: 76.76.21.21
- **TTL**: 600

#### CNAME Record (WWW)
- **Type**: CNAME
- **Host**: www
- **Answer**: cname.vercel-dns.com
- **TTL**: 600

### 5. Email Forwarding (Optional)
Set up email forwarding:
- **Type**: Email Forwarding
- **Mailbox**: support
- **Forward to**: support@aegntic.ai

### 6. Verify DNS Propagation
Check DNS propagation at: https://www.whatsmydns.net/
- Search for `zkflow.pro`
- Should show Vercel IP globally within 5-30 minutes

## Vercel Setup

### 1. Deploy to Vercel
```bash
cd website
npm install -g vercel
vercel --prod
```

### 2. Add Custom Domain
- Go to your Vercel dashboard
- Select your zkflow-pro project
- Go to Settings → Domains
- Add `zkflow.pro`
- Add `www.zkflow.pro`
- Vercel will automatically verify DNS

### 3. SSL Certificate
Vercel automatically provisions SSL certificates once DNS is verified.

## Troubleshooting

### DNS Not Resolving
- Wait up to 48 hours for full propagation
- Clear browser cache and try incognito mode
- Use `nslookup zkflow.pro` to verify

### SSL Issues
- Ensure DNS is fully propagated first
- Check Vercel dashboard for certificate status
- May take up to 24 hours after DNS verification

### Common Errors
- "Invalid Configuration": Double-check DNS records
- "Domain Already in Use": Contact Vercel support
- "SSL Pending": Wait for automatic provisioning

## Production Checklist

- [ ] DNS records added in Porkbun
- [ ] Vercel deployment successful
- [ ] Custom domain added in Vercel
- [ ] SSL certificate active
- [ ] Test zkflow.pro loads correctly
- [ ] Test www.zkflow.pro redirects properly
- [ ] Email forwarding working (if configured)
- [ ] Update Chrome extension with production URL

## Support

- Porkbun Support: support@porkbun.com
- Vercel Support: https://vercel.com/support
- Our Support: support@aegntic.ai