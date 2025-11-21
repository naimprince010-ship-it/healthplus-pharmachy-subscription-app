# Vercel Deployment Checklist

Complete checklist for deploying HealthPlus to Vercel with all required configurations.

---

## 📦 Pre-Deployment Preparation

### Repository Setup
- [ ] All code committed to GitHub
- [ ] `.env` file is in `.gitignore` (verified)
- [ ] `.env.example` is committed with all variables documented
- [ ] `package.json` includes all production dependencies
- [ ] Database migrations are ready in `prisma/migrations/`
- [ ] Seed script is tested and working

### Database Setup
- [ ] Production PostgreSQL database created (Supabase/Railway/other)
- [ ] Database connection string obtained
- [ ] Database allows connections from Vercel IPs
- [ ] Connection pooling configured (if using Supabase)

---

## 🚀 Vercel Project Configuration

### Step 1: Import Project
1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Choose: `naimprince010-ship-it/healthplus-pharmachy-subscription-app`
4. Click "Import"

### Step 2: Configure Build Settings
- [ ] **Framework Preset:** Next.js (auto-detected)
- [ ] **Root Directory:** `./` (leave as default)
- [ ] **Build Command:** `npm run build` (default)
- [ ] **Output Directory:** `.next` (default)
- [ ] **Install Command:** `npm install` (default)
- [ ] **Node.js Version:** 18.x or higher

### Step 3: Environment Variables

Add the following environment variables in Vercel Project Settings > Environment Variables:

#### 🔴 CRITICAL (Required for App to Function)

```
DATABASE_URL
```
- **Value:** Your production PostgreSQL connection string
- **Example:** `postgresql://user:pass@host.supabase.co:5432/postgres?pgbouncer=true`
- **Environment:** Production, Preview, Development

