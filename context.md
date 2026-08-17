# CareerPilot (AI-Based Internship & Career Platform) — Comprehensive Project Context

This document provides a complete, production-grade technical reference for the codebase. Future AI models and software engineers should review this document to understand the system architecture, directory structure, database models, AI/ML pipelines, API endpoints, frontend state management, deployment setups, and execution workflows without needing to re-parse the entire repository.

---

## 1. Executive Summary & Core Architecture

**CareerPilot** (formerly AI-Based Internship Recommendation System) is a full-stack, AI-powered recruitment and career guidance SaaS platform. It connects candidates with recruiters using semantic AI vector search, automated ATS match scoring, career coaching via an embedded AI Chatbot, and skill market demand intelligence.

### Core Capabilities
- **Structured Resume Processing**: Parses candidate resumes (PDF/TXT) via PyPDF2/pdfplumber, extracts structured JSON profile data (summary, skills, education, experience, projects) using Google Gemini LLM, generates 768-dimensional vector embeddings, and stores candidate profiles directly in PostgreSQL.
- **`pgvector` Semantic Job Matching**: Replaced file-based FAISS vector stores with PostgreSQL's **`pgvector`** extension (`Vector(768)`). Enables high-performance, in-database cosine similarity search (`<=>`) for job-candidate matching.
- **Automated ATS Match Scoring & Gap Analysis**: Calculates instant Match Percentages (0–100%) for job applications by blending semantic vector proximity with candidate-job skill overlap heuristics. Generates candidate skill gap reports (`matched_skills` vs `missing_skills`).
- **Interactive Multi-Turn AI Career Assistant**: Features intent detection (`recommend_jobs`, `suggest_skills`, `market_insight`, `general`) backed by multi-turn chat history persisted directly in the `chat_sessions` database table.
- **Unified Dual-Portal System**: Candidate registration/login with resume management & job application tracking; Recruiter registration/login with posting management, ATS applicant rankings, and application status management (`applied` -> `shortlisted` -> `interviewing` -> `selected` / `rejected`).
- **Market Demand Intelligence**: Aggregates skill frequency across job postings into a normalized `skill_market_trends` table to deliver real-time market insights and personalized skill roadmaps.

---

## 2. Technology Stack

| Layer | Technology | Details / Usage |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | Modern single-page web app built with React Router v6 |
| **Styling & Icons** | Vanilla CSS3 + Lucide Icons | Responsive UI with rich CSS design system & Lucide iconography |
| **Frontend State & HTTP** | React Context API + Axios | Unified auth state in `AppContext`, Axios interceptor for JWT injection |
| **Backend Framework** | Python 3.10+ & FastAPI | Async REST API framework with Uvicorn ASGI server |
| **Database & ORM** | Neon DB (PostgreSQL) + SQLAlchemy 2.0 (Async) | Async Database operations with `asyncpg` (runtime) and `psycopg2` (migrations) |
| **Vector Store** | `pgvector` Extension | In-database 768-dim vector embeddings and `ivfflat` cosine similarity indexes |
| **Database Migrations** | Alembic | Version-controlled schema migrations (`alembic/versions/`) |
| **AI & LLM Engine** | Google Gemini API (`google-genai`) | Primary & sole AI provider: `text-embedding-004` (embeddings) and `gemini-2.0-flash` / `gemini-flash-latest` (LLM) |
| **Authentication & Security** | JWT (`python-jose`) + Passlib (`bcrypt`) | Stateless Bearer token authentication for `student` and `recruiter` roles |
| **Resume Extraction** | PyPDF2 + pdfplumber | Dual PDF text extraction fallback engine |
| **Containerization & Hosting** | Docker, Docker Compose, Render | Multi-stage Docker containers, `render.yaml` deployment scripts |

---

## 3. Project Directory Structure

