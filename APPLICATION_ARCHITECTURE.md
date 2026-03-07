# SERVIXA APPLICATION ARCHITECTURE
## Single Next.js Web App for All User Types

---

## TABLE OF CONTENTS

1. Application Overview
2. User Types & Roles
3. Authentication System
4. Routing Architecture
5. UI/UX Design Strategy
6. User Journeys
7. Service Provider Onboarding Flow
8. Payment Integration (RazorPay)
9. Navigation & Linking Strategy
10. Implementation Structure

---

## 1. APPLICATION OVERVIEW

### Single Next.js Application

**One codebase, multiple user experiences based on authentication state and role.**

```
servixa.com (Single Domain)
├── Public Routes (No Login Required)
│   ├── Customer browsing
│   ├── Service discovery
│   └── Provider profiles
│
├── Customer Routes (Customer Role)
│   ├── Dashboard
│   ├── Book services
│   └── Manage bookings
│
├── Provider Routes (Service Provider Role)
│   ├── Dashboard
│   ├── Job management
│   └── Earnings
│
├── Staff Routes (Staff Role)
│   ├── Support dashboard
│   ├── Ticket management
│   └── User support
│
└── Admin Routes (Admin Role)
    ├── Platform management
    ├── Provider approval
    └── System configuration
```

### Key Principles

1. **Role-Based Access Control (RBAC)**: User role determines accessible routes
2. **Public Customer Portal**: Browse services without login
3. **Progressive Disclosure**: Show features based on authentication state
4. **Unified Design System**: Same UI components, different layouts
5. **Deep Linking**: Everything clickable, connected, discoverable

---

## 2. USER TYPES & ROLES

### 2.1 User Roles

```typescript
enum UserRole {
  CUSTOMER = 'CUSTOMER',
  SERVICE_PROVIDER = 'SERVICE_PROVIDER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}
```

### 2.2 Role Capabilities

| Feature | Public | Customer | Provider | Staff | Admin |
|---------|--------|----------|----------|-------|-------|
| Browse Services | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Providers | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Job | ❌ | ✅ | ❌ | ❌ | ✅ |
| Accept Jobs | ❌ | ❌ | ✅ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ | ✅ |
| Approve Providers | ❌ | ❌ | ❌ | ❌ | ✅ |
| System Config | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. AUTHENTICATION SYSTEM

### 3.1 Authentication Methods

#### Method 1: OAuth (Google)
```
User clicks "Continue with Google"
→ Redirects to Google OAuth
→ Google returns user info
→ Backend creates/updates user
→ JWT token generated
→ User redirected to role-based dashboard
```

#### Method 2: Mobile OTP
```
User enters mobile number
→ OTP sent via SMS (using Twilio/MessageBird)
→ User enters OTP
→ Backend verifies OTP
→ JWT token generated
→ User redirected to role-based dashboard
```

### 3.2 Authentication Flow

```typescript
// Authentication State Management
interface AuthState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// User Object
interface User {
  id: string;
  email: string;
  mobile: string;
  name: string;
  role: UserRole;
  profileComplete: boolean;
  onboardingStatus?: OnboardingStatus;
}
```

### 3.3 Login Page Design

**Single Login Page with Multiple Options:**

```
┌─────────────────────────────────────┐
│         SERVIXA LOGIN                │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Continue with Google         │  │
│  │  [Google Icon]                │  │
│  └───────────────────────────────┘  │
│                                     │
│           OR                         │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Mobile Number                │  │
│  │  [91] [___________]           │  │
│  │                                │  │
│  │  [Send OTP]                    │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Enter OTP                    │  │
│  │  [____] [____] [____] [____]  │  │
│  │                                │  │
│  │  [Verify & Login]              │  │
│  └───────────────────────────────┘  │
│                                     │
│  New to SERVIXA?                    │
│  [Sign Up as Customer]              │
│  [Sign Up as Service Provider]      │
└─────────────────────────────────────┘
```

### 3.4 Authentication Implementation

```typescript
// lib/auth.ts
import { signIn, signOut, useSession } from 'next-auth/react';

export const useAuth = () => {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user,
    role: session?.user?.role,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };
};

// Login with Google
export const loginWithGoogle = () => {
  signIn('google', { callbackUrl: '/dashboard' });
};

// Login with OTP
export const loginWithOTP = async (mobile: string) => {
  // Step 1: Send OTP
  await fetch('/api/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ mobile }),
  });
  
  // Step 2: Verify OTP (in separate component)
};

export const verifyOTP = async (mobile: string, otp: string) => {
  const response = await fetch('/api/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ mobile, otp }),
  });
  
  const { token } = await response.json();
  // Store token and redirect
};
```

