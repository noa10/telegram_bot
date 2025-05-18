const express = require('express');
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('./supabaseClient');
const { telegramAuthMiddleware } = require('./middleware/telegramAuth');
const { supabaseAuthMiddleware } = require('./middleware/supabaseAuth');
const { validate, orderValidationRules, paymentIntentValidationRules, userOrdersValidationRules } = require('./middleware/validation');
const { errorHandler, notFoundHandler, ApiError } = require('./middleware/errorHandler');
const { bot, setupBotFeatures } = require('./bot');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOptions = {
  origin: ['https://telegram-bot-seven-blue.vercel.app', 'http://localhost:3000', process.env.CORS_ORIGIN || '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));
app.use(express.json());

// Root route handler
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Telegram Mini App API Server',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Handle favicon.ico requests to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response
});

// Health check endpoint to keep the server alive
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Product API endpoints - with and without /api prefix
const getProductsHandler = async (_, res, next) => {
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      return next(new ApiError(400, 'Failed to fetch products', error));
    }
    res.json(data);
  } catch (error) {
    next(error);
  }
};

app.get('/api/products', getProductsHandler);
app.get('/products', getProductsHandler);

// Categories API endpoint - with and without /api prefix
const getCategoriesHandler = async (_, res, next) => {
  try {
    // Using a direct SQL query to get distinct categories
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .order('category');

    if (error) {
      return next(new ApiError(400, 'Failed to fetch categories', error));
    }

    // Extract unique categories
    const uniqueCategories = [...new Set(data.map(item => item.category))];
    res.json(uniqueCategories);
  } catch (error) {
    next(error);
  }
};

app.get('/api/categories', getCategoriesHandler);
app.get('/categories', getCategoriesHandler);

// Product detail handler - with and without /api prefix
const getProductDetailHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Fetching product with ID: ${id}`);

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Check if it's a "not found" error
      if (error.code === 'PGRST116') {
        return next(new ApiError(404, 'Product not found', error));
      }
      return next(new ApiError(400, 'Failed to fetch product', error));
    }

    if (!data) {
      return next(new ApiError(404, 'Product not found'));
    }

    // Log the product data for debugging
    console.log('Product data:', {
      id: data.id,
      name: data.name,
      price: data.price,
      hasAddons: !!data.addons,
      addonKeys: data.addons ? Object.keys(data.addons) : []
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// Search handler - with and without /api prefix
const searchProductsHandler = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      console.log('Search query is empty, returning empty array.');
      return res.json([]);
    }
    console.log(`Searching for products with query: "${q}"`);

    // Use textSearch for potentially better relevance if you have FTS enabled on 'name' and 'description'
    // const { data, error } = await supabase
    //   .from('products')
    //   .select('*')
    //   .textSearch('fts_column_name', q, { type: 'websearch' }); // Replace 'fts_column_name'

    // Using ilike for broad matching without FTS
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`); // Ensure description is text searchable or handle null

    if (error) {
      console.error('Supabase search error:', error);
      throw new ApiError(500, 'Product search failed due to a database error', error.message);
    }

    console.log(`Found ${data ? data.length : 0} products for query "${q}"`);
    res.json(data || []); // Ensure data is an array, even if null
  } catch (error) {
    console.error('Error in products search:', error);
    // Ensure the error is an instance of ApiError or wrap it
    if (!(error instanceof ApiError)) {
        next(new ApiError(500, error.message || 'An unexpected error occurred during search'));
    } else {
        next(error);
    }
  }
};

// Note: Order matters! The search route must come before the :id route
app.get('/api/products/search', searchProductsHandler);
app.get('/products/search', searchProductsHandler);

// Now add the product detail routes
app.get('/api/products/:id', getProductDetailHandler);
app.get('/products/:id', getProductDetailHandler);

// Order API endpoints - with and without /api prefix
const createOrderHandler = async (req, res, next) => {
  try {
    const { userId, products, totalAmount, paymentIntentId, shippingAddress } = req.body;

    // Create order in Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          products: products,
          total_amount: totalAmount,
          payment_intent_id: paymentIntentId,
          shipping_address: shippingAddress || {},
          status: 'paid'
        }
      ])
      .select();

    if (error) {
      return next(new ApiError(400, 'Failed to create order', error));
    }

    res.status(201).json(data[0]);
  } catch (error) {
    next(error);
  }
};

app.post('/api/orders', telegramAuthMiddleware, supabaseAuthMiddleware, validate(orderValidationRules), createOrderHandler);
app.post('/orders', telegramAuthMiddleware, supabaseAuthMiddleware, validate(orderValidationRules), createOrderHandler);

// Get user orders handler - with and without /api prefix
const getUserOrdersHandler = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return next(new ApiError(400, 'Failed to fetch orders', error));
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

app.get('/api/orders/user/:userId', telegramAuthMiddleware, supabaseAuthMiddleware, validate(userOrdersValidationRules), getUserOrdersHandler);
app.get('/orders/user/:userId', telegramAuthMiddleware, supabaseAuthMiddleware, validate(userOrdersValidationRules), getUserOrdersHandler);

