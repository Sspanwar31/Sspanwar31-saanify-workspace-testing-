# 🚀 GLM DevOps Automation System

## 📋 Overview

The GLM (Global Lifecycle Management) system is a comprehensive DevOps automation solution for the Saanify platform that provides:

- ✅ **Zero-touch deployment** from GitHub to Vercel
- ✅ **Automated backups** of schema, data, and environment
- ✅ **One-click rollback** with `npm run restore:glm`
- ✅ **UI protection** during migrations
- ✅ **Idempotent operations** (safe to run multiple times)
- ✅ **Comprehensive logging** and health monitoring

## 🎯 Key Features

### 🔄 **Automated Deployment Pipeline**
```bash
# Push to GitHub → Auto-deploy to Vercel
git push origin main
```

### 📦 **Comprehensive Backup System**
- Environment variables backup
- Database schema + data backup
- Code files backup
- Checksum verification
- Timestamped backup directories

### 🛡️ **Safety & Rollback**
```bash
# Emergency rollback
npm run restore:glm

# Or specify backup
npm run restore:glm backups/2024-01-15T10-30-00-000Z
```

### 🔍 **Health Monitoring**
```bash
# Complete system health check
npm run health:glm
```

## 🏗️ System Architecture

```
GitHub Push → GLM Deploy → Vercel Deploy → Health Check
     ↓              ↓              ↓
  Change Detection  Backup Creation  UI Protection
     ↓              ↓              ↓
Environment Sync   Database Migrate   Final Verification
     ↓              ↓              ↓
   Seeding Data    Rollback Safety   System Ready
```

## 📁 Directory Structure

```
├── scripts/
│   ├── deploy-glm.js      # Main deployment script
│   ├── restore-glm.js     # Restore/rollback script
│   └── health-check-glm.js # Health monitoring
├── logs/
│   ├── deploy-*.log       # Deployment logs
│   ├── restore-*.log      # Restore logs
│   └── health-*.log       # Health check logs
├── backups/
│   └── YYYY-MM-DDTHH-MM-SS-SSSZ/  # Timestamped backups
│       ├── environment.json
│       ├── database.json
│       ├── code.json
│       └── manifest.json
└── .github/workflows/
    └── glm-deploy.yml     # GitHub Actions workflow
```

## 🚀 Usage Guide

### 📦 **Deployment Commands**

```bash
# Full automated deployment
npm run deploy:glm

# Backup only (no deployment)
npm run backup:glm

# System health check
npm run health:glm

# Restore from latest backup
npm run restore:glm

# Restore from specific backup
npm run restore:glm backups/2024-01-15T10-30-00-000Z
```

### 🔧 **Manual Operations**

```bash
# Database operations
npm run db:push
npm run db:generate
npm run db:seed

# Development
npm run dev
npm run build
npm run start
```

## 🔐 Environment Variables

### Required Variables
```env
DATABASE_URL=your-supabase-database-url
NEXTAUTH_SECRET=your-super-secret-key
```

### Optional Variables
```env
VERCEL_URL=your-app.vercel.app
VERCEL_ENV=production
NODE_ENV=production
```

### Vercel Secrets
Set these in your Vercel dashboard:
- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- `VERCEL_TOKEN` (for GitHub Actions)
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 🔄 **Deployment Process**

### 📋 **Step-by-Step Flow**

1. **Change Detection**
   - Analyze Git changes
   - Detect schema, API, UI modifications
   - Skip deployment if only docs changed

2. **Backup Creation**
   - Environment variables backup
   - Database schema + data backup
   - Critical code files backup
   - Checksum verification

3. **Environment Sync**
   - Pull environment variables from Vercel
   - Validate required variables
   - Ensure database connectivity

4. **Database Migration**
   - Generate Prisma client
   - Push schema changes
   - Seed default data (Super Admin, Demo Client)

5. **UI Protection**
   - Test critical routes
   - Verify UI components
   - Ensure no downtime

6. **Deployment**
   - Trigger Vercel build
   - Monitor deployment progress
   - Verify successful deployment

7. **Health Verification**
   - API health checks
   - Route accessibility
   - Data integrity verification

## 🛡️ **Safety Features**

### 🔄 **Idempotent Operations**
- Safe to run multiple times
- No duplicate data creation
- Graceful error handling

