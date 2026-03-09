# SERVICHAYA - Frontend Application

## Next.js 13+ Application for SERVICHAYA Platform

### Tech Stack
- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Animations**: Framer Motion
- **Authentication**: NextAuth.js
- **State Management**: React Context / Zustand
- **API Client**: Axios / Fetch

### Project Structure

```
SERVICHAYA/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes (no auth)
│   ├── (customer)/               # Customer routes
│   ├── (provider)/                # Provider routes
│   ├── (staff)/                   # Staff routes
│   ├── (admin)/                   # Admin routes
│   ├── api/                       # API routes
│   └── layout.tsx                 # Root layout
│
├── components/                    # React Components
│   ├── ui/                        # Base UI components
│   ├── layout/                    # Layout components
│   ├── features/                  # Feature components
│   └── role-specific/             # Role-specific components
│
├── lib/                           # Utilities
│   ├── auth.ts                    # Authentication
│   ├── api.ts                     # API client
│   ├── razorpay.ts                # Payment integration
│   └── utils.ts                   # Helper functions
│
├── hooks/                         # Custom hooks
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

### Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

**⚠️ IMPORTANT:** `NEXT_PUBLIC_API_URL` is **REQUIRED** and must be set as a Linux environment variable.

```bash
# Set in Linux environment (REQUIRED)
export NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Or create .env file for development
echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api" > .env
```

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for detailed setup instructions.

**Required Variables:**
- `NEXT_PUBLIC_API_URL` - Backend API URL (REQUIRED)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Razorpay key for payments (REQUIRED for payments)

**Optional Variables:**
- `NEXTAUTH_URL` - NextAuth URL
- `NEXTAUTH_SECRET` - NextAuth secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### Key Features

- ✅ Public customer portal (browse without login)
- ✅ Role-based routing (Customer, Provider, Staff, Admin)
- ✅ OAuth (Google) + Mobile OTP authentication
- ✅ RazorPay payment integration
- ✅ Provider onboarding flow
- ✅ Deep linking (everything clickable)
- ✅ Mobile-first responsive design

### Development Guidelines

Follow **APPLICATION_ARCHITECTURE.md** and **USER_JOURNEYS_AND_UI_GUIDE.md** for:
- Routing structure
- Component design
- User journeys
- UI/UX patterns

---

**Built for SERVICHAYA Platform** 🚀
