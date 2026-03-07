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

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

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
