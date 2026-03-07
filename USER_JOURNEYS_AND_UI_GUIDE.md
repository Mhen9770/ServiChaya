# SERVIXA USER JOURNEYS & UI/UX GUIDE
## Simple, Clickable, Connected Experiences

---

## 1. UI/UX PRINCIPLES

### Core Principles

1. **Everything is Clickable**: Every card, badge, name, location → Links to relevant page
2. **Progressive Disclosure**: Show more as user explores deeper
3. **Contextual Actions**: Actions appear where they're needed
4. **Visual Hierarchy**: Important actions stand out
5. **Consistent Navigation**: Same patterns across all roles
6. **Mobile-First**: 60%+ users on mobile

---

## 2. PUBLIC USER EXPERIENCE (No Login)

### Homepage Design

```
┌─────────────────────────────────────────────────────────┐
│  [SERVIXA Logo]                    [Login] [Sign Up]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Get Services at Your Doorstep                   │   │
│  │  Trusted professionals. Verified providers.           │   │
│  │                                                   │   │
│  │  [Search Services...]                            │   │
│  │  [📍 Use My Location]                            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Popular Services                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │  AC  │ │Plumb │ │Elect │ │Clean │                  │
│  │Repair│ │  ing │ │rical │ │  ing │                  │
│  └──────┘ └──────┘ └──────┘ └──────┘                  │
│    ↓        ↓        ↓        ↓                        │
│  [Click to browse services in this category]            │
│                                                          │
│  How It Works                                           │
│  1. Select Service → 2. Get Matched → 3. Service Done  │
│                                                          │
│  Trust Indicators                                       │
│  ✓ 10,000+ Verified Providers                           │
│  ✓ 50,000+ Jobs Completed                               │
│  ✓ 4.8★ Average Rating                                  │
│                                                          │
│  [Get Started - It's Free]                             │
└─────────────────────────────────────────────────────────┘
```

### Service Browsing (No Login)

```
┌─────────────────────────────────────────────────────────┐
│  [← Back]  AC Repair Services                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Filters: [All] [Gas Refill] [Cleaning] [Installation] │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [Provider Photo]  Rajesh AC Services            │   │
│  │                    ⭐ 4.8 (234 reviews)          │   │
│  │                    📍 2.5 km away                 │   │
│  │                    💰 ₹500 - ₹2000              │   │
│  │                    ✓ Verified                     │   │
│  │                                                   │   │
│  │  [View Profile →]  [Book Now]                    │   │
│  └──────────────────────────────────────────────────┘   │
│    ↓ Click anywhere on card → Provider Profile           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [Provider Photo]  Cool Air Solutions             │   │
│  │                    ⭐ 4.9 (567 reviews)          │   │
│  │                    📍 1.2 km away                 │   │
│  │                    💰 ₹600 - ₹2500              │   │
│  │                    ✓ Verified | ⭐ Premium       │   │
│  │                                                   │   │
│  │  [View Profile →]  [Book Now]                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Load More Providers]                                   │
└─────────────────────────────────────────────────────────┘

Click Actions:
- Provider Photo/Name → Provider Profile Page
- "View Profile" → Provider Profile Page
- "Book Now" → Login Required → After Login → Create Job
- Rating → Reviews Page
- Location → Map View
- Service Type Badge → Filter by Service Type
```

---

## 3. CUSTOMER JOURNEY (Logged In)

### Customer Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  [SERVIXA]  [Services] [My Jobs] [Profile] [Avatar ▼]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Welcome back, Priya! 👋                                 │
│                                                          │
│  Quick Actions                                          │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │  [Book Service]   │  │  [Hire Worker]    │           │
│  └──────────────────┘  └──────────────────┘           │
│                                                          │
│  My Active Jobs (2)                                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  AC Repair - Gas Refill                          │   │
│  │  Provider: Rajesh AC Services                    │   │
│  │  Status: 🔵 Provider On The Way                   │   │
│  │  ETA: 15 minutes                                 │   │
│  │                                                   │   │
│  │  [Track Location] [Chat] [View Details →]       │   │
│  └──────────────────────────────────────────────────┘   │
│    ↓ Click → Job Details Page                            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Plumbing - Leak Fix                              │   │
│  │  Provider: Quick Fix Plumbers                     │   │
│  │  Status: 🟢 Job Completed                          │   │
│  │  Amount: ₹1,200                                   │   │
│  │                                                   │   │
│  │  [Pay Now] [Rate Provider] [View Details →]       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Recent Services                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐                            │
│  │  AC  │ │Plumb │ │Clean │                            │
│  │  ✓   │ │  ✓   │ │  ✓   │                            │
│  └──────┘ └──────┘ └──────┘                            │
│    ↓ Click → Service History                            │
│                                                          │
│  Recommended Providers                                  │
│  [Scrollable cards - Click to view profile]              │
└─────────────────────────────────────────────────────────┘
```

### Job Creation Flow

```
Step 1: Select Service
┌─────────────────────────────────────────────────────────┐
│  [← Back]  Book a Service                               │
│  Step 1 of 3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                          │
│  What service do you need?                              │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐                            │
│  │  AC  │ │Plumb │ │Elect │                            │
│  │Repair│ │  ing │ │rical │                            │
│  └──────┘ └──────┘ └──────┘                            │
│    ↓ Click → Step 2                                      │
│                                                          │
│  Or search: [Search services...]                        │
└─────────────────────────────────────────────────────────┘

