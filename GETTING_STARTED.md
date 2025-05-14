# Getting Started with Your E-commerce Telegram Mini App

This guide will help you get your E-commerce Telegram Mini App up and running.

## Prerequisites

Before you begin, make sure you have the following:

1. Node.js (v14 or later) and npm installed
2. A Telegram bot token (from [@BotFather](https://t.me/BotFather))
3. A Supabase account and project
4. A Stripe account

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd telegram_bot
```

### 2. Run the Setup Script

```bash
./setup.sh
```

This script will:
- Create `.env` files from the examples
- Install dependencies for both the backend and frontend

### 3. Configure Environment Variables

Update the `.env` files with your actual values:

**Backend (.env)**:
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
MINI_APP_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
PORT=3001
```

**Frontend (.env)**:
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 4. Set Up the Database

1. Create the necessary tables in Supabase using the SQL in `backend/supabase-schema.sql`
2. Seed the database with sample products:
   ```bash
   npm run seed
   ```

### 5. Start the Development Servers

```bash
./dev.sh
```

This script will start both the backend and frontend in development mode using tmux.

Alternatively, you can start them separately:

```bash
# Start the backend
cd backend
npm run dev

# Start the frontend (in a separate terminal)
cd frontend
npm start
```

### 6. Test Your Bot

1. Open Telegram and find your bot
2. Send the `/start` or `/shop` command
3. Click on the "Open Shop" button to launch the Mini App

## Project Structure

```
telegram_bot/
├── backend/             # Node.js backend
│   ├── bot.js           # Telegram bot logic
│   ├── server.js        # Express API server
│   ├── supabaseClient.js # Supabase client
│   ├── seed-data.js     # Database seeding script
│   └── .env             # Environment variables
│
├── frontend/            # React Mini App
│   ├── public/          # Public assets
│   └── src/             # Source code
│       ├── components/  # React components
│       ├── context/     # Context providers
│       ├── pages/       # Page components
│       ├── services/    # API services
│       └── App.js       # Main app component
│
├── setup.sh             # Setup script
├── dev.sh               # Development script
└── README.md            # Project documentation
```

## Available Scripts

At the root level:

- `npm run setup`: Run the setup script
- `npm run dev`: Start both backend and frontend in development mode
- `npm run start:backend`: Start the backend server
- `npm run start:frontend`: Start the frontend development server
- `npm run build:frontend`: Build the frontend for production
- `npm run seed`: Seed the database with sample products
- `npm run install:all`: Install dependencies for both backend and frontend

## Next Steps

1. **Customize the UI**: Modify the React components to match your brand
2. **Add More Products**: Add your own products to the database
3. **Configure Payments**: Set up Stripe for real payments
4. **Deploy**: Deploy your app to Vercel or another hosting service

## Documentation

For more detailed information, see the following documentation:

- [README.md](README.md): Overview of the project
- [TELEGRAM_INTEGRATION.md](TELEGRAM_INTEGRATION.md): Guide to Telegram Mini App integration
- [SUPABASE_INTEGRATION.md](SUPABASE_INTEGRATION.md): Guide to Supabase integration
- [STRIPE_INTEGRATION.md](STRIPE_INTEGRATION.md): Guide to Stripe integration
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md): Guide to deploying your app

## Troubleshooting

### Common Issues

1. **Bot not responding**: Make sure your Telegram bot token is correct and the bot is running
2. **Database connection issues**: Verify your Supabase URL and key
3. **Payment processing errors**: Check your Stripe configuration
4. **CORS errors**: Ensure your backend allows requests from your frontend

### Getting Help

If you encounter any issues, check the documentation or reach out to the community for help.
