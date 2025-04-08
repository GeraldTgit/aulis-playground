# Stage 1: Build frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend .
RUN npm run build

# Stage 2: Build backend
FROM python:3.11-slim as backend-builder
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --user -r requirements.txt

# Stage 3: Runtime
FROM python:3.11-slim
WORKDIR /app

# Copy Python dependencies
COPY --from=backend-builder /root/.local /root/.local
COPY backend .

# Copy built frontend
COPY --from=frontend-builder /app/build ./static

# Environment setup
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/app
ENV PORT=8000

# Expose and run
EXPOSE $PORT
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${PORT}"]