# HealthPlus Authentication & User Management System

Complete documentation of the authentication and user management system implemented in HealthPlus.

---

## Table of Contents

1. [Overview](#overview)
2. [Admin User Creation](#admin-user-creation)
3. [Normal User Signup](#normal-user-signup)
4. [Login Flow](#login-flow)
5. [Data Storage & Models](#data-storage--models)
6. [Session Management](#session-management)
7. [Security Considerations](#security-considerations)
8. [Admin Management Guide](#admin-management-guide)
9. [For Non-Technical Admins](#for-non-technical-admins)

---

## Overview

HealthPlus uses **NextAuth.js v5** with a **Credentials Provider** for authentication. The system supports two user roles:
- **USER**: Regular customers who can shop, subscribe, and manage their orders
- **ADMIN**: Staff members who can manage products, orders, prescriptions, and view reports

**Key Technologies:**
- **NextAuth.js v5**: Authentication framework
- **bcryptjs**: Password hashing (12 rounds)
- **Zod**: Input validation
- **Prisma**: Database ORM
- **PostgreSQL**: Database (via Supabase)
- **JWT**: Session strategy

---

## Admin User Creation

### 1. Default Admin Creation (Seed Script)

The default admin user is created automatically when you run the database seed script.

**Location:** `prisma/seed.ts` (lines 410-429)

**Process:**
```typescript
const adminPhone = process.env.DEFAULT_ADMIN_PHONE || '+8801712345678'
const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!'
const adminName = process.env.DEFAULT_ADMIN_NAME || 'Admin User'
const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@healthplus.com'

const hashedPassword = await hash(adminPassword, 10)

const adminUser = await prisma.user.upsert({
  where: { phone: adminPhone },
  update: {},
  create: {
    phone: adminPhone,
    password: hashedPassword,
    name: adminName,
    email: adminEmail,
    role: 'ADMIN',
  },
})
```

**Default Credentials:**
- **Phone:** `+8801712345678`
- **Password:** `ChangeMe123!`
- **Role:** `ADMIN`

**To Run Seed Script:**
```bash
npm run db:seed
```

### 2. Database Table & Fields

**Table:** `User`

**Admin-Specific Fields:**
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String?  @unique
  phone     String   @unique
  password  String
  role      Role     @default(USER)  // ADMIN or USER
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // ... relations
}

enum Role {
  USER
  ADMIN
}
```

### 3. Creating Another Admin User Manually

**Option A: Via Database (Recommended)**

1. **Sign up a normal user** through the signup page (`/auth/signup`)
   - Provide: name, phone, email, password
   - Both phone and email are now required

2. **Connect to your Supabase database** (SQL Editor)

3. **Run this SQL query to promote user to ADMIN:**
   ```sql
   -- Promote by phone
   UPDATE "User" 
   SET role = 'ADMIN' 
   WHERE phone = '+8801XXXXXXXXX';
   
   -- OR promote by email
   UPDATE "User" 
   SET role = 'ADMIN' 
   WHERE email = 'admin@example.com';
   ```
   Replace with the actual phone number or email.

4. **Verify the change:**
   ```sql
   SELECT id, name, phone, email, role 
   FROM "User" 
   WHERE role = 'ADMIN';
   ```

**Creating Admin with Real Email + Phone:**

To create a new admin user with specific credentials:

```sql
-- First, check if user exists
SELECT id, name, phone, email, role FROM "User" 
WHERE phone = '+8801XXXXXXXXX' OR email = 'newadmin@healthplus.com';

-- If user doesn't exist, sign them up through /auth/signup first
-- Then promote to ADMIN:
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'newadmin@healthplus.com';

-- Verify
SELECT id, name, phone, email, role FROM "User" 
WHERE email = 'newadmin@healthplus.com';
```

**Important Notes:**
- Both phone and email must be unique in the database
- Email is stored in lowercase
- Phone is stored with +88 prefix
- Admin can log in with either phone or email

**Option B: Via Seed Script (For Initial Setup)**

1. Edit `prisma/seed.ts`
2. Add environment variables to `.env`:
   ```env
   DEFAULT_ADMIN_PHONE=+8801712345678
   DEFAULT_ADMIN_PASSWORD=YourSecurePassword123!
   DEFAULT_ADMIN_NAME=Admin Name
   DEFAULT_ADMIN_EMAIL=admin@healthplus.com
   ```
3. Run: `npm run db:seed`

**Option C: Create Admin Signup API (Advanced)**

You could create a protected API route that allows existing admins to create new admin users. This would require:
- Authentication check (must be ADMIN)
- Input validation
- Password hashing
- Role assignment

---

## Normal User Signup

### 1. Signup API Route

**Location:** `app/api/auth/signup/route.ts`

**Endpoint:** `POST /api/auth/signup`

### 2. Required Fields

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "01712345678",  // or "+8801712345678"
  "email": "john@example.com",  // REQUIRED
  "password": "SecurePass123!"
}
```

**Validation Rules (Zod Schema):**
- **name**: Minimum 2 characters
- **phone**: Must match Bangladesh phone format: `^(\+88)?01[3-9]\d{8}$`
  - Accepts: `01712345678` or `+8801712345678`
  - Automatically normalizes to `+88` format
- **email**: Valid email format (REQUIRED)
  - Automatically converted to lowercase
  - Must be unique in database
- **password**: 
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number

### 3. Signup Process Flow

```
1. User submits signup form
   ↓
2. Zod validates input (name, phone, email, password)
   ↓
3. Phone number normalized (+88 prefix)
   ↓
4. Email normalized (lowercase, trimmed)
   ↓
5. Check if phone already exists
   ↓
6. Check if email already exists
   ↓
7. Hash password with bcrypt (12 rounds)
   ↓
8. Create user in database with role='USER'
   ↓
9. Return success response (no auto-login)
```

### 4. Prisma Model & Table

**Model:** `User`

**Default Values:**
- `role`: `USER` (automatically assigned)
- `createdAt`: Current timestamp
- `updatedAt`: Current timestamp

**Database Write:**
```typescript
const normalizedPhone = phone.startsWith('+88') ? phone : `+88${phone}`
const normalizedEmail = email.toLowerCase().trim()

const user = await prisma.user.create({
  data: {
    name,
    phone: normalizedPhone,  // +8801XXXXXXXXX
    email: normalizedEmail,  // lowercase email
    password: hashedPassword,
    role: 'USER',  // Default role
  },
})
```

### 5. Response

**Success (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "clxxx...",
    "name": "John Doe",
    "phone": "+8801712345678",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2025-11-21T10:00:00.000Z"
  }
}
```

**Error (400 - Validation):**
```json
{
  "error": "Validation failed",
  "details": {
    "password": ["Password must contain at least one uppercase letter"]
  }
}
```

**Error (409 - Duplicate):**
```json
{
  "error": "User with this phone number already exists"
}
```

---

## Login Flow

### 1. Login Route & Configuration

**NextAuth Configuration:** `lib/auth.ts`

**Login Page:** `app/auth/signin/page.tsx`

**API Endpoint:** `POST /api/auth/callback/credentials` (handled by NextAuth)

### 2. Login with Phone or Email

**Users can log in using EITHER their phone number OR email address** with the same password.

**Accepted Formats:**

**Phone Numbers (Bangladesh):**
- `01712345678` (local format)
- `8801712345678` (country code without +)
- `+8801712345678` (international format)

All formats are automatically normalized to `+8801XXXXXXXXX` before database lookup.

**Email Addresses:**
- Any valid email format: `user@example.com`
- Case-insensitive (automatically converted to lowercase)

**Example Login Inputs:**
```
✅ 01712345678 + password
✅ +8801712345678 + password
✅ admin@healthplus.com + password
✅ ADMIN@healthplus.com + password (case doesn't matter)
```

### 3. Login Process

```
1. User enters identifier (phone or email) + password
   ↓
2. Form submits to NextAuth
   ↓
3. NextAuth calls CredentialsProvider.authorize()
   ↓
4. authorize() calls verifyCredentials(identifier, password)
   ↓
5. verifyCredentials() attempts phone lookup first
   ↓
6. If not found by phone, attempts email lookup
   ↓
7. User found? → Compare password with bcrypt
   ↓
8. Password valid? → Return user object
   ↓
9. NextAuth creates JWT token
   ↓
10. JWT stored in HTTP-only cookie
   ↓
11. User redirected based on role
```

### 4. Identifier & Password Validation

**verifyCredentials Function** (`lib/auth.ts`):

```typescript
function normalizeBdPhone(input: string): string | null {
  const raw = input.replace(/\s+/g, '')
  const bdLocal = /^01[3-9]\d{8}$/
  const bdNoPlus = /^8801[3-9]\d{8}$/
  const bdPlus = /^\+8801[3-9]\d{8}$/
  
  if (bdLocal.test(raw)) return `+88${raw}`
  if (bdNoPlus.test(raw)) return `+${raw}`
  if (bdPlus.test(raw)) return raw
  return null
}

export async function verifyCredentials(identifier: string, password: string) {
  const { prisma } = await import('./prisma')  // Dynamic import for Edge compatibility
  
  let user = null
  
  // 1. Try phone lookup first
  const maybePhone = normalizeBdPhone(identifier)
  if (maybePhone) {
    user = await prisma.user.findUnique({
      where: { phone: maybePhone },
    })
  }
  
  // 2. If not found by phone, try email lookup
  if (!user) {
    const email = identifier.trim().toLowerCase()
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    
    if (looksLikeEmail) {
      user = await prisma.user.findUnique({
        where: { email },
      })
    }
  }

  // 3. Check if user exists and has password
  if (!user || !user.password) {
    return null
  }

  // 4. Compare password with bcrypt
  const isPasswordValid = await compare(password, user.password)

  if (!isPasswordValid) {
    return null
  }

  // 5. Return user data (without password)
  return {
    id: user.id,
    name: user.name,
    email: user.email || null,
    phone: user.phone,
    role: user.role,
  }
}
```

**Lookup Priority:**
1. **Phone first**: If identifier looks like a Bangladesh phone number, normalize and search by phone
2. **Email second**: If not found by phone (or doesn't look like phone), treat as email and search by email
3. **Case-insensitive email**: Emails are automatically lowercased before lookup

**Security Features:**
- Password never returned in response
- bcrypt.compare() for secure password verification
- Returns `null` on any failure (no specific error messages to prevent enumeration)
- Generic error message: "Invalid credentials" (doesn't reveal whether phone/email exists)

### 4. Session Management

**Strategy:** JWT (JSON Web Tokens)

**Configuration:**
```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',  // Tokens stored in HTTP-only cookies
  },
  pages: {
    signIn: '/auth/signin',
  },
  // ...
})
```

**JWT Callback** (Adds user data to token):
```typescript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id
    token.role = user.role
    token.phone = user.phone
    token.email = user.email
    token.name = user.name
  }
  return token
}
```

**Session Callback** (Adds token data to session):
```typescript
async session({ session, token }) {
  if (session.user) {
    session.user.id = token.id as string
    session.user.role = token.role as string
    session.user.phone = token.phone as string
    session.user.email = token.email as string | undefined
    session.user.name = token.name as string
  }
  return session
}
```

### 5. How getServerSession() Works

**In Server Components:**
```typescript
import { auth } from '@/lib/auth'

export default async function Page() {
  const session = await auth()
  
  if (!session) {
    // User not logged in
  }
  
  console.log(session.user.role)  // 'USER' or 'ADMIN'
}
```

**In API Routes:**
```typescript
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Access user data
  const userId = session.user.id
  const userRole = session.user.role
}
```

**In Middleware:**
```typescript
import { auth } from '@/lib/auth'

export default auth((req) => {
  const session = req.auth  // Session available on request
  
  if (!session) {
    // Redirect to login
  }
})
```

### 6. Redirect Rules After Login

**Middleware Configuration** (`middleware.ts`):

```typescript
export default auth((req) => {
  const session = req.auth
  const path = req.nextUrl.pathname

  // Admin routes - require ADMIN role
  if (path.startsWith('/admin')) {
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }

  // Dashboard routes - require any authenticated user
  if (path.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
}
```

**Redirect Logic:**
- **USER login** → Can access `/dashboard`, redirected from `/admin`
- **ADMIN login** → Can access both `/admin` and `/dashboard`
- **No session** → Redirected to `/auth/signin`

---

## Data Storage & Models

### 1. User Model (Core)

```prisma
model User {
  id                String            @id @default(cuid())
  name              String
  email             String?           @unique
  phone             String            @unique
  password          String
  role              Role              @default(USER)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  addresses         Address[]
  prescriptions     Prescription[]
  orders            Order[]
  memberships       UserMembership[]
  subscriptions     Subscription[]
}
```

**Key Points:**
- `phone` is the unique identifier for login
- `email` is optional
- `password` is bcrypt hashed (never stored in plain text)
- `role` defaults to `USER`

### 2. Related Models

#### Address Model
```prisma
model Address {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName        String
  phone           String
  addressLine1    String
  addressLine2    String?
  city            String
  zoneId          String
  zone            Zone     @relation(fields: [zoneId], references: [id])
  isDefault       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  orders          Order[]
}
```

**Relationship:** One user can have multiple addresses

#### Prescription Model
```prisma
model Prescription {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  phone       String
  zoneId      String?
  fileUrl     String   // Supabase Storage path
  status      String   @default("PENDING")  // PENDING, APPROVED, REJECTED
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Relationship:** One user can upload multiple prescriptions

#### Order Model
```prisma
model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  addressId       String
  address         Address       @relation(fields: [addressId], references: [id])
  status          OrderStatus   @default(PENDING)
  subtotal        Float
  discount        Float         @default(0)
  deliveryCharge  Float
  total           Float
  paymentMethod   PaymentMethod @default(COD)
  paymentStatus   String        @default("PENDING")
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  items           OrderItem[]
}
```

**Relationship:** One user can have multiple orders

#### UserMembership Model
```prisma
model UserMembership {
  id          String         @id @default(cuid())
  userId      String
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  planId      String
  plan        MembershipPlan @relation(fields: [planId], references: [id])
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean        @default(true)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}
```

**Relationship:** One user can have multiple memberships (historical records)

#### Subscription Model
```prisma
model Subscription {
  id              String           @id @default(cuid())
  userId          String
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  planId          String
  plan            SubscriptionPlan @relation(fields: [planId], references: [id])
  startDate       DateTime
  nextDeliveryDate DateTime
  isActive        Boolean          @default(true)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}
```

**Relationship:** One user can have multiple subscriptions

### 3. Data Relationships Diagram

```
User (Core)
├── addresses[] (Address)
│   └── zone (Zone)
│   └── orders[] (Order)
├── prescriptions[] (Prescription)
├── orders[] (Order)
│   └── items[] (OrderItem)
│       └── medicine (Medicine)
├── memberships[] (UserMembership)
│   └── plan (MembershipPlan)
└── subscriptions[] (Subscription)
    └── plan (SubscriptionPlan)
        └── items[] (SubscriptionItem)
            └── medicine (Medicine)
```

### 4. Cascade Deletion

When a user is deleted, the following are automatically deleted:
- All addresses (`onDelete: Cascade`)
- All prescriptions (`onDelete: Cascade`)
- All memberships (`onDelete: Cascade`)
- All subscriptions (`onDelete: Cascade`)

Orders are NOT deleted (they reference the user but don't cascade delete).

---

## Session Management

### 1. Session Storage

**Method:** JWT tokens stored in HTTP-only cookies

**Cookie Name:** `authjs.session-token` (or `__Secure-authjs.session-token` in production)

**Cookie Properties:**
- `httpOnly: true` - Cannot be accessed by JavaScript
- `secure: true` - Only sent over HTTPS (in production)
- `sameSite: 'lax'` - CSRF protection

### 2. Session Data Structure

```typescript
{
  user: {
    id: string,
    name: string,
    email: string | undefined,  // Now included in session
    phone: string,
    role: 'USER' | 'ADMIN'
  },
  expires: string  // ISO timestamp
}
```

### 3. Accessing Session Data

**Server Components:**
```typescript
import { auth } from '@/lib/auth'

const session = await auth()
if (session) {
  console.log(session.user.id)
  console.log(session.user.role)
}
```

**Client Components:**
```typescript
'use client'
import { useSession } from 'next-auth/react'

export default function Component() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return <div>Not logged in</div>
  
  return <div>Hello {session.user.name}</div>
}
```

**API Routes:**
```typescript
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Use session.user.id, session.user.role, etc.
}
```

### 4. Session Expiration

**Default:** 30 days

**Refresh:** Automatic on page navigation

**Manual Refresh:**
```typescript
import { signIn } from 'next-auth/react'

// Refresh session
await signIn('credentials', { redirect: false })
```

---

## Security Considerations

### 1. Password Security

✅ **Implemented:**
- bcrypt hashing with 12 rounds
- Strong password requirements (8+ chars, uppercase, lowercase, number)
- Passwords never returned in API responses
- Passwords never logged

⚠️ **Recommendations:**
- Add password reset functionality
- Implement rate limiting on login attempts
- Add 2FA for admin accounts
- Consider password expiration policy

### 2. Session Security

✅ **Implemented:**
- HTTP-only cookies (XSS protection)
- JWT strategy (stateless)
- Secure cookies in production (HTTPS only)
- SameSite cookie attribute (CSRF protection)

⚠️ **Recommendations:**
- Implement session invalidation on password change
- Add "logout all devices" functionality
- Monitor for suspicious login patterns

### 3. API Security

✅ **Implemented:**
- Middleware protection for `/admin` and `/dashboard` routes
- Role-based access control (RBAC)
- Input validation with Zod
- SQL injection protection (Prisma ORM)

⚠️ **Recommendations:**
- Add rate limiting on all API routes
- Implement API request logging
- Add CORS configuration for production
- Consider adding API keys for external integrations

### 4. Data Security

✅ **Implemented:**
- Unique constraints on phone and email
- Cascade deletion for user data
- Environment variables for sensitive config

⚠️ **Recommendations:**
- Encrypt sensitive user data at rest
- Implement data retention policies
- Add audit logging for admin actions
- Regular database backups

### 5. Production Security Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Set strong `NEXTAUTH_SECRET` (32+ random characters)
- [ ] Enable HTTPS (Vercel does this automatically)
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Review and restrict database access
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Add rate limiting middleware
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure CORS properly
- [ ] Review all environment variables
- [ ] Test authentication flows thoroughly
- [ ] Set up automated backups

---

## Admin Management Guide

### How to Promote a User to Admin

**Method 1: Via Supabase SQL Editor (Recommended)**

1. Log in to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run this query:
   ```sql
   -- Find the user first
   SELECT id, name, phone, role FROM "User" WHERE phone = '+8801XXXXXXXXX';
   
   -- Promote to admin
   UPDATE "User" 
   SET role = 'ADMIN' 
   WHERE phone = '+8801XXXXXXXXX';
   
   -- Verify the change
   SELECT id, name, phone, role FROM "User" WHERE phone = '+8801XXXXXXXXX';
   ```

**Method 2: Via Supabase Table Editor**

1. Log in to Supabase Dashboard
2. Navigate to **Table Editor** → **User** table
3. Find the user by phone number
4. Click on the `role` field
5. Change from `USER` to `ADMIN`
6. Save changes

### How to Change Default Admin Credentials

**Step 1: Change Password via Database**

```sql
-- First, generate a bcrypt hash for your new password
-- Use an online bcrypt generator with 12 rounds
-- Example: https://bcrypt-generator.com/

-- Then update the password
UPDATE "User" 
SET password = '$2a$12$YOUR_BCRYPT_HASH_HERE'
WHERE phone = '+8801712345678';
```

**Step 2: Update Environment Variables**

Edit your `.env` file:
```env
DEFAULT_ADMIN_PHONE=+8801YOURNEWPHONE
DEFAULT_ADMIN_PASSWORD=YourNewSecurePassword123!
DEFAULT_ADMIN_NAME=Your Admin Name
DEFAULT_ADMIN_EMAIL=youremail@healthplus.com
```

**Step 3: Re-run Seed Script (Optional)**

If you want to create a new admin with the new credentials:
```bash
npm run db:seed
```

### How to Revoke Admin Access

```sql
-- Demote admin to regular user
UPDATE "User" 
SET role = 'USER' 
WHERE phone = '+8801XXXXXXXXX';

-- Verify
SELECT id, name, phone, role FROM "User" WHERE phone = '+8801XXXXXXXXX';
```

### How to Delete a User

⚠️ **Warning:** This will cascade delete all user data (addresses, prescriptions, memberships, subscriptions)

```sql
-- Delete user and all related data
DELETE FROM "User" WHERE phone = '+8801XXXXXXXXX';
```

---

## For Non-Technical Admins

### How to Login as Admin

1. **Open the admin login page:**
   - Go to: `https://your-domain.com/auth/signin`
   - Or click "Login" on the homepage

2. **Enter your credentials:**
   - **Phone Number:** Your admin phone (e.g., `+8801712345678`)
   - **Password:** Your admin password

3. **Click "Sign In"**

4. **Access admin panel:**
   - After login, go to: `https://your-domain.com/admin`
   - Or click "Admin" in the navigation menu

### What Can Admins Do?

Once logged in as admin, you can:

- **View Dashboard:** See overview of orders, sales, and subscriptions
- **Manage Prescriptions:** Approve or reject customer prescription uploads
- **View Sales Reports:** See total orders, revenue, and active subscriptions
- **Manage Orders:** View and update order statuses
- **Manage Products:** Add, edit, or remove medicines (via API)
- **Manage Categories:** Add or edit medicine categories (via API)

### How to Add a New Staff Member

**Option 1: Ask Them to Sign Up First**

1. Tell the new staff member to:
   - Go to `https://your-domain.com/auth/signup`
   - Fill in their name, phone, and password
   - Click "Sign Up"

2. After they sign up, you need to promote them:
   - Contact your technical team
   - Provide the staff member's phone number
   - Ask them to run this command:
     ```sql
     UPDATE "User" SET role = 'ADMIN' WHERE phone = '+8801XXXXXXXXX';
     ```

**Option 2: Ask Technical Team**

1. Provide the following information to your technical team:
   - Staff member's name
   - Staff member's phone number
   - Staff member's email (optional)

2. They will create the admin account for you

### How to Reset a Password

**If You Forgot Your Password:**

Currently, there is no self-service password reset. You need to:

1. Contact your technical team
2. Provide your phone number
3. They will generate a new password for you
4. Change it after first login

**If a Staff Member Forgot Their Password:**

1. Contact your technical team
2. Provide the staff member's phone number
3. Technical team will reset the password
4. Give the new password to the staff member
5. Ask them to change it after login

### Common Issues

**"Invalid phone number or password"**
- Make sure you're using the correct phone format: `+8801XXXXXXXXX`
- Check that you're typing the password correctly (case-sensitive)
- Contact technical team if you've forgotten your password

**"Access Denied" when accessing admin pages**
- Make sure you're logged in as an admin (not a regular user)
- Contact technical team to verify your admin status

**Can't see admin menu**
- Make sure you're logged in
- Make sure your account has ADMIN role
- Try logging out and logging in again

### Getting Help

If you encounter any issues:

1. **Check your login credentials** - Make sure phone and password are correct
2. **Try a different browser** - Sometimes browser cache causes issues
3. **Contact technical support** - Provide:
   - Your phone number
   - What you were trying to do
   - Any error messages you saw
   - Screenshot if possible

---

## Summary

**Key Points:**

1. **Admin Creation:**
   - Default admin created via seed script (`+8801712345678` / `ChangeMe123!`)
   - Additional admins created by promoting existing users via SQL

2. **User Signup:**
   - Users sign up via `/api/auth/signup`
   - Required: name, phone, password (8+ chars, uppercase, lowercase, number)
   - Default role: `USER`

3. **Login:**
   - NextAuth with Credentials Provider
   - Phone + password authentication
   - bcrypt password verification
   - JWT session strategy

4. **Data Storage:**
   - PostgreSQL database via Supabase
   - User model with relations to addresses, orders, prescriptions, memberships, subscriptions
   - Cascade deletion for user-owned data

5. **Security:**
   - bcrypt password hashing (12 rounds)
   - HTTP-only cookies
   - Role-based access control
   - Input validation with Zod
   - Middleware protection for admin routes

**Change Default Admin Password Immediately in Production!**

---

*Last Updated: November 21, 2025*