Step 2: Describe Problem
┌─────────────────────────────────────────────────────────┐
│  [← Back]  Book a Service                               │
│  Step 2 of 3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                          │
│  AC Repair > Gas Refill                                  │
│                                                          │
│  Describe the problem *                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  AC is not cooling properly. Need gas refill.    │   │
│  │                                                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Upload photos (optional)                                │
│  [📷 Add Photo] [📷 Add Photo] [📷 Add Photo]          │
│                                                          │
│  Preferred time *                                        │
│  [📅 Today] [🕐 2:00 PM]                                │
│                                                          │
│  [Continue →]                                           │
└─────────────────────────────────────────────────────────┘

Step 3: Location & Submit
┌─────────────────────────────────────────────────────────┐
│  [← Back]  Book a Service                               │
│  Step 3 of 3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                          │
│  AC Repair > Gas Refill                                 │
│  AC is not cooling properly. Need gas refill.           │
│                                                          │
│  Select address *                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  🏠 Home (Primary)                                │   │
│  │  123, Main Street, Indore                         │   │
│  │  [Select]                                         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Or [📍 Use Current Location]                          │
│                                                          │
│  Emergency Service? [ ] Yes, I need urgent help         │
│                                                          │
│  [Submit Job Request]                                   │
└─────────────────────────────────────────────────────────┘
```

### Job Details Page (Customer View)

```
┌─────────────────────────────────────────────────────────┐
│  [← Back]  Job #12345                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Job Status: 🔵 Provider On The Way                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Timeline                                        │   │
│  │  ✓ Job Created (2:00 PM)                         │   │
│  │  ✓ Provider Assigned (2:05 PM)                   │   │
│  │  ✓ Provider Accepted (2:06 PM)                   │   │
│  │  🔵 Provider On The Way (2:10 PM)                 │   │
│  │  ⏳ Started (Pending)                            │   │
│  │  ⏳ Completed (Pending)                          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Provider Details                                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [Photo]  Rajesh AC Services                      │   │
│  │           ⭐ 4.8 (234 reviews)                    │   │
│  │           📍 1.2 km away | ETA: 10 min           │   │
│  │           ✓ Verified                              │   │
│  │                                                   │   │
│  │  [View Profile →] [Call] [Chat]                    │   │
│  └──────────────────────────────────────────────────┘   │
│    ↓ Click Provider → Provider Profile                  │
│                                                          │
│  Job Details                                            │
│  Service: AC Repair > Gas Refill                        │
│  Location: 123, Main Street, Indore                     │
│  Preferred Time: Today, 2:00 PM                          │
│                                                          │
│  [📍 View on Map] [📞 Call Provider] [💬 Chat]        │
│                                                          │
│  Payment                                                │
│  Estimated Amount: ₹1,500                               │
│  Payment Type: Partial (30% upfront)                    │
│  Upfront: ₹450 | After Completion: ₹1,050             │
│                                                          │
│  [Pay ₹450 Now]                                         │
└─────────────────────────────────────────────────────────┘

Click Actions:
- Provider Name/Photo → Provider Profile
- "View Profile" → Provider Profile
- Location → Map View
- Timeline items → Expand for details
- "Chat" → Open chat window
```

---

## 4. PROVIDER JOURNEY (Logged In)

### Provider Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  [SERVIXA] [Dashboard] [Jobs] [Earnings] [Profile]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Welcome, Rajesh! 👋                                     │
│                                                          │
│  Quick Stats                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │  Today's │ │  This    │ │  Total   │              │
│  │  Jobs    │ │  Month   │ │  Earnings │              │
│  │    3     │ │  ₹45,000 │ │  ₹2,50,000│              │
│  └──────────┘ └──────────┘ └──────────┘              │
│                                                          │
│  Availability: [🟢 Online] [🔴 Offline]                 │
│                                                          │
│  Available Jobs (5)                                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  AC Repair - Gas Refill                           │   │
│  │  Customer: Priya S.                               │   │
│  │  📍 2.5 km away                                    │   │
│  │  💰 ₹1,500 | ⏰ 2:00 PM Today                     │   │
│  │  ⭐ Match Score: 95%                               │   │
│  │                                                   │   │
│  │  [View Details →] [Accept] [Reject]               │   │
│  └──────────────────────────────────────────────────┘   │
│    ↓ Click → Job Details                                 │
│                                                          │
│  My Active Jobs (2)                                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Plumbing - Leak Fix                              │   │
│  │  Customer: Amit K.                                │   │
│  │  Status: 🟢 Started                                │   │
│  │  [View Job →] [Complete Job]                      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Earnings Summary                                       │
│  Available: ₹12,500 | Pending: ₹3,200                   │
│  [Request Payout]                                       │
└─────────────────────────────────────────────────────────┘
```