### 📊 **Rollback Protection**
- Automatic backup before deployment
- One-click restore functionality
- Data integrity verification

### 🎨 **UI Protection**
- No UI changes during migration
- Route accessibility checks
- Performance monitoring

### 📝 **Comprehensive Logging**
- Timestamped log files
- Detailed operation tracking
- Error reporting and analysis

## 🎯 **Default Data**

### 👑 **Super Admin**
- Email: `superadmin@saanify.com`
- Password: `admin123`
- Role: `SUPER_ADMIN`

### 👤 **Demo Client**
- Email: `client@saanify.com`
- Password: `client123`
- Role: `CLIENT`

### 🏢 **Demo Societies**
- Green Valley Society (PRO plan)
- Sunset Apartments (TRIAL plan)

## 🚨 **Troubleshooting**

### ❌ **Common Issues**

1. **Environment Variables Missing**
   ```bash
   # Check environment
   npm run health:glm
   
   # Set missing variables in Vercel dashboard
   ```

2. **Database Connection Failed**
   ```bash
   # Check DATABASE_URL
   echo $DATABASE_URL
   
   # Test connection
   npm run db:push
   ```

3. **Deployment Failed**
   ```bash
   # Check logs
   cat logs/deploy-*.log
   
   # Restore from backup
   npm run restore:glm
   ```

### 🔧 **Debug Mode**

Enable detailed logging:
```bash
# Run with verbose output
DEBUG=* npm run deploy:glm
```

### 📊 **System Diagnostics**

```bash
# Complete health check
npm run health:glm

# Check recent logs
ls -la logs/

# View available backups
ls -la backups/
```

## 🔄 **GitHub Integration**

### 🚀 **Automatic Deployment**

1. Push to main branch:
   ```bash
   git push origin main
   ```

2. GitHub Actions will:
   - Run health checks
   - Create backup
   - Deploy to Vercel
   - Verify deployment

3. If deployment fails:
   - Automatic rollback
   - Error notification
   - Detailed logs

### 🎛️ **Manual Deployment**

1. Go to GitHub Actions
2. Select "GLM Automated Deployment"
3. Click "Run workflow"
4. Choose options:
   - Skip backup
   - Force deployment

## 📈 **Monitoring & Alerts**

### 📊 **Health Metrics**
- Database connectivity
- API response times
- UI accessibility
- Environment validation

### 🚨 **Alert Levels**
- **INFO**: Normal operations
- **WARNING**: Non-critical issues
- **ERROR**: System failures
- **CRITICAL**: Emergency situations

### 📝 **Log Files**
- `logs/deploy-*.log`: Deployment operations
- `logs/restore-*.log`: Restore operations
- `logs/health-*.log`: Health checks

## 🎯 **Best Practices**

### 📋 **Pre-Deployment Checklist**
- [ ] Environment variables configured
- [ ] Database accessible
- [ ] Backups enabled
- [ ] Health check passing
- [ ] Rollback plan ready

### 🔄 **Deployment Strategy**
- Deploy during low-traffic periods
- Monitor system post-deployment
- Keep recent backups
- Document all changes

### 🛡️ **Safety Measures**
- Test in development first
- Keep backup of working version
- Monitor logs during deployment
- Have rollback procedure ready

## 🆘 **Recovery Procedures**

### 🔄 **Standard Rollback**
```bash
# Restore from latest backup
npm run restore:glm
```

### 🚨 **Emergency Recovery**
```bash
# Manual database restore
npx prisma migrate reset

# Restore environment variables
cp .env.backup .env

# Restart services
npm run dev
```

### 📊 **Data Recovery**
```bash
# Check backup integrity
ls -la backups/

# View backup contents
cat backups/latest/manifest.json

# Select specific backup
npm run restore:glm backups/2024-01-15T10-30-00-000Z
```

---

## 🎉 **System Status**

Your GLM DevOps Automation System is now fully operational!

**Next Steps:**
1. ✅ Test with `npm run health:glm`
2. ✅ Deploy with `npm run deploy:glm`
3. ✅ Monitor logs in `logs/` directory
4. ✅ Set up GitHub Actions secrets

**Zero-Touch Deployment Enabled!** 🚀

From now on, just push to GitHub and everything happens automatically!