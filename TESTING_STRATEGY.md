# Testing & Quality Assurance Strategy

## 1. Testing Philosophy
We prioritize **Integration Tests** for the WhatsApp Bot and **Unit Tests** for critical business logic (e.g., appointment slot calculation).

## 2. Test Types
### Unit Tests (Jest)
- Test individual services (e.g., `whatsappService.js`).
- Mock external API calls using `jest.mock()`.

### Integration Tests (Supertest)
- Test API endpoints.
- Verify the Webhook -> Queue pipeline works as expected.

### E2E Tests (Playwright)
- Test the Admin Portals.
- Focus on critical paths: Login, Booking an Appointment, Issuing a Prescription.

## 3. WhatsApp API Mocking
Since we cannot send thousands of real WhatsApp messages during testing:
- Create a `MockWhatsAppClient` that simulates Meta's responses.
- Use this mock in the development environment.

## 4. Review Checklist
Before any PR is merged:
1. All tests must pass.
2. Code follows `DEVELOPMENT_STANDARDS.md`.
3. No secrets are hardcoded.
4. Error handling is implemented for new async calls.

## 5. CI/CD Integration
- Automated linting on every push.
- Automated tests on every pull request to the `main` branch.
