
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
// Ensure the webAppUrl doesn't have a trailing slash
let webAppUrl = process.env.MINI_APP_URL;
if (webAppUrl && webAppUrl.endsWith('/')) {
  webAppUrl = webAppUrl.slice(0, -1);
}
const isProduction = process.env.NODE_ENV === 'production';
const webhookUrl = process.env.WEBHOOK_URL;

if (!token) {
  console.error('FATAL ERROR: TELEGRAM_BOT_TOKEN is not defined in your .env file.');
  process.exit(1);
}

console.log('Bot configuration:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- isProduction: ${isProduction}`);
console.log(`- MINI_APP_URL: ${webAppUrl}`);
console.log(`- WEBHOOK_URL: ${webhookUrl}`);

// Create a bot instance with improved error handling
let bot;

try {
  if (isProduction && webhookUrl) {
    // Use webhooks in production - but don't set the webhook here
    // The webhook will be set by server.js after the server starts
    bot = new TelegramBot(token);
    console.log('Bot initialized for webhook mode (webhook to be set by server.js)');
  } else {
    // Use polling in development with better options
    bot = new TelegramBot(token, {
      polling: {
        interval: 300,
        autoStart: true,
        params: {
          timeout: 10 // Shorter timeout for faster feedback in dev
        }
      }
    });
    console.log('Bot initialized in polling mode for development');
  }
} catch (error) {
  console.error('Error initializing bot:', error);
  process.exit(1); // Exit if bot initialization fails
}

// Add global error handlers
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code, error.message);
});

bot.on('webhook_error', (error) => {
  console.error('Webhook error:', error.code, error.message);
});

// Debug incoming messages
bot.on('message', (msg) => {
  console.log('Received message:', JSON.stringify(msg, null, 2));
});

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`Processing /start for chat ID: ${chatId}`);

  if (!webAppUrl) {
    bot.sendMessage(chatId, "Welcome! The shop is currently unavailable (webAppUrl not configured).");
    return;
  }

  bot.sendMessage(chatId, 'Welcome to our E-commerce Bot! Click below to browse our products:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛍️ Open Shop (Start)', web_app: { url: webAppUrl } }]
      ]
    }
  }).then(() => {
    console.log(`Sent /start response to chat ID: ${chatId}`);
  }).catch(error => {
    console.error(`Error sending /start response to chat ID: ${chatId}:`, error);
  });
});

// Handle /shop command
bot.onText(/\/shop/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`Processing /shop for chat ID: ${chatId}`);

  if (!webAppUrl) {
    bot.sendMessage(chatId, "The shop is currently unavailable (webAppUrl not configured).");
    return;
  }

  bot.sendMessage(chatId, 'Click below to browse our products:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛍️ Open Shop (Shop)', web_app: { url: webAppUrl } }]
      ]
    }
  }).then(() => {
    console.log(`Sent /shop response to chat ID: ${chatId}`);
  }).catch(error => {
    console.error(`Error sending /shop response to chat ID: ${chatId}:`, error);
  });
});

// Handle /menu command
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`Processing /menu for chat ID: ${chatId}`);

  if (!webAppUrl) {
    bot.sendMessage(chatId, "The menu is currently unavailable (webAppUrl not configured).");
    return;
  }

  bot.sendMessage(chatId, 'Open our shop menu:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛒 Shop Menu (Menu)', web_app: { url: webAppUrl } }]
      ]
    }
  }).then(() => {
    console.log(`Sent /menu response to chat ID: ${chatId}`);
  }).catch(error => {
    console.error(`Error sending /menu response to chat ID: ${chatId}:`, error);
  });
});

// Handle /myorders command
bot.onText(/\/myorders/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  console.log(`Processing /myorders for chat ID: ${chatId}, User ID: ${userId}`);

  if (!webAppUrl) {
    bot.sendMessage(chatId, "Orders are currently unavailable (webAppUrl not configured).");
    return;
  }

  bot.sendMessage(chatId, 'View your orders:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📦 My Orders', web_app: { url: `${webAppUrl}/orders?userId=${userId}` } }]
      ]
    }
  }).then(() => {
    console.log(`Sent /myorders response to chat ID: ${chatId}`);
  }).catch(error => {
    console.error(`Error sending /myorders response to chat ID: ${chatId}:`, error);
  });
});