### Provider Onboarding Flow

```
Step 1: Registration
┌─────────────────────────────────────────────────────────┐
│  Join as Service Provider                               │
│  Step 1 of 7 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                          │
│  Create your account                                    │
│                                                          │
│  [Continue with Google]                                 │
│                                                          │
│  OR                                                     │
│                                                          │
│  Mobile Number *                                        │
│  [91] [___________]                                     │
│  [Send OTP]                                             │
│                                                          │
│  Enter OTP                                              │
│  [____] [____] [____] [____]                            │
│                                                          │
│  Full Name *                                            │
│  [________________________]                              │
│                                                          │
│  Email *                                                │
│  [________________________]                              │
│                                                          │
│  [Continue →]                                           │
└─────────────────────────────────────────────────────────┘

Step 2: Document Upload
┌─────────────────────────────────────────────────────────┐
│  Join as Service Provider                               │
│  Step 2 of 7 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                          │
│  Upload Documents                                       │
│                                                          │
│  Government ID *                                        │
│  (Aadhaar, PAN, or Driving License)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [📄 Upload Document]                            │   │
│  │  Max 5MB | JPG, PNG, PDF                         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Address Proof *                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [📄 Upload Document]                            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Profile Photo                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [📷 Upload Photo]                               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Continue →]                                           │
└─────────────────────────────────────────────────────────┘

Step 3: Skills
┌─────────────────────────────────────────────────────────┐
│  Join as Service Provider                               │
│  Step 3 of 7 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                          │
│  Select Your Skills                                      │
│                                                          │
│  Primary Skill *                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [▼ AC Technician]                               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Experience (Years) *                                    │
│  [5] years                                              │
│                                                          │
│  Secondary Skills                                       │
│  [✓] Plumbing [✓] Electrical [ ] Appliance Repair     │
│                                                          │
│  Certifications (Optional)                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [📄 Upload Certificate]                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Continue →]                                           │
└─────────────────────────────────────────────────────────┘

Step 4: Service Areas
┌─────────────────────────────────────────────────────────┐
│  Join as Service Provider                               │
│  Step 4 of 7 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                          │
│  Select Service Areas                                   │
│                                                          │
│  City *                                                │
│  [▼ Indore]                                            │
│                                                          │
│  Zones *                                                │
│  [✓] Vijay Nagar [✓] Palasia [ ] MG Road               │
│                                                          │
│  PODs (Service Clusters) *                              │
│  [✓] Vijay Nagar Pod A                                  │
│  [✓] Vijay Nagar Pod B                                  │
│  [ ] Palasia Pod                                        │
│                                                          │
│  Service Radius                                          │
│  5 km [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]  │
│                                                          │
│  [Continue →]                                           │
└─────────────────────────────────────────────────────────┘

Step 5-7: Profile, Verification, Approval
[Similar step-by-step flow with progress tracking]
```

---

## 5. ADMIN JOURNEY (Provider Approval)

### Admin Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  [SERVIXA Admin] [Dashboard] [Providers] [Users] ...    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Dashboard Overview                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │  Pending │ │  Active  │ │  Total   │              │
│  │  Approvals│ │ Providers│ │  Jobs    │              │
│  │    12    │ │   245    │ │  1,234   │              │
│  └──────────┘ └──────────┘ └──────────┘              │
│                                                          │
│  Pending Provider Approvals (12)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [Photo]  Rajesh Kumar                            │   │
│  │           Mobile: +91 98765 43210                │   │
│  │           Skills: AC Technician                  │   │
│  │           Applied: 2 days ago                    │   │
│  │                                                   │   │
│  │  [Review & Approve →]                            │   │
│  └──────────────────────────────────────────────────┘   │
│    ↓ Click → Provider Verification Page                  │
└─────────────────────────────────────────────────────────┘
```

### Provider Verification Page

```
┌─────────────────────────────────────────────────────────┐
│  [← Back]  Verify Provider: Rajesh Kumar               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Provider Information                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Name: Rajesh Kumar                               │   │
│  │  Mobile: +91 98765 43210                          │   │
│  │  Email: rajesh@example.com                       │   │
│  │  Primary Skill: AC Technician                     │   │
│  │  Experience: 5 years                              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Documents                                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Government ID                                    │   │
│  │  [📄 View Aadhaar Card] [✓ Verified]            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Address Proof                                   │   │
│  │  [📄 View Document] [✓ Verified]                │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Profile Photo                                   │   │
│  │  [📷 View Photo] [✓ Verified]                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Service Areas                                          │
│  City: Indore                                           │
│  Zones: Vijay Nagar, Palasia                            │
│  PODs: Vijay Nagar Pod A, Pod B                        │
│                                                          │
│  Verification Actions                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Background Check: [✓ Pass] [✗ Fail]            │   │
│  │  Document Verification: [✓ Pass] [✗ Fail]      │   │
│  │  Skill Verification: [✓ Pass] [✗ Fail]          │   │
│  │                                                   │   │
│  │  Admin Notes:                                      │   │
│  │  [________________________________]               │   │
│  │                                                   │   │
│  │  [✅ Approve Provider] [❌ Reject]               │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

