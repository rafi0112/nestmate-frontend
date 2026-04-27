# NestMate — Roommate Finder (Next.js)

A full-featured roommate finder webapp built with Next.js 16, TypeScript, and Tailwind CSS.

## Features

### Core
- 🏠 **Browse Listings** — Search, filter by location, rent, room type, lifestyle tags
- 📝 **Post Listings** — Create detailed roommate listings with lifestyle preferences
- ❤️ **Like System** — Express interest; contact info unlocks on mutual interest
- 👤 **My Listings** — Edit and delete your own listings
- 🔐 **Auth** — Email/password + Google sign-in

### Real-Life Problem Solvers
- 🎯 **Compatibility Quiz** — 8-question lifestyle quiz that builds your ideal roommate profile and highlights dealbreakers BEFORE you waste time viewing listings
- 💬 **Messages** — In-app messaging with potential roommates (no sharing personal numbers with strangers)
- 📄 **Agreement Generator** — Generate a custom roommate agreement (PDF-ready) covering rent, quiet hours, cleaning, guests, pets — the #1 conflict prevention tool
- 🌙 **Dark Mode** — Full dark/light theme toggle

## Setup

```bash
npm install
cp .env.example .env.local
# Add your API URL and Firebase config
npm run dev
```

## Connect to your backend

Set `NEXT_PUBLIC_API_URL` in `.env.local` to point to your Express server:
```
NEXT_PUBLIC_API_URL=https://your-server.vercel.app
```

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Lucide React icons
- react-hot-toast
- framer-motion

## Backend (Express + MongoDB)
The original Express server at `/Roommate-Finder-server-main` works as-is.
API endpoints: GET/POST/PUT/DELETE `/roommate`, GET `/roommate/:id`