```
AI-Based-Internship-Recommendation/
├── backend/
│   ├── alembic/                         # Database schema migration scripts
│   │   ├── versions/
│   │   │   └── 001_initial_schema.py   # Initial Neon DB + pgvector migration
│   │   ├── env.py                       # Alembic env setup with psycopg2 driver
│   │   └── script.py.mako               # Alembic template
│   ├── db/
│   │   ├── crud/                        # Modularized async CRUD database handlers
│   │   │   ├── applications.py          # Application creation, listing, status updates & withdrawal
│   │   │   ├── companies.py             # Recruiter company signup, login & profile lookup
│   │   │   ├── jobs.py                  # Job posting creation, vector search, filter & update
│   │   │   ├── resume.py                # Resume profile save, update & retrieval
│   │   │   └── users.py                 # Student user creation, login & authentication
│   │   ├── database.py                  # Async SQLAlchemy engine, session maker & pgvector setup
│   │   ├── models.py                    # SQLAlchemy ORM models (User, Company, Job, ResumeProfile, Application, ChatSession, SkillMarketTrend)
│   │   ├── schemas.py                   # Pydantic v2 validation models for requests & responses
│   │   └── Postgress_config.txt         # PostgreSQL / Neon DB configuration notes
│   ├── routes/
│   │   ├── ai_routes.py                 # Resume upload (/api/ai/resume/upload), Q&A chat (/api/ai/chat), history
│   │   ├── application_routes.py        # Student apply (/api/applications/), application history, withdraw
│   │   ├── auth_routes.py               # Student & Recruiter register/login (/api/auth/register/*, /api/auth/login/*, /api/auth/me)
│   │   ├── internship_routes.py         # Legacy internship routes compatibility wrapper
│   │   ├── job_routes.py                # Public job listing (/api/jobs), semantic vector search (/search), recommendations (/recommended)
│   │   ├── recruiter_routes.py          # Recruiter dashboard stats, job creation (/api/recruiter/jobs), applicant ranking
│   │   └── student_routes.py            # Legacy student routes compatibility
│   ├── services/
│   │   ├── gemini_service.py            # Centralized Gemini API service wrapper (embedding, chat, structured JSON)
│   │   ├── job_matching.py              # Semantic vector search & ATS match score computation
│   │   ├── recommendation.py            # Multi-turn chat message processing & intent resolution
│   │   ├── resume_parser.py             # PyPDF2/pdfplumber text extraction + Gemini structured resume parsing
│   │   └── skill_market.py              # Market trend demand score calculation & skill gap recommendations
│   ├── static/
│   │   └── resumes/                     # Permanent storage for uploaded candidate resume PDFs
│   ├── utils/
│   │   ├── auth.py                      # Bcrypt password hashing & JWT access token verification
│   │   └── config.py                    # Pydantic BaseSettings environment configuration loader
│   ├── alembic.ini                      # Alembic configuration
│   ├── Dockerfile                       # Python 3.10 Backend container setup
│   ├── Dockerfile.postgres              # Custom PostgreSQL container definition
│   ├── env.example                      # Environment variables template
│   ├── main.py                          # FastAPI main entry point, CORS, static mounting & router inclusions
│   ├── render.yaml                      # Render cloud deployment specification
│   ├── RENDER_DEPLOYMENT_GUIDE.md       # Render backend deployment documentation
│   └── requirements.txt                 # Backend Python package dependencies
├── frontend/
│   ├── public/                          # Static web assets
│   ├── src/
│   │   ├── assets/                      # Images, SVGs, global CSS assets
│   │   ├── components/
│   │   │   ├── Chatbot/
│   │   │   │   └── InternshipChatbot.jsx# Standalone candidate chatbot assistant modal
│   │   │   ├── ChatbotSection.jsx       # Landing page chatbot showcase banner
│   │   │   ├── EmbeddedChatbot.jsx      # Slide-out interactive embedded chatbot drawer
│   │   │   ├── FeaturedJob.jsx          # Home page featured job grid
│   │   │   ├── Hero.jsx                 # Dynamic home page hero banner
│   │   │   ├── JobCard.jsx              # Reusable job item card with match score indicator
│   │   │   ├── JobCategory.jsx          # Job category filter grid
│   │   │   ├── Navbar.jsx               # Navigation bar with role-aware action buttons & mobile menu
│   │   │   └── ...                      # Footer, Counter, Loader, Testimonials components
│   │   ├── context/
│   │   │   └── AppContext.jsx           # Global state provider for auth token, role, jobs & applications
│   │   ├── layout/
│   │   │   └── AppLayout.jsx            # Top-level layout wrapper with Navbar & Footer
│   │   ├── pages/
│   │   │   ├── About.jsx                # Platform about page
│   │   │   ├── AddJobs.jsx              # Recruiter job posting form
│   │   │   ├── AllJobs.jsx              # Job browsing & multi-filter search page
│   │   │   ├── Applications.jsx         # Candidate submitted applications dashboard
│   │   │   ├── ApplyJob.jsx             # Job details view & single-click application submit
│   │   │   ├── CandidatesLogin.jsx      # Candidate login form
│   │   │   ├── CandidatesSignup.jsx     # Candidate signup form
│   │   │   ├── Dashborad.jsx            # Recruiter layout & navigation shell
│   │   │   ├── Home.jsx                 # Main landing page
│   │   │   ├── ManageJobs.jsx           # Recruiter active postings list & delete manager
│   │   │   ├── RecruiterLogin.jsx       # Recruiter login form
│   │   │   ├── RecruiterSignup.jsx      # Recruiter signup form
│   │   │   ├── Terms.jsx                # Terms of service page
│   │   │   └── ViewApplications.jsx     # Recruiter ATS applicant management panel
│   │   ├── utils/
│   │   │   └── api.js                   # Axios HTTP client with request token header & 401 interceptor
│   │   ├── App.jsx                      # Main React Router v6 route configuration
│   │   ├── main.jsx                     # Vite React entry point
│   │   └── index.css                    # Design system styling tokens & utility rules
│   ├── Dockerfile                       # Multi-stage Docker build container with Nginx
│   ├── nginx.conf                       # Production Nginx reverse proxy configuration
│   ├── package.json                     # Frontend dependencies (React 18, Vite, Axios, Lucide, Toast)
│   └── vite.config.js                   # Vite build configuration
├── docker-compose.yml                   # Multi-container orchestration (PostgreSQL, Backend, Frontend)
├── init_database.py                     # Initial seed database script
├── start_all.ps1                        # Concurrent backend & frontend launcher script for Windows
├── BACKEND_PLAN.md                      # Backend architectural redesign specification
└── test_*.py                            # Test & verification scripts (test_ai_services, test_embeddings, etc.)
```

