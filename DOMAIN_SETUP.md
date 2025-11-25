# Domain Setup Guide for halalzi.com

This guide explains how to properly configure your custom domain `halalzi.com` for the HealthPlus Pharmacy application.

## Overview

The application has been updated to support custom domains through environment variables. All hardcoded domain references have been removed and replaced with dynamic configuration.

## Changes Made

### 1. Environment Variables

Added support for the following environment variables:

- `NEXT_PUBLIC_SITE_URL` - Base URL for canonical tags, sitemaps, and absolute URLs
- `AUTH_TRUST_HOST` - Allows NextAuth v5 to automatically detect the host from the request

### 2. Code Updates

- **app/layout.tsx**: Added `metadataBase` using `NEXT_PUBLIC_SITE_URL` for proper canonical URLs and Open Graph tags
- **app/sitemap.ts**: Updated to use `NEXT_PUBLIC_SITE_URL` instead of hardcoded domain
- **.env.example**: Added documentation for domain-related environment variables

## Vercel Configuration

### Step 1: Add www Subdomain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter `www.halalzi.com`
4. Follow the DNS configuration instructions

### Step 2: Set Primary Domain

1. In the Domains section, find `halalzi.com`
2. Click the three dots menu → "Set as Primary Domain"
3. This ensures all traffic is directed to the canonical domain

### Step 3: Configure Redirect

1. Decide on your canonical domain:
   - **Option A**: `halalzi.com` (without www) - Recommended
   - **Option B**: `www.halalzi.com` (with www)

2. Set up automatic redirect:
   - If you chose Option A: Vercel will automatically redirect `www.halalzi.com` → `halalzi.com`
   - If you chose Option B: Vercel will automatically redirect `halalzi.com` → `www.halalzi.com`

### Step 4: Configure Environment Variables

Add the following environment variables in Vercel:

**Production Environment:**

```bash
# Base URL (use your canonical domain)
NEXT_PUBLIC_SITE_URL="https://halalzi.com"

# NextAuth URL (use your canonical domain)
NEXTAUTH_URL="https://halalzi.com"

# Trust host header for NextAuth v5
AUTH_TRUST_HOST="true"

# Your existing variables
NEXTAUTH_SECRET="your-production-secret"
DATABASE_URL="your-production-database-url"
# ... other variables
```

**Preview Environment (Optional):**

```bash
# For preview deployments, you can leave NEXTAUTH_URL unset
# and rely on AUTH_TRUST_HOST to auto-detect the domain
AUTH_TRUST_HOST="true"

# Or set a specific preview URL
NEXT_PUBLIC_SITE_URL="https://your-preview-domain.vercel.app"
```

### Step 5: Redeploy

After adding environment variables:
1. Go to Deployments tab
2. Find the latest deployment
3. Click the three dots menu → "Redeploy"
4. Wait for deployment to complete

## DNS Configuration

If you haven't already configured DNS, add these records at your domain registrar:

### For Apex Domain (halalzi.com)

**A Records** (if your registrar supports ALIAS/ANAME):
```
Type: A
Name: @
Value: 76.76.21.21
```

**OR CNAME** (if your registrar supports CNAME flattening):
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

### For www Subdomain (www.halalzi.com)

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## Testing

After configuration, test the following:

### 1. Domain Access
- Visit `https://halalzi.com` - Should load successfully
- Visit `https://www.halalzi.com` - Should redirect to canonical domain

### 2. Authentication
- Test login flow: `/auth/signin`
- Verify callback URL works correctly
- Check that session cookies are set properly

### 3. SEO & Metadata
- Check canonical URL: View page source and look for `<link rel="canonical">`
- Verify Open Graph tags use correct domain
- Check sitemap: Visit `/sitemap.xml` and verify URLs use `halalzi.com`

### 4. Marketing Tracking
- Verify GTM loads correctly on the new domain
- Check that dataLayer events fire properly
- Test in GTM Preview mode

## Troubleshooting

### Issue: "Invalid Host Header" Error

**Solution**: Ensure `AUTH_TRUST_HOST="true"` is set in Vercel environment variables.

### Issue: Authentication Callback Fails

**Solution**: 
1. Verify `NEXTAUTH_URL` matches your canonical domain exactly (including https://)
2. Ensure no trailing slash in `NEXTAUTH_URL`
3. Check that `AUTH_TRUST_HOST="true"` is set

### Issue: Sitemap Shows Wrong Domain

**Solution**: 
1. Verify `NEXT_PUBLIC_SITE_URL` is set correctly in Vercel
2. Redeploy the application
3. Clear browser cache and check `/sitemap.xml`

### Issue: Canonical URLs Point to Old Domain

**Solution**:
1. Verify `NEXT_PUBLIC_SITE_URL` is set in Vercel environment variables
2. Redeploy the application
3. Check page source to verify canonical URL

### Issue: www Subdomain Not Redirecting

**Solution**:
1. Ensure both `halalzi.com` and `www.halalzi.com` are added in Vercel Domains
2. Set one as Primary Domain
3. Vercel will automatically handle the redirect

## Environment Variable Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | Yes | Base URL for the application | `https://halalzi.com` |
| `NEXTAUTH_URL` | Yes | NextAuth callback URL | `https://halalzi.com` |
| `AUTH_TRUST_HOST` | Yes | Trust host header (NextAuth v5) | `true` |
| `NEXTAUTH_SECRET` | Yes | NextAuth encryption secret | `your-secret-key` |
| `NEXT_PUBLIC_GTM_ID` | Optional | Google Tag Manager ID | `GTM-XXXXXXX` |

## Best Practices

1. **Use HTTPS**: Always use `https://` in production environment variables
2. **No Trailing Slash**: Don't add trailing slash to `NEXTAUTH_URL` or `NEXT_PUBLIC_SITE_URL`
3. **Consistent Domain**: Use the same canonical domain everywhere (either with or without www)
4. **Test Before Production**: Test authentication and critical flows after domain change
5. **Monitor Errors**: Check Vercel logs and browser console for any domain-related errors

## Additional Resources

- [Vercel Custom Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [NextAuth.js v5 Documentation](https://authjs.dev/getting-started/deployment)
- [Next.js Metadata Documentation](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)

## Support

If you encounter any issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set correctly
3. Test in incognito/private browsing mode
4. Clear browser cache and cookies
5. Check DNS propagation at https://dnschecker.org

---

**Note**: DNS changes can take up to 48 hours to propagate globally, but typically complete within a few hours.
