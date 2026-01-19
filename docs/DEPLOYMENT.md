# NeuroCanvas Deployment Guide

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Environment Variables](#environment-variables)
5. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites
- Node.js v18 or higher
- Python 3.8 or higher
- MongoDB 6.0 or higher
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/neurocanvas.git
   cd neurocanvas
   ```

2. **Run the installation script**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. **Start MongoDB**
   ```bash
   mongod --dbpath ./data/db
   ```

4. **Start the backend** (new terminal)
   ```bash
   cd backend
   npm start
   ```

5. **Start the frontend** (new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

---

## Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Quick Start with Docker

1. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env file**
   ```bash
   nano .env
   ```
   Update the following:
   - `MONGO_PASSWORD` - Set a secure password
   - `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - `ALLOWED_ORIGINS` - Add your production domain

3. **Build and start containers**
   ```bash
   docker-compose up -d
   ```

4. **Check container status**
   ```bash
   docker-compose ps
   ```

5. **View logs**
   ```bash
   docker-compose logs -f
   ```

6. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild services
docker-compose up -d --build

# View logs
docker-compose logs -f [service-name]

# Execute commands in container
docker-compose exec backend sh
docker-compose exec frontend sh

# Remove all data (WARNING: deletes database)
docker-compose down -v
```

---

## Production Deployment

### System Requirements
- **CPU:** 4+ cores recommended
- **RAM:** 8GB minimum, 16GB recommended
- **Storage:** 50GB+ (for models and generated images)
- **OS:** Ubuntu 20.04+ or similar Linux distribution

### Production Setup

#### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
```

#### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/yourusername/neurocanvas.git
cd neurocanvas

# Copy and edit environment file
cp .env.example .env
nano .env
```

#### 3. SSL/HTTPS Setup (Recommended)

Install Nginx and Certbot:
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

Create Nginx configuration:
```nginx
# /etc/nginx/sites-available/neurocanvas
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and get SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/neurocanvas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d yourdomain.com
```

#### 4. Start Production Services

```bash
# Start with Docker Compose
docker-compose -f docker-compose.yml up -d

# Enable auto-restart
docker update --restart=unless-stopped $(docker ps -q)
```

#### 5. Setup Monitoring (Optional)

Install PM2 for process monitoring:
```bash
npm install -g pm2
pm2 startup
pm2 save
```

---

## Environment Variables

### Backend (.env)

```bash
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://username:password@localhost:27017/neurocanvas

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key
ALLOWED_ORIGINS=https://yourdomain.com

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Python Path (if needed)
PYTHON_PATH=/usr/bin/python3
```

### Frontend (.env)

```bash
# API URL
VITE_API_URL=https://api.yourdomain.com

# Or for local development
VITE_API_URL=http://localhost:5000
```

### Docker (.env)

```bash
# MongoDB
MONGO_USERNAME=admin
MONGO_PASSWORD=your-secure-password

# JWT
JWT_SECRET=your-jwt-secret

# CORS
ALLOWED_ORIGINS=https://yourdomain.com

# File Upload
MAX_FILE_SIZE=10485760
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

#### 2. MongoDB Connection Failed

```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Enable MongoDB on boot
sudo systemctl enable mongod
```

#### 3. Docker Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

#### 4. Python Module Not Found

```bash
# Activate virtual environment
source venv/bin/activate

# Reinstall dependencies
pip install -r ml/requirements.txt
```

#### 5. Out of Memory

```bash
# Increase Docker memory limit
# Edit docker-compose.yml and add:
services:
  backend:
    mem_limit: 4g
    memswap_limit: 4g
```

### Performance Optimization

1. **Enable Redis caching**
   ```bash
   docker-compose up -d redis
   ```

2. **Use PM2 cluster mode**
   ```bash
   pm2 start backend/server.js -i max
   ```

3. **Optimize MongoDB**
   ```javascript
   // Add indexes in MongoDB
   db.generations.createIndex({ userId: 1, createdAt: -1 })
   db.prompts.createIndex({ keywords: "text" })
   ```

4. **Enable Nginx caching**
   ```nginx
   proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
   proxy_cache my_cache;
   ```

---

## Backup and Recovery

### Database Backup

```bash
# Backup MongoDB
mongodump --db neurocanvas --out ./backups/$(date +%Y%m%d)

# Restore MongoDB
mongorestore --db neurocanvas ./backups/20240119/neurocanvas
```

### Docker Volume Backup

```bash
# Backup volumes
docker run --rm -v neurocanvas_mongo-data:/data -v $(pwd):/backup alpine tar czf /backup/mongo-backup.tar.gz /data

# Restore volumes
docker run --rm -v neurocanvas_mongo-data:/data -v $(pwd):/backup alpine tar xzf /backup/mongo-backup.tar.gz -C /
```

---

## Scaling

### Horizontal Scaling

Use Docker Swarm or Kubernetes for multi-server deployment:

```bash
# Initialize Docker Swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml neurocanvas

# Scale services
docker service scale neurocanvas_backend=3
```

### Load Balancing

Use Nginx as a load balancer:

```nginx
upstream backend {
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/neurocanvas/issues
- Documentation: https://github.com/yourusername/neurocanvas/wiki
- Email: support@yourdomain.com
