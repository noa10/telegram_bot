const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
// Ensure the webAppUrl doesn't have a trailing slash
let webAppUrl = process.env.MINI_APP_URL;
if (webAppUrl && webAppUrl.endsWith('/')) {
  webAppUrl = webAppUrl.slice(0, -1);
}
const API_URL = process.env.API_URL || 'http://localhost:3001'; // Define API base URL
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

// Create a custom request handler using axios
const axiosRequestHandler = {
  request: async (options) => {
    try {
      const { url, method = 'GET', form, formData, body, timeout = 30000, ...restOptions } = options;

      // Configure axios request
      const axiosOptions = {
        url,
        method,
        timeout,
        headers: {
          'User-Agent': 'TelegramBot/1.0 (Node.js)',
          'Content-Type': 'application/json',
          ...restOptions.headers
        },
        ...restOptions
      };

      // Handle different types of data
      if (form) {
        axiosOptions.data = form;
      } else if (formData) {
        // For multipart/form-data (file uploads)
        const formDataObj = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          formDataObj.append(key, value);
        });
        axiosOptions.data = formDataObj;
        axiosOptions.headers['Content-Type'] = 'multipart/form-data';
      } else if (body) {
        axiosOptions.data = body;
      }

      console.log(`Making ${method} request to ${url}`);
      const response = await axios(axiosOptions);
      return response.data;
    } catch (error) {
      console.error('Axios request error:', error.message);
      throw error;
    }
  }
};

// Create a bot instance with improved error handling and custom request handler
let bot;