// Handle /promo command - new feature for promotional content
bot.onText(/\/promo/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`Processing /promo for chat ID: ${chatId}`);

  if (!webAppUrl) {
    bot.sendMessage(chatId, "Promotions are currently unavailable (webAppUrl not configured).");
    return;
  }

  const promoWebAppUrl = `${webAppUrl}/promotion-page`; // Append a path for a specific promotion page
  bot.sendMessage(chatId, 'Check out our special promotion!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎁 View Promotion', web_app: { url: promoWebAppUrl } }]
      ]
    }
  }).then(() => {
    console.log(`Sent /promo response to chat ID: ${chatId}`);
  }).catch(error => {
    console.error(`Error sending /promo response to chat ID: ${chatId}:`, error);
  });
});

// Handle /help command - updated to include the new promo command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`Processing /help for chat ID: ${chatId}`);

  bot.sendMessage(chatId,
    'Available commands:\n' +
    '/start - Start the bot & Shop\n' +
    '/shop - Browse our products\n' +
    '/menu - Open shop menu\n' +
    '/myorders - View your orders\n' +
    '/promo - View special promotions\n' +
    '/help - Show this help message'
  ).then(() => {
    console.log(`Sent /help response to chat ID: ${chatId}`);
  }).catch(error => {
    console.error(`Error sending /help response to chat ID: ${chatId}:`, error);
  });
});

// Handle messages that don't match any command
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const chatId = msg.chat.id;
    console.log(`Processing non-command message from chat ID: ${chatId}`);

    bot.sendMessage(chatId, 'I can help you shop! Try /shop to browse our products or /help to see all commands.')
      .then(() => {
        console.log(`Sent fallback response to chat ID: ${chatId}`);
      }).catch(error => {
        console.error(`Error sending fallback response to chat ID: ${chatId}:`, error);
      });
  }
});

// Function to set up bot commands and menu button
const setupBotFeatures = async () => {
  if (!webAppUrl || !webAppUrl.startsWith('https://')) {
    console.error('Cannot set up menu button: MINI_APP_URL is invalid or not HTTPS. Current value:', webAppUrl);
    console.log('Please set a valid HTTPS URL in your .env file for MINI_APP_URL');
    return;
  }

  console.log('Setting up bot commands and menu button with webAppUrl:', webAppUrl);

  try {
    // Define commands
    const commands = [
      { command: 'start', description: 'Start the bot & Shop' },
      { command: 'shop', description: 'Browse our products' },
      { command: 'menu', description: 'Open shop menu (inline)' },
      { command: 'myorders', description: 'View your orders' },
      { command: 'promo', description: 'View special promotions' },
      { command: 'help', description: 'Show help message' }
    ];

    // Set commands using the bot's built-in method
    await bot.setMyCommands(commands);
    console.log('Bot commands configured successfully!');

    // Set menu button using the bot's built-in method
    await bot.setChatMenuButton({
      menu_button: {
        type: 'web_app',
        text: 'Shop', // Text for the main menu button
        web_app: { url: webAppUrl },
      },
    });
    console.log('Chat Menu button configured successfully!');
    console.log('Bot setup completed! You might need to restart your Telegram app to see changes.');
  } catch (error) {
    console.error('Failed to set up bot features (commands/menu button):',
      error.response ? error.response.data : error.message);
    console.log('Suggestion: Try setting the menu button manually via @BotFather with URL:', webAppUrl);
  }
};

// Delay setup if using polling, or call after webhook is confirmed if using webhooks.
if (!isProduction || !webhookUrl) { // i.e., if using polling
  console.log('Polling mode: Setting up features in 3 seconds...');
  setTimeout(setupBotFeatures, 3000);
}

console.log('Telegram bot script execution finished. Bot should be running if initialized.');

// Provide instructions in the console
console.log('\n======================================================================');
console.log('TROUBLESHOOTING TIPS:');
console.log('1. If commands still don\'t work, try these steps:');
console.log('   - Restart your Telegram app');
console.log('   - Delete and start a new chat with your bot');
console.log('   - Use @BotFather to set menu button manually:');
console.log(`     /mybots > Your Bot > Bot Settings > Menu Button > Set Menu Button`);
console.log('2. Ensure your MINI_APP_URL is a valid HTTPS URL in .env file');
console.log('======================================================================\n');

module.exports = { bot, setupBotFeatures };
