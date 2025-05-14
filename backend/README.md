# E-commerce Telegram Mini App Backend

This is the backend part of the E-commerce Telegram Mini App. It provides the Telegram bot functionality and API endpoints for the frontend.

## Features

- Telegram bot integration
- RESTful API for products and orders
- Supabase database integration
- Stripe payment processing
- Serverless deployment support (Vercel)

## Project Structure

```
backend/
├── bot.js           # Telegram bot logic
├── server.js        # Express API server
├── supabaseClient.js # Supabase client
├── vercel.json      # Vercel deployment configuration
└── .env             # Environment variables
```

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   MINI_APP_URL=your_mini_app_url
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   PORT=3001
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the server in production mode.

### `npm run dev`

Runs the server in development mode with nodemon for auto-reloading.

### `npm run bot`

Runs only the Telegram bot without the API server.

## API Endpoints

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a specific product by ID

### Orders

- `POST /api/orders` - Create a new order
- `GET /api/orders/user/:userId` - Get orders for a specific user

### Payments

- `POST /api/create-payment-intent` - Create a Stripe payment intent

## Telegram Bot Commands

- `/start` - Start the bot
- `/shop` - Open the shop Mini App
- `/myorders` - View your orders
- `/help` - Show help message

## Supabase Database Schema

### Products Table

```sql
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  created_at timestamp with time zone default now()
);
```

### Orders Table

```sql
create table orders (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  products jsonb not null,
  total_amount numeric not null,
  payment_intent_id text not null,
  shipping_address jsonb,
  status text not null,
  created_at timestamp with time zone default now()
);
```

## Deployment

The recommended way to deploy this backend is using Vercel:

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Set up environment variables in Vercel
4. Deploy the app

The included `vercel.json` file configures the deployment for serverless functions.

## Technologies Used

- Node.js
- Express
- node-telegram-bot-api
- Supabase (PostgreSQL)
- Stripe
