# HealthPlus - Subscription Pharmacy & E-Commerce

Full-stack custom subscription pharmacy web app for local customers. Features: monthly medicine plans, 100 BDT membership with 10% discount on all medicines, customer dashboard, admin panel, orders, and payments using Next.js 15, TypeScript, Prisma, and PostgreSQL.

## Features

### Customer Features
- **Prescription Upload**: Upload prescriptions directly from the homepage
- **Membership Program**: 100 BDT/month membership with 10% discount on all medicines
- **Subscription Plans**: Monthly packages for BP Care, Diabetes, Baby Care, and Family Pack
- **E-Commerce**: Browse medicines, add to cart, and checkout with COD or online payment
- **Customer Dashboard**: View orders, subscriptions, and membership status
- **Order History**: Track all past and current orders

### Admin Features
- **Medicine Management**: CRUD operations for medicines and categories
- **Order Management**: View and manage customer orders with zone filtering
- **Subscription Management**: Manage subscription plans and packages
- **Membership Management**: Configure membership plans and pricing
- **Banner Management**: Upload and manage promotional banners
- **User Management**: View and manage customer accounts
- **Prescription Review**: Review uploaded prescriptions

### Technical Features
- **SEO Optimized**: Complete metadata, sitemaps, canonical tags, and OpenGraph
- **Analytics & Tracking**: GTM, GA4, Facebook Pixel, TikTok Pixel, Google Ads
- **WhatsApp Integration**: Floating WhatsApp button with click tracking
- **SMS/Email Notifications**: Automated notifications for orders, prescriptions, and membership
- **Delivery Zones**: Zone-based delivery with custom charges and schedules
- **Responsive Design**: Mobile-first design with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/naimprince010-ship-it/healthplus-pharmachy-subscription-app.git
cd healthplus-pharmachy-subscription-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- Tracking IDs (GTM, GA4, Facebook Pixel, TikTok Pixel, Google Ads)
- SMS/Email provider credentials
- WhatsApp number

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. (Optional) Seed the database:
```bash
npx prisma db seed
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
healthplus-pharmachy-subscription-app/
├── app/                      # Next.js App Router pages
│   ├── api/                 # API routes
│   ├── admin/               # Admin panel pages
│   ├── dashboard/           # Customer dashboard
│   ├── membership/          # Membership pages
│   ├── subscriptions/       # Subscription pages
│   ├── medicines/           # Medicine catalog
│   ├── cart/                # Shopping cart
│   └── page.tsx             # Homepage
├── components/              # Reusable React components
├── lib/                     # Utility functions and helpers
│   ├── prisma.ts           # Prisma client
│   ├── auth.ts             # NextAuth configuration
│   ├── utils.ts            # Utility functions
│   └── notifications.ts    # SMS/Email module
├── prisma/                  # Prisma schema and migrations
├── types/                   # TypeScript type definitions
└── public/                  # Static assets
```

## Database Schema

The application uses the following main models:
- User, Address, Zone
- Medicine, Category
- Prescription
- Order, OrderItem
- MembershipPlan, UserMembership
- SubscriptionPlan, Subscription, SubscriptionItem
- Banner

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

### Database

Use Vercel Postgres, Supabase, or any PostgreSQL provider. Update `DATABASE_URL` in your environment variables.

## Environment Variables

See `.env.example` for all required environment variables:
- Database connection
- NextAuth configuration
- SMS/Email provider settings
- Analytics tracking IDs
- WhatsApp number
- File upload settings

## License

MIT

## Support

For support, email info@healthplus.com or contact us via WhatsApp.
