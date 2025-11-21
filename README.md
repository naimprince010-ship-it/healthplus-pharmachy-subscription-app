# HealthPlus Pharmacy - Subscription Web App

A full-stack Next.js 15 + TypeScript web application for a local subscription pharmacy. Built with modern technologies including Prisma, PostgreSQL, NextAuth.js, and Tailwind CSS.

## Features

### Customer Features
- **User Authentication**: Sign up, login, and secure session management
- **Customer Dashboard**: Overview of subscriptions, orders, and account stats
- **Monthly Medicine Plans**: Subscribe to specialized plans for:
  - Blood Pressure (BP) management
  - Diabetes care
  - Heart conditions
  - General health maintenance
- **Premium Membership**: 100 BDT/month for 10% discount on all medicines for 30 days
- **Shopping Cart**: Browse medicines, add to cart, and checkout
- **Order History**: Track all past orders with detailed information
- **Profile Management**: Update personal information and account settings

### Admin Features
- **Admin Dashboard**: Comprehensive statistics and overview
- **Order Management**: View and update order statuses
- **Medicine Inventory**: Add and manage medicines
- **Plan Management**: Create and manage subscription plans
- **User Management**: View and manage customer accounts

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Password Hashing**: bcryptjs
- **Form Validation**: React Hook Form + Zod

## Database Models

The application uses the following main data models:

1. **User**: Customer and admin accounts
2. **MedicinePlan**: Monthly subscription plans (BP, diabetes, etc.)
3. **Subscription**: User subscriptions to medicine plans
4. **Membership**: Premium membership for discounts
5. **Medicine**: Product catalog
6. **Cart & CartItem**: Shopping cart functionality
7. **Order & OrderItem**: Order management and history

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
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
```
DATABASE_URL="postgresql://user:password@localhost:5432/healthplus_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
```

4. Set up the database:
```bash
# Create the database schema
npx prisma migrate dev --name init

# (Optional) Seed the database with sample data
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

### Using Docker for PostgreSQL (Optional)

```bash
docker run --name healthplus-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=user \
  -e POSTGRES_DB=healthplus_db \
  -p 5432:5432 \
  -d postgres:15
```

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create a migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   └── auth/         # Authentication endpoints
│   ├── auth/             # Auth pages (signin, register)
│   ├── dashboard/        # Customer dashboard pages
│   │   ├── cart/         # Shopping cart
│   │   ├── orders/       # Order history
│   │   ├── profile/      # User profile
│   │   └── subscriptions/# Subscription management
│   ├── admin/            # Admin panel
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Homepage
├── components/           # Reusable components
├── lib/                  # Utilities and helpers
│   └── prisma.ts         # Prisma client
├── prisma/
│   └── schema.prisma     # Database schema
├── types/                # TypeScript type definitions
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features in Detail

### Subscription Plans

The app supports two types of subscriptions:

1. **Monthly Medicine Plans**: Specialized plans containing curated medicine packages for specific health conditions
   - Each plan has a monthly price
   - Default duration of 30 days
   - Auto-renewal option

2. **Premium Membership**: Fixed monthly subscription
   - Cost: 100 BDT/month
   - Benefit: 10% discount on all medicine purchases
   - Valid for 30 days

### User Roles

- **CUSTOMER**: Can browse, purchase medicines, manage subscriptions
- **ADMIN**: Full access to admin panel, can manage all aspects of the system

### Order Flow

1. Customer browses medicines and adds to cart
2. Cart calculates total and applies membership discount if applicable
3. Customer proceeds to checkout
4. Order is created with status PENDING
5. Admin can update order status (PROCESSING → COMPLETED)
6. Customer can view order in order history

## Security

- Passwords are hashed using bcryptjs
- Authentication handled by NextAuth.js with JWT strategy
- Protected routes using middleware and server-side checks
- SQL injection prevention via Prisma ORM
- XSS protection through React's built-in escaping

## Deployment

### Vercel (Recommended for Next.js)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform supporting Node.js:
- Railway
- Render
- DigitalOcean App Platform
- AWS/GCP/Azure

Make sure to:
1. Set up PostgreSQL database
2. Configure environment variables
3. Run `npx prisma migrate deploy` after deployment

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email support@healthplus.com or open an issue in the repository.

## Acknowledgments

- Next.js team for the amazing framework
- Prisma for the excellent ORM
- Tailwind CSS for the utility-first CSS framework