Click Actions:
- Document links → View full document
- Provider name → View full profile
- Service areas → View on map
- Approve/Reject → Confirm action → Notification sent
```

---

## 6. LINKING STRATEGY EXAMPLES

### Example 1: Job Card (Clickable Everywhere)

```typescript
<JobCard job={job}>
  {/* Click job title → Job details */}
  <Link href={`/jobs/${job.id}`}>
    <h3>{job.title}</h3>
  </Link>
  
  {/* Click provider → Provider profile */}
  <Link href={`/providers/${job.providerId}`}>
    <ProviderInfo>
      <Avatar src={job.providerPhoto} />
      <span>{job.providerName}</span>
    </ProviderInfo>
  </Link>
  
  {/* Click service type → Browse similar services */}
  <Link href={`/services?category=${job.serviceCategoryId}`}>
    <Badge>{job.serviceType}</Badge>
  </Link>
  
  {/* Click location → Map view */}
  <Link href={`/jobs/${job.id}?tab=location`}>
    <Location>{job.address}</Location>
  </Link>
  
  {/* Click status → Job timeline */}
  <Link href={`/jobs/${job.id}?tab=timeline`}>
    <Status>{job.status}</Status>
  </Link>
</JobCard>
```

### Example 2: Provider Card (Clickable Everywhere)

```typescript
<ProviderCard provider={provider}>
  {/* Click photo/name → Provider profile */}
  <Link href={`/providers/${provider.id}`}>
    <Avatar src={provider.photo} />
    <h3>{provider.name}</h3>
  </Link>
  
  {/* Click rating → Reviews page */}
  <Link href={`/providers/${provider.id}/reviews`}>
    <Rating value={provider.rating} />
    <span>({provider.reviewCount} reviews)</span>
  </Link>
  
  {/* Click service type → Filter by service */}
  <Link href={`/providers?skill=${provider.primarySkillId}`}>
    <Badge>{provider.primarySkill}</Badge>
  </Link>
  
  {/* Click location → Map view */}
  <Link href={`/providers/${provider.id}?tab=location`}>
    <Location>{provider.distance} km away</Location>
  </Link>
  
  {/* Click "View Profile" → Full profile */}
  <Link href={`/providers/${provider.id}`}>
    <Button>View Profile →</Button>
  </Link>
</ProviderCard>
```

---

## 7. MOBILE-FIRST DESIGN

### Mobile Navigation

```
Bottom Navigation Bar (Sticky)
┌─────────────────────────────────────────┐
│  [🏠] [🔍] [➕] [📋] [👤]              │
│  Home Search Add  Jobs Profile          │
└─────────────────────────────────────────┘
```

### Mobile Card Design

```
┌─────────────────────────────┐
│  [Provider Photo]           │
│  Provider Name              │
│  ⭐ 4.8 (234)               │
│  📍 2.5 km                  │
│  💰 ₹500 - ₹2000           │
│                             │
│  [View Profile →]           │
└─────────────────────────────┘
  ↓ Tap anywhere → Profile
```

---

## 8. SUMMARY

### Key UI/UX Principles Applied

✅ **Everything Clickable**: Cards, badges, names, locations all link
✅ **Simple Journeys**: Clear step-by-step flows
✅ **Contextual Actions**: Actions appear where needed
✅ **Deep Linking**: Easy navigation between related content
✅ **Mobile-First**: Touch-friendly, bottom navigation
✅ **Visual Hierarchy**: Important actions stand out
✅ **Consistent Design**: Same patterns across all roles

### Ready to Implement

The architecture and UI/UX guide are complete. You can now:
1. Start building the Next.js app
2. Implement authentication
3. Create role-based layouts
4. Build clickable components
5. Implement onboarding flows
6. Integrate RazorPay

**Everything is designed to be simple, clickable, and connected! 🚀**