try {
  const botOptions = {
    // Use our custom axios-based request handler
    request: axiosRequestHandler
  };

  if (isProduction && webhookUrl) {
    // Use webhooks in production - but don't set the webhook here
    // The webhook will be set by server.js after the server starts
    bot = new TelegramBot(token, botOptions);
    console.log('Bot initialized for webhook mode with custom axios client (webhook to be set by server.js)');
  } else {
    // Use polling in development with better options
    botOptions.polling = {
      interval: 300,
      autoStart: true,
      params: {
        timeout: 10 // Shorter timeout for faster feedback in dev
      }
    };
    bot = new TelegramBot(token, botOptions);
    console.log('Bot initialized in polling mode with custom axios client for development');
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

// Enhanced sendMessageWithRetry function with better error handling
async function sendMessageWithRetry(chatId, text, options, commandName, retries = 3, initialDelay = 1000) {
  let attempt = 0;
  let currentDelay = initialDelay;

  while (attempt <= retries) {
    try {
      attempt++;
      console.log(`[${commandName}] Attempt ${attempt}/${retries + 1} to send message to chat ID: ${chatId}`);
      // If options is null/undefined, bot.sendMessage will handle it correctly
      return await bot.sendMessage(chatId, text, options || undefined);
    } catch (error) {
      // Improved error detection with more detailed logging
      const isRetryableError = (
        error.code === 'EFATAL' ||
        (error.message && (
          error.message.includes('socket hang up') ||
          error.message.includes('Client network socket disconnected before secure TLS connection was established') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('network socket disconnected') ||
          error.message.includes('connection timed out') ||
          error.message.includes('network error')
        ))
      );

      if (isRetryableError && attempt <= retries) {
        console.warn(`[${commandName}] Send attempt ${attempt} failed: ${error.message || error.code}. Retrying in ${currentDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= 2; // Exponential backoff
      } else {
        console.error(`[${commandName}] Failed to send message to chat ID ${chatId} after ${attempt} attempts or due to non-retryable error:`,
          error.message || error.code || 'Unknown error');
        throw error; // Re-throw error if not retryable or retries exhausted
      }
    }
  }
}

// Handle /start command
bot.onText(/\/start(?:\\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const param = match[1]; // Parameter after /start
  const commandName = '/start';
  console.log(`Processing ${commandName} for chat ID: ${chatId}, param: ${param}`);

  if (!webAppUrl) {
    try {
      await sendMessageWithRetry(chatId, "Welcome! The shop is currently unavailable (webAppUrl not configured).", null, commandName);
    } catch (e) { /* Error already logged by sendMessageWithRetry */ }
    return;
  }

  try {
    if (param && param.startsWith('product_')) {
      const productId = param.split('_')[1];
      await sendMessageWithRetry(chatId, 'View product:', {
        reply_markup: {
          inline_keyboard: [[
            { text: 'View Product', web_app: { url: `${webAppUrl}/product/${productId}` } }
          ]]
        }
      }, commandName + ` (product_${productId})`);
      console.log(`Sent ${commandName} deep link response for product ${productId} to chat ID: ${chatId}`);
    } else {
      await sendMessageWithRetry(chatId, 'Welcome to our E-commerce Bot! Click below to browse our products:', {
        reply_markup: {
          inline_keyboard: [[
            { text: '🛍️ Open Shop (Start)', web_app: { url: webAppUrl } }
          ]]
        }
      }, commandName);
      console.log(`Sent ${commandName} response to chat ID: ${chatId}`);
    }
  } catch (error) {
    // Error is already logged by sendMessageWithRetry if it exhausts retries
    // console.error(`Error in ${commandName} handler for chat ID: ${chatId}:`, error); // Optional additional logging
  }
});

// Handle /shop command
bot.onText(/\/shop/, async (msg) => {
  const chatId = msg.chat.id;
  const commandName = '/shop';
  console.log(`Processing ${commandName} for chat ID: ${chatId}`);

  if (!webAppUrl) {
     try {
      await sendMessageWithRetry(chatId, "The shop is currently unavailable (webAppUrl not configured).", null, commandName);
    } catch (e) { /* Error already logged */ }
    return;
  }

  try {
    await sendMessageWithRetry(chatId, 'Click below to browse our products:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ Open Shop (Shop)', web_app: { url: webAppUrl } }]
        ]
      }
    }, commandName);
    console.log(`Sent ${commandName} response to chat ID: ${chatId}`);
  } catch (error) { /* Error already logged */ }
});

// Handle /menu command
bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;
  const commandName = '/menu';
  console.log(`Processing ${commandName} for chat ID: ${chatId}`);

  if (!webAppUrl) {
    try {
      await sendMessageWithRetry(chatId, "The menu is currently unavailable (webAppUrl not configured).", null, commandName);
    } catch (e) { /* Error already logged */ }
    return;
  }

  try {
    await sendMessageWithRetry(chatId, 'Open our shop menu:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛒 Shop Menu (Menu)', web_app: { url: webAppUrl } }]
        ]
      }
    }, commandName);
    console.log(`Sent ${commandName} response to chat ID: ${chatId}`);
  } catch (error) { /* Error already logged */ }
});

// Handle /myorders command
bot.onText(/\/myorders/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const commandName = '/myorders';
  console.log(`Processing ${commandName} for chat ID: ${chatId}, User ID: ${userId}`);

  if (!webAppUrl) {
    try {
      await sendMessageWithRetry(chatId, "Orders are currently unavailable (webAppUrl not configured).", null, commandName);
    } catch (e) { /* Error already logged */ }
    return;
  }

  try {
    await sendMessageWithRetry(chatId, 'View your orders:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📦 My Orders', web_app: { url: `${webAppUrl}/orders?userId=${userId}` } }]
        ]
      }
    }, commandName);
    console.log(`Sent ${commandName} response to chat ID: ${chatId}`);
  } catch (error) { /* Error already logged */ }
});

// Handle /promo command - new feature for promotional content
bot.onText(/\/promo/, async (msg) => {
  const chatId = msg.chat.id;
  const commandName = '/promo';
  console.log(`Processing ${commandName} for chat ID: ${chatId}`);

  if (!webAppUrl) {
     try {
      await sendMessageWithRetry(chatId, "Promotions are currently unavailable (webAppUrl not configured).", null, commandName);
    } catch (e) { /* Error already logged */ }
    return;
  }

  const promoWebAppUrl = `${webAppUrl}/promotion-page`;
  try {
    await sendMessageWithRetry(chatId, 'Check out our special promotion!', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎁 View Promotion', web_app: { url: promoWebAppUrl } }]
        ]
      }
    }, commandName);
    console.log(`Sent ${commandName} response to chat ID: ${chatId}`);
  } catch (error) { /* Error already logged */ }
});

// Handle /help command - updated to include the new promo command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const commandName = '/help';
  console.log(`Processing ${commandName} for chat ID: ${chatId}`);

  const helpText = 'Available commands:\\n' +
                   '/start - Start the bot & Shop\\n' +
                   '/shop - Browse our products\\n' +
                   '/menu - Open shop menu\\n' +
                   '/myorders - View your orders\\n' +
                   '/promo - View special promotions\\n' +
                   '/help - Show this help message';
  try {
    await sendMessageWithRetry(chatId, helpText, null, commandName);
    console.log(`Sent ${commandName} response to chat ID: ${chatId}`);
  } catch (error) { /* Error already logged */ }
});

// Handle messages that don't match any command
bot.on('message', async (msg) => {
  // Ensure this handler only processes messages once and doesn't interfere with command handlers
  // This check is crucial if there are multiple general 'message' handlers or if commands are also processed by a general handler.
  // However, node-telegram-bot-api processes onText handlers first. If a command matches, this won't be triggered for that message.
  if (msg.text && !msg.text.startsWith('/')) {
    const chatId = msg.chat.id;
    // Check if the message might have been handled by other specific listeners if any are added later
    if (bot.listeners('message').length > 2) { // >2 because of this and the built-in debug one
        // console.log('Skipping generic message handler due to other listeners.')
        // return;
    }
    console.log(`Processing non-command message from chat ID: ${chatId}: "${msg.text}"`);

    try {
      await sendMessageWithRetry(
        chatId,
        'I can help you shop! Try /shop to browse our products or /help to see all commands.',
        null,
        'non-command-message'
      );
      console.log(`Sent fallback response to chat ID: ${chatId}`);
    } catch (error) {
      console.error(`Error sending fallback response to chat ID: ${chatId}:`, error);
    }
  }
});

// Handle inline queries
bot.on('inline_query', async (query) => {
  const queryText = query.query.trim();
  console.log(`Received inline query: "${queryText}" from user ${query.from.id}`);
  if (!queryText) {
    console.log('Empty inline query, returning empty results.');
    return bot.answerInlineQuery(query.id, []);
  }

  try {
    // Fetch products matching the query
    console.log(`Fetching products from ${API_URL}/api/products/search?q=${queryText}`);
    const response = await axios.get(`${API_URL}/api/products/search`, {
      params: { q: queryText }
    });
    const products = response.data;
    console.log(`Found ${products.length} products for query "${queryText}"`);

    if (!products || products.length === 0) {
      return bot.answerInlineQuery(query.id, [], {
        cache_time: 0,
        switch_pm_text: 'No products found. Search again?',
        switch_pm_parameter: 'search_again'
      });
    }

    // Format results as InlineQueryResultArticle
    const results = products.map(product => ({
      type: 'article',
      id: String(product.id), // Ensure ID is a string
      title: product.name,
      description: `${product.description || ''} - $${parseFloat(product.price).toFixed(2)}`,
      thumb_url: product.image_url || 'https://via.placeholder.com/150', // Placeholder if no image
      input_message_content: {
        message_text: `Check out this product: ${product.name} - $${parseFloat(product.price).toFixed(2)}
See more: ${webAppUrl}/product/${product.id}`
      },
      reply_markup: {
        inline_keyboard: [[
          { text: 'View in Shop', web_app: { url: `${webAppUrl}/product/${product.id}` } }
        ]]
      }
    }));
    console.log(`Sending ${results.length} inline query results.`);
    await bot.answerInlineQuery(query.id, results, { cache_time: 0 }); // cache_time 0 for dev
  } catch (error) {
    console.error('Error handling inline query:', error.response ? error.response.data : error.message);
    // Optionally send a generic error message to the user if appropriate
    // e.g., by sending an empty result with a message
    await bot.answerInlineQuery(query.id, [], {
        cache_time: 0,
        switch_pm_text: 'Error searching. Try again?',
        switch_pm_parameter: 'search_error'
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
