# 🚀 MERN STACK PRE-DEPLOYMENT AUDIT DOCUMENT
*(Agent-Executable Checklist + Prompts)*

---

# 🧠 SECTION 0: HOW TO USE THIS

Each checkpoint includes:
- ✅ What to check
- 🧪 How to verify
- 🤖 Agent Prompt (copy-paste into your AI agent)

---

# 🔐 1. SECURITY CHECKS (CRITICAL)

## 1.1 Authentication & Authorization

### ✅ Check:
- JWT expiry is set
- Refresh tokens (if used) are secure
- Protected routes enforce authentication
- Role-based access implemented (if applicable)

### 🧪 Verify:
- Access protected route without token → FAIL
- Access with invalid token → FAIL

### 🤖 Agent Prompt:
Scan the backend authentication system:
- Ensure JWT tokens have expiration
- Verify all protected routes use auth middleware
- Check if any route is missing authentication protection
- Confirm no sensitive routes are publicly accessible

---

## 1.2 IDOR (Insecure Direct Object Reference)

### ✅ Check:
- User cannot access another user's data via ID manipulation

### 🧪 Verify:
- Modify userId in API request → should FAIL

### 🤖 Agent Prompt:
Analyze all routes that fetch data by ID:
- Ensure user ownership validation is present
- Check queries include userId or tenantId filtering
- Flag any route that directly uses req.params.id without ownership validation

---

## 1.3 Mass Assignment Protection

### ✅ Check:
- Only allowed fields are accepted

### 🧪 Verify:
- Send extra fields → ignored or rejected

### 🤖 Agent Prompt:
Check all create/update endpoints:
- Ensure only whitelisted fields are accepted
- Verify no direct spreading of req.body into database queries
- Flag any unsafe assignment patterns

---

## 1.4 Rate Limiting

### ✅ Check:
- API request limits exist

### 🧪 Verify:
- Rapid requests → should be throttled

### 🤖 Agent Prompt:
Verify rate limiting:
- Check if express-rate-limit or equivalent is used
- Ensure limits are applied to auth and public APIs
- Confirm protection against brute force attacks

---

## 1.5 Webhook Security (CRITICAL)

### ✅ Check:
- Signature verification (Razorpay / WhatsApp)
- Idempotency implemented

### 🧪 Verify:
- Replay webhook → no duplicate processing

### 🤖 Agent Prompt:
Analyze webhook handlers:
- Verify signature validation is implemented
- Ensure idempotency logic exists (unique event IDs stored)
- Check duplicate webhook handling

---

# 🌐 2. BACKEND (NODE + EXPRESS)

## 2.1 Error Handling

### ✅ Check:
- Centralized error handler exists

### 🧪 Verify:
- Trigger error → structured response returned

### 🤖 Agent Prompt:
Check error handling:
- Ensure global error middleware exists
- Verify try/catch usage in async routes
- Confirm no unhandled promise rejections

---

## 2.2 Logging

### ✅ Check:
- Structured logging used (not console.log)

### 🤖 Agent Prompt:
Check logging system:
- Verify use of structured logger (pino/winston)
- Ensure logs include request ID, timestamp, and error stack
- Flag usage of console.log in production code

---

## 2.3 Input Validation

### ✅ Check:
- All inputs validated

### 🤖 Agent Prompt:
Verify input validation:
- Ensure all routes validate request body, params, and query
- Check for missing validation in critical endpoints

---

## 2.4 Environment Variables

### ✅ Check:
- No secrets hardcoded

### 🤖 Agent Prompt:
Scan for sensitive data:
- Ensure no API keys, secrets, or DB URIs are hardcoded
- Verify environment variables are used consistently

---

# 🗄️ 3. DATABASE (MongoDB)

## 3.1 Indexing

### ✅ Check:
- Frequently queried fields indexed

### 🤖 Agent Prompt:
Analyze database queries:
- Identify frequently used query fields
- Check if indexes exist for those fields
- Suggest missing indexes