```
NEXTAUTH_URL
```
- **Value:** Your production domain
- **Example:** `https://healthplus.vercel.app` or `https://yourdomain.com`
- **Environment:** Production, Preview (use preview URL), Development (http://localhost:3000)

```
NEXTAUTH_SECRET
```
- **Value:** Generate with `openssl rand -base64 32`
- **Example:** `abc123xyz789...` (32+ character random string)
- **Environment:** Production, Preview, Development
- **⚠️ Use different secrets for each environment**

```
NEXT_PUBLIC_SITE_URL
```
- **Value:** Same as NEXTAUTH_URL
- **Example:** `https://healthplus.vercel.app`
- **Environment:** Production, Preview, Development

#### 🟡 IMPORTANT (Admin Access)

```
DEFAULT_ADMIN_PHONE
```
- **Value:** Admin phone number with country code
- **Example:** `+8801712345678`
- **Environment:** Production, Preview, Development

```
DEFAULT_ADMIN_PASSWORD
```
- **Value:** Strong password (change after first login)
- **Example:** `SecureP@ssw0rd123!`
- **Environment:** Production, Preview, Development
- **⚠️ Change immediately after first login**

```
DEFAULT_ADMIN_NAME
```
- **Value:** Admin user display name
- **Example:** `Admin User`
- **Environment:** Production, Preview, Development

```
DEFAULT_ADMIN_EMAIL
```
- **Value:** Admin email address
- **Example:** `admin@healthplus.com`
- **Environment:** Production, Preview, Development

#### 🟢 OPTIONAL (Notifications)

```
SMS_API_KEY
```
- **Value:** Your SMS provider API key
- **Example:** `sk_live_abc123...`
- **Environment:** Production, Preview (optional), Development (optional)

```
SMS_API_URL
```
- **Value:** SMS provider API endpoint
- **Example:** `https://api.sms-provider.com/send`
- **Environment:** Production, Preview, Development

```
SMS_SENDER_ID
```
- **Value:** Sender ID for SMS
- **Example:** `HealthPlus`
- **Environment:** Production, Preview, Development

```
EMAIL_FROM
```
- **Value:** Sender email address
- **Example:** `noreply@healthplus.com`
- **Environment:** Production, Preview, Development

```
SMTP_HOST
```
- **Value:** SMTP server hostname
- **Example:** `smtp.gmail.com`
- **Environment:** Production, Preview, Development

```
SMTP_PORT
```
- **Value:** SMTP port
- **Example:** `587`
- **Environment:** Production, Preview, Development

```
SMTP_USER
```
- **Value:** SMTP username/email
- **Example:** `your-email@gmail.com`
- **Environment:** Production, Preview, Development

```
SMTP_PASSWORD
```
- **Value:** SMTP password or app password
- **Example:** `your-app-password`
- **Environment:** Production, Preview, Development

#### 🔵 OPTIONAL (Tracking & Analytics)

```
NEXT_PUBLIC_GTM_ID
```
- **Value:** Google Tag Manager ID
- **Example:** `GTM-XXXXXXX`
- **Environment:** Production (required), Preview (optional), Development (optional)

```
NEXT_PUBLIC_GA_ID
```
- **Value:** Google Analytics 4 Measurement ID
- **Example:** `G-XXXXXXXXXX`
- **Environment:** Production (required), Preview (optional), Development (optional)

```
NEXT_PUBLIC_FB_PIXEL_ID
```
- **Value:** Facebook Pixel ID
- **Example:** `123456789012345`
- **Environment:** Production (required), Preview (optional), Development (optional)

```
NEXT_PUBLIC_TIKTOK_PIXEL_ID
```
- **Value:** TikTok Pixel ID
- **Example:** `XXXXXXXXXXXXXX`
- **Environment:** Production (required), Preview (optional), Development (optional)

```
NEXT_PUBLIC_GOOGLE_ADS_ID
```
- **Value:** Google Ads Conversion ID
- **Example:** `AW-XXXXXXXXXX`
- **Environment:** Production (required), Preview (optional), Development (optional)

#### 🟣 OPTIONAL (WhatsApp & File Upload)

```
NEXT_PUBLIC_WHATSAPP_NUMBER
```
- **Value:** WhatsApp business number (no + prefix)
- **Example:** `8801712345678`
- **Environment:** Production, Preview, Development

```
NEXT_PUBLIC_MAX_FILE_SIZE
```
- **Value:** Maximum file size in bytes
- **Example:** `5242880` (5MB)
- **Environment:** Production, Preview, Development

```
UPLOAD_DIR
```
- **Value:** Upload directory path
- **Example:** `./public/uploads`
- **Environment:** Production, Preview, Development

---

## 🗄️ Database Migration & Seeding

### After First Deployment

#### Option 1: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy

# Seed database
npm run db:seed
```

#### Option 2: From Local Machine

```bash
# Set production database URL
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Seed database
npm run db:seed
```

#### Option 3: Using Prisma Data Platform

1. Connect your database to Prisma Data Platform
2. Run migrations from the platform UI
3. Execute seed script manually

### Verify Database Setup

- [ ] All migrations applied successfully
- [ ] Seed script executed without errors
- [ ] 6 zones created
- [ ] 6 categories created
- [ ] 1 membership plan created
- [ ] 4 subscription plans created
- [ ] 7 sample medicines created
- [ ] 3 banners created
- [ ] 1 admin user created

---

## 🎯 Post-Deployment Verification

### Deployment Status
- [ ] Build completed successfully
- [ ] No build errors in Vercel logs
- [ ] Deployment is live and accessible

### Homepage Testing
- [ ] Homepage loads without errors
- [ ] Prescription upload form is visible
- [ ] Membership card displays correctly
- [ ] Subscription plans are shown
- [ ] Navigation menu works
- [ ] Footer displays correctly
- [ ] WhatsApp button is visible and clickable

### Authentication Testing
- [ ] Admin login page accessible at `/auth/signin`
- [ ] Can login with default admin credentials
- [ ] Session persists after login
- [ ] Protected routes require authentication

### Pages Testing
- [ ] `/membership` - Membership page loads
- [ ] `/subscriptions` - Subscription plans display
- [ ] `/medicines` - Medicine catalog loads
- [ ] `/cart` - Cart page accessible
- [ ] `/dashboard` - Customer dashboard works
- [ ] `/admin` - Admin dashboard accessible (requires admin role)

### API Endpoints Testing
- [ ] `GET /api/zones` - Returns zones list
- [ ] `POST /api/prescriptions` - Accepts prescription uploads
- [ ] `GET /api/prescriptions` - Returns prescriptions
- [ ] `POST /api/membership` - Creates membership
- [ ] `GET /api/membership` - Returns user membership

### Database Connectivity
- [ ] Application connects to database successfully
- [ ] Data fetching works on all pages
- [ ] No database connection errors in logs

### Static Assets
- [ ] Images load correctly
- [ ] Favicon displays
- [ ] SVG icons render properly
- [ ] CSS styles applied correctly

### SEO & Meta Tags
- [ ] Meta tags present on all pages
- [ ] Open Graph tags configured
- [ ] Twitter Card tags present
- [ ] Canonical URLs correct
- [ ] Sitemap accessible at `/sitemap.xml`

### Tracking & Analytics
- [ ] Google Tag Manager container loads
- [ ] Google Analytics tracking active
- [ ] Facebook Pixel fires correctly
- [ ] TikTok Pixel tracking works
- [ ] WhatsApp click tracking functional

### Performance
- [ ] Lighthouse Performance score > 80
- [ ] Lighthouse Accessibility score > 90
- [ ] Lighthouse Best Practices score > 90
- [ ] Lighthouse SEO score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s

---

## 🔒 Security Checklist

### Immediate Actions
- [ ] Change default admin password
- [ ] Verify NEXTAUTH_SECRET is unique
- [ ] Confirm database credentials are secure
- [ ] Check .env is not in git history

### Configuration
- [ ] HTTPS enabled (Vercel default)
- [ ] CORS configured correctly
- [ ] Rate limiting considered for APIs
- [ ] Input validation on all forms
- [ ] SQL injection protection (Prisma handles this)

### Monitoring
- [ ] Error tracking configured (Sentry recommended)
- [ ] Uptime monitoring setup
- [ ] Database backup schedule configured
- [ ] Log monitoring enabled

---

## 📁 File Storage Setup

### Prescription Uploads

Since Vercel has read-only filesystem, you need external storage for uploads:

#### Option 1: Vercel Blob Storage (Recommended)

```bash
npm install @vercel/blob
```

Update upload logic to use Vercel Blob.

#### Option 2: AWS S3

```bash
npm install @aws-sdk/client-s3
```

Configure S3 bucket and update upload logic.

#### Option 3: Cloudinary

```bash
npm install cloudinary
```

Configure Cloudinary and update upload logic.

**For MVP:** You can temporarily store uploads in database as base64 or use external storage from day 1.

---

## 🌐 Custom Domain Setup (Optional)

### Step 1: Add Domain in Vercel
1. Go to Project Settings > Domains
2. Click "Add Domain"
3. Enter your domain name
4. Click "Add"

### Step 2: Configure DNS

Add these DNS records at your domain registrar:

**For root domain (healthplus.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 3: Update Environment Variables

Update these variables with your custom domain:
- `NEXTAUTH_URL` → `https://yourdomain.com`
- `NEXT_PUBLIC_SITE_URL` → `https://yourdomain.com`

### Step 4: Redeploy

Trigger a new deployment for changes to take effect.

---

## 🔄 Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to:
- **main branch** → Production deployment
- **other branches** → Preview deployments
- **Pull requests** → Preview deployments with unique URLs

### Manual Deployment

```bash
# Deploy from CLI
vercel --prod
```

### Deployment Hooks

Set up webhooks in Vercel for:
- Slack notifications on deployment
- Discord notifications
- Custom webhook endpoints

---

## 📊 Monitoring & Analytics

### Vercel Analytics
- [ ] Enable Vercel Analytics in project settings
- [ ] Review Web Vitals data
- [ ] Monitor function execution times

### Error Tracking
- [ ] Set up Sentry or similar
- [ ] Configure error alerts
- [ ] Review error logs regularly

### Uptime Monitoring
- [ ] Set up UptimeRobot or similar
- [ ] Configure downtime alerts
- [ ] Monitor API endpoint health

---

## 🆘 Troubleshooting

### Build Fails

**Check:**
- Build logs in Vercel dashboard
- TypeScript errors
- Missing dependencies
- Environment variables

**Common fixes:**
```bash
# Locally test production build
npm run build

# Check for type errors
npx tsc --noEmit

# Verify all dependencies installed
npm install
```

### Database Connection Fails

**Check:**
- DATABASE_URL is correct
- Database allows Vercel IP ranges
- Connection string includes `?pgbouncer=true` for Supabase
- Database is not paused (free tier databases may pause)

### Pages Return 500 Errors

**Check:**
- Vercel function logs
- Database connection
- Missing environment variables
- API route errors

### Tracking Not Working

**Check:**
- Tracking IDs are correct
- Environment variables are set
- Ad blockers disabled for testing
- Browser console for errors

---

## ✅ Final Checklist

Before announcing launch:

- [ ] All environment variables configured
- [ ] Database migrated and seeded
- [ ] Admin password changed from default
- [ ] All pages load without errors
- [ ] All API endpoints working
- [ ] Tracking pixels firing correctly
- [ ] SEO meta tags verified
- [ ] Performance scores acceptable
- [ ] Mobile responsiveness tested
- [ ] Cross-browser testing completed
- [ ] SSL certificate active (Vercel default)
- [ ] Custom domain configured (if applicable)
- [ ] Backup strategy in place
- [ ] Monitoring tools configured
- [ ] Error tracking active
- [ ] Documentation updated
- [ ] Team members have access
- [ ] Support channels ready

---

## 📞 Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **Prisma Documentation:** https://www.prisma.io/docs
- **Vercel Support:** https://vercel.com/support
- **Community Discord:** https://discord.gg/vercel

---

**Deployment Date:** _________________
**Deployed By:** _________________
**Production URL:** _________________
**Database Provider:** _________________
**Notes:** _________________

---

**Last Updated:** November 2025
**Version:** 1.0.0
