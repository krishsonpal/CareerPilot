# CareerPilot Frontend Redesign — Implementation Plan

> **Branch:** `dev`  
> **Strategy:** One screen per session → commit → stop → wait for user to proceed  
> **Theme Rule:** Screen 3 ([`photos/candidate_dashboard.jpg`](./photos/candidate_dashboard.jpg)) is the **universal theme reference** for ALL authenticated screens (Screens 3–8). Layout details come from each screen's photo, but colors, sidebar chrome, card styling, and typography must match Screen 3 exactly.

---

## 🎨 Universal Theme — Derived from Screen 3

All authenticated pages (`/app/**` and `/dashboard/**`) must share these tokens without exception:

```
Sidebar:          bg-white border-r border-slate-200
Sidebar Active:   bg-indigo-600 text-white rounded-xl (or bg-indigo-50 text-indigo-700 font-bold)
Canvas:           bg-slate-50 (or bg-gray-50)
Top Header:       bg-white/90 backdrop-blur-md border-b border-slate-200
Cards:            bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md
Primary:          #6366F1  (Indigo-600)
Secondary:        #8B5CF6  (Violet-500)
Text Heading:     text-slate-900 / text-gray-900
Text Body:        text-slate-500 / text-gray-500
Font:             'Outfit', sans-serif
```

---

## 📋 Screen-by-Screen Implementation Plan

---

### ✅ SCREEN 1 — Public Landing Page (`/`)

**Branch commit message:** `feat(ui): redesign public landing page — hero, search, how-it-works, AI teaser`

#### Files to Create / Modify:
| File | Action | What Changes |
|---|---|---|
| `frontend/src/index.css` | **MODIFY** | Add design system CSS variables, smooth scrollbar, glass utilities |
| `frontend/src/layout/AppLayout.jsx` | **RENAME → `PublicContainer.jsx`** | Remove `w-[90%] overflow-hidden`, used only for public pages |
| `frontend/src/components/Navbar.jsx` | **MODIFY** | Clean glassmorphic sticky bar, logged-in users see "Go to Dashboard" CTA instead of Sign In |
| `frontend/src/components/Hero.jsx` | **MODIFY** | Full hero redesign: big bold headline, animated stat chips, pill search bar |
| `frontend/src/components/HowItWorks.jsx` | **CREATE (NEW)** | 3-step horizontal pipeline strip (Upload → Match → Coach) |
| `frontend/src/components/JobCategory.jsx` | **MODIFY** | Visual icon category cards, hover lift animation |
| `frontend/src/components/FeaturedJob.jsx` | **MODIFY** | Elevated job cards with company logo, salary badge, skill tags |
| `frontend/src/components/AIChatTeaser.jsx` | **CREATE (NEW)** | Static dark obsidian preview card of AI coach with "Try free →" CTA, NOT a live widget |
| `frontend/src/components/ChatbotSection.jsx` | **MODIFY** | Replace live widget embed with `AIChatTeaser.jsx` |
| `frontend/src/components/Footer.jsx` | **MODIFY** | Clean modern footer with nav links and copyright |
| `frontend/src/pages/Home.jsx` | **MODIFY** | Compose all updated sections in correct order |
| `frontend/src/App.jsx` | **MODIFY** | Fix public routes, hero search routes to `/jobs?title=...` instead of staying on `/` |

#### Key Visual Rules:
- Background: soft lavender tint (`bg-indigo-50/30`) on Hero only; rest is `bg-white`
- No authenticated app shell chrome on public pages
- Hero stat chips float on either side of the search pill

---

### ✅ SCREEN 2 — Unified Auth Portal (`/candidate-login`, `/recruiter-login`, signups)

**Branch commit message:** `feat(ui): redesign auth pages — split-screen layout with role tab switcher`

#### Files to Create / Modify:
| File | Action | What Changes |
|---|---|---|
| `frontend/src/pages/AuthPage.jsx` | **CREATE (NEW)** | Single unified split-screen auth page, role tabs switch between candidate/recruiter forms |
| `frontend/src/pages/CandidatesLogin.jsx` | **MODIFY** | Move form logic into AuthPage or reuse as form component |
| `frontend/src/pages/RecruiterLogin.jsx` | **MODIFY** | Move form logic into AuthPage |
| `frontend/src/pages/CandidatesSignup.jsx` | **MODIFY** | Consistent with AuthPage styling |
| `frontend/src/pages/RecruiterSignup.jsx` | **MODIFY** | Consistent with AuthPage styling |
| `frontend/src/App.jsx` | **MODIFY** | Update redirect: post-login → `/app` (student) or `/dashboard` (recruiter), never `/` |
| `frontend/src/context/AppContext.jsx` | **MODIFY** | Add `redirectAfterLogin(role)` helper returning `/app` or `/dashboard` |

