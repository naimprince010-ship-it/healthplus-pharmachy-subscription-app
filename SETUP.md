# Quick Setup Guide for HealthPlus Pharmacy

This guide will help you get the HealthPlus Pharmacy Subscription App running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (version 12 or higher)
- **Git**

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd healthplus-pharmachy-subscription-app
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, Prisma, NextAuth.js, and more.

### 3. Set Up PostgreSQL Database

#### Option A: Using Local PostgreSQL

1. Create a new database:
```bash
psql -U postgres
CREATE DATABASE healthplus_db;
\q
```

#### Option B: Using Docker (Recommended for Development)

```bash
docker run --name healthplus-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=healthplus \
  -e POSTGRES_DB=healthplus_db \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and update with your database credentials:
```env
DATABASE_URL="postgresql://healthplus:password@localhost:5432/healthplus_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

**Important:** For `NEXTAUTH_SECRET`, generate a secure random string:
```bash
# On Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Set Up the Database Schema

Run Prisma migrations to create the database tables:

```bash
npx prisma migrate dev --name init
```

This will:
- Create all necessary tables in your database
- Generate the Prisma Client
- Ask if you want to seed the database (optional)

### 6. Seed the Database (Optional but Recommended)

Populate your database with sample data:

```bash
npx prisma db seed
```

This will create:
- An admin user (email: `admin@healthplus.com`, password: `admin123`)
- A customer user (email: `customer@example.com`, password: `customer123`)
- Sample medicine plans (BP, Diabetes, Heart)
- Sample medicines
- Sample subscriptions and memberships

**⚠️ Security Note:** Change these default passwords in production!

### 7. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Testing the Application

### Login as Customer
- Navigate to: http://localhost:3000/auth/signin
- Email: `customer@example.com`
- Password: `customer123`

### Login as Admin
- Navigate to: http://localhost:3000/auth/signin
- Email: `admin@healthplus.com`
- Password: `admin123`

### Register a New Account
- Navigate to: http://localhost:3000/auth/register
- Fill in the registration form

## Available Pages

### Public Pages
- **Homepage:** `/` - Landing page with features
- **Sign In:** `/auth/signin` - Login page
- **Register:** `/auth/register` - Registration page

### Customer Pages (Requires Login)
- **Dashboard:** `/dashboard` - Overview and stats
- **Subscriptions:** `/dashboard/subscriptions` - Manage subscriptions and view plans
- **Cart:** `/dashboard/cart` - Shopping cart
- **Orders:** `/dashboard/orders` - Order history
- **Profile:** `/dashboard/profile` - User profile

### Admin Pages (Requires Admin Role)
- **Admin Dashboard:** `/admin` - Admin panel with statistics

## Useful Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Database Management
```bash
# Open Prisma Studio (Database GUI)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (⚠️ Deletes all data)
npx prisma migrate reset

# Re-generate Prisma Client
npx prisma generate

# Seed database
npx prisma db seed
```

### TypeScript
```bash
# Type check
npx tsc --noEmit
```

## Troubleshooting

### Issue: Database connection fails

**Solution:** 
- Verify PostgreSQL is running
- Check DATABASE_URL in .env matches your database credentials
- Ensure the database exists

### Issue: Prisma Client errors

**Solution:**
```bash
npx prisma generate
```

### Issue: Build fails

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Run on a different port
PORT=3001 npm run dev
```

## Project Structure

```
healthplus-pharmachy-subscription-app/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Customer dashboard
│   └── globals.css        # Global styles
├── components/            # Reusable React components
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   └── prisma.ts         # Prisma client instance
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database models
│   └── seed.ts           # Seed script
├── types/                # TypeScript type definitions
├── .env                  # Environment variables (create from .env.example)
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Key Features

### For Customers
✅ Sign up and login securely  
✅ Subscribe to monthly medicine plans (BP, Diabetes, Heart, etc.)  
✅ Purchase premium membership (100 BDT/month) for 10% discount  
✅ Browse and add medicines to cart  
✅ Checkout with automatic discount calculation  
✅ View order history  
✅ Manage profile  

### For Admins
✅ View comprehensive dashboard with statistics  
✅ Manage orders and update status  
✅ View all customers  
✅ Manage medicine inventory  
✅ Create and manage subscription plans  

## Next Steps

1. ✅ Complete the setup steps above
2. 🔐 Change default admin password
3. 🎨 Customize the branding and colors
4. 💳 Integrate a payment gateway (e.g., Stripe, bKash)
5. 📧 Set up email notifications
6. 🚀 Deploy to production (Vercel, Railway, etc.)

## Support

If you encounter any issues:
1. Check this setup guide
2. Review the main README.md
3. Check Prisma/Next.js documentation
4. Open an issue on GitHub

## Security Checklist for Production

Before deploying to production:

- [ ] Change all default passwords
- [ ] Use strong NEXTAUTH_SECRET
- [ ] Enable HTTPS
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Review and update environment variables
- [ ] Enable production error logging

---

Happy coding! 🚀
