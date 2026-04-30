# NestMate — Complete Documentation Index

Welcome! This folder contains **everything** you need to understand, develop, and deploy NestMate.

---

## 📚 Documents in This Folder

### 1. **FRONTEND_README.md** (Main Docs)
Complete guide to the Next.js frontend:
- Feature overview (13 routes, household hub, messaging)
- Tech stack and project structure
- Getting started (installation, config, local dev)
- API reference (20+ typed functions)
- Design system (fonts, colors, dark mode)
- Deployment to Vercel
- **Read this first if you're working on the frontend**

### 2. **BACKEND_README.md** (Main Docs)
Complete guide to the Express backend:
- 15 endpoint groups with curl examples
- Technology stack (Node 18+, MongoDB Atlas)
- Installation and configuration
- Error handling patterns
- Performance optimization tips
- Deployment options (Vercel, Docker, self-hosted)
- Security considerations (CORS, auth, data privacy)
- **Read this first if you're working on the backend**

### 3. **DB_SCHEMA_REFERENCE.md** (Deep Dive)
Detailed MongoDB schema documentation:
- All 10 collections with complete field definitions
- Index strategy and performance notes
- Entity relationships and ERD
- Fair-share calculation examples
- Query patterns and aggregations
- Backup and recovery procedures
- **Read this if you need to understand the data model or add new fields**

### 4. **README_INDEX.md** (This File)
Navigation guide to all documentation.

---

## 🗺 Quick Navigation

### I'm new to NestMate — where do I start?

1. **Understand the product**: Read the "Features" section in `FRONTEND_README.md`
2. **See the database**: Review "Database Schema Overview" in `DB_SCHEMA_REFERENCE.md`
3. **Set up locally**: Follow "Getting Started" in `FRONTEND_README.md` + `BACKEND_README.md`
4. **Explore the code**: Clone repos and look at project structures

### I want to add a feature

1. **Clarify the data**: Check `DB_SCHEMA_REFERENCE.md` → is the collection you need already there?
2. **Design the endpoint**: Use `BACKEND_README.md` → "API Reference" as a template
3. **Implement frontend**: Use `FRONTEND_README.md` → "API Reference" (lib/api.ts) to add the typed function
4. **Test end-to-end**: Use curl examples from `BACKEND_README.md` to verify

### I found a bug — where do I look?

- **API fails**: Check `BACKEND_README.md` → "Error Handling" and "Troubleshooting"
- **Data issue**: Check `DB_SCHEMA_REFERENCE.md` → "Constraints" and "Aggregation Examples"
- **Frontend crashes**: Check `FRONTEND_README.md` → "Troubleshooting"
- **Auth not working**: Check both READMEs → "Authentication Modes" section

### I'm deploying to production

- **Frontend**: `FRONTEND_README.md` → "Deployment" (Vercel)
- **Backend**: `BACKEND_README.md` → "Deployment" (Docker, PM2, Vercel)
- **Database**: `DB_SCHEMA_REFERENCE.md` → "Backup & Recovery" (MongoDB Atlas)

### I need to scale the app

- **Performance**: `BACKEND_README.md` → "Performance & Scaling"
- **Database**: `DB_SCHEMA_REFERENCE.md` → "Maintenance Tasks" and "Aggregation Examples"
- **Real-time**: `FRONTEND_README.md` → "Known Limitations" (mentions WebSocket roadmap)

---

## 📋 Key Sections by Audience

### Frontend Engineers
| Topic | Document | Section |
|---|---|---|
| Routes & pages | FRONTEND_README.md | Project Structure |
| API calls | FRONTEND_README.md | API Reference |
| Authentication | FRONTEND_README.md | Authentication Modes |
| Styling | FRONTEND_README.md | Design System |
| Deployment | FRONTEND_README.md | Deployment |

### Backend Engineers
| Topic | Document | Section |
|---|---|---|
| Endpoints | BACKEND_README.md | API Reference |
| Database | DB_SCHEMA_REFERENCE.md | Collection Definitions |
| Validation | DB_SCHEMA_REFERENCE.md | Constraints |
| Aggregations | DB_SCHEMA_REFERENCE.md | Data Aggregation Examples |
| Scaling | BACKEND_README.md | Performance & Scaling |

### DevOps / Infrastructure
| Topic | Document | Section |
|---|---|---|
| Frontend hosting | FRONTEND_README.md | Deployment |
| Backend hosting | BACKEND_README.md | Deployment |
| Database backup | DB_SCHEMA_REFERENCE.md | Backup & Recovery |
| Monitoring | BACKEND_README.md | Monitoring |
| Docker | BACKEND_README.md | Deployment → Docker |

### Product Managers / Stakeholders
| Topic | Document | Section |
|---|---|---|
| Features | FRONTEND_README.md | Features |
| Roadmap | FRONTEND_README.md | Known Limitations & Next Steps |
| Data structure | DB_SCHEMA_REFERENCE.md | Collections Overview |
| API contracts | BACKEND_README.md | API Reference |

---

## 🔗 Cross-Document References