#### Key Visual Rules:
- Left panel: white glassmorphic card, tab switcher, form inputs, purple gradient CTA
- Right panel: deep violet gradient (`from-indigo-600 to-violet-700`) with feature badges
- No Navbar/Footer on auth pages — full-screen layout

---

### ✅ SCREEN 3 — App Shell & Candidate Overview (`/app`) ← GOLDEN THEME BENCHMARK

**Branch commit message:** `feat(ui): implement candidate app shell layout and overview dashboard`

#### Files to Create / Modify:
| File | Action | What Changes |
|---|---|---|
| `frontend/src/layout/CandidateLayout.jsx` | **CREATE (NEW)** | Persistent sidebar + topbar shell for all `/app/**` routes |
| `frontend/src/components/AppSidebar.jsx` | **CREATE (NEW)** | White sidebar with indigo active capsule, avatar at bottom |
| `frontend/src/components/AppTopbar.jsx` | **CREATE (NEW)** | Search pill, notification bell, avatar menu |
| `frontend/src/pages/app/Overview.jsx` | **CREATE (NEW)** | Welcome banner, profile completeness ring, top 3 FAISS jobs, applications snapshot, AI prompt bar |
| `frontend/src/App.jsx` | **MODIFY** | Add `/app/*` protected routes wrapped in `<CandidateLayout>`, add `ProtectedRoute` guard |
| `frontend/src/components/ProtectedRoute.jsx` | **CREATE (NEW)** | Redirect unauthenticated users to `/candidate-login?next=<path>` |

#### Key Visual Rules (ALL SUBSEQUENT SCREENS INHERIT THESE):
```
Sidebar width:     w-64 (desktop) / collapsed to w-16 icon rail (tablet) / bottom tabs (mobile)
Sidebar bg:        bg-white border-r border-slate-200
Active link:       bg-indigo-600 text-white rounded-xl px-3 py-2.5 shadow-sm
Canvas bg:         bg-slate-50
Top bar height:    h-16 bg-white/90 backdrop-blur border-b border-slate-200
Card style:        bg-white rounded-2xl border border-slate-100 shadow-sm p-6
```

---

### ✅ SCREEN 4 — Full-Page AI Career Assistant (`/app/assistant`)

**Branch commit message:** `feat(ui): migrate AI assistant to full-page route inside app shell`

#### Files to Create / Modify:
| File | Action | What Changes |
|---|---|---|
| `frontend/src/pages/app/Assistant.jsx` | **CREATE (NEW)** | Mounts `InternshipChatbot.jsx` in `position="page"` mode inside `<CandidateLayout>` |
| `frontend/src/components/Chatbot/InternshipChatbot.jsx` | **MODIFY** | Add `position="page"` mode: fills full content area, no drawer chrome; keep `floating` FAB and `inline` modes |
| `frontend/src/components/ResumeContextRail.jsx` | **CREATE (NEW)** | Right-hand rail showing extracted skills tags + target roles from resume profile |

#### Key Visual Rules (Screen 3 theme + layout from Screen 4 photo):
- Shell: Screen 3's white sidebar + slate canvas
- Chat workspace: dark obsidian surface (`bg-[#0F0A1E]`) inside the main content area only, not full-page
- Right context rail: white card (`bg-white rounded-2xl border border-slate-100`)

---

### ✅ SCREEN 5 — Job Discovery & Semantic Search (`/app/jobs`)

**Branch commit message:** `feat(ui): redesign job discovery with FAISS recommendations rail and Ask AI button`

#### Files to Create / Modify:
| File | Action | What Changes |
|---|---|---|
| `frontend/src/pages/app/Jobs.jsx` | **CREATE (NEW)** | Authenticated job search page inside `<CandidateLayout>` |
| `frontend/src/components/JobCard.jsx` | **MODIFY** | Add `Ask AI about Job` secondary action button; match Screen 3 card styling |
| `frontend/src/components/RecommendedRail.jsx` | **CREATE (NEW)** | Horizontal pinned rail showing top FAISS matches with "96% Fit" badge |
| `frontend/src/components/JobFilters.jsx` | **CREATE (NEW)** | Left filter panel: category, experience, salary, remote toggle |
| `frontend/src/pages/AllJobs.jsx` | **KEEP** | Public version of job board at `/jobs` (unauthenticated, no FAISS rail) |

#### Key Visual Rules (Screen 3 theme + layout from Screen 5 photo):
- Same white sidebar as Screen 3
- Canvas: `bg-slate-50`
- Filter sidebar: `bg-white rounded-2xl border border-slate-100 p-4`
- Job cards: Screen 3 card style (white, rounded-2xl, soft shadow)

---

### ✅ SCREEN 6 — Applications ATS Tracker / Kanban (`/app/applications`)

**Branch commit message:** `feat(ui): redesign applications tracker as Kanban ATS board with AI match gauges`