---

## 4. ROUTING ARCHITECTURE

### 4.1 Route Structure

```
/app
├── (public)                    # Public routes (no auth required)
│   ├── page.tsx               # Homepage (customer portal)
│   ├── services/
│   │   ├── page.tsx           # Browse services
│   │   └── [id]/
│   │       └── page.tsx       # Service details
│   ├── providers/
│   │   ├── page.tsx           # Browse providers
│   │   └── [id]/
│   │       └── page.tsx       # Provider profile
│   └── login/
│       └── page.tsx           # Login page
│
├── (customer)                  # Customer routes (auth required)
│   ├── dashboard/
│   │   └── page.tsx           # Customer dashboard
│   ├── jobs/
│   │   ├── page.tsx           # My jobs
│   │   ├── create/
│   │   │   └── page.tsx       # Create job
│   │   └── [id]/
│   │       └── page.tsx       # Job details
│   ├── profile/
│   │   └── page.tsx           # Customer profile
│   └── payments/
│       └── page.tsx           # Payment history
│
├── (provider)                   # Provider routes (auth required)
│   ├── dashboard/
│   │   └── page.tsx           # Provider dashboard
│   ├── jobs/
│   │   ├── page.tsx           # Available jobs
│   │   ├── my-jobs/
│   │   │   └── page.tsx       # My accepted jobs
│   │   └── [id]/
│   │       └── page.tsx       # Job details
│   ├── onboarding/
│   │   └── page.tsx           # Onboarding flow
│   ├── earnings/
│   │   └── page.tsx           # Earnings & payout
│   └── profile/
│       └── page.tsx           # Provider profile
│
├── (staff)                      # Staff routes (auth required)
│   ├── dashboard/
│   │   └── page.tsx           # Staff dashboard
│   ├── tickets/
│   │   ├── page.tsx           # Support tickets
│   │   └── [id]/
│   │       └── page.tsx       # Ticket details
│   ├── users/
│   │   └── page.tsx           # User management
│   └── support/
│       └── page.tsx           # Support tools
│
└── (admin)                      # Admin routes (auth required)
    ├── dashboard/
    │   └── page.tsx           # Admin dashboard
    ├── providers/
    │   ├── page.tsx           # Provider management
    │   ├── pending/
    │   │   └── page.tsx       # Pending approvals
    │   └── [id]/
    │       ├── page.tsx       # Provider details
    │       └── verify/
    │           └── page.tsx   # Verification page
    ├── users/
    │   └── page.tsx           # User management
    ├── jobs/
    │   └── page.tsx           # All jobs
    ├── payments/
    │   └── page.tsx           # Payment management
    ├── configuration/
    │   └── page.tsx           # System configuration
    └── analytics/
        └── page.tsx           # Analytics dashboard
```

