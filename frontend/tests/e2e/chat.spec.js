import { test, expect } from '@playwright/test';

test.describe('Chat & Doctor Takeover Flow', () => {

  test.beforeEach(async ({ page, request }) => {
    // 1. Programmatic login via backend API to get real JWT token and user info
    const response = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'doctor@test.com',
        password: 'password123'
      }
    });
    const json = await response.json();
    const { token, data: { user } } = json;

    // Fetch patient list and reset bot pause state to false to avoid cross-test contamination
    const patientsRes = await request.get('http://localhost:5000/api/chat/patients', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const patientsJson = await patientsRes.json();
    const patientId = patientsJson.data[0]._id;

    await request.patch('http://localhost:5000/api/chat/toggle-bot', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        patientId,
        isPaused: false
      }
    });

    // 2. Load login page to set origin domain
    await page.goto('/login');

    // 3. Inject authenticated state into Zustand localStorage key
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user,
          token
        }
      }));
    }, { token, user });

    // 4. Navigate directly to patients chat screen
    await page.goto('/patients');
    await expect(page).toHaveURL('/patients');
  });

  test('E2E-CHAT-01: Select Patient and Load Conversation History', async ({ page }) => {
    // Verify Test Patient Alice is visible in list
    const patientItem = page.locator('text=Test Patient Alice');
    await expect(patientItem).toBeVisible();
    
    // Click on the patient
    await patientItem.click();
    
    // Verify chat header displays correct details
    await expect(page.locator('p.font-bold')).toContainText('Test Patient Alice');
    await expect(page.locator('p.text-xs')).toContainText('1234567890');
    
    // Verify messages loaded in viewport (scoping selector to main chat container to avoid sidebar collision)
    const chatArea = page.locator('.flex-1.flex.flex-col');
    await expect(chatArea.locator('text=Hello Dr. Test!')).toBeVisible();
    await expect(chatArea.locator('text=Hi Alice! How can I help you today?')).toBeVisible();
  });

  test('E2E-CHAT-02: Bot Pause & Human Takeover Flow', async ({ page }) => {
    const patientItem = page.locator('text=Test Patient Alice');
    await patientItem.click();

    // Verify input is disabled initially when bot is active
    const messageInput = page.locator('input[placeholder="Pause bot to reply manually..."]');
    await expect(messageInput).toBeDisabled();

    // Click "Pause Bot"
    const toggleButton = page.locator('button:has-text("Pause Bot")');
    await toggleButton.click();

    // Verify button changes to "Resume Bot" and input enables
    await expect(page.locator('button:has-text("Resume Bot")')).toBeVisible();
    
    const activeInput = page.locator('input[placeholder="Type a manual message..."]');
    await expect(activeInput).toBeEnabled();

    // Send manual message
    await activeInput.fill('This is a manual doctor message.');
    await page.click('form button[type="submit"]');

    // Verify manual message renders
    await expect(page.locator('text=This is a manual doctor message.')).toBeVisible();
  });

  test('E2E-CHAT-03: Bot Resume Flow', async ({ page }) => {
    const patientItem = page.locator('text=Test Patient Alice');
    await patientItem.click();

    // Pause bot
    const toggleButton = page.locator('button:has-text("Pause Bot")');
    await toggleButton.click();
    await expect(page.locator('button:has-text("Resume Bot")')).toBeVisible();

    // Resume bot
    const resumeButton = page.locator('button:has-text("Resume Bot")');
    await resumeButton.click();

    // Verify input is disabled again and button returns to "Pause Bot"
    await expect(page.locator('button:has-text("Pause Bot")')).toBeVisible();
    const messageInput = page.locator('input[placeholder="Pause bot to reply manually..."]');
    await expect(messageInput).toBeDisabled();
  });

  test('E2E-CHAT-04: Real-Time Message Receipt Simulation', async ({ page }) => {
    const patientItem = page.locator('text=Test Patient Alice');
    await patientItem.click();

    // Fetch patient ID from backend API inside browser context using localStorage token
    const patientId = await page.evaluate(async () => {
      const auth = JSON.parse(localStorage.getItem('auth-storage'));
      const token = auth?.state?.token;
      const res = await fetch('http://localhost:5000/api/chat/patients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      return json.data[0]._id;
    });

    // Simulate an incoming message on socket.io using window.simulateIncomingMessage
    await page.evaluate(({ id }) => {
      if (window.simulateIncomingMessage) {
        window.simulateIncomingMessage({
          patientId: id,
          message: {
            _id: 'socket-sim-123',
            patientId: id,
            sender: 'patient',
            type: 'text',
            content: 'This is a simulated real-time socket message!',
            timestamp: new Date().toISOString()
          }
        });
      }
    }, { id: patientId });

    // Assert that the message displays in the chat list
    const chatArea = page.locator('.flex-1.flex.flex-col');
    await expect(chatArea.locator('text=This is a simulated real-time socket message!')).toBeVisible();
  });
});