// Stripe Payment Intent API - with and without /api prefix
const createPaymentIntentHandler = async (req, res, next) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    // Get user information from telegramUser (set by telegramAuthMiddleware)
    const userId = req.telegramUser?.id || 'anonymous';
    const userName = req.telegramUser?.first_name || 'Anonymous User';

    // Create payment intent with metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: userId.toString(),
        userName
      }
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    if (error.type === 'StripeError') {
      return next(new ApiError(400, 'Payment processing error', error));
    }
    next(error);
  }
};

app.post('/api/create-payment-intent', telegramAuthMiddleware, supabaseAuthMiddleware, validate(paymentIntentValidationRules), createPaymentIntentHandler);
app.post('/create-payment-intent', telegramAuthMiddleware, supabaseAuthMiddleware, validate(paymentIntentValidationRules), createPaymentIntentHandler);

// Validate Telegram Mini App data - with and without /api prefix
const validateTelegramDataHandler = (req, res, next) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return next(new ApiError(400, 'initData is required'));
    }

    const { isValidTelegramData, parseUserFromInitData } = require('./middleware/telegramAuth');
    const isValid = isValidTelegramData(initData, process.env.TELEGRAM_BOT_TOKEN);

    if (isValid) {
      const user = parseUserFromInitData(initData);
      return res.json({ valid: true, user });
    }

    return next(new ApiError(403, 'Invalid initData'));
  } catch (error) {
    next(error);
  }
};

app.post('/api/validate-telegram-data', validateTelegramDataHandler);
app.post('/validate-telegram-data', validateTelegramDataHandler);

// Telegram bot webhook endpoint with improved error handling
app.post(`/api/webhook/${process.env.TELEGRAM_BOT_TOKEN}`, express.json(), (req, res) => {
  try {
    // Log webhook request for debugging
    console.log('Received webhook update:', JSON.stringify(req.body, null, 2));

    // Process the update
    bot.processUpdate(req.body);

    // Send immediate response to Telegram
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing webhook update:', error);
    // Still return 200 to prevent Telegram from retrying
    res.sendStatus(200);
  }
});

// Only start the server if this file is run directly
if (require.main === module || process.env.VERCEL) {
  const server = app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    // Set webhook in production
    const isProduction = process.env.NODE_ENV === 'production';
    const webhookUrl = process.env.WEBHOOK_URL;

    if (isProduction && webhookUrl) {
      const webhookPath = `/api/webhook/${process.env.TELEGRAM_BOT_TOKEN}`;
      const fullWebhookUrl = `${webhookUrl}${webhookPath}`;

      console.log(`Attempting to set webhook to ${fullWebhookUrl}`);

      try {
        // First, delete any existing webhook to ensure clean setup
        await bot.deleteWebHook();
        console.log('Deleted any existing webhook');

        // Wait a moment before setting the new webhook
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Configure the webhook with improved options
        const webhookOptions = {
          max_connections: 100, // Allow more simultaneous webhook connections
          drop_pending_updates: true, // Start fresh with new updates
          allowed_updates: ['message', 'callback_query', 'inline_query'], // Only receive specific update types
        };

        // Set the webhook with retry logic
        let webhookSetSuccess = false;
        let retryCount = 0;

        while (!webhookSetSuccess && retryCount < 3) {
          try {
            await bot.setWebHook(fullWebhookUrl, webhookOptions);
            webhookSetSuccess = true;
            console.log(`Webhook set successfully to: ${fullWebhookUrl}`);
          } catch (webhookError) {
            retryCount++;
            console.error(`Webhook setup attempt ${retryCount} failed:`, webhookError.message);

            if (retryCount < 3) {
              console.log(`Retrying webhook setup in ${retryCount * 2} seconds...`);
              await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
            }
          }
        }

        if (!webhookSetSuccess) {
          throw new Error('Failed to set webhook after multiple attempts');
        }

        // Verify the webhook was set correctly
        const webhookInfo = await bot.getWebHookInfo();
        console.log('Webhook verification:', JSON.stringify(webhookInfo, null, 2));

        if (webhookInfo.url !== fullWebhookUrl) {
          console.warn(`Warning: Webhook URL mismatch. Expected: ${fullWebhookUrl}, Actual: ${webhookInfo.url}`);
        }

        // Now that webhook is set, configure commands and menu button
        console.log('Setting up bot features after webhook confirmation...');
        await setupBotFeatures();
        console.log('Bot setup completed successfully');
      } catch (error) {
        console.error('Error setting webhook or bot features:', error.message);
        console.error('You may need to set up menu button manually using @BotFather');

        // Try to set up bot features anyway
        try {
          await setupBotFeatures();
          console.log('Bot features set up despite webhook error');
        } catch (featuresError) {
          console.error('Failed to set up bot features:', featuresError.message);
        }
      }
    } else {
      console.log('Development mode or missing webhook URL: Bot is using polling (configured in bot.js)');
      // setupBotFeatures is called via setTimeout in bot.js for polling mode
    }
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
    });
  });
}

// Add error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Export for Vercel serverless functions and for use in start-all.js
module.exports = app;
