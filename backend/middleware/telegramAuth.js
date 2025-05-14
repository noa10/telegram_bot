const crypto = require('crypto');

/**
 * Validates Telegram Mini App initData
 * @param {string} initData - The initData string from Telegram Mini App
 * @param {string} botToken - The bot token for validation
 * @returns {boolean} - Whether the initData is valid
 */
function isValidTelegramData(initData, botToken) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      return false;
    }

    // Remove hash before sorting and stringifying
    params.delete('hash');

    // Create data check string as per Telegram docs
    const dataCheckString = Array.from(params.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Generate secret key based on bot token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  } catch (error) {
    console.error('Error validating Telegram data:', error);
    return false;
  }
}

/**
 * Parse user data from initData
 * @param {string} initData - The initData string from Telegram Mini App
 * @returns {object|null} - Parsed user object or null if not available
 */
function parseUserFromInitData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');

    if (!userParam) {
      return null;
    }

    return JSON.parse(decodeURIComponent(userParam));
  } catch (error) {
    console.error('Error parsing user from initData:', error);
    return null;
  }
}

/**
 * Middleware to validate Telegram Mini App initData
 */
function telegramAuthMiddleware(req, res, next) {
  // Get initData from body or query parameters
  const initData = req.body.initData || req.query.initData;

  if (!initData) {
    return res.status(401).json({ error: 'Unauthorized: initData missing' });
  }

  if (!isValidTelegramData(initData, process.env.TELEGRAM_BOT_TOKEN)) {
    return res.status(403).json({ error: 'Forbidden: Invalid initData' });
  }

  // Parse and attach user info to req
  const user = parseUserFromInitData(initData);
  if (user) {
    req.telegramUser = user;
  }

  next();
}

module.exports = {
  telegramAuthMiddleware,
  isValidTelegramData,
  parseUserFromInitData
};
