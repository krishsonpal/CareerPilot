# AI-Based Internship Recommendation System — Comprehensive Project Context

This document provides a complete technical reference for the codebase. Future AI models and developers should review this document to understand the system architecture, code structure, data models, AI/ML pipelines, API endpoints, frontend state management, deployment options, and execution steps without needing to re-parse the entire repository.

---

## 1. Executive Summary & Core Architecture

The **AI-Based Internship Recommendation System** is a full-stack Web & AI application. It parses student resumes, generates semantic vector embeddings, performs similarity searches against posted internships, and provides personalized internship recommendations and interactive career guidance via an embedded AI Chatbot.

### Key Capabilities
- **Resume Processing & Feature Extraction**: Extracts text from PDF/TXT resumes, summarizes key candidate information (skills, education, projects, strengths) via Gemini LLM, and embeds vector representations.
- **RAG & Vector Search**: Stores internship postings in a FAISS vector index (`faiss-cpu`) and matches student profiles with internships using embedding vector similarity.
- **Resilient AI Pipeline with Automatic Fallbacks**:
  - Embeddings: Primary = Google Gemini (`gemini-embedding-001`), Fallback = HuggingFace (`sentence-transformers/all-MiniLM-L6-v2`).
  - Chat LLM: Primary = Google Gemini (`gemini-2.0-flash`), Fallback = Local Ollama (`llama3`).
- **Interactive AI Assistant**: Features multi-turn chat memory, intent detection (`recommend_internships`, `suggest_skills`, `general`), match scoring (0-100% skill match percentage), and skill gap analysis.
- **Dual Portal (Student & Recruiter)**: Candidate registration/login with resume upload; Recruiter registration/login with internship management dashboard.

---

## 2. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Axios, React Hot Toast, TailwindCSS / CSS3, Lucide Icons |
| **Backend Framework** | Python 3.8+, FastAPI, Uvicorn |
| **Database & ORM** | SQLAlchemy, SQLite (Dev Default) / PostgreSQL (Production), Psycopg2 |
| **Authentication & Security** | JWT (`python-jose`), Passlib (bcrypt), Starlette SessionMiddleware |
| **Vector Store & Retrieval** | FAISS (`faiss-cpu`), LangChain (`langchain-community`, `langchain-text-splitters`) |
| **LLM & Embedding Providers** | Google Generative AI (`langchain-google-genai`), Hugging Face (`langchain-huggingface`), PyPDF2 |
| **Containerization & Deployment** | Docker, Docker Compose, Nginx, Render, Vercel, Railway |

---

## 3. Project Directory Structure

```
.
├── backend/
│   ├── db/
│   │   ├── crud.py                  # Database CRUD queries (Users, Companies, Internships, Resumes)
│   │   ├── database.py              # SQLAlchemy engine & session maker
│   │   ├── models.py                # SQLAlchemy ORM models (Internship, User, Company, ResumeSummary)
│   │   ├── schemas.py               # Pydantic request/response validation schemas
│   │   └── vectorstore.py           # FAISS vector store initialization, persistence, and student stores
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── internship_routes.py     # Company auth (/company/signup, /company/login) & internship CRUD
│   │   └── student_routes.py        # Student auth, resume upload/analysis, scored recs, & chatbot endpoint
│   ├── services/
│   │   ├── __init__.py
│   │   ├── recommendation.py        # Vector similarity search, average embeddings, skill matching & intent detection
│   │   └── resume_parser.py         # PyPDF2 extraction & Gemini LLM resume summarization
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── auth.py                  # Password hashing (bcrypt) & JWT token generation/verification
│   │   └── config.py                # Environment variables, CORS config, & embedding fallback setup
│   ├── add_new_internships.py       # Utility to populate database with new internships & rebuild FAISS
│   ├── Dockerfile                   # Backend Docker configuration (Python 3.10)
│   ├── Dockerfile.postgres          # Custom PostgreSQL container setup
│   ├── env.example                  # Environment variable template
│   ├── init_database.py             # Database seed script for backend
│   ├── main.py                      # FastAPI entry point, middleware (CORS, Sessions), router inclusions
│   ├── migrate_sqlite_to_postgres.py# SQLite -> PostgreSQL migration tool
│   ├── RENDER_DEPLOYMENT_GUIDE.md   # Backend Render deployment instructions
│   ├── render.yaml                  # Render deployment configuration
│   ├── requirements.txt             # Python dependencies
│   ├── start_dev.ps1                # PowerShell backend startup script
│   └── start_production.sh          # Linux production startup script
├── frontend/
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── assets/                  # Images, SVGs, and styles
│   │   ├── components/              # UI Components (Navbar, Footer, Hero, JobCard, EmbeddedChatbot, etc.)
│   │   ├── context/
│   │   │   └── AppContext.jsx       # Central state management (auth, jobs data, user profiles)
│   │   ├── layout/
│   │   │   └── AppLayout.jsx        # Standard page layout wrapper with Navbar & Footer
│   │   ├── pages/                   # Application pages (Home, AllJobs, ApplyJob, Dashboard, Login, Signup)
│   │   ├── App.jsx                  # Main routing component
│   │   ├── main.jsx                 # Vite application entry point
│   │   └── index.css                # Global CSS styles
│   ├── Dockerfile                   # Multi-stage Docker build with Nginx
│   ├── nginx.conf                   # Nginx reverse proxy configuration
│   ├── package.json                 # Node.js dependencies and scripts
│   ├── vercel.json                  # Vercel SPA rewrite deployment config
│   └── vite.config.js               # Vite build config
├── docker-compose.yml               # Multi-container orchestration (PostgreSQL, Backend, Frontend)
├── init_database.py                 # Root database table creation & seed script
├── README.md                        # Quickstart documentation
├── start_all.ps1                    # Root PowerShell script to launch Backend & Frontend concurrently
└── test_*.py                        # Development test scripts (test_ai_services, test_vectorstore, etc.)
```