---

## 4. Database Models & Schema Design (`backend/db/models.py`)

The system utilizes **Neon DB (PostgreSQL)** paired with **`pgvector`**. All primary keys are auto-generated **UUIDs** (`gen_random_uuid()`).

### 1. `User` (`users` table) — Student / Candidate Accounts
- `id` (*UUID, Primary Key*): Unique student identifier.
- `email` (*VARCHAR 255, Unique, Index*): Candidate login email address.
- `password_hash` (*VARCHAR 255*): Bcrypt hashed password.
- `full_name` (*VARCHAR 150*): Candidate full name.
- `phone` (*VARCHAR 20, Optional*): Contact telephone number.
- `avatar_url` (*TEXT, Optional*): Candidate profile picture URL.
- `plan` (*VARCHAR 20, Default "free"*): Account tier (`free`, `pro`, `enterprise`).
- `created_at` / `updated_at` (*TIMESTAMPTZ*): UTC creation and modification timestamps.

### 2. `Company` (`companies` table) — Recruiter Accounts
- `id` (*UUID, Primary Key*): Unique company identifier.
- `email` (*VARCHAR 255, Unique, Index*): Recruiter email address.
- `password_hash` (*VARCHAR 255*): Bcrypt hashed password.
- `company_name` (*VARCHAR 200*): Registered organization name.
- `website` (*TEXT, Optional*): Organization website URL.
- `industry` (*VARCHAR 100, Optional*): Industry category.
- `description` (*TEXT, Optional*): Company overview.
- `logo_url` (*TEXT, Optional*): Organization brand logo URL.
- `verified` (*BOOLEAN, Default False*): Verified employer checkmark.
- `plan` (*VARCHAR 20, Default "free"*): Account tier.

### 3. `Job` (`jobs` table) — Job & Internship Postings
- `id` (*UUID, Primary Key*): Unique job posting ID.
- `company_id` (*UUID, FK -> companies.id, On Delete Cascade*): Posting company.
- `title` (*VARCHAR 255*): Job title (e.g., "AI Engineering Intern").
- `description` (*TEXT*): Comprehensive job description.
- `skills_required` (*ARRAY(Text)*): Required candidate skills (e.g., `["Python", "FastAPI", "React"]`).
- `job_type` (*VARCHAR 50, Default "internship"*): Employment type (`internship`, `full_time`, `part_time`, `contract`).
- `location` (*VARCHAR 150*): Geographical location or "Remote".
- `is_remote` (*BOOLEAN, Default False*): Remote work flag.
- `salary_min` / `salary_max` (*INTEGER*): Monthly compensation range (in INR).
- `duration` (*VARCHAR 100*): Internship duration (e.g., "6 months").
- `experience_level` (*VARCHAR 50*): Required tier (`fresher`, `junior`, `mid`, `senior`).
- `openings` (*INTEGER, Default 1*): Available position count.
- `deadline` (*DATE*): Application deadline.
- `status` (*VARCHAR 20, Default "active"*): Posting state (`active`, `closed`, `draft`).
- `embedding` (*Vector(768)*): **`pgvector` 768-dim Gemini vector representation** used for semantic search with `ivfflat` vector index.

