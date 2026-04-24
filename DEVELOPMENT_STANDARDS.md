# Development Standards & Coding Guidelines

## 1. Naming Conventions
- **Variable & Function Names**: `camelCase` (e.g., `processIncomingMessage`).
- **Class Names**: `PascalCase` (e.g., `WhatsAppService`).
- **File Names**: `camelCase.js` for logic, `PascalCase.js` for Models and React Components.
- **Environment Variables**: `UPPER_SNAKE_CASE` (e.g., `META_ACCESS_TOKEN`).
- **Database Fields**: `camelCase` (consistent with JS).

## 2. Project Structure
- `backend/services/`: Business logic and external integrations (WhatsApp, AI).
- `backend/queues/`: BullMQ queue definitions.
- `backend/workers/`: Job processors.
- `backend/models/`: Mongoose schemas.
- `backend/routes/`: Express route definitions.
- `backend/middleware/`: Auth, Validation, Error handling.

## 3. Response & Error Standards
### Success Response
All API responses must follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
Handled by a centralized error middleware:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User friendly message",
    "details": []
  }
}
```

## 4. Async/Await Rules
- Always use `try/catch` blocks or a global async wrapper for Express routes.
- Never let an async process fail silently; log it via the centralized logger.

## 5. Documentation
- Use JSDoc for complex functions.
- Keep the `README.md` updated with setup instructions.
- All new API endpoints must be documented in a `/docs/api.md` file (to be created).