---

## 4. Database Models & Schema Design (`backend/db/models.py`)

The application uses **SQLAlchemy ORM** targeting SQLite for development and PostgreSQL for production (`DATABASE_URL`).

### 1. `Internship` (`internships` table)
- `job_id` (*Integer, Primary Key, Autoincrement*): Unique identifier for internship.
- `title` (*String 255*): Internship title (e.g., "Software Developer Intern").
- `description` (*Text*): Full job description.
- `skills_required` (*Text*): Required skills (comma-separated or text).
- `location` (*String 100*): Location ("Remote", "Hybrid", "On-site").
- `stipend` (*String 50*): Compensation information.
- `duration` (*String 50*): Duration (e.g., "3 months").

### 2. `User` (`users` table)
- `id` (*Integer, Primary Key, Autoincrement*): Internal record ID.
- `student_id` (*String 50, Unique, Index*): User login ID (e.g., student registration number).
- `email` (*String 100, Unique, Index*): Candidate email address.
- `password_hash` (*String 255*): Bcrypt hashed password.
- `name` (*String 100*): Full name of student.
- `created_at` (*DateTime*): Account creation timestamp.

### 3. `Company` (`companies` table)
- `id` (*Integer, Primary Key, Autoincrement*): Internal record ID.
- `company_id` (*String 50, Unique, Index*): Recruiter/Company ID.
- `email` (*String 100, Unique, Index*): Company email address.
- `password_hash` (*String 255*): Bcrypt hashed password.
- `company_name` (*String 100*): Registered company name.
- `created_at` (*DateTime*): Account creation timestamp.

### 4. `ResumeSummary` (`resume_summaries` table)
- `id` (*Integer, Primary Key, Autoincrement*): Record ID.
- `student_id` (*String, Unique, Index*): Links resume summary directly to student.
- `summary_text` (*Text*): Concise resume summary generated by LLM.
- `embedding_vector` (*LargeBinary*): Binary pickled vector representation (`pickle.dumps(embedding_list)`).
- `created_at` (*String*): Timestamp of resume processing.

---

## 5. AI, Embeddings & RAG Recommendation Pipeline

### 1. Robust Embedding Provider with Automatic Fallback (`backend/utils/config.py`)
- Function `get_embeddings_with_fallback()` initializes:
  1. Primary: `GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")`. Performs a smoke test.
  2. Fallback: If `GOOGLE_API_KEY` is missing or raises `ResourceExhausted` / API errors, it falls back seamlessly to `HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")`.
- FAISS indexes are stored in separate directories based on provider type (`faiss_index_gemini` vs `faiss_index_huggingface`) to prevent vector dimension mismatch.

### 2. Vector Store Indexing (`backend/db/vectorstore.py`)
- **Global Internship Vectorstore**:
  - Combines `job_id`, `title`, `description`, `skills_required`, and `location` into FAISS documents.
  - Chunked using `RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)`.
  - Persisted locally under `VECTORSTORE_PATH` (`save_local` / `load_local`).
  - Auto-rebuilt whenever a recruiter adds a new internship via `/company/add_internship/`.
- **Per-Student Vectorstore**:
  - Generates dedicated FAISS indexes per student under `STUDENT_VECTORSTORE_DIR/{student_id}` for granular resume fragment retrieval.