### 4. `ResumeProfile` (`resume_profiles` table) — Candidate Parsed Resume Data
- `id` (*UUID, Primary Key*): Record ID.
- `user_id` (*UUID, Unique, FK -> users.id, On Delete Cascade*): Associated student account.
- `raw_text` (*TEXT*): Extracted raw text content from PDF/TXT resume.
- `summary` (*TEXT*): Concise candidate executive summary generated by Gemini LLM.
- `skills` (*ARRAY(Text)*): Extracted candidate technical skills.
- `education` (*JSONB*): Array of education records `[{ degree, institution, year, gpa }]`.
- `experience` (*JSONB*): Array of employment entries `[{ title, company, duration, description }]`.
- `projects` (*JSONB*): Array of key projects `[{ name, description, tech_stack, link }]`.
- `embedding` (*Vector(768)*): **`pgvector` 768-dim Gemini vector representation** of the candidate summary.
- `resume_url` (*TEXT*): Static file URL to the uploaded resume PDF (`/static/resumes/{user_id}_{filename}`).

### 5. `Application` (`applications` table) — Candidate Job Applications
- `id` (*UUID, Primary Key*): Application ID.
- `user_id` (*UUID, FK -> users.id, On Delete Cascade*): Applicant ID.
- `job_id` (*UUID, FK -> jobs.id, On Delete Cascade*): Target job posting ID.
- `status` (*VARCHAR 30, Default "applied"*): Current ATS state (`applied`, `shortlisted`, `interviewing`, `rejected`, `selected`).
- `cover_letter` (*TEXT, Optional*): Candidate cover note.
- `match_score` (*FLOAT*): Computed AI match percentage (0.0–100.0%).
- `matched_skills` (*ARRAY(Text)*): Overlapping skills between candidate and job requirements.
- `missing_skills` (*ARRAY(Text)*): Identified skill gaps required by the job.
- `applied_at` / `updated_at` (*TIMESTAMPTZ*): Application audit timestamps.
- **Unique Constraint**: `(user_id, job_id)` prevents duplicate applications per job.

### 6. `ChatSession` (`chat_sessions` table) — AI Assistant Chat History
- `id` (*UUID, Primary Key*): Record ID.
- `user_id` (*UUID, FK -> users.id, On Delete Cascade*): Student chat owner.
- `role` (*VARCHAR 10*): Message sender (`user` or `assistant`).
- `content` (*TEXT*): Message body content.
- `intent` (*VARCHAR 50*): Classified intent (`recommend_jobs`, `suggest_skills`, `market_insight`, `general`).

### 7. `SkillMarketTrend` (`skill_market_trends` table) — Market Demand Intelligence
- `id` (*UUID, Primary Key*): Record ID.
- `skill_name` (*VARCHAR 150, Unique, Index*): Target skill name (e.g., "Docker").
- `demand_score` (*FLOAT*): Normalized market demand score (0.0–100.0).
- `growth_trend` (*VARCHAR 20*): Trend indicator (`rising`, `stable`, `declining`).
- `avg_salary` (*INTEGER*): Average monthly compensation for positions requiring this skill.
- `top_companies` / `related_skills` (*ARRAY(Text)*): Associated employer names and related technologies.

---

## 5. AI, Embeddings & Semantic Matching Engine

The AI subsystem operates exclusively via **Google Gemini API** through `backend/services/gemini_service.py`.

### 1. Vector Embedding Provider (`text-embedding-004`)
- **Dimension**: 768 dimensions.
- **Usage**: Encodes both job postings (`title`, `description`, `skills_required`) and candidate resumes into 768-dim dense floating-point vectors.
- **Database Storage**: Saved into `pgvector` columns (`Job.embedding` and `ResumeProfile.embedding`).

