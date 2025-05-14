const express = require('express');
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('./supabaseClient');
const { telegramAuthMiddleware } = require('./middleware/telegramAuth');
const { supabaseAuthMiddleware } = require('./middleware/supabaseAuth');
const { validate, orderValidationRules, paymentIntentValidationRules, userOrdersValidationRules } = require('./middleware/validation');
const { errorHandler, notFoundHandler, ApiError } = require('./middleware/errorHandler');
const bot = require('./bot');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Product API endpoints
app.get('/api/products', async (_, res, next) => {
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      return next(new ApiError(400, 'Failed to fetch products', error));
    }
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
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

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Order API endpoints
app.post('/api/orders', telegramAuthMiddleware, supabaseAuthMiddleware, validate(orderValidationRules), async (req, res, next) => {
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
});

app.get('/api/orders/user/:userId', telegramAuthMiddleware, supabaseAuthMiddleware, validate(userOrdersValidationRules), async (req, res, next) => {
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
});

// Stripe Payment Intent API
app.post('/api/create-payment-intent', telegramAuthMiddleware, supabaseAuthMiddleware, validate(paymentIntentValidationRules), async (req, res, next) => {
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
});

// Validate Telegram Mini App data
app.post('/api/validate-telegram-data', (req, res, next) => {
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
});

// Telegram bot webhook endpoint
app.post(`/api/webhook/${process.env.TELEGRAM_BOT_TOKEN}`, express.json(), (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Only start the server if this file is run directly
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Set webhook in production
    const isProduction = process.env.NODE_ENV === 'production';
    const webhookUrl = process.env.WEBHOOK_URL;

    if (isProduction && webhookUrl) {
      const webhookPath = `/api/webhook/${process.env.TELEGRAM_BOT_TOKEN}`;
      const fullWebhookUrl = `${webhookUrl}${webhookPath}`;

      bot.setWebHook(fullWebhookUrl)
        .then(() => {
          console.log(`Webhook set to ${fullWebhookUrl}`);
        })
        .catch((error) => {
          console.error('Error setting webhook:', error);
        });
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
