# HealthPlus - Production Deployment Guide

This guide provides complete instructions for deploying the HealthPlus Pharmacy Subscription System to production.

---

## 📋 Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Database Setup](#database-setup)
3. [Environment Variables](#environment-variables)
4. [Vercel Deployment](#vercel-deployment)
5. [Post-Deployment Checklist](#post-deployment-checklist)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Local Development Setup

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Git installed

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/naimprince010-ship-it/healthplus-pharmachy-subscription-app.git
cd healthplus-pharmachy-subscription-app

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values
nano .env  # or use your preferred editor
```

**Required Variables for Local Development:**
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_URL` - http://localhost:3000
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`

### Step 3: Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with initial data
npm run db:seed
```

### Step 4: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see your application.

**Default Admin Credentials:**
- Phone: +8801712345678 (or value from .env)
- Password: ChangeMe123! (or value from .env)

⚠️ **IMPORTANT:** Change the default admin password immediately after first login!

---

## 🗄️ Database Setup

### Option 1: Supabase (Recommended)

1. Create a free account at https://supabase.com
2. Create a new project
3. Go to Project Settings > Database
4. Copy the "Connection string" (URI format)
5. Add to your `.env` file as `DATABASE_URL`

### Option 2: Railway

1. Create account at https://railway.app
2. Create new project > Add PostgreSQL
3. Copy the connection string from the database settings
4. Add to your `.env` file as `DATABASE_URL`

### Option 3: Local PostgreSQL

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE healthplus;
CREATE USER healthplus_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE healthplus TO healthplus_user;
\q

# Update .env
DATABASE_URL="postgresql://healthplus_user:your_password@localhost:5432/healthplus?schema=public"
```

### Running Migrations

```bash
# Development (creates migration files)
npm run db:migrate

# Production (applies existing migrations)
npm run db:migrate:deploy

# View database in browser
npm run db:studio
```

### Seeding the Database

The seed script creates:
- 6 delivery zones (Dhaka Central, Dhaka North, Dhaka South, Chittagong, Sylhet, Rajshahi)
- 6 medicine categories (Blood Pressure, Diabetes, Baby Care, Pain Relief, Vitamins, Heart Health)
- 1 membership plan (100 BDT, 10% discount, 30 days)
- 4 subscription plans (BP Care, Diabetes Care, Baby Care, Family Pack)
- 7 sample medicines
- 3 banner placeholders
- 1 admin user

```bash
# Run seed script
npm run db:seed
```

---

## 🔐 Environment Variables

### Complete Environment Configuration

Copy `.env.example` to `.env` and configure all variables:

#### Required for Basic Functionality

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

#### Admin Configuration

```env
DEFAULT_ADMIN_PHONE="+8801712345678"
DEFAULT_ADMIN_PASSWORD="ChangeMe123!"
DEFAULT_ADMIN_NAME="Admin User"
DEFAULT_ADMIN_EMAIL="admin@healthplus.com"
```

#### SMS Provider (Optional but Recommended)

Configure your SMS provider for OTP and notifications:

```env
SMS_API_KEY="your-sms-api-key"
SMS_API_URL="https://api.sms-provider.com/send"
SMS_SENDER_ID="HealthPlus"
```

**Recommended SMS Providers for Bangladesh:**
- SSL Wireless
- Banglalink SMS API
- Robi SMS Gateway
- Twilio (international)

#### Email Configuration (Optional but Recommended)

```env
EMAIL_FROM="noreply@healthplus.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASSWORD`

#### Tracking & Analytics (Optional)

```env
NEXT_PUBLIC_GTM_ID="GTM-XXXXXXX"
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_FB_PIXEL_ID="123456789012345"
NEXT_PUBLIC_TIKTOK_PIXEL_ID="XXXXXXXXXXXXXX"
NEXT_PUBLIC_GOOGLE_ADS_ID="AW-XXXXXXXXXX"
```

**Setup Instructions:**
- **Google Tag Manager:** https://tagmanager.google.com
- **Google Analytics 4:** https://analytics.google.com
- **Facebook Pixel:** https://business.facebook.com/events_manager
- **TikTok Pixel:** https://ads.tiktok.com/help/article?aid=10000357
- **Google Ads:** https://ads.google.com

#### WhatsApp Configuration

```env
NEXT_PUBLIC_WHATSAPP_NUMBER="8801712345678"
```

Use your business WhatsApp number without the + prefix.

#### File Upload Configuration

```env
NEXT_PUBLIC_MAX_FILE_SIZE="5242880"
UPLOAD_DIR="./public/uploads"
```

#### Application URLs

```env
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

---

## ☁️ Vercel Deployment

### Step 1: Prepare Your Repository

Ensure all changes are committed and pushed to GitHub:

```bash
git add .
git commit -m "Production setup complete"
git push origin main
```

### Step 2: Create Vercel Project

1. Go to https://vercel.com
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** .next
   - **Install Command:** `npm install`

### Step 3: Configure Environment Variables

In Vercel project settings, add all environment variables from your `.env` file:

**Critical Variables:**
- `DATABASE_URL` - Your production PostgreSQL connection string
- `NEXTAUTH_URL` - Your production domain (e.g., https://healthplus.vercel.app)
- `NEXTAUTH_SECRET` - Generate a new secret for production
- `NEXT_PUBLIC_SITE_URL` - Same as NEXTAUTH_URL

**Optional but Recommended:**
- All SMS, Email, Tracking, and WhatsApp variables

### Step 4: Deploy

Click "Deploy" and wait for the build to complete.

### Step 5: Run Production Migrations

After first deployment, run migrations:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Run migrations in production
vercel env pull .env.production
DATABASE_URL="your-production-db-url" npx prisma migrate deploy

# Seed production database
DATABASE_URL="your-production-db-url" npm run db:seed
```

**Alternative:** Use Vercel's built-in database migration feature or run migrations from your local machine pointing to production database.

### Step 6: Configure Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` environment variables

---

## ✅ Post-Deployment Checklist

### Immediate Actions

- [ ] Verify homepage loads correctly
- [ ] Test admin login with default credentials
- [ ] Change default admin password immediately
- [ ] Test prescription upload functionality
- [ ] Verify membership page displays correctly
- [ ] Check subscription plans page
- [ ] Test medicine browsing
- [ ] Verify cart functionality
- [ ] Test customer dashboard
- [ ] Check admin dashboard access

### Database Verification

- [ ] Confirm all zones are created
- [ ] Verify categories exist
- [ ] Check membership plan is active
- [ ] Confirm subscription plans are visible
- [ ] Verify sample medicines are listed
- [ ] Check banners are displayed

### API Testing

- [ ] Test `/api/prescriptions` endpoint
- [ ] Test `/api/membership` endpoint
- [ ] Test `/api/zones` endpoint
- [ ] Verify authentication works

### Tracking & Analytics

- [ ] Verify Google Tag Manager is firing
- [ ] Check Google Analytics is receiving data
- [ ] Test Facebook Pixel events
- [ ] Confirm TikTok Pixel is working
- [ ] Test WhatsApp button click tracking

### Performance & SEO

- [ ] Run Lighthouse audit (aim for 90+ scores)
- [ ] Verify meta tags on all pages
- [ ] Check sitemap.xml is accessible
- [ ] Confirm canonical URLs are correct
- [ ] Test Open Graph tags (share on social media)

### Security

- [ ] Change default admin password
- [ ] Verify NEXTAUTH_SECRET is unique and secure
- [ ] Confirm database credentials are secure
- [ ] Check that .env files are not committed to git
- [ ] Verify API routes require authentication where needed

### File Upload Setup

- [ ] Create uploads directory: `mkdir -p public/uploads`
- [ ] Set proper permissions for uploads directory
- [ ] Test prescription file upload
- [ ] Verify uploaded files are accessible

### Notifications (if configured)

- [ ] Test SMS sending (if configured)
- [ ] Test email sending (if configured)
- [ ] Verify OTP generation and validation

---

## 🐛 Troubleshooting

### Build Errors

**Error: "Cannot find module '@prisma/client'"**
```bash
npm run db:generate
npm run build
```

**Error: "Database connection failed"**
- Verify `DATABASE_URL` is correct
- Check database is accessible from Vercel
- Ensure database allows connections from Vercel IPs

### Runtime Errors

**Error: "NEXTAUTH_SECRET is not set"**
- Add `NEXTAUTH_SECRET` to Vercel environment variables
- Redeploy the application

**Error: "Failed to fetch data"**
- Check API routes are working
- Verify database connection
- Check Vercel function logs

### Database Issues

**Migrations not applied:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or apply migrations manually
npx prisma migrate deploy
```

**Seed script fails:**
- Check database connection
- Verify Prisma Client is generated
- Run `npm run db:generate` first

### Performance Issues

**Slow page loads:**
- Enable Vercel Edge caching
- Optimize images with Next.js Image component
- Check database query performance
- Consider adding database indexes

**High database usage:**
- Review and optimize Prisma queries
- Add connection pooling
- Consider using Prisma Accelerate

---

## 📞 Support

For issues or questions:
- Check the [README.md](./README.md) for project documentation
- Review Prisma documentation: https://www.prisma.io/docs
- Check Next.js documentation: https://nextjs.org/docs
- Vercel support: https://vercel.com/support

---

## 🔄 Updating Production

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Generate Prisma Client
npm run db:generate

# Run new migrations
npm run db:migrate:deploy

# Rebuild and deploy
git push origin main  # Vercel auto-deploys
```

---

## 📊 Monitoring

### Recommended Monitoring Tools

1. **Vercel Analytics** - Built-in performance monitoring
2. **Sentry** - Error tracking and monitoring
3. **LogRocket** - Session replay and debugging
4. **Uptime Robot** - Uptime monitoring
5. **Google Analytics** - User behavior tracking

### Key Metrics to Monitor

- Page load times
- API response times
- Error rates
- User conversion rates
- Database query performance
- Server function execution time

---

## 🔒 Security Best Practices

1. **Never commit .env files** - Always use .env.example as template
2. **Rotate secrets regularly** - Change NEXTAUTH_SECRET periodically
3. **Use strong passwords** - Enforce password policies
4. **Enable HTTPS only** - Vercel provides this by default
5. **Validate user input** - All forms should have validation
6. **Rate limit APIs** - Prevent abuse of API endpoints
7. **Regular updates** - Keep dependencies up to date
8. **Backup database** - Regular automated backups
9. **Monitor logs** - Check for suspicious activity
10. **Use environment-specific configs** - Different secrets for dev/prod

---

**Last Updated:** November 2025
**Version:** 1.0.0