### 3. Recommendation Algorithm & Matching (`backend/services/recommendation.py`)
- **Vector Similarity Search**: `similarity_search_by_vector(query_embedding, k=5)` searches FAISS for top matching job IDs.
- **Skill Match & Gap Analysis (`score_skill_match` & `augment_recommendations_with_scoring`)**:
  - Rule-based regex skill parsing combined with tech keyword overlap heuristics.
  - Computes Match Percentage (0-100%) and identifies explicit skill gaps.
- **Interactive Multi-Turn Query Memory**:
  - Combines student resume embedding + last 3 chat query embeddings via element-wise vector averaging (`average_embeddings`), delivering context-aware recommendations during live chat.

---

## 6. API Endpoints Reference

### Core Routes (`backend/main.py`)
- `GET /healthz`: Health check endpoint. Returns `{"status": "ok"}`.

### Student Routes (`/student`, `backend/routes/student_routes.py`)
- `POST /student/signup`: Student registration. Request: `UserSignup` (`student_id`, `email`, `password`, `name`).
- `POST /student/login`: Student login. Request: `UserLogin` (`student_id`, `password`). Returns JWT `Token`.
- `GET /student/user-info`: Authenticated endpoint. Returns student ID & resume status (`has_resume_summary`).
- `GET /student/session-status`: Inspect active Starlette session state.
- `POST /student/analyze_resume/`: Upload PDF/TXT resume. Performs text extraction -> Gemini summary -> embedding calculation -> DB/Session cache -> Scored Recommendations output.
- `GET /student/recommendations_scored`: Re-computes top 3 scored recommendations from session state.
- `POST /student/chat`: Interactive Chatbot endpoint. Detects intent (`recommend_internships`, `suggest_skills`, `general`) and executes vector search or LLM answer generation.

### Company/Recruiter Routes (`/company`, `backend/routes/internship_routes.py`)
- `POST /company/signup`: Recruiter registration. Request: `CompanySignup`.
- `POST /company/login`: Recruiter login. Request: `CompanyLogin`. Returns JWT `Token`.
- `GET /company/internships`: Fetch all available internships.
- `POST /company/add_internship/`: Add new internship (`title`, `description`, `skills_required`, `location`, `stipend`, `duration`) and automatically update global FAISS vectorstore.

---

## 7. Frontend Architecture & State Management

- **Routing Structure (`frontend/src/App.jsx`)**:
  - Standard Routes: `/` (Home), `/all-jobs/:category` (Job listing/filter), `/apply-job/:id`, `/applications`, `/about`, `/terms`.
  - Authentication: `/candidate-login`, `/candidate-signup`, `/recruiter-login`, `/recruiter-signup`.
  - Recruiter Dashboard: `/dashboard` with nested outlets `/dashboard/add-job`, `/dashboard/manage-jobs`, `/dashboard/view-applications`.
- **Global Context (`frontend/src/context/AppContext.jsx`)**:
  - Manages `userToken`, `companyToken`, candidate profile, recruiter profile, job listings state, and API network calls via `axios`.
  - Automatically persists auth tokens & profile data in `localStorage`.
- **Embedded Chatbot Component (`frontend/src/components/EmbeddedChatbot.jsx`)**:
  - Dynamic chatbot interface supporting resume upload, live Q&A, interactive internship recommendation cards, and skill advice.

---

## 8. Environment Variables & Configuration

Create a `.env` file in the `backend/` directory based on `backend/env.example`:

```env
# AI Models API Keys
GOOGLE_API_KEY=your_gemini_api_key_here
HUGGINGFACE_API_TOKEN=your_huggingface_token_here (Optional)

# Database Connection (Defaults to local SQLite if omitted)
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/internships

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Security Secrets
SESSION_SECRET=a_very_secret_session_key
JWT_SECRET_KEY=a_very_secret_jwt_key

# Vector Store Storage Paths
VECTORSTORE_DIR=.
STUDENT_VECTORSTORE_DIR=.

# Database Auto-Creation
RUN_DB_CREATE_ALL=true
```

For the Frontend (`frontend/.env`):
```env
VITE_BACKEND_URL=http://localhost:8000
```

---

## 9. Development & Execution Instructions

### Option A: Concurrent Start via PowerShell (Recommended for Windows)
```powershell
.\start_all.ps1
```

### Option B: Manual Startup
1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Option C: Docker Deployment
```bash
docker compose up --build
```

---

## 10. Development & Testing Scripts

- `init_database.py`: Initializes SQLite tables and inserts sample internships (Software Developer, Data Science, UI/UX Design).
- `test_ai_services.py`: Tests resume parsing & Gemini API connectivity.
- `test_embeddings.py`: Tests vector embedding generation & fallback functionality.
- `test_vectorstore.py`: Tests FAISS vector database build, serialization, and similarity retrieval.
- `migrate_sqlite_to_postgres.py`: Bulk migrates existing SQLite tables to a target PostgreSQL database.