### 2. In-Database Vector Search (`pgvector`)
- Computes cosine distance using PostgreSQL's `<=>` operator:
  ```sql
  SELECT id, title, description, 1 - (embedding <=> :query_vector) AS similarity_score
  FROM jobs
  WHERE status = 'active'
  ORDER BY embedding <=> :query_vector
  LIMIT :limit;
  ```

### 3. Automated ATS Match Score Computation (`backend/services/job_matching.py`)
When a student applies for a job, `calculate_match_score()` evaluates:
1. **Skill Overlap Score** (\(S_{\text{skills}}\)): Intersection of candidate `ResumeProfile.skills` against job `Job.skills_required`.
2. **Semantic Similarity Score** (\(S_{\text{semantic}}\)): Cosine similarity between resume vector and job vector.
3. **Composite Match Score**:
   \[
   \text{MatchScore} = \text{Round}\big( (0.6 \times S_{\text{skills}} + 0.4 \times S_{\text{semantic}}) \times 100 \big)
   \]
4. Computes `matched_skills` array and `missing_skills` gap array, persisting them in the application record.

### 4. Multi-Turn AI Assistant & Intent Detection (`backend/services/recommendation.py`)
- **Intent Classification**: Classifies incoming candidate query into one of:
  - `recommend_jobs`: Performs semantic vector search on active job postings.
  - `suggest_skills`: Evaluates candidate skills against market trends to return personalized upskilling advice.
  - `general`: Provides conversational career coaching using Gemini LLM.
- **Persistent Memory**: Chat messages are recorded in `chat_sessions` and pulled dynamically to maintain multi-turn context without client-side session cookies.

---

## 6. API Endpoints Reference

### Core & Health (`backend/main.py`)
- `GET /healthz`: Health check endpoint. Returns `{"status": "ok", "app": "CareerPilot", "version": "2.0.0"}`.
- `GET /api/version`: System version and runtime metadata.

### Authentication (`/api/auth`, `backend/routes/auth_routes.py`)
- `POST /api/auth/register/student`: Register a student candidate. Request: `UserCreate`. Returns: `UserResponse`.
- `POST /api/auth/login/student`: Login student candidate. Request: `UserLogin`. Returns: `TokenResponse` (`access_token`, `role="student"`).
- `POST /api/auth/register/recruiter`: Register a recruiter company. Request: `CompanyCreate`. Returns: `CompanyResponse`.
- `POST /api/auth/login/recruiter`: Login recruiter company. Request: `UserLogin`. Returns: `TokenResponse` (`access_token`, `role="recruiter"`).
- `GET /api/auth/me`: Authenticated profile fetch for currently logged in student or recruiter.

### Jobs & Search (`/api/jobs`, `backend/routes/job_routes.py`)
- `GET /api/jobs`: List active jobs with pagination (`limit`, `offset`) and filters (`job_type`, `location`, `experience_level`).
- `GET /api/jobs/search?q={query}`: Semantic vector search using natural language query.
- `GET /api/jobs/recommended`: Authenticated student endpoint returning personalized job recommendations based on candidate resume embedding.
- `GET /api/jobs/{job_id}`: Fetch detailed breakdown of a specific job posting.

### Applications (`/api/applications`, `backend/routes/application_routes.py`)
- `POST /api/applications/`: Submit job application. Request: `ApplicationApply` (`job_id`, `cover_letter`). Automatically computes ATS `match_score`, `matched_skills`, and `missing_skills`.
- `GET /api/applications/me`: Authenticated student endpoint returning submitted applications with job details.
- `DELETE /api/applications/{application_id}`: Withdraw an active application.

### AI Subsystem (`/api/ai`, `backend/routes/ai_routes.py`)
- `POST /api/ai/resume/upload`: Multipart file upload (PDF/TXT). Performs text extraction -> Gemini JSON structured extraction -> 768-dim vector embedding -> permanent disk save (`static/resumes`) -> DB save.
- `GET /api/ai/resume`: Retrieve authenticated student's parsed resume profile.
- `POST /api/ai/chat`: Send message to AI Career Assistant. Request: `ChatRequest`. Returns: `ChatResponse` (`response`, `intent`).
- `GET /api/ai/chat/history`: Fetch candidate's persistent chat conversation history.

