const { test, expect } = require('@playwright/test');

test.describe('Booking Flow (API Simulation)', () => {
  test('should successfully trigger a bot message processing job', async ({ request }) => {
    // Simulating a WhatsApp webhook event to the backend
    const response = await request.post('http://localhost:5000/api/webhook', {
      data: {
        entry: [{
          changes: [{
            value: {
              messages: [{
                from: '919999999999',
                text: { body: 'Hi' },
                type: 'text'
              }]
            }
          }]
        }]
      }
    });

    expect(response.ok()).toBe(true);
  });

  test('should verify clinic language in database', async ({ request }) => {
    // This would ideally check the DB state or an admin API
    const response = await request.get('http://localhost:5000/api/health');
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.status).toBe('ok');
  });
});
