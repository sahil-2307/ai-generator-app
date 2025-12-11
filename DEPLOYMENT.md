# Deployment Guide

## Environment Variables for Production

When deploying to Vercel, you'll need to set these environment variables in your Vercel project settings:

### Required Environment Variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Google Veo API
VEO_API_KEY=your_google_veo_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://vibhxftmmqlervxmatgr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cashfree Payment Gateway (Use PROD values for production)
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_WEBHOOK_SECRET=your_webhook_secret

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NODE_ENV=production

# AWS S3 Storage (Optional - for storing generated content)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## Deployment Steps

### 1. GitHub Repository Setup
```bash
# If you haven't authenticated with GitHub CLI:
gh auth login

# Create repository and push:
gh repo create ai-generator-app --public --source=. --remote=origin --push
```

### 2. Vercel Deployment

**Option A: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel

# Follow the prompts:
# - Link to existing project: N
# - Project name: ai-generator-app
# - Directory: ./
# - Override settings: N
```

**Option B: Using Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 3. Environment Variables Setup in Vercel

1. Go to your project dashboard on Vercel
2. Navigate to Settings → Environment Variables
3. Add each variable from the list above
4. **Important**: Set `NODE_ENV=production` and update `NEXT_PUBLIC_APP_URL` to your Vercel domain

### 4. Database Setup

Ensure your Supabase database is properly configured:
- Tables created (users, pricing_plans)
- Row Level Security (RLS) policies enabled
- Service role has proper permissions

### 5. Payment Gateway Configuration

For production, update Cashfree settings:
- Switch to production API keys
- Update webhook URLs to point to your Vercel domain
- Test payment flows

## Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] Authentication works (sign up/sign in)
- [ ] Text generation functions
- [ ] Image generation functions
- [ ] Video generation functions
- [ ] Credit system updates properly
- [ ] Payment integration works
- [ ] All environment variables are set
- [ ] HTTPS is working
- [ ] Domain is correctly configured

## Troubleshooting

### Common Issues:

1. **Environment Variables Not Loading**
   - Ensure all variables are set in Vercel dashboard
   - Check variable names match exactly (case-sensitive)
   - Redeploy after adding variables

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Ensure service role key has proper permissions

3. **API Limits**
   - Monitor OpenAI API usage
   - Check Google Veo API quotas
   - Verify Cashfree API limits

4. **Build Failures**
   - Check for TypeScript errors
   - Ensure all dependencies are in package.json
   - Verify Next.js configuration

## Security Notes

- Never commit environment variables to Git
- Use Vercel's environment variable encryption
- Regularly rotate API keys
- Monitor for unusual usage patterns
- Set up proper CORS policies