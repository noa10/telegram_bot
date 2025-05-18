# Deployment Guide

This document provides guidance on deploying your E-commerce Telegram Mini App to Vercel.

## What is Vercel?

Vercel is a cloud platform for static sites and serverless functions that enables developers to deploy websites and web services that deploy instantly and scale automatically.

## Prerequisites

Before deploying, make sure you have:

1. A [Vercel account](https://vercel.com/signup)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Completed your local development and testing

## Deploying the Frontend

### 1. Prepare Your Frontend for Production

1. Update your `.env` file with production values:
   ```
   REACT_APP_API_URL=https://your-backend-url.vercel.app
   REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

2. Build your frontend:
   ```bash
   cd frontend
   npm run build
   ```

### 2. Deploy to Vercel

#### Option 1: Using the Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Navigate to your frontend directory:
   ```bash
   cd frontend
   ```

3. Deploy to Vercel:
   ```bash
   vercel
   ```

4. Follow the prompts to configure your project

#### Option 2: Using the Vercel Dashboard

1. Go to [Vercel](https://vercel.com/) and log in
2. Click "New Project"
3. Import your Git repository
4. Configure your project:
   - Framework Preset: Create React App
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: build
5. Add environment variables:
   - REACT_APP_API_URL
   - REACT_APP_STRIPE_PUBLISHABLE_KEY
6. Click "Deploy"

### 3. Configure Custom Domain (Optional)

1. In your Vercel project dashboard, go to "Settings" > "Domains"
2. Add your custom domain and follow the instructions to configure DNS

## Deploying the Backend

### 1. Prepare Your Backend for Production

1. Update your `.env` file with production values:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   MINI_APP_URL=https://your-frontend-url.vercel.app
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

2. Make sure your `vercel.json` file is configured correctly:
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "server.js", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "server.js" }
     ]
   }
   ```

### 2. Deploy to Vercel

#### Option 1: Using the Vercel CLI

1. Navigate to your backend directory:
   ```bash
   cd backend
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Follow the prompts to configure your project

#### Option 2: Using the Vercel Dashboard

1. Go to [Vercel](https://vercel.com/) and log in
2. Click "New Project"
3. Import your Git repository
4. Configure your project:
   - Framework Preset: Other
   - Root Directory: backend
   - Build Command: npm install
   - Output Directory: (leave empty)
5. Add environment variables:
   - TELEGRAM_BOT_TOKEN
   - MINI_APP_URL
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - STRIPE_SECRET_KEY
   - STRIPE_PUBLISHABLE_KEY
6. Click "Deploy"

### 3. Configure Custom Domain (Optional)

1. In your Vercel project dashboard, go to "Settings" > "Domains"
2. Add your custom domain and follow the instructions to configure DNS

## Handling the Telegram Bot on Vercel

Vercel's serverless functions are not designed for long-running processes like a Telegram bot using polling. There are two approaches to handle this:

### Option 1: Use Webhooks Instead of Polling

1. Update your bot.js file to use webhooks instead of polling:
   ```javascript
   const TelegramBot = require('node-telegram-bot-api');
   require('dotenv').config();

   const token = process.env.TELEGRAM_BOT_TOKEN;
   const webAppUrl = process.env.MINI_APP_URL;
   const webhookUrl = process.env.WEBHOOK_URL || 'https://your-backend-url.vercel.app/api/webhook';

   // Create a bot instance with webhook
   const bot = new TelegramBot(token);

   // Set webhook
   bot.setWebHook(`${webhookUrl}/${token}`);

   // Export bot for use in server.js
   module.exports = bot;
   ```

2. Add a webhook endpoint in your server.js:
   ```javascript
   // Webhook endpoint for Telegram
   app.post(`/api/webhook/${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
     bot.processUpdate(req.body);
     res.sendStatus(200);
   });
   ```

### Option 2: Use a Separate Service for the Bot

1. Deploy your API to Vercel
2. Deploy your bot to a service that supports long-running processes:
   - [Heroku](https://www.heroku.com/)
   - [DigitalOcean](https://www.digitalocean.com/)
   - [Railway](https://railway.app/)

## Updating Your Telegram Bot

After deploying your frontend, update your Telegram bot to use the new URL:

1. In your chat with BotFather, use the `/mybots` command
2. Select your bot from the list
3. Select "Bot Settings" > "Menu Button"
4. Update the menu button URL to your deployed frontend URL

## Monitoring and Troubleshooting

### Vercel Logs

1. In your Vercel project dashboard, go to "Deployments"
2. Select your deployment
3. Click "Functions" to see your serverless functions
4. Click on a function to view its logs

### Common Issues

1. **CORS Errors**: Make sure your backend allows requests from your frontend domain
2. **Environment Variables**: Verify that all environment variables are set correctly
3. **Build Errors**: Check your build logs for any errors
4. **API Timeouts**: Vercel has a 10-second timeout for serverless functions; optimize your code to run within this limit

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Deploying Node.js to Vercel](https://vercel.com/guides/deploying-nodejs-to-vercel)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
