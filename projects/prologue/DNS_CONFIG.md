# DNS Configuration for logue.pro
# Add these records to your DNS provider (Porkbun, Cloudflare, etc.)

## GitHub Pages A Records (Root Domain)
# Replace these existing A records with GitHub Pages IPs:
TYPE: A
NAME: @
VALUE: 185.199.108.153
TTL: 3600

TYPE: A
NAME: @
VALUE: 185.199.109.153
TTL: 3600

TYPE: A
NAME: @
VALUE: 185.199.110.153
TTL: 3600

TYPE: A
NAME: @
VALUE: 185.199.111.153
TTL: 3600

## WWW Subdomain (CNAME)
TYPE: CNAME
NAME: www
VALUE: aegntic.github.io
TTL: 3600

## Email Configuration (Optional)
# For email forwarding with forwardemail.net
TYPE: MX
NAME: @
VALUE: mx1.forwardemail.net
PRIORITY: 10
TTL: 3600

TYPE: MX
NAME: @
VALUE: mx2.forwardemail.net
PRIORITY: 20
TTL: 3600

## SPF Record (Email Security)
TYPE: TXT
NAME: @
VALUE: "v=spf1 a mx include:forwardemail.net ~all"
TTL: 3600

## DMARC Record (Email Security)
TYPE: TXT
NAME: _dmarc
VALUE: "v=DMARC1; p=none; rua=mailto:dmarc@logue.pro"
TTL: 3600

## GitHub Domain Verification (Temporary)
# After setting up the above records, GitHub may provide a TXT record
# for domain verification. Add it to your DNS provider.

## Configuration Instructions:

### Porkbun Manual Setup:
1. Log in to porkbun.com
2. Go to Domain Management -> logue.pro
3. Delete existing A, CNAME, MX, and TXT records
4. Add the 4 GitHub Pages A records above
5. Add the www CNAME record pointing to aegntic.github.io
6. Configure email records if needed
7. Save changes and wait for DNS propagation (2-24 hours)

### Alternative: Use Porkbun API Script
Set your credentials and run:
export PORKBUN_API_KEY=your_api_key
export PORKBUN_SECRET_KEY=your_secret_key
node scripts/porkbun-dns.js configure

### Verification:
After DNS configuration, verify:
1. DNS propagation: https://dnschecker.org
2. Website access: https://logue.pro
3. GitHub Pages status: gh api repos/aegntic/prologue/pages

### Notes:
- DNS changes may take 2-24 hours to propagate globally
- HTTPS will be automatically configured by GitHub Pages
- Email configuration is optional for basic website functionality