### If you see a reference like this:
- **"See BACKEND_README.md → Error Handling"** = Open BACKEND_README.md, search for "Error Handling" heading
- **"DB_SCHEMA_REFERENCE.md → users collection"** = Open DB_SCHEMA_REFERENCE.md, find "users" section
- **"FRONTEND_README.md → Getting Started"** = Open FRONTEND_README.md, look for "Getting Started" heading

---

## 📦 Repository Structure

After cloning both repos, your folder structure should look like:

```
nestmate/
├── roommate-finder-next/          # Frontend (Next.js)
│   ├── README.md                  # Same as FRONTEND_README.md
│   ├── app/
│   ├── components/
│   ├── contexts/
│   └── lib/
├── nestmate-server/               # Backend (Express)
│   ├── README.md                  # Same as BACKEND_README.md
│   └── index.js
└── documentation/                 # This folder
    ├── FRONTEND_README.md         # Frontend guide
    ├── BACKEND_README.md          # Backend guide
    ├── DB_SCHEMA_REFERENCE.md     # Database guide
    └── README_INDEX.md            # Navigation (this file)
```

---

## 🚀 Common Tasks Checklists

### Setting Up Local Development
- [ ] Clone both repositories
- [ ] Install Node.js 18+
- [ ] Read FRONTEND_README.md → Getting Started
- [ ] Create MongoDB Atlas cluster (free tier ok)
- [ ] Read BACKEND_README.md → Installation
- [ ] Set up `.env` files in both projects
- [ ] Run `npm install` in both folders
- [ ] Start backend with `npm run dev`
- [ ] Start frontend with `npm run dev`
- [ ] Test auth (demo mode works without Firebase)

### Adding a New Household Feature
- [ ] Check DB_SCHEMA_REFERENCE.md → households collection
- [ ] Design your data model (add fields if needed)
- [ ] Write/update MongoDB migration script
- [ ] Add endpoint in BACKEND_README.md → tell DevOps to deploy
- [ ] Implement frontend route in next.js (see FRONTEND_README.md → project structure)
- [ ] Add API function in `lib/api.ts`
- [ ] Wire up component
- [ ] Test end-to-end

### Preparing for Production
- [ ] Read FRONTEND_README.md → Deployment
- [ ] Read BACKEND_README.md → Deployment
- [ ] Read DB_SCHEMA_REFERENCE.md → Backup & Recovery
- [ ] Set up Vercel for frontend
- [ ] Set up backend hosting (Vercel, Docker, or self-hosted)
- [ ] Configure MongoDB Atlas backup
- [ ] Set all env vars in production dashboards (do NOT commit secrets)
- [ ] Test staging environment first
- [ ] Deploy to production

---

## 🆘 Quick Troubleshooting

### Frontend won't start
→ FRONTEND_README.md → Getting Started → Installation

### Backend API calls fail
→ BACKEND_README.md → Troubleshooting

### Authentication not working
→ FRONTEND_README.md → Authentication Modes (and Troubleshooting)

### Database connection error
→ BACKEND_README.md → Troubleshooting (MongoDB connection fails)

### Join code not working
→ FRONTEND_README.md → Troubleshooting → "Household join code not working"

### Messages not syncing
→ FRONTEND_README.md → Troubleshooting → "Messages not syncing"

---

## 📞 Getting Help

### Code Questions
- Check the relevant README (FRONTEND or BACKEND)
- Look for a "Troubleshooting" section
- Search the document for your keyword (Ctrl+F / Cmd+F)

### Data Model Questions
- Read DB_SCHEMA_REFERENCE.md → "Collection Definitions"
- Check constraints and indexes for that collection

### Deployment Questions
- FRONTEND_README.md → "Deployment"
- BACKEND_README.md → "Deployment"
- DB_SCHEMA_REFERENCE.md → "Backup & Recovery"

### Feature/Roadmap Questions
- FRONTEND_README.md → "Known Limitations & Next Steps"
- GitHub Issues in both repos

---

## 📝 Document Versions

| Document | Version | Last Updated | Status |
|---|---|---|---|
| FRONTEND_README.md | 1.0 | April 2025 | ✅ Current |
| BACKEND_README.md | 1.0 | April 2025 | ✅ Current |
| DB_SCHEMA_REFERENCE.md | 1.0 | April 2025 | ✅ Current |
| README_INDEX.md | 1.0 | April 2025 | ✅ Current |

All docs are kept in sync with the codebase. If you find outdated info, please open an issue.

---

## 🎯 Next Steps

1. **Choose your role**: Frontend, backend, or full-stack?
2. **Read the relevant README**: Start with the one for your role
3. **Set up locally**: Follow "Getting Started" in both READMEs
4. **Explore the code**: See `FRONTEND_README.md` → "Project Structure"
5. **Contribute**: Pick a task from `FRONTEND_README.md` → "Roadmap" or create a feature

---

## 📜 License

All documentation is part of NestMate and follows the same MIT license as the code.

---

**Last Updated**: April 2025  
**Maintained By**: NestMate Dev Team  
**Questions?** Open an issue on GitHub or contact dev@nestmate.app
