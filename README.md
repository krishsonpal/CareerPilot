# AI Internship Recommender

AI-powered internship recommender using FastAPI, LangChain, FAISS, Gemini, and Hugging Face

## Quick Start

### Prerequisites
- Python 3.8+ 
- Node.js 16+
- npm or yarn

### 1. Environment Setup

Copy the environment file and configure your API keys:
```bash
cp backend/env.example backend/.env
```

Edit `backend/.env` to set your API keys:
- `GOOGLE_API_KEY` - For Gemini AI integration
- `HUGGINGFACE_API_TOKEN` - For Hugging Face models (optional)

### 2. Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Start the Servers

#### Option A: Start Both Servers at Once (Recommended)
```bash
# From the root directory
.\start_all.ps1
```

#### Option B: Start Servers Individually

**Backend Server:**
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend Server:**
```bash
cd frontend
npm run dev
```

#### Option C: Using PowerShell Scripts
```bash
# Backend only
cd backend
.\start_dev.ps1

# Frontend only  
cd frontend
.\start_dev.ps1
```

### 4. Access the Application

- **Backend API**: http://localhost:8000
- **Backend Health Check**: http://localhost:8000/healthz
- **Frontend**: http://localhost:5173
- **API Documentation**: http://localhost:8000/docs

## Docker Deployment

### Run with Docker Compose

1. Copy environment file:
```bash
cp backend/env.example backend/.env
# Edit backend/.env to set GOOGLE_API_KEY/HUGGINGFACE_API_TOKEN if needed
```

2. Start services:
```bash
docker compose up --build
```

3. Access:
- Backend API: http://localhost:8080/healthz
- Frontend: http://localhost:3000

## Database Migration

### Migrate from SQLite to PostgreSQL

If you have existing data in `backend/internships.db` and want to move it to PostgreSQL:

```bash
cd backend
python migrate_sqlite_to_postgres.py
```

**Notes:**
- Ensure `DATABASE_URL` in `backend/.env` points to your target PostgreSQL instance
- The script reflects SQLite schema into PostgreSQL and bulk-copies rows

## Production Deployment

### Deploy Backend to Railway

Set these variables in Railway project settings:
- `DATABASE_URL` (from Railway PostgreSQL plugin)
- `CORS_ORIGINS` (your frontend URLs)
- `SESSION_SECRET`, `JWT_SECRET_KEY`
- `RUN_DB_CREATE_ALL=false`

Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend Docker Image

The `frontend/Dockerfile` builds the Vite app and serves static files via Nginx.

## Development

### Project Structure
```
├── backend/           # FastAPI backend
│   ├── db/           # Database models and CRUD operations
│   ├── routes/       # API endpoints
│   ├── services/     # Business logic
│   └── utils/        # Utilities and configuration
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── utils/       # Frontend utilities
└── docker-compose.yml # Docker configuration
```

### Available Scripts

**Backend:**
- `python -m uvicorn main:app --reload` - Start development server
- `python migrate_sqlite_to_postgres.py` - Migrate database

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**: Change ports in the start commands or kill existing processes
2. **Missing dependencies**: Run `pip install -r requirements.txt` and `npm install`
3. **Database connection issues**: Check your `DATABASE_URL` in `.env`
4. **API key errors**: Ensure your Google API key is set in `backend/.env`

### PowerShell Commands

If you're using PowerShell and encounter issues with `&&` syntax, use the provided `.ps1` scripts or run commands separately:

```powershell
# Instead of: cd backend && python -m uvicorn main:app --reload
cd backend
python -m uvicorn main:app --reload
```

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.
