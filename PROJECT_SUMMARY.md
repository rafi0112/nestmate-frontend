# NestMate — Complete Project Summary v3
## Session handoff document

---

## Quick Start

```bash
# Frontend
cd roommate-finder-next
npm install
cp .env.example .env.local
# Edit .env.local → set NEXT_PUBLIC_API_URL to your backend URL
npm run dev   # http://localhost:3000

# Backend
cd nestmate-server
npm install
cp .env.example .env
# Edit .env → set USER and PASS (MongoDB Atlas credentials)
npm start     # http://localhost:3001
```

---

## What's Complete ✅

### Frontend (Next.js 16, TypeScript, Tailwind v4)
| Route | Status | Notes |
|---|---|---|
| `/` | ✅ | Real listings from DB + Mess Mate Reviews section |
| `/browse` | ✅ | Search, filter, sort with real data |
| `/listings/[id]` | ✅ | Detail page, like→unlock contact info |
| `/add-listing` | ✅ | Full form, posts to DB |
| `/edit-listing/[id]` | ✅ | Loads from DB, saves to DB via PUT |
| `/my-listings` | ✅ | Own listings + per-listing household card |
| `/household` | ✅ | Full hub — all 5 tabs wired to DB |
| `/messages` | ✅ | Real conversations, 8s polling |
| `/login` | ✅ | Email + Google (demo mode works without Firebase) |
| `/register` | ✅ | Two-panel layout, password strength |
| `/profile` | ✅ | Edit name, account stats, Firebase setup guide |
| `/compatibility` | ✅ | 8-step lifestyle quiz |
| `/agreement` | ✅ | Roommate agreement generator (.txt download) |

### Household Hub (5 tabs, all DB-backed)
| Tab | What it does |
|---|---|
| Meal Ledger | Add market entries (item, ৳ amount, date); grouped by week; per-person auto-calc |
| Dues & Payments | Shows room fee + market share owed; Pay Now button; all-member breakdown |
| Daily Meals | Log 0–3 personal + 0–3 guest meals per day; 14-day history table |
| Fair-Share Snapshot | 30-day meal units → proportional market cost + room fee = total due |
| Room Chat | Live DB chat with 5s polling |

### Backend (Express + MongoDB)
All endpoints in `nestmate-server/index.js`:
- `GET/POST /roommate`, `GET/PUT/DELETE /roommate/:id`
- `GET/POST /messages`, `PATCH /messages/:id/read`
- `GET/POST /households`, `GET /households/all`, `PUT /households/:id`, `POST /households/join`
- `GET/POST /ledger`, `DELETE /ledger/:id`
- `GET/POST /meals` (upsert)
- `GET/POST /payments`
- `GET/POST /room-chat`
- `GET/POST /reviews`

---

## Auth Modes

**Demo mode** (default, no config needed):
- Uses `localStorage` — works immediately
- `nestmate_user` key stores the current user

**Firebase mode** (production):
1. `npm install firebase`
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_USE_FIREBASE=true
   NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
   ```
3. Enable Email/Password + Google in Firebase Console

---

## Design System
- **Font body:** Times New Roman (system)
- **Font display:** Syne (Google Fonts, 600/700/800)
- **Currency:** ৳ (BDT Taka) throughout
- **Primary color:** `#1a5276` deep navy
- **Secondary:** `#117a65` teal
- **Dark mode:** toggle in navbar, persisted to localStorage

---

## What's Left (next session)

1. **Household: real data by member email** — `getHouseholdByMember()` is wired but the backend needs
   to return a household where the member's email is in the `members[]` array. Test this end-to-end.

2. **Messages: start conversation from listing detail** — Add a "Message" button in `ListingDetailClient.tsx`
   that pre-fills `toEmail` and `listingId` so the user can initiate a chat directly from a listing.

3. **Notifications** — Badge on Messages link showing unread count (already have `totalUnread` in messages page,
   just needs to bubble up to Navbar).

4. **Image upload** — Currently `imageUrl` is a text field. Wire to Cloudinary/Firebase Storage for real uploads.

5. **Pagination** — `/browse` loads all listings; add page-based or infinite scroll for scale.

6. **Household invite by email** — Instead of copy-paste code, let owner type a member email and send invite.

7. **Deploy** — Frontend: Vercel (`vercel deploy`). Backend: already on Vercel at `roommate-server-lime.vercel.app`
   — update with new `nestmate-server/index.js`.

---

## File Tree
```
roommate-finder-next/       ← Next.js frontend
├── app/
│   ├── page.tsx            ← Home (real listings + reviews)
│   ├── browse/             ← Browse with filters
│   ├── listings/[id]/      ← Detail + contact unlock
│   ├── add-listing/        ← Post listing
│   ├── edit-listing/[id]/  ← Edit → PUT to DB
│   ├── my-listings/        ← Own listings + household codes
│   ├── household/          ← Full household hub
│   ├── messages/           ← Real DB chat with polling
│   ├── login/register/     ← Auth (Firebase or demo)
│   ├── profile/            ← Edit name, account info
│   ├── compatibility/      ← Lifestyle quiz
│   └── agreement/          ← Agreement generator
├── components/
│   ├── Navbar.tsx           ← All nav links incl. Household + Profile
│   ├── HomeClient.tsx       ← Hero, listings, reviews
│   ├── ListingCard.tsx      ← Card with ৳, like button
│   ├── BrowseClient.tsx     ← Filters
│   └── ListingDetailClient.tsx
├── contexts/
│   ├── AuthContext.tsx      ← Firebase + localStorage fallback
│   └── ThemeContext.tsx
└── lib/
    ├── api.ts               ← All 20+ API calls
    └── types.ts

nestmate-server/             ← Express backend
├── index.js                 ← All 15 endpoint groups
└── package.json
```
