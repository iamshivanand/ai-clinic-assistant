const axios = require('axios');
const whatsappService = require('../../services/whatsappService');

jest.mock('axios');

describe('WhatsApp Service - Interactive Messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.post.mockResolvedValue({ data: { messages: [{ id: 'mock-id' }] } });
    
    // Mock the logMessage method to prevent DB writes during unit tests
    whatsappService.logMessage = jest.fn().mockResolvedValue(true);
  });

  it('should correctly format interactive buttons payload', async () => {
    const to = '1234567890';
    const text = 'Choose an option';
    const buttons = [
      { id: 'btn_1', title: 'Option 1' },
      { id: 'btn_2', title: 'Option 2' }
    ];

    await whatsappService.sendInteractiveButtons(to, text, buttons);

    expect(axios.post).toHaveBeenCalledTimes(1);
    
    // Check the payload format
    const payload = axios.post.mock.calls[0][1];
    expect(payload.type).toBe('interactive');
    expect(payload.interactive.type).toBe('button');
    expect(payload.interactive.action.buttons).toHaveLength(2);
    expect(payload.interactive.action.buttons[0].reply.id).toBe('btn_1');
  });
});
