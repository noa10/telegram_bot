# E-commerce Telegram Mini App

This project is a complete e-commerce solution built as a Telegram Mini App. It consists of a Node.js backend for the Telegram bot and API, and a React frontend for the Mini App.

## Project Structure

```
telegram_bot/
├── backend/             # Node.js backend
│   ├── bot.js           # Telegram bot logic
│   ├── server.js        # Express API server
│   ├── supabaseClient.js # Supabase client
│   └── .env             # Environment variables
│
└── frontend/            # React Mini App
    ├── public/          # Public assets
    └── src/             # Source code
        ├── components/  # React components
        ├── context/     # Context providers
        ├── pages/       # Page components
        ├── services/    # API services
        └── App.js       # Main app component
```

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Telegram Bot Token (from BotFather)
- Supabase account and project
- Stripe account

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   MINI_APP_URL=your_mini_app_url
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   PORT=3001
   ```

4. Start the backend server:
   ```
   npm run dev
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:3001
   REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. Start the frontend development server:
   ```
   npm start
   ```

### 3. Supabase Setup

1. Create a new Supabase project
2. Create the following tables:
   - `products`: For storing product information
   - `orders`: For storing order information
3. Set up Row Level Security (RLS) policies for secure data access

### 4. Telegram Bot Setup

1. Talk to [@BotFather](https://t.me/BotFather) on Telegram to create a new bot
2. Get your BOT_TOKEN and add it to the `.env` file
3. Set up your bot's commands:
   - `/start` - Start the bot
   - `/shop` - Browse products
   - `/myorders` - View your orders
   - `/help` - Show help message

## Deployment

### Backend Deployment (Vercel)

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Set up environment variables in Vercel
4. Deploy the backend

### Frontend Deployment (Vercel)

1. Build the frontend:
   ```
   npm run build
   ```
2. Deploy the `build` directory to Vercel
3. Set up environment variables in Vercel

## Features

- Product browsing and searching
- Shopping cart management
- Secure checkout with Stripe
- Order history
- Telegram native UI integration
- Dark/light theme support

## Technologies Used

- **Backend**: Node.js, Express, node-telegram-bot-api
- **Frontend**: React, React Router, Stripe Elements
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Telegram user authentication
- **Payment Processing**: Stripe
- **Deployment**: Vercel

## License

This project is licensed under the MIT License - see the LICENSE file for details.