### 4.2 Route Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  const path = request.nextUrl.pathname;

  // Public routes (no auth required)
  const publicRoutes = ['/', '/services', '/providers', '/login'];
  if (publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }

  // Protected routes require authentication
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based route protection
  const userRole = getUserRoleFromToken(token.value);
  
  if (path.startsWith('/admin') && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  if (path.startsWith('/staff') && !['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 4.3 Layout Structure

```typescript
// app/layout.tsx (Root Layout)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

// app/(customer)/layout.tsx (Customer Layout)
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth();
  
  if (role !== 'CUSTOMER') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <main>{children}</main>
      <CustomerFooter />
    </div>
  );
}

// Similar layouts for (provider), (staff), (admin)
```

---

## 5. UI/UX DESIGN STRATEGY

### 5.1 Design System (Unified)

**All user types share the same design system:**

```typescript
// Design Tokens (shared across all roles)
const designTokens = {
  colors: {
    primary: '#2563EB',
    accent: '#10B981',
    warning: '#F59E0B',
    // ... from MVP plan
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
  },
};
```

### 5.2 Component Library (Shared)

```
/components
├── ui/                          # Base UI components (shared)
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Badge.tsx
│   └── Avatar.tsx
│
├── layout/                      # Layout components
│   ├── Navbar.tsx              # Base navbar
│   ├── CustomerNavbar.tsx      # Customer-specific
│   ├── ProviderNavbar.tsx      # Provider-specific
│   ├── StaffNavbar.tsx         # Staff-specific
│   └── AdminNavbar.tsx          # Admin-specific
│
├── features/                    # Feature components
│   ├── JobCard.tsx              # Used by all roles
│   ├── ProviderCard.tsx        # Used by all roles
│   ├── ServiceCard.tsx          # Used by all roles
│   └── PaymentCard.tsx          # Used by customer/provider
│
└── role-specific/               # Role-specific components
    ├── customer/
    ├── provider/
    ├── staff/
    └── admin/
```

### 5.3 Navigation Design

**Each role has tailored navigation:**

#### Customer Navbar
```
[SERVIXA Logo] | Browse Services | My Jobs | Profile | [Avatar Menu]
```

#### Provider Navbar
```
[SERVIXA Logo] | Dashboard | Available Jobs | My Jobs | Earnings | Profile | [Avatar Menu]
```

#### Staff Navbar
```
[SERVIXA Logo] | Dashboard | Tickets | Users | Support Tools | [Avatar Menu]
```

#### Admin Navbar
```
[SERVIXA Logo] | Dashboard | Providers | Users | Jobs | Payments | Configuration | Analytics | [Avatar Menu]
```

### 5.4 Deep Linking Strategy

**Everything is clickable and connected:**

```typescript
// Example: Job Card Component
<JobCard job={job}>
  {/* Click job title → Go to job details */}
  <Link href={`/jobs/${job.id}`}>
    <h3>{job.title}</h3>
  </Link>
  
  {/* Click provider name → Go to provider profile */}
  <Link href={`/providers/${job.providerId}`}>
    <ProviderName>{job.providerName}</ProviderName>
  </Link>
  
  {/* Click service type → Go to service category */}
  <Link href={`/services?category=${job.serviceCategoryId}`}>
    <ServiceBadge>{job.serviceType}</ServiceBadge>
  </Link>
  
  {/* Click location → Show on map */}
  <Link href={`/jobs/${job.id}?tab=location`}>
    <Location>{job.address}</Location>
  </Link>
</JobCard>
```

---

## 6. USER JOURNEYS

### 6.1 Public User Journey (No Login)

```
Homepage
  ↓
Browse Services (Click service card)
  ↓
Service Details Page
  ↓
View Providers (Click "View Providers")
  ↓
Provider List (Filter, search)
  ↓
Provider Profile (Click provider card)
  ↓
[Login Required] → Login Page
  ↓
After Login → Create Job
```

### 6.2 Customer Journey (Logged In)

```
Customer Dashboard
  ↓
Create Job (Click "Book Service")
  ↓
Select Service Category
  ↓
Fill Job Form
  ↓
Submit Job
  ↓
Job Created → Job Details Page
  ↓
Wait for Provider Assignment
  ↓
Provider Assigned → Chat with Provider
  ↓
Provider On The Way → Track Location
  ↓
Job Started → Monitor Progress
  ↓
Job Completed → Make Payment
  ↓
Rate & Review Provider
  ↓
Back to Dashboard
```

### 6.3 Provider Journey (Logged In)

```
Provider Dashboard
  ↓
Check Available Jobs
  ↓
View Job Details (Click job card)
  ↓
Accept Job
  ↓
Job Accepted → Job Details Page
  ↓
Mark "On The Way"
  ↓
Start Job
  ↓
Upload Work Photos
  ↓
Complete Job
  ↓
Wait for Payment
  ↓
Payment Received → Earnings Updated
  ↓
Back to Dashboard
```

### 6.4 Staff Journey (Logged In)

```
Staff Dashboard
  ↓
View Support Tickets
  ↓
Open Ticket (Click ticket)
  ↓
Ticket Details Page
  ↓
Respond to Customer
  ↓
Resolve Ticket
  ↓
View User Profile (Click user link)
  ↓
User Details Page
  ↓
Back to Dashboard
```

### 6.5 Admin Journey (Logged In)

```
Admin Dashboard
  ↓
View Pending Provider Approvals
  ↓
Click Provider Card
  ↓
Provider Details Page
  ↓
Review Documents
  ↓
Verify Provider
  ↓
Approve/Reject Provider
  ↓
Provider Approved → Notification Sent
  ↓
Back to Dashboard
```

---

## 7. SERVICE PROVIDER ONBOARDING FLOW

### 7.1 Onboarding Steps

**Multi-step wizard with progress tracking:**

```
Step 1: Registration
  ├── Mobile OTP or Google OAuth
  └── Basic info (Name, Email)

Step 2: Document Upload
  ├── Government ID (Aadhaar/PAN)
  ├── Address Proof
  ├── Skill Certificates (optional)
  └── Profile Photo

Step 3: Skill Selection
  ├── Primary Skill (required)
  ├── Secondary Skills (optional)
  ├── Experience Years per Skill
  └── Certification Upload

Step 4: Service Area Selection
  ├── Select City
  ├── Select Zones
  ├── Select PODs (multiple)
  └── Set Service Radius

Step 5: Profile Completion
  ├── Business Name (if applicable)
  ├── Bio/Description
  ├── Service Rates (optional)
  └── Availability Preferences

Step 6: Verification (Admin Review)
  ├── Documents Under Review
  └── Wait for Approval

Step 7: Approval & Activation
  ├── Account Activated
  ├── Welcome to Dashboard
  └── Start Receiving Jobs
```

### 7.2 Onboarding UI Implementation

```typescript
// app/(provider)/onboarding/page.tsx
export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({});
  const totalSteps = 7;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <ProgressBar current={currentStep} total={totalSteps} />
        
        {/* Step Content */}
        <Card className="mt-8">
          {currentStep === 1 && <RegistrationStep onNext={handleNext} />}
          {currentStep === 2 && <DocumentUploadStep onNext={handleNext} />}
          {currentStep === 3 && <SkillSelectionStep onNext={handleNext} />}
          {currentStep === 4 && <ServiceAreaStep onNext={handleNext} />}
          {currentStep === 5 && <ProfileCompletionStep onNext={handleNext} />}
          {currentStep === 6 && <VerificationPendingStep />}
          {currentStep === 7 && <ApprovalCompleteStep />}
        </Card>
        
        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          {currentStep > 1 && (
            <Button onClick={handlePrevious}>Previous</Button>
          )}
          {currentStep < 5 && (
            <Button onClick={handleNext}>Next</Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 7.3 Onboarding Status Check

```typescript
// Middleware to check onboarding status
export function checkOnboardingStatus(user: User) {
  if (user.role === 'SERVICE_PROVIDER' && !user.onboardingComplete) {
    // Redirect to onboarding if not complete
    return '/onboarding';
  }
  return '/dashboard';
}
```

---

## 8. PAYMENT INTEGRATION (RAZORPAY)

### 8.1 RazorPay Setup

```typescript
// lib/razorpay.ts
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const createRazorpayOrder = async (amount: number, currency: string = 'INR') => {
  const options = {
    amount: amount * 100, // Convert to paise
    currency,
    receipt: `receipt_${Date.now()}`,
  };
  
  const order = await razorpay.orders.create(options);
  return order;
};

export const verifyPayment = async (razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string) => {
  const crypto = require('crypto');
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');
  
  return generated_signature === razorpay_signature;
};
```

### 8.2 Payment Component

```typescript
// components/payment/RazorpayButton.tsx
'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayButton({ amount, orderId, onSuccess, onFailure }: PaymentProps) {
  const handlePayment = () => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount * 100,
      currency: 'INR',
      name: 'SERVIXA',
      description: 'Service Payment',
      order_id: orderId,
      handler: async (response: any) => {
        // Verify payment on backend
        const verified = await verifyPayment(response);
        if (verified) {
          onSuccess(response);
        } else {
          onFailure('Payment verification failed');
        }
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.mobile,
      },
      theme: {
        color: '#2563EB',
      },
    };
    
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => console.log('Razorpay loaded')}
      />
      <Button onClick={handlePayment}>
        Pay ₹{amount}
      </Button>
    </>
  );
}
```

### 8.3 Payment Flow

```
Customer clicks "Pay Now"
  ↓
