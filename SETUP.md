# HealthPlus - Quick Setup Guide

## Local Development Setup

Follow these steps to set up the HealthPlus pharmacy subscription system on your local machine.

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud-hosted)
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/naimprince010-ship-it/healthplus-pharmachy-subscription-app.git
cd healthplus-pharmachy-subscription-app
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages and automatically run `prisma generate` via the postinstall script.

### Step 3: Configure Environment Variables

Copy the example environment file and update it with your values:

```bash
cp .env.example .env
```

**Required Environment Variables:**

```env
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@localhost:5432/healthplus?schema=public"

# NextAuth (REQUIRED for production)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Application
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

**Optional Environment Variables:**

See `.env.example` for the complete list of optional variables including SMS, Email, Tracking, and Payment Gateway configurations.

### Step 4: Set Up the Database

#### Option A: Using Supabase (Recommended for Quick Start)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database → Connection String
4. Copy the connection string and update `DATABASE_URL` in your `.env` file

#### Option B: Using Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a new database:
   ```bash
   createdb healthplus
   ```
3. Update `DATABASE_URL` in your `.env` file with your local credentials

### Step 5: Run Database Migrations

```bash
npm run db:migrate
```

This will create all the necessary tables in your database.

### Step 6: Seed the Database

```bash
npm run db:seed
```

This will populate your database with:
- 6 delivery zones (Dhaka Central, Dhaka North, Dhaka South, Chittagong, Sylhet, Rajshahi)
- 6 medicine categories
- 1 membership plan (100 BDT, 10% discount)
- 4 subscription plans (BP Care, Diabetes Care, Baby Care, Family Pack)
- 7 sample medicines
- 3 banner placeholders
- 1 default admin user

**Default Admin Credentials:**
- Phone: +8801712345678
- Password: ChangeMe123!

⚠️ **IMPORTANT:** Change the admin password immediately after first login!

### Step 7: Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations (development)
- `npm run db:migrate:deploy` - Run database migrations (production)
- `npm run db:seed` - Seed the database with default data
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:generate` - Generate Prisma Client

## Verification Checklist

After setup, verify that everything is working:

- [ ] Homepage loads at http://localhost:3000
- [ ] Membership page shows the 100 BDT plan
- [ ] Subscriptions page shows 4 subscription plans
- [ ] Medicines page loads
- [ ] Admin panel is accessible at http://localhost:3000/admin
- [ ] Database has been seeded with default data (check with `npm run db:studio`)

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Verify your `DATABASE_URL` is correct
2. Ensure PostgreSQL is running
3. Check that the database exists
4. Verify network connectivity (for cloud databases)

### Build Errors

If you encounter build errors:

1. Clear the build cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Regenerate Prisma Client: `npm run db:generate`
4. Try building again: `npm run build`

### Prisma Client Errors

If you see "Prisma Client not generated" errors:

```bash
npm run db:generate
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Use a different port
PORT=3001 npm run dev
```

## Next Steps

1. **Configure Tracking:** Add your GTM, GA4, Facebook Pixel, and TikTok Pixel IDs to `.env`
2. **Set Up SMS/Email:** Configure your SMS and email providers
3. **Upload Banners:** Replace placeholder banners with actual images in `/public/banners/`
4. **Customize Content:** Update homepage text, membership benefits, and subscription plan descriptions
5. **Deploy to Production:** Follow the deployment guide in `DEPLOYMENT.md`

## Need Help?

- Check `DEPLOYMENT.md` for production deployment instructions
- Check `VERCEL_CHECKLIST.md` for Vercel-specific deployment steps
- Review the Prisma schema in `prisma/schema.prisma` to understand the database structure
- Open Prisma Studio to inspect your database: `npm run db:studio`

## Security Notes

- Never commit your `.env` file to version control
- Change the default admin password immediately
- Use strong secrets for `NEXTAUTH_SECRET` in production
- Enable HTTPS in production
- Regularly update dependencies for security patches
