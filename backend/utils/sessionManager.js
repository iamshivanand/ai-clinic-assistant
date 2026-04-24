const redis = require('../utils/redis');
const logger = require('../utils/logger');

class SessionManager {
  async getSession(phoneNumber) {
    const session = await redis.get(`session:${phoneNumber}`);
    return session ? JSON.parse(session) : null;
  }

  async setSession(phoneNumber, data, expiry = 3600) {
    await redis.set(`session:${phoneNumber}`, JSON.stringify(data), 'EX', expiry);
  }

  async deleteSession(phoneNumber) {
    await redis.del(`session:${phoneNumber}`);
  }

  async updateSession(phoneNumber, updates) {
    const current = await this.getSession(phoneNumber) || {};
    await this.setSession(phoneNumber, { ...current, ...updates });
  }
}

module.exports = new SessionManager();