---

## 3.2 Multi-Tenant Safety

### ✅ Check:
- All queries scoped by tenantId/userId

### 🤖 Agent Prompt:
Check multi-tenant safety:
- Ensure all queries include tenantId or userId filtering
- Flag any global queries without tenant isolation

---

## 3.3 Data Validation

### ✅ Check:
- Schema validation exists

### 🤖 Agent Prompt:
Verify schema validation:
- Ensure required fields are enforced
- Check for proper data types and constraints

---

# ⚙️ 4. BACKGROUND JOBS (BullMQ + Redis)

## 4.1 Retry & Failure Handling

### ✅ Check:
- Retry configured
- Failures handled properly

### 🤖 Agent Prompt:
Analyze job queues:
- Check retry configuration for failed jobs
- Ensure failed jobs are logged or stored
- Verify no silent failures

---

## 4.2 Redis Persistence

### ✅ Check:
- Persistence enabled (AOF or RDB)

### 🤖 Agent Prompt:
Verify Redis configuration:
- Ensure persistence is enabled (AOF or snapshotting)
- Check behavior on Redis restart

---

# 🌍 5. FRONTEND (React)

## 5.1 API Error Handling

### ✅ Check:
- UI handles API failures gracefully

### 🤖 Agent Prompt:
Check frontend API handling:
- Ensure all API calls have error handling
- Verify user-friendly error messages

---

## 5.2 Environment Config

### ✅ Check:
- API URLs not hardcoded

### 🤖 Agent Prompt:
Verify frontend environment usage:
- Ensure API base URL comes from environment variables

---

## 5.3 Build Optimization

### ✅ Check:
- Production build optimized

### 🤖 Agent Prompt:
Analyze frontend build:
- Check bundle size
- Verify code splitting and lazy loading

---

# 🌐 6. INFRASTRUCTURE (PM2 + NGINX)

## 6.1 PM2

### ✅ Check:
- Auto-restart enabled
- Logs configured

### 🤖 Agent Prompt:
Check PM2 config:
- Ensure restart on crash is enabled
- Verify log rotation setup

---

## 6.2 Nginx

### ✅ Check:
- Reverse proxy working
- WebSocket supported

### 🤖 Agent Prompt:
Analyze Nginx config:
- Verify proxy_pass configuration
- Ensure WebSocket headers are set correctly

---

## 6.3 HTTPS

### ✅ Check:
- SSL enabled

### 🤖 Agent Prompt:
Check HTTPS setup:
- Verify SSL certificate configuration
- Ensure HTTP redirects to HTTPS

---

# 📡 7. PERFORMANCE

## 7.1 Caching

### ✅ Check:
- Redis caching used where needed

### 🤖 Agent Prompt:
Analyze caching strategy:
- Identify repeated queries
- Suggest Redis caching where applicable

---

## 7.2 Load Testing

### ✅ Check:
- System handles expected load

### 🤖 Agent Prompt:
Simulate load scenarios:
- Test API under concurrent requests
- Identify bottlenecks

---

# 🚨 8. FINAL DEPLOYMENT CHECKLIST

## ✅ Must Pass Before Deploy

- [x] No console.log in production  
- [x] No hardcoded secrets  
- [x] All APIs secured  
- [x] Webhooks verified + idempotent  
- [x] Redis persistence enabled  
- [x] Jobs retry configured  
- [x] Logs working  
- [x] HTTPS enabled (In Nginx config)  
- [x] Multi-tenant safe  

---

# 🧠 FINAL NOTE

This checklist ensures:
- No critical security leaks  
- No financial risks (webhooks/payments)  
- No multi-tenant data breaches  

---

# ⚡ FUTURE IMPROVEMENTS

- CI/CD automated audit checks  
- Deployment blocking on failed checks  
- Monitoring + alerting integration  
- Automated rollback system  
