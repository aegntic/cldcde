# GitHub Auto-Deploy Setup for zkFlow.pro

## 🚀 Quick Setup (5 minutes)

### 1. Create GitHub Repository
```bash
# On GitHub.com:
# 1. Go to github.com/new
# 2. Repository name: zkflow-pro
# 3. Set to Public
# 4. Click "Create repository"
```

### 2. Push Code to GitHub
```bash
cd /home/tabs/ae-co-system/zkFlow.pro
git add .
git commit -m "Initial zkFlow.pro release

🎯 Features:
- Chrome extension for form automation
- Next.js website with Stripe integration
- Supabase user management
- Free 7-day trial promotion

🚀 Generated with Claude Code"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/zkflow-pro.git
git push -u origin main
```

### 3. Connect to Vercel (One-time setup)
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Connect your GitHub account
4. Select `zkflow-pro` repository
5. **Important**: Set root directory to `website/`
6. Click Deploy

### 4. Configure GitHub Secrets
In your GitHub repository settings → Secrets and variables → Actions:

Add these secrets:
```
VERCEL_TOKEN: [Get from vercel.com/account/tokens]
VERCEL_ORG_ID: [Get from vercel.com/account/team-id]  
VERCEL_PROJECT_ID: [Get from project settings]
```

### 5. Set Environment Variables in Vercel
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-key
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret
NEXT_PUBLIC_APP_URL=https://zkflow.pro
NEXT_PUBLIC_FREE_TRIAL_DAYS=7
```

## ✅ Auto-Deploy Workflow

Once setup is complete:
1. **Push to GitHub** → Automatic deployment to Vercel
2. **Pull Request** → Preview deployment
3. **Merge to main** → Production deployment

## 🎯 Benefits
- Zero manual deployment steps
- Automatic builds on every commit
- Preview deployments for testing
- Rollback capability
- Build logs and error tracking

## 🔧 Troubleshooting

**Build fails?**
- Check GitHub Actions logs
- Verify all environment variables are set
- Ensure `website/` directory structure is correct

**Deployment not triggered?**
- Verify webhook is configured in GitHub
- Check GitHub Actions are enabled
- Confirm secrets are properly set

**Domain not working?**
- DNS should already be configured to point to Vercel
- Check Vercel dashboard for domain status
- May take up to 48 hours for full propagation

## 📞 Support
- GitHub Issues: Create issue in repository
- Vercel Support: vercel.com/support
- Our team: support@aegntic.ai

The site will be live at **https://zkflow.pro** immediately after first successful deployment!