#### Files to Create / Modify:
| File | Action | What Changes |
|---|---|---|
| `frontend/src/pages/app/ApplicationsKanban.jsx` | **CREATE (NEW)** | Kanban board view with 4 status columns |
| `frontend/src/components/KanbanColumn.jsx` | **CREATE (NEW)** | Column wrapper with header badge and count |
| `frontend/src/components/ApplicationCard.jsx` | **CREATE (NEW)** | Card with company logo, role, match gauge, matched/missing skill chips |
| `frontend/src/components/MatchGauge.jsx` | **CREATE (NEW)** | SVG circular progress gauge (green >80%, blue 60–79%, amber <60%) |
| `frontend/src/pages/Applications.jsx` | **MODIFY** | Redirect logic to new `/app/applications` route |

#### Key Visual Rules (Screen 3 theme + layout from Screen 6 photo):
- Same white sidebar as Screen 3
- Kanban columns: `bg-slate-100/60 rounded-2xl p-3` with white cards inside
- Matched skills: `bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full`
- Missing skills: `bg-rose-50 text-rose-600 border border-rose-200 rounded-full`

---

### ✅ SCREEN 7 — AI Resume Profile & Upload Pipeline (`/app/profile`)

**Branch commit message:** `feat(ui): implement profile page with async BullMQ pipeline stepper and AI profile display`

#### Files to Create / Modify:
| File | Action | What Changes |
|---|---|---|
| `frontend/src/pages/app/Profile.jsx` | **CREATE (NEW)** | Resume upload + AI-extracted profile display |
| `frontend/src/components/PipelineStepper.jsx` | **CREATE (NEW)** | 4-step progress bar: Uploaded → Parsing → Embedding → Ready |
| `frontend/src/components/ResumeDropzone.jsx` | **CREATE (NEW)** | Drag-and-drop PDF upload zone with file-replace action |
| `frontend/src/components/AIProfileCard.jsx` | **CREATE (NEW)** | Summary, extracted skill tags, education, experience timeline |

#### Key Visual Rules (Screen 3 theme + layout from Screen 7 photo):
- Same white sidebar as Screen 3
- Pipeline stepper: indigo filled circles with connecting lines; completed steps show ✓ in green
- Content: two-column layout (`grid grid-cols-2 gap-6`)

---

### ✅ SCREEN 8 — Recruiter ATS Dashboard (`/dashboard/**`)

**Branch commit message:** `feat(ui): restyle recruiter dashboard to match Screen 3 design tokens and add overview stats`

#### Files to Create / Modify:
| File | Action | What Changes |
|---|---|---|
| `frontend/src/layout/RecruiterLayout.jsx` | **CREATE (NEW)** | Same `<CandidateLayout>` pattern but with recruiter sidebar links |
| `frontend/src/pages/RecruiterOverview.jsx` | **CREATE (NEW)** | Stat cards: Active Postings, Total Candidates, Avg AI Match Fit |
| `frontend/src/pages/Dashborad.jsx` | **MODIFY** | Replace legacy `assets.home_icon` images with `lucide-react` icons; use `RecruiterLayout` |
| `frontend/src/pages/ViewApplications.jsx` | **MODIFY** | Add circular AI match gauge, matched/missing skill chips; apply Screen 3 card style |
| `frontend/src/pages/ManageJobs.jsx` | **MODIFY** | Apply Screen 3 card and table styling |
| `frontend/src/pages/AddJobs.jsx` | **MODIFY** | Apply Screen 3 form card styling |

#### Key Visual Rules (Screen 3 theme + layout from Screen 8 photo):
- Recruiter sidebar uses the **same** `RecruiterLayout` component as `CandidateLayout` — only the nav links differ
- Stat cards: `bg-white rounded-2xl border border-slate-100 shadow-sm p-6`
- ATS table: clean white table inside a `bg-white rounded-2xl` card container

---

## 📌 Commit Cadence & Session Protocol

| Session | Screen | Commit Message |
|---|---|---|
| **Session 1** | Screen 1: Public Landing | `feat(ui): redesign public landing page` |
| **Session 2** | Screen 2: Auth Portal | `feat(ui): redesign auth pages split-screen` |
| **Session 3** | Screen 3: App Shell + Candidate Overview | `feat(ui): candidate app shell and overview` |
| **Session 4** | Screen 4: AI Assistant full-page | `feat(ui): full-page AI assistant inside app shell` |
| **Session 5** | Screen 5: Job Discovery | `feat(ui): job discovery with FAISS rail and AI buttons` |
| **Session 6** | Screen 6: Kanban ATS | `feat(ui): kanban applications tracker with match gauges` |
| **Session 7** | Screen 7: Resume Profile | `feat(ui): profile page with pipeline stepper` |
| **Session 8** | Screen 8: Recruiter Dashboard | `feat(ui): recruiter dashboard with Screen 3 theme` |

> **Rule:** After each session, changes are committed and work stops until the user says `"next"` or `"continue"`.

---

## 🚀 Ready to Start

**Session 1 is next:** Redesign the Public Landing Page (`/`).

> Say **"start"** to begin Screen 1.
