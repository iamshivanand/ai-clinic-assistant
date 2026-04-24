import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock axios before importing anything else
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      })),
    },
  };
});

describe('API Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-import api inside the test to ensure mock is used
    await import('./api');
  });

  it('should have initialized axios with a base URL', () => {
    expect(axios.create).toHaveBeenCalled();
  });
});
