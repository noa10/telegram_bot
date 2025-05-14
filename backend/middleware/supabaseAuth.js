const supabase = require('../supabaseClient');

/**
 * Set the Telegram user ID in the Supabase session
 * @param {string} userId - The Telegram user ID
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
async function setTelegramUserId(userId) {
  try {
    const { data, error } = await supabase.rpc('set_telegram_user_id', {
      telegram_id: userId
    });
    
    if (error) {
      console.error('Error setting Telegram user ID:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error setting Telegram user ID:', error);
    return false;
  }
}

/**
 * Middleware to set the Telegram user ID in the Supabase session
 */
function supabaseAuthMiddleware(req, res, next) {
  // If telegramUser is set by telegramAuthMiddleware
  if (req.telegramUser && req.telegramUser.id) {
    setTelegramUserId(req.telegramUser.id.toString())
      .then(() => {
        next();
      })
      .catch((error) => {
        console.error('Error in supabaseAuthMiddleware:', error);
        next();
      });
  } else if (req.params.userId) {
    // If userId is provided in the URL params
    setTelegramUserId(req.params.userId)
      .then(() => {
        next();
      })
      .catch((error) => {
        console.error('Error in supabaseAuthMiddleware:', error);
        next();
      });
  } else {
    // If no user ID is available, continue without setting it
    next();
  }
}

module.exports = {
  supabaseAuthMiddleware,
  setTelegramUserId
};
