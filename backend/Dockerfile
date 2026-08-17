# =============================================
# CareerPilot Backend — Dockerfile
# Deployment: Render Web Service
# Base: Python 3.11 slim
# =============================================

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# -----------------------------------------------
# System dependencies
# - gcc / libpq-dev: needed for psycopg2-binary
# - curl: for health check debugging
# -----------------------------------------------
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# -----------------------------------------------
# Python dependencies
# Install before copying app code for Docker cache efficiency
# -----------------------------------------------
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# -----------------------------------------------
# Copy application source code
# -----------------------------------------------
COPY . .

# -----------------------------------------------
# Create upload directory
# -----------------------------------------------
RUN mkdir -p /tmp/uploads

# -----------------------------------------------
# Expose application port
# Render sets $PORT automatically — default 8000
# -----------------------------------------------
EXPOSE 8000

# -----------------------------------------------
# Start command
# - 1 worker (Render free tier: 512MB RAM)
# - main:application wraps FastAPI + Socket.IO on the same port
# - host 0.0.0.0 required for Render
# -----------------------------------------------
CMD ["sh", "-c", "uvicorn main:application --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
