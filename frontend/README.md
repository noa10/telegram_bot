# E-commerce Telegram Mini App Frontend

This is the frontend part of the E-commerce Telegram Mini App. It's built with React and designed to run inside Telegram's WebApp view.

## Features

- Product browsing
- Shopping cart management
- Secure checkout with Stripe
- Order history
- Telegram native UI integration
- Dark/light theme support

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ProductCard.js
│   ├── CartItem.js
│   └── CheckoutForm.js
│
├── context/          # React context providers
│   ├── TelegramContext.js
│   └── CartContext.js
│
├── pages/            # Page components
│   ├── HomePage.js
│   ├── CartPage.js
│   ├── CheckoutPage.js
│   ├── OrderSuccessPage.js
│   └── OrdersPage.js
│
├── services/         # API services
│   └── api.js
│
└── App.js            # Main app component
```

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:3001
   REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

3. Start the development server:
   ```
   npm start
   ```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

## Telegram Mini App Integration

This app uses the Telegram Mini App SDK to integrate with Telegram's native features:

- **MainButton**: Used for primary actions like "View Cart" and "Checkout"
- **BackButton**: Used for navigation
- **Theme**: Automatically adapts to Telegram's theme (light/dark)
- **User Data**: Accesses user information from Telegram when available

## Deployment

The recommended way to deploy this app is using Vercel:

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Set up environment variables in Vercel
4. Deploy the app

Once deployed, update the `MINI_APP_URL` in your backend's `.env` file to point to your deployed frontend URL.

## Technologies Used

- React
- React Router
- Stripe Elements
- Telegram Mini App SDK