### Recruiter Management (`/api/recruiter`, `backend/routes/recruiter_routes.py`)
- `POST /api/recruiter/jobs`: Create new job posting with automatic vector embedding generation. Request: `JobCreate`.
- `GET /api/recruiter/jobs`: Fetch all jobs posted by the authenticated recruiter.
- `PUT /api/recruiter/jobs/{job_id}`: Edit job details. Request: `JobUpdate`.
- `DELETE /api/recruiter/jobs/{job_id}`: Remove or close a job posting.
- `GET /api/recruiter/jobs/{job_id}/applications`: Fetch all candidate applications for a specific job, pre-ranked by match score.
- `PATCH /api/recruiter/applications/{application_id}/status`: Update candidate ATS status (`applied`, `shortlisted`, `interviewing`, `rejected`, `selected`).

---

## 7. Frontend Architecture & State Management

### 1. Unified Context Provider (`frontend/src/context/AppContext.jsx`)
Central state container managing authentication state, active user profiles, global job listings, and application states:
- `token`: Active JWT access token string (stored in `localStorage`).
- `userRole`: Role identifier (`"student"` vs `"recruiter"`).
- `userData`: Decoded profile object for student or company.
- `jobs` / `fetchJobsData()`: List of public job postings.
- `userApplications` / `fetchUserApplications()`: Applications list for logged-in candidates.
- `logout()`: Clears credentials and resets context state.

### 2. Axios Network Interceptor (`frontend/src/utils/api.js`)
Configured Axios instance with `baseURL` (`import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'`):
- **Request Interceptor**: Automatically attaches `Authorization: Bearer <token>` header to all outgoing requests.
- **Response Interceptor**: Intercepts `401 Unauthorized` responses, clears invalid local storage credentials, and redirects non-auth pages to login.

### 3. Route Hierarchy (`frontend/src/App.jsx`)
- **Public Candidate Pages**: `/` (Home), `/all-jobs` (Job search grid with filter bar), `/apply-job/:id` (Job view & apply drawer), `/about`, `/terms`.
- **Auth Routes**: `/candidate-login`, `/candidate-signup`, `/recruiter-login`, `/recruiter-signup`.
- **Candidate Portal**: `/applications` (Application tracking dashboard with AI match badges).
- **Recruiter Portal**: `/dashboard` layout wrapper with nested routes:
  - `/dashboard/add-job`: Job posting creation interface.
  - `/dashboard/manage-jobs`: Active job posting list manager.
  - `/dashboard/view-applications`: Applicant tracking board with ATS match scores and candidate status selectors.

---

## 8. Environment Variables & Configuration

Create a `.env` file in the `backend/` directory based on `backend/env.example`:

```env
# App Metadata
APP_NAME=CareerPilot
APP_VERSION=2.0.0
APP_ENV=development

# Database Connection (Neon DB / PostgreSQL)
# Format (async runtime): postgresql+asyncpg://user:password@ep-host.neon.tech/dbname?sslmode=require
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/careerpilot

# AI Provider Key (Google Gemini API)
GOOGLE_API_KEY=your_google_gemini_api_key_here
GEMINI_LLM_MODEL=gemini-flash-latest
GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001
GEMINI_EMBEDDING_DIM=768

# Authentication Secrets
JWT_SECRET_KEY=your_super_secret_jwt_key_min_32_chars
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080

# CORS Allowed Origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# File Upload Configuration
UPLOAD_DIR=./temp_uploads
MAX_UPLOAD_SIZE_MB=10
PORT=8000
```

Frontend Environment (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 9. Database Migrations (Alembic)

Database schema migrations are located in `backend/alembic/`.

### Migration Commands
```bash
cd backend

# Run pending migrations up to latest version
alembic upgrade head

# Create a new migration script after modifying models.py
alembic revision --autogenerate -m "describe changes here"

# Revert last migration step
alembic downgrade -1
```

---

## 10. Execution & Deployment Workflow

### Option A: Concurrent Local Start (PowerShell on Windows)
Launch both backend FastAPI server and frontend Vite development server concurrently:
```powershell
.\start_all.ps1
```

### Option B: Manual Terminal Startup
1. **Backend Server**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
2. **Frontend Development Server**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Option C: Docker Container Orchestration
Build and run the entire stack (PostgreSQL + `pgvector`, FastAPI backend, Nginx frontend):
```bash
docker compose up --build
```

### Access Ports
- **Frontend SPA**: `http://localhost:5173`
- **Backend API Base**: `http://localhost:8000/api`
- **Interactive OpenAPI Documentation**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Endpoint**: `http://localhost:8000/healthz`
