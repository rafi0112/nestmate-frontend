# NestMate — Frontend

A modern Next.js 16 + TypeScript roommate finder and household management app. Find your perfect living situation with intelligent matching, fair-share meal tracking, and collaborative household tools.

**Live**: [nestmate.vercel.app](https://nestmate.vercel.app)  
**Backend**: [GitHub](https://github.com/yourusername/nestmate-server)  
**Database**: MongoDB Atlas (see schema below)

---

## Features

### 🏠 Core
- **Smart Listing Browse** — Search by city, price, room type, lifestyle preferences
- **Real-time Geospatial Search** — Find nearby listings with map view
- **Like & Contact** — Like listings to unlock owner contact info
- **Post & Edit Listings** — Full listing CRUD with image uploads

### 🏘 Household Hub
Complete household management after joining or creating a group:
- **Meal Ledger** — Track grocery expenses, auto-calculate per-person share
- **Daily Meals** — Log personal + guest meals for fair billing
- **Fair-Share Calculator** — 30-day meal units → proportional cost breakdown
- **Dues & Payments** — Room fee + market share owed; Pay Now settlement button
- **Room Chat** — Live group chat with 5s polling, TTL auto-cleanup
- **Join Code System** — 6-character alphanumeric codes; instant member additions

### 💬 Social
- **Direct Messages** — 1:1 conversations about listings; optimistic UI with DB sync
- **Mess-Mate Reviews** — Public reviews of households visible on home page
- **Notifications** — In-app feed (auto-purge after 30 days)
- **Compatibility Quiz** — 8-step lifestyle questionnaire; generates roommate profile

### 🔐 Auth
- **Firebase Auth** (production) — Email + Google Sign-In; automatic user profiles
- **Demo Mode** (default) — localStorage auth; works without Firebase config
- **Dual-mode** — Seamlessly switch between Firebase and demo with env var

---

## Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | Next.js 16, TypeScript, React 19, Tailwind CSS v4 |
| **Styling** | CSS-in-JS (inline), Syne + Times New Roman fonts |
| **State** | React Context (Auth, Theme), localStorage for preferences |
| **API** | Fetch + JSON, 20+ typed API functions in `lib/api.ts` |
| **Real-time** | 8s polling for messages, 5s for room chat |
| **Hosting** | Vercel (auto-deploy from `main`) |
| **Database** | MongoDB Atlas (via backend proxy) |
| **Currency** | ৳ BDT Taka throughout |

---

## Project Structure

```
roommate-finder-next/
├── app/
│   ├── page.tsx                  # Home — hero + live listings + reviews
│   ├── browse/page.tsx           # Browse with filters + geosearch
│   ├── listings/[id]/page.tsx    # Detail + contact unlock
│   ├── add-listing/page.tsx      # Post new listing
│   ├── edit-listing/[id]/page.tsx# Edit listing (PUT to DB)
│   ├── my-listings/page.tsx      # User's listings + household cards
│   ├── household/page.tsx        # 5-tab hub: ledger, dues, meals, snapshot, chat
│   ├── messages/page.tsx         # DM thread list + conversation
│   ├── profile/page.tsx          # User settings, Firebase setup guide
│   ├── compatibility/page.tsx    # Lifestyle quiz
│   ├── agreement/page.tsx        # Roommate agreement generator
│   ├── login/page.tsx            # Email + Google signin
│   ├── register/page.tsx         # Registration with strength meter
│   ├── api/
│   │   ├── messages/route.ts     # GET conversations, POST message
│   │   ├── households/route.ts   # GET/POST households, PUT (update fee)
│   │   └── households/join/route.ts # POST join via code
│   └── globals.css               # Design system (navy, teal, ৳ utilities)
├── components/
│   ├── Navbar.tsx                # Sticky nav with auth menu
│   ├── Footer.tsx                # Footer with links
│   ├── HomeClient.tsx            # Hero, listings, mess reviews
│   ├── ListingCard.tsx           # Card with ৳, like button
│   ├── BrowseClient.tsx          # Filters + geosearch
│   └── ListingDetailClient.tsx   # Full detail page
├── contexts/
│   ├── AuthContext.tsx           # Firebase + localStorage fallback
│   └── ThemeContext.tsx          # Dark/light toggle
├── lib/
│   ├── api.ts                    # All 20+ API calls (typed)
│   └── types.ts                  # TypeScript interfaces
├── .env.example                  # Firebase + API_URL vars
├── PROJECT_SUMMARY.md            # Session handoff notes
└── README.md                     # This file
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas URI (provided by backend team)
- (Optional) Firebase project for real auth

### Installation

```bash
git clone https://github.com/yourusername/nestmate-frontend.git
cd roommate-finder-next

npm install
cp .env.example .env.local
```

### Configuration

**`.env.local`** — minimal setup (demo mode):
```env
NEXT_PUBLIC_API_URL=https://api.nestmate.dev
```

**For real Firebase auth**, add:
```env
NEXT_PUBLIC_USE_FIREBASE=true
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=nestmate.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=nestmate-xyz
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=nestmate-xyz.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123...
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...
```

### Development

```bash
npm run dev
# Visit http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start
# or deploy to Vercel (auto-deploy on git push)
```

---

## API Reference

All endpoints proxied through Next.js API routes (`app/api/*`) to the backend. See `lib/api.ts` for typed functions.

### Listings
```typescript
getListings()              // GET all listings
getListing(id)             // GET single listing
createListing(data)        // POST new listing
updateListing(id, data)    // PUT listing (full update)
deleteListing(id)          // DELETE listing
```

### Messages
```typescript
getConversations(email)    // GET all DM threads for user
sendMessage(payload)       // POST new message
markMessageRead(id)        // PATCH mark as read
```

### Households
```typescript
getHouseholdByMember(email) // GET household for user
createHousehold(payload)   // POST create household + auto joinCode
joinHousehold(code, email) // POST join via code
updateHousehold(id, data)  // PUT update fee/name
getLedger(householdId)     // GET market entries
addLedgerEntry(entry)      // POST ledger entry
getMeals(householdId)      // GET daily meal log
upsertMeal(entry)          // POST/update daily meal
getPayments(householdId)   // GET due payments
createPayment(payment)     // POST payment record
getRoomChat(householdId)   // GET chat messages (5s polling)
sendRoomChat(msg)          // POST chat message
```

### Reviews
```typescript
getReviews(limit)          // GET mess reviews
createReview(review)       // POST new review
```

---

## Authentication Modes

### Demo Mode (Default)
- No config needed
- User data in `localStorage` under `nestmate_user`
- Perfect for testing, local development, prototyping
- All features work — data persists in browser only

### Firebase Mode (Production)
- Requires Firebase project setup
- Real authentication with Email/Password or Google
- Cross-device persistence
- User profiles synced across sessions
- Switch via `NEXT_PUBLIC_USE_FIREBASE=true` in `.env.local`

The code in `contexts/AuthContext.tsx` handles both automatically — reads env vars at runtime and bootstraps the right auth method. No code changes needed to switch.

---

## Database Schema

The app uses a **10-collection MongoDB schema** designed for performance and scalability:

```
┌─────────────────────────────────────────────────────┐
│                     NESTMATE DB SCHEMA              │
├─────────────────────────────────────────────────────┤
│  users                                              │
│  ├─ PK: _id (ObjectId)                            │
│  ├─ unique: firebaseUid, email                    │
│  ├─ FK: householdId → households                  │
│  ├─ FK: savedListings[] → roommates               │
│  └─ idx: email, householdId, preferredCity        │
├─────────────────────────────────────────────────────┤
│  roommates (listings)                              │
│  ├─ PK: _id                                        │
│  ├─ FK: userId → users                            │
│  ├─ idx: city, location, rentAmount, roomType     │
│  ├─ idx: coordinates (2dsphere geospatial)        │
│  └─ text-search: title + description + location   │
├─────────────────────────────────────────────────────┤
│  households                                         │
│  ├─ PK: _id                                        │
│  ├─ unique: joinCode                              │
│  ├─ FK: memberIds[] → users (N-to-N)             │
│  ├─ FK: listingId → roommates (1-to-1)           │
│  └─ idx: joinCode, members, isActive              │
├─────────────────────────────────────────────────────┤
│  messages (1:1 DMs)                                │
│  ├─ PK: _id                                        │
│  ├─ FK: fromId, toId → users                      │
│  ├─ FK: listingId → roommates                     │
│  └─ idx: (fromEmail, toEmail, timestamp)          │
├─────────────────────────────────────────────────────┤
│  ledger (grocery expenses)                          │
│  ├─ PK: _id                                        │
│  ├─ FK: householdId → households                  │
│  ├─ FK: paidById → users                          │
│  └─ idx: (householdId, date), (householdId, category) │
├─────────────────────────────────────────────────────┤
│  meals (daily meal log)                             │
│  ├─ PK: _id                                        │
│  ├─ FK: householdId → households                  │
│  ├─ unique: (householdId, userEmail, date)        │
│  └─ idx: (householdId, userEmail)                 │
├─────────────────────────────────────────────────────┤
│  payments (due settlements)                         │
│  ├─ PK: _id                                        │
│  ├─ FK: householdId → households                  │
│  ├─ FK: fromId → users                            │
│  └─ idx: (householdId, month), status             │
├─────────────────────────────────────────────────────┤
│  room_chat (group chat)                            │
│  ├─ PK: _id                                        │
│  ├─ FK: householdId → households                  │
│  ├─ FK: senderId → users                          │
│  ├─ TTL: 90 days auto-purge                       │
│  └─ idx: (householdId, timestamp)                 │
├─────────────────────────────────────────────────────┤
│  reviews (mess-mate reviews)                        │
│  ├─ PK: _id                                        │
│  ├─ FK: householdId → households                  │
│  ├─ FK: authorId → users                          │
│  ├─ text-search: houseName + text                 │
│  └─ idx: rating, verified, createdAt              │
├─────────────────────────────────────────────────────┤
│  notifications (in-app feed)                        │
│  ├─ PK: _id                                        │
│  ├─ FK: userId → users                            │
│  ├─ TTL: 30 days after read                       │
│  └─ idx: (userId, read, createdAt)                │
└─────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- **Indexed compound keys** — (householdId, date), (fromEmail, toEmail, timestamp) prevent duplicates & speed lookups
- **TTL indexes** — room_chat & notifications auto-purge after 90/30 days
- **Geospatial 2dsphere** — Find listings within 5km
- **Text-search indexes** — Full-text search on listings + reviews
- **N-to-N via array** — users.savedListings[], households.memberIds[] for follows & members
- **No denormalization** — Master user data in users; minimal embedded objects

See `nestmate-server` repo for migration scripts (createCollection, createIndex commands).

---

## Design System

### Colors
| Token | Value | Usage |
|---|---|---|
| `--accent` | `#1a5276` (navy) | Primary actions, headings |
| `--accent-2` | `#117a65` (teal) | Secondary, stats |
| `--success` | `#1e8449` | Paid, available |
| `--danger` | `#922b21` | Dues, errors |
| `--gold` | `#b7950b` | Warnings, featured |

### Typography
- **Body**: Times New Roman (serif) — all prose text
- **Display**: Syne (Google Fonts, 600/700/800) — headings, buttons, labels
- **Mono**: System monospace — code, IDs, amounts

### Dark Mode
Toggle in navbar → persisted to `localStorage`. All colors auto-invert via CSS variables. `[data-theme="dark"]` class on root.

---

## Performance Optimizations

- **Image Optimization** — Next.js Image component with lazy loading
- **Code Splitting** — Route-based, automatic with Next.js
- **API Caching** — `cache: 'no-store'` for real-time data; consider SWR for polling
- **Polling Strategy** — Messages: 8s, Room chat: 5s (adjust `useEffect` intervals in pages)
- **Bundle Size** — ~180kb gzipped (excluding node_modules)

---

## Known Limitations & Next Steps

### Currently
- Listings use placeholder image URLs (no upload integration)
- Messages + room chat polling (not WebSocket)
- Household data in single household view (no multi-household support per user)
- Notifications created manually (no automated triggers from backend)

### Roadmap
1. **Image Upload** — Cloudinary or Firebase Storage integration
2. **WebSocket** — Real-time messages via Socket.io or Firebase Realtime DB
3. **Multi-Household** — Users can belong to multiple households, switch context
4. **Payment Gateway** — Razorpay/Stripe for actual rupee transactions
5. **Mobile App** — React Native or Next.js mobile optimization
6. **Analytics** — PostHog or Mixpanel for user behavior tracking
7. **Invite System** — Email invites instead of copy-paste join codes

---

## Troubleshooting

### Firebase Auth not working?
- Check `NEXT_PUBLIC_FIREBASE_API_KEY` in `.env.local`
- Ensure Email/Password + Google Sign-In enabled in Firebase Console
- Try demo mode first (no Firebase needed)

### Backend API calls fail?
- Verify `NEXT_PUBLIC_API_URL` matches backend URL
- Check CORS headers in backend
- Use browser DevTools → Network tab to inspect requests

### Household join code not working?
- Code is 6 characters, alphanumeric only (A-Z, 0-9)
- Ensure code exists in database (POST /households should return it)
- Check householdId in household page query

### Messages not syncing?
- Polling interval is 8 seconds (check `useEffect` in `/messages`)
- Optimistic UI: message appears immediately, syncs after 600ms
- Check backend message route is returning flat array, not paginated

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit changes (`git commit -m 'feat: add cool feature'`)
4. Push to branch (`git push origin feat/your-feature`)
5. Open a Pull Request

### Code Style
- TypeScript strict mode
- ESLint + Prettier (auto-format on save)
- Commit lint messages (conventional commits)
- Test all API integrations before PR

---

## Deployment

### Vercel (Recommended)
```bash
# Connect GitHub repo to Vercel
# Auto-deploys on push to main
# Set env vars in Vercel dashboard
```

### Self-Hosted
```bash
npm run build
npm run start
# Ensure PORT=3000 or set via env
# Use a process manager (PM2, systemd) for persistence
```

### Environment Variables (Production)
```env
NEXT_PUBLIC_API_URL=https://api.nestmate.production
NEXT_PUBLIC_USE_FIREBASE=true
NEXT_PUBLIC_FIREBASE_API_KEY=...
# All vars should be in Vercel/host dashboard, not in git
```

---

## License

MIT © 2025 NestMate Contributors

---

## Support

- **Docs**: [nestmate.notion.site](https://notion.site) (if exists)
- **Issues**: GitHub Issues
- **Contact**: dev@nestmate.app

---

**Built with ❤️ for shared living.**
