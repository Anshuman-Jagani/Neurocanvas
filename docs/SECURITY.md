# NeuroCanvas Security Guide

## Overview
This document outlines the security measures implemented in NeuroCanvas and best practices for maintaining security.

## Security Features

### 1. HTTP Security Headers (Helmet)
Helmet helps secure Express apps by setting various HTTP headers:

- **Content Security Policy (CSP)** - Prevents XSS attacks
- **X-Frame-Options** - Prevents clickjacking
- **X-Content-Type-Options** - Prevents MIME sniffing
- **Strict-Transport-Security** - Enforces HTTPS
- **X-XSS-Protection** - Enables browser XSS protection

### 2. Rate Limiting
Protects against brute force and DDoS attacks:

**General API Endpoints:**
- 100 requests per 15 minutes per IP
- Returns 429 status when limit exceeded

**Generation Endpoints:**
- 20 requests per hour per IP (more restrictive)
- Applies to `/api/diffusion` and `/api/generate`

### 3. CORS (Cross-Origin Resource Sharing)
Configured to allow requests only from trusted origins:

```javascript
// Allowed origins (configurable via environment)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173'
];
```

### 4. Input Validation
All API inputs are validated using Joi schemas:

- **Prompt validation** - Min/max length, required fields
- **Parameter validation** - Type checking, range validation
- **File validation** - Size limits, type restrictions

### 5. Data Sanitization

**NoSQL Injection Prevention:**
- Sanitizes MongoDB queries
- Removes `$` and `.` operators from user input

**XSS Prevention:**
- Cleans user input to prevent script injection
- Escapes HTML entities

### 6. Request Size Limits
Prevents memory exhaustion attacks:
- JSON payload limit: 10MB
- URL-encoded payload limit: 10MB
- File upload limit: Configured in multer middleware

## Environment Variables

### Required Security Variables
```bash
# .env file
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

### Generating Secure Secrets
```bash
# Generate a secure random string for JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Security Audit

### Running npm audit
Check for known vulnerabilities:
```bash
cd backend
npm audit

# Fix automatically fixable issues
npm audit fix

# Force fix (may introduce breaking changes)
npm audit fix --force
```

### Manual Security Checks

1. **Check for exposed secrets**
   ```bash
   grep -r "password\|secret\|key" --exclude-dir=node_modules .
   ```

2. **Verify .gitignore**
   Ensure sensitive files are ignored:
   ```
   .env
   .env.local
   .env.production
   *.pem
   *.key
   ```

3. **Review dependencies**
   ```bash
   npm outdated
   npm update
   ```

## API Security Best Practices

### 1. Authentication (Future Implementation)
```javascript
// Recommended: JWT-based authentication
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
```

### 2. File Upload Security
```javascript
// Validate file types
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

// Validate file size
const maxSize = 10 * 1024 * 1024; // 10MB

// Sanitize filenames
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};
```

### 3. Error Handling
Never expose sensitive information in error messages:

```javascript
// ❌ Bad
res.status(500).json({ error: err.stack });

// ✅ Good
res.status(500).json({ 
  error: 'Internal server error',
  message: process.env.NODE_ENV === 'development' ? err.message : undefined
});
```

## Database Security

### 1. Connection Security
```javascript
// Use authentication
const mongoURI = `mongodb://${username}:${password}@localhost:27017/neurocanvas`;

// Enable SSL/TLS for production
const options = {
  ssl: process.env.NODE_ENV === 'production',
  sslValidate: true
};
```

### 2. Query Security
```javascript
// ❌ Vulnerable to injection
User.find({ email: req.body.email });

// ✅ Sanitized
const sanitizedEmail = mongoSanitize(req.body.email);
User.find({ email: sanitizedEmail });
```

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure `ALLOWED_ORIGINS` for production domains
- [ ] Enable HTTPS/SSL
- [ ] Set up MongoDB authentication
- [ ] Configure firewall rules
- [ ] Enable MongoDB access control
- [ ] Set up automated backups
- [ ] Configure logging and monitoring
- [ ] Review and update dependencies
- [ ] Run security audit (`npm audit`)
- [ ] Set up rate limiting
- [ ] Configure CSP headers
- [ ] Enable CORS only for trusted origins
- [ ] Implement authentication/authorization
- [ ] Set up intrusion detection

## Monitoring and Logging

### Security Events to Log
- Failed authentication attempts
- Rate limit violations
- Validation errors
- File upload attempts
- Unusual API usage patterns

### Recommended Tools
- **Winston** - Logging
- **Morgan** - HTTP request logging
- **PM2** - Process monitoring
- **Sentry** - Error tracking

## Incident Response

### If a Security Breach Occurs:

1. **Immediate Actions**
   - Take affected systems offline
   - Change all secrets and passwords
   - Review access logs

2. **Investigation**
   - Identify the attack vector
   - Assess the damage
   - Document everything

3. **Recovery**
   - Patch vulnerabilities
   - Restore from clean backups
   - Notify affected users

4. **Prevention**
   - Update security measures
   - Conduct security training
   - Review and improve processes

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

## Contact

For security concerns, please contact: [your-security-email@domain.com]
