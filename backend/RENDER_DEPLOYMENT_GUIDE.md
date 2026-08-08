# Render Deployment Guide for AI Internship Recommender

## 🚀 Production Deployment Steps

### 1. Prerequisites
- Render account (sign up at render.com)
- GitHub repository with your code
- Google API key for Gemini
- Hugging Face API token (optional, for fallback)

### 2. Database Setup

#### Option A: Use Render's PostgreSQL Service (Recommended)
1. In Render dashboard, create a new **PostgreSQL** service
2. Choose **Starter** plan ($7/month)
3. Set database name: `internships`
4. Note down the connection details

#### Option B: Use External PostgreSQL
- Use services like Supabase, Railway, or AWS RDS
- Get connection string in format: `postgresql+psycopg2://user:password@host:port/dbname`

### 3. Backend Service Setup

1. **Create Web Service**:
   - Connect your GitHub repository
   - Choose **Python** environment
   - Select **Starter** plan ($7/month)

2. **Build Settings**:
   - Build Command: `pip install -r backend/requirements.txt && python backend/init_database.py`
   - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables** (set in Render dashboard):
   ```
   DATABASE_URL=postgresql+psycopg2://user:password@host:port/dbname
   GOOGLE_API_KEY=your_google_api_key_here
   HUGGINGFACE_API_TOKEN=your_huggingface_token_here
   SESSION_SECRET=your_random_secret_key_here
   JWT_SECRET_KEY=your_random_jwt_secret_here
   CORS_ORIGINS=https://your-frontend-app.onrender.com,http://localhost:3000
   RUN_DB_CREATE_ALL=true
   VECTORSTORE_DIR=/var/data/vectorstores
   STUDENT_VECTORSTORE_DIR=/var/data/student_vectorstores
   PYTHONUNBUFFERED=1
   ```

4. **Disk Storage**:
   - Add disk for vector stores
   - Mount path: `/var/data`
   - Size: 1GB (minimum)

### 4. Frontend Service Setup

1. **Create Static Site**:
   - Connect your GitHub repository
   - Root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`

2. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-app.onrender.com
   ```

### 5. Database Migration

The `init_database.py` script will automatically:
- Test database connection
- Create all required tables
- Verify table creation
- Handle connection retries

### 6. Security Considerations

1. **Environment Variables**:
   - Never commit `.env` files to Git
   - Use Render's environment variable system
   - Generate strong secrets for SESSION_SECRET and JWT_SECRET_KEY

2. **CORS Configuration**:
   - Update CORS_ORIGINS with your actual frontend URL
   - Remove localhost URLs in production

3. **Database Security**:
   - Use strong passwords
   - Enable SSL connections
   - Restrict database access to your app only

### 7. Monitoring and Logs

1. **Health Check**:
   - Endpoint: `https://your-app.onrender.com/healthz`
   - Monitor this endpoint for uptime

2. **Logs**:
   - View logs in Render dashboard
   - Set up log monitoring if needed

### 8. Troubleshooting

#### Common Issues:

1. **Database Connection Failed**:
   - Check DATABASE_URL format
   - Verify database service is running
   - Check firewall settings

2. **Build Failures**:
   - Check Python version compatibility
   - Verify all dependencies in requirements.txt
   - Check build logs for specific errors

3. **Memory Issues**:
   - Upgrade to higher plan if needed
   - Optimize vector store usage
   - Monitor memory usage in logs

4. **CORS Errors**:
   - Update CORS_ORIGINS with correct frontend URL
   - Check if frontend is making requests to correct backend URL

### 9. Performance Optimization

1. **Database**:
   - Use connection pooling (already configured)
   - Monitor query performance
   - Add indexes if needed

2. **Vector Stores**:
   - Use persistent disk storage
   - Consider caching strategies
   - Monitor disk usage

3. **API**:
   - Enable gzip compression
   - Use CDN for static assets
   - Monitor response times

### 10. Scaling

- **Starter Plan**: Good for development and small production use
- **Standard Plan**: For higher traffic and better performance
- **Pro Plan**: For enterprise-level applications

## 🔧 Local Development with Production-like Setup

1. **Use Docker Compose**:
   ```bash
   docker compose up -d
   ```

2. **Set Environment Variables**:
   ```bash
   cp backend/production.env.example backend/.env
   # Edit .env with your values
   ```

3. **Test Database Migration**:
   ```bash
   python backend/init_database.py
   ```

## 📞 Support

- Render Documentation: https://render.com/docs
- FastAPI Documentation: https://fastapi.tiangolo.com/
- SQLAlchemy Documentation: https://docs.sqlalchemy.org/

## 🎯 Next Steps After Deployment

1. Test all API endpoints
2. Verify database tables are created
3. Test file upload functionality
4. Monitor logs for any errors
5. Set up monitoring and alerts
6. Configure custom domain (optional)
7. Set up SSL certificates (automatic with Render)