Create Razorpay Order (Backend)
  ↓
Open Razorpay Checkout (Frontend)
  ↓
Customer completes payment
  ↓
Razorpay callback
  ↓
Verify payment signature (Backend)
  ↓
Update payment status
  ↓
Release escrow (if applicable)
  ↓
Notify customer and provider
```

---

## 9. NAVIGATION & LINKING STRATEGY

### 9.1 Clickable Elements

**Every data element should be clickable:**

```typescript
// Example: Dashboard with clickable cards
<Dashboard>
  {/* Jobs Card - Click to view all jobs */}
  <Card onClick={() => router.push('/jobs')}>
    <h3>My Jobs</h3>
    <p>{jobCount} active jobs</p>
    <Link href="/jobs">View All →</Link>
  </Card>
  
  {/* Provider Card - Click to view provider */}
  <Card onClick={() => router.push(`/providers/${providerId}`)}>
    <Avatar src={providerPhoto} />
    <h3>{providerName}</h3>
    <Rating value={rating} />
    <Link href={`/providers/${providerId}`}>View Profile →</Link>
  </Card>
  
  {/* Service Card - Click to browse services */}
  <Card onClick={() => router.push('/services?category=AC_REPAIR')}>
    <ServiceIcon />
    <h3>AC Repair</h3>
    <p>50+ providers available</p>
    <Link href="/services?category=AC_REPAIR">Browse →</Link>
  </Card>
