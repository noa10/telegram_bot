const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.MINI_APP_URL;
const isProduction = process.env.NODE_ENV === 'production';
const webhookUrl = process.env.WEBHOOK_URL;

// Create a bot instance
let bot;

if (isProduction && webhookUrl) {
  // Use webhooks in production
  bot = new TelegramBot(token);

  // The webhook will be set up by the server when it starts
  console.log('Bot initialized in webhook mode for production');
} else {
  // Use polling in development
  bot = new TelegramBot(token, { polling: true });
  console.log('Bot initialized in polling mode for development');
}

// Handle /start and /shop commands
bot.onText(/\/start|\/shop/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to our E-commerce Bot! Click below to browse our products:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛍️ Open Shop', web_app: { url: webAppUrl } }]
      ]
    }
  });
});

// Handle /myorders command
bot.onText(/\/myorders/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  bot.sendMessage(chatId, 'View your orders:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📦 My Orders', web_app: { url: `${webAppUrl}/orders?userId=${userId}` } }]
      ]
    }
  });
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    'Available commands:\n' +
    '/start - Start the bot\n' +
    '/shop - Browse our products\n' +
    '/myorders - View your orders\n' +
    '/help - Show this help message'
  );
});

// Handle messages that don't match any command
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'I can help you shop! Try /shop to browse our products or /help to see all commands.');
  }
});

console.log('Telegram bot started...');

module.exports = bot;
