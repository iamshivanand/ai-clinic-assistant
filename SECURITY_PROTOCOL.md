# Security & Compliance Protocol

## 1. Data Protection
- **Personal Health Information (PHI)**: Any data related to patient medical history must be treated with the highest sensitivity.
- **Encryption at Rest**: Ensure sensitive DB fields are encrypted where possible.
- **Encryption in Transit**: All communication between Frontend, Backend, and WhatsApp MUST be over HTTPS/TLS.

## 2. Webhook Security
- **X-Hub-Signature-256**: All incoming webhooks from Meta MUST be verified using the App Secret. Requests without a valid signature must be rejected immediately (HTTP 401).
- **Validation**: Use `Zod` to validate the structure of every incoming webhook before processing.

## 3. Authentication & Authorization
- **JWT (JSON Web Tokens)**: Used for portal authentication.
- **Role-Based Access Control (RBAC)**:
  - `SUPER_ADMIN`: Access to all clinics and system settings.
  - `DOCTOR_ADMIN`: Access only to their own clinic's data.
- **Password Hashing**: Use `bcryptjs` with a salt round of 12.

## 4. Rate Limiting
- Implement `express-rate-limit` to prevent brute force on auth endpoints and DOS on webhooks.
- Monitor Meta API rate limits and implement exponential backoff in the Outgoing Message queue.

## 5. Environment Secrets
- NEVER commit `.env` files.
- Use a secrets manager in production.
- Rotate the `META_ACCESS_TOKEN` periodically.