</Dashboard>
```

### 9.2 Breadcrumb Navigation

```typescript
// components/navigation/Breadcrumb.tsx
export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="mx-2" />}
            {item.href ? (
              <Link href={item.href} className="text-blue-600 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-500">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Usage
<Breadcrumb items={[
  { label: 'Home', href: '/' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Job #12345', href: null },
]} />
```

### 9.3 Related Content Links

```typescript
// Show related content on every page
<JobDetailsPage job={job}>
  <JobInfo job={job} />
  
  {/* Related Content Section */}
  <RelatedContent>
    <h3>Related</h3>
    
    {/* Same Provider's Other Jobs */}
    <Link href={`/providers/${job.providerId}/jobs`}>
      View all jobs by {job.providerName}
    </Link>
    
    {/* Similar Services */}
    <Link href={`/services?category=${job.serviceCategoryId}`}>
      Browse more {job.serviceCategory} services
    </Link>
    
    {/* Customer's Other Jobs */}
    <Link href={`/customers/${job.customerId}/jobs`}>
      View customer's service history
    </Link>
  </RelatedContent>
</JobDetailsPage>
```

---

## 10. IMPLEMENTATION STRUCTURE

### 10.1 Project Structure

```
servixa-web/
├── app/                          # Next.js 13+ App Router
│   ├── (public)/                 # Public routes
│   ├── (customer)/               # Customer routes
│   ├── (provider)/                # Provider routes
│   ├── (staff)/                   # Staff routes
│   ├── (admin)/                   # Admin routes
│   ├── api/                       # API routes
│   │   ├── auth/
│   │   ├── jobs/
│   │   ├── payments/
│   │   └── providers/
│   └── layout.tsx                 # Root layout
│
├── components/                     # React components
│   ├── ui/                        # Base UI components
│   ├── layout/                    # Layout components
│   ├── features/                  # Feature components
│   └── role-specific/             # Role-specific components
│
├── lib/                           # Utilities
│   ├── auth.ts                    # Authentication
│   ├── razorpay.ts                # Payment integration
│   ├── api.ts                     # API client
│   └── utils.ts                   # Helper functions
│
├── hooks/                         # Custom React hooks
│   ├── useAuth.ts
│   ├── useJobs.ts
│   └── usePayments.ts
│
├── types/                         # TypeScript types
│   ├── user.ts
│   ├── job.ts
│   └── payment.ts
│
├── styles/                        # Global styles
│   └── globals.css
│
└── public/                        # Static assets
    ├── images/
    └── icons/
```

### 10.2 Key Files

#### Authentication Setup
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Add OTP provider here
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      return session;
    },
  },
};

export default NextAuth(authOptions);
```

#### Role-Based Dashboard Redirect
```typescript
// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on role
      switch (role) {
        case 'CUSTOMER':
          router.push('/customer/dashboard');
          break;
        case 'SERVICE_PROVIDER':
          router.push('/provider/dashboard');
          break;
        case 'STAFF':
          router.push('/staff/dashboard');
          break;
        case 'ADMIN':
        case 'SUPER_ADMIN':
          router.push('/admin/dashboard');
          break;
        default:
          router.push('/');
      }
    }
  }, [user, role, isLoading, router]);

  return <div>Loading...</div>;
}
```

---

## 11. SUMMARY

### Key Design Decisions

1. **Single Next.js App**: One codebase, multiple user experiences
2. **Role-Based Routing**: Routes protected by user role
3. **Public Customer Portal**: Browse without login, login to book
4. **OAuth + OTP**: Google login + Mobile OTP for flexibility
5. **RazorPay Integration**: Payment processing
6. **Deep Linking**: Everything clickable and connected
7. **Unified Design System**: Same components, different layouts
8. **Simple User Journeys**: Clear paths for each user type

### Next Steps

1. Set up Next.js project with App Router
2. Configure authentication (NextAuth.js)
3. Implement RazorPay integration
4. Build component library
5. Create role-based layouts
6. Implement onboarding flow
7. Add deep linking throughout
8. Test user journeys

**Ready to start building! 🚀**
