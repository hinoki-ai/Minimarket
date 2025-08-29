# Deployment Guide: minimarket.aramac.dev

This guide will help you deploy your minimarket app as a subdomain of your main website aramac.dev.

## Prerequisites

- Vercel account connected to your project
- Access to your domain's DNS settings (aramac.dev)
- Node.js and pnpm installed

## Quick Deployment

1. **Deploy using the script:**
   ```bash
   ./scripts/deploy.sh
   ```

2. **Or deploy manually:**
   ```bash
   pnpm install
   pnpm run build
   vercel --prod
   ```

## DNS Configuration

After deployment, you need to configure your DNS to point `minimarket.aramac.dev` to your Vercel deployment:

### Option 1: CNAME Record (Recommended)
```
Type: CNAME
Name: minimarket
Value: your-project.vercel.app
TTL: 3600 (or default)
```

### Option 2: A Record (if CNAME doesn't work)
```
Type: A
Name: minimarket
Value: 76.76.19.76 (Vercel's IP)
TTL: 3600 (or default)
```

## Vercel Configuration

1. **Go to your Vercel dashboard**
2. **Select your minimarket project**
3. **Go to Settings → Domains**
4. **Add custom domain: `minimarket.aramac.dev`**
5. **Verify domain ownership**

## Environment Variables

Make sure these environment variables are set in Vercel:

```bash
NEXT_PUBLIC_APP_URL=https://minimarket.aramac.dev
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CLERK_SECRET_KEY=your_clerk_secret
# ... other required env vars
```

## Testing

After deployment and DNS configuration:

1. **Wait for DNS propagation** (can take up to 48 hours)
2. **Test the subdomain:**
   ```bash
   curl -I https://minimarket.aramac.dev
   ```
3. **Check SSL certificate** (should be automatic with Vercel)

## Troubleshooting

### Common Issues

1. **DNS not propagated:**
   - Use `dig minimarket.aramac.dev` to check DNS resolution
   - Wait longer for propagation

2. **SSL certificate issues:**
   - Vercel handles SSL automatically
   - Check domain verification in Vercel dashboard

3. **Build errors:**
   - Check build logs in Vercel
   - Ensure all environment variables are set

### Useful Commands

```bash
# Check DNS resolution
dig minimarket.aramac.dev
nslookup minimarket.aramac.dev

# Check SSL certificate
openssl s_client -connect minimarket.aramac.dev:443 -servername minimarket.aramac.dev

# Test deployment locally
pnpm run dev
```

## Maintenance

- **Auto-deployments:** Vercel automatically deploys on git push to main branch
- **Monitoring:** Check Vercel analytics and logs regularly
- **Updates:** Keep dependencies updated with `pnpm update`

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify DNS configuration
3. Ensure all environment variables are set
4. Check Next.js and Convex documentation 