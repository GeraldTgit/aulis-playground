# Stage 1: Frontend - Use smaller Node image and memory optimizations
FROM node:18-alpine as frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
# Add Python/pip for some node-gyp dependencies
RUN apk add --no-cache python3 py3-pip make g++ && \
    npm ci --no-optional --prefer-offline --production
COPY frontend .
RUN npm run build

# Stage 2: Backend - Slim Python with build essentials
FROM python:3.11-slim as backend-builder
WORKDIR /app
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc python3-dev && \
    rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final stage
FROM python:3.11-slim
WORKDIR /app

# Copy only necessary files
COPY --from=backend-builder /root/.local /root/.local
COPY --from=frontend-builder /app/build ./static
COPY backend .

# Environment
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/app
ENV PORT=8000
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:$PORT/api/health || exit 1

EXPOSE $PORT
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${PORT}"]