# 🚀 Deploy Minimarket to minimarket.aramac.dev

This guide will help you deploy your minimarket application as a subdomain of your main website aramac.dev.

## 📋 Quick Start

### 1. Deploy to Vercel
```bash
# Option A: Use the deployment script
./scripts/deploy.sh

# Option B: Use npm scripts
pnpm run deploy

# Option C: Deploy manually
pnpm install
pnpm run build
vercel --prod
```

### 2. Configure DNS
Add this CNAME record to your domain provider:
```
Type: CNAME
Name: minimarket
Value: your-project.vercel.app
TTL: 3600
```

### 3. Verify in Vercel
- Go to Vercel Dashboard → Your Project → Settings → Domains
- Add: `minimarket.aramac.dev`
- Verify domain ownership

## 🌐 What You'll Get

- **Production URL**: `https://minimarket.aramac.dev`
- **Status Page**: `https://minimarket.aramac.dev/status`
- **Health Check**: `https://minimarket.aramac.dev/api/health`
- **Auto-deployments** on git push to main branch

## 🔧 Configuration Files

- `vercel.json` - Vercel deployment configuration
- `next.config.ts` - Next.js configuration with subdomain support
- `scripts/deploy.sh` - Automated deployment script
- `app/api/health/route.ts` - Health check endpoint
- `components/StatusPage.tsx` - Status monitoring component

## 📱 Features

- ✅ **Subdomain Support**: Properly configured for minimarket.aramac.dev
- ✅ **Health Monitoring**: Built-in health check and status page
- ✅ **Auto-deployment**: Deploys automatically on git push
- ✅ **SSL Certificate**: Automatic HTTPS with Vercel
- ✅ **Performance**: Optimized Next.js configuration
- ✅ **Security**: Content Security Policy and security headers

## 🚨 Troubleshooting

### Common Issues

1. **DNS Not Working**
   ```bash
   # Check DNS resolution
   dig minimarket.aramac.dev
   nslookup minimarket.aramac.dev
   ```

2. **Build Errors**
   - Check Vercel build logs
   - Ensure all environment variables are set
   - Run `pnpm run build` locally to test

3. **Domain Not Verified**
   - Check Vercel domain settings
   - Ensure DNS is properly configured
   - Wait for DNS propagation (up to 48 hours)

### Environment Variables

Make sure these are set in Vercel:
```bash
NEXT_PUBLIC_APP_URL=https://minimarket.aramac.dev
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CLERK_SECRET_KEY=your_clerk_secret
# ... other required vars
```

## 📊 Monitoring

- **Status Page**: `/status` - Real-time deployment status
- **Health API**: `/api/health` - JSON health check endpoint
- **Vercel Analytics**: Built-in performance monitoring
- **Logs**: Available in Vercel dashboard

## 🔄 Maintenance

- **Updates**: `pnpm update` to update dependencies
- **Redeploy**: Push to main branch or run `pnpm run deploy`
- **Monitoring**: Check `/status` page regularly
- **Logs**: Monitor Vercel deployment logs

## 📞 Support

If you need help:
1. Check the [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions
2. Review Vercel deployment logs
3. Test locally with `pnpm run dev`
4. Check DNS configuration with your domain provider

## 🎯 Next Steps

After successful deployment:
1. Test all functionality on the subdomain
2. Set up monitoring and alerts
3. Configure backup and recovery procedures
4. Document any custom configurations

---

**Happy Deploying! 🎉**

Your minimarket app will be available at: `https://minimarket.aramac.dev` 