## Telegram Mini App E-commerce Platform: Implementation Workflow

This document outlines the complete workflow for implementing the Telegram Mini App e-commerce platform based on the provided frontend and backend codebase.

### 1. Project Setup & Dependencies

* **Backend (Node.js)**:
    * Initialize a Node.js project (`npm init`).
    * Install necessary dependencies:
        * `express`: For the web server framework[cite: 549].
        * `cors`: To enable Cross-Origin Resource Sharing[cite: 549].
        * `dotenv`: To manage environment variables[cite: 104, 549].
        * `stripe`: For payment processing[cite: 549].
        * `@supabase/supabase-js`: Supabase client library for interacting with the database[cite: 103].
        * `node-telegram-bot-api`: To create and manage the Telegram bot[cite: 104].
        * `axios`: For making HTTP requests (used in `bot.js` for a custom request handler and potentially by services)[cite: 104].
        * `form-data`: Used by `axios` for multipart/form-data requests[cite: 104].
    * Create a `.env` file to store sensitive information and configuration variables such as:
        * `TELEGRAM_BOT_TOKEN`: Your Telegram Bot Token[cite: 104, 107].
        * `MINI_APP_URL`: The URL where your frontend Mini App will be hosted (must be HTTPS)[cite: 105, 200].
        * `API_URL`: The base URL for your backend API (e.g., `http://localhost:3001` or your production API URL)[cite: 105].
        * `SUPABASE_URL`: Your Supabase project URL[cite: 103].
        * `SUPABASE_ANON_KEY`: Your Supabase anonymous public key[cite: 103].
        * `STRIPE_SECRET_KEY`: Your Stripe secret key[cite: 549].
        * `WEBHOOK_URL`: The public URL for your Telegram bot webhook in production[cite: 106, 574].
        * `NODE_ENV`: Set to `development` or `production`.

* **Frontend (React)**:
    * Create a React application (e.g., using `create-react-app`).
    * Install necessary dependencies:
        * `react-router-dom`: For routing within the single-page application[cite: 82, 538].
        * `axios`: For making API calls to the backend[cite: 465].
        * `@stripe/react-stripe-js` and `@stripe/stripe-js`: For Stripe.js integration in the checkout form[cite: 263, 318].
        * `uuid`: For generating unique IDs (used in CartContext)[cite: 403].
    * Create a `.env` file in the frontend directory (usually `frontend/.env`) for:
        * `REACT_APP_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key[cite: 319].
        * `REACT_APP_API_URL`: The base URL for your backend API (this should match the backend `API_URL` or be the public URL of your deployed backend)[cite: 465].

### 2. Database Setup (Supabase)

* Set up a new project on Supabase.
* Obtain your Supabase Project URL and Anonymous Key and add them to the backend `.env` file.
* Use the `supabase-schema.sql` file [cite: 593] to create the necessary tables and relationships:
    * **`products` table**: Stores product information including name, description, price, image URL, stock, category, product code, and addons (JSONB for flexible addon structures)[cite: 593].
    * **`product_addons` table**: Stores definitions of available addons (e.g., "Size", "Topping")[cite: 594]. (Note: The current schema has `addons` directly in the `products` table as JSONB, which is a simpler approach for the provided code. The `product_addons` and `product_addon_options` tables might be for a more normalized/complex addon system not fully utilized in the current frontend logic but are good for future expansion.)
    * **`product_addon_options` table**: Links products to available addons if a normalized structure is used[cite: 595].
    * **`orders` table**: Stores order details including user ID, products (JSONB), total amount, payment intent ID, shipping address (JSONB), and status[cite: 596].
* Apply Row Level Security (RLS) policies as defined in `supabase-schema.sql`[cite: 597, 602]:
    * Products: Publicly readable, but only users with an 'admin' role can insert, update, or delete[cite: 598, 599, 600, 601].
    * Orders: Users can only read and create their own orders. Admins can manage all orders[cite: 606, 607, 608].
* Define helper SQL functions like `is_admin()`, `set_telegram_user_id()`, and `current_telegram_user_id()` for RLS policies[cite: 603, 604, 605, 606].
* Insert sample product data as provided in the schema or your own data[cite: 609].
* Ensure triggers like `update_updated_at_column()` are created to automatically update `updated_at` timestamps for relevant tables[cite: 611, 612, 613, 614, 615].

### 3. Backend Implementation (`/backend`)

* **`supabaseClient.js`**[cite: 103]:
    * Initializes and exports the Supabase client using the URL and anon key from environment variables. This client will be used by other backend services to interact with the database.

* **`bot.js`**[cite: 104]:
    * Initializes the Telegram Bot using `node-telegram-bot-api` with the `TELEGRAM_BOT_TOKEN`.
    * Configures the bot for polling in development and prepares for webhook setup in production[cite: 130, 132].
    * Implements an `axiosRequestHandler` for making HTTP requests with retry logic and improved reliability, which is then passed to the `TelegramBot` instance[cite: 109, 128].
    * Defines command handlers (`/start`, `/shop`, `/menu`, `/myorders`, `/promo`, `/help`)[cite: 160, 167, 173, 179, 181, 183]:
        * These handlers generally send messages to the user with inline keyboards that contain buttons. These buttons, when clicked, open the Mini App (frontend) at specific URLs (e.g., `/product/:id`, `/category/:categoryName`, `/orders?userId=:userId`)[cite: 161, 168, 174, 180, 182].
        * The `/shop` and `/menu` commands fetch categories from the API (`/api/products` then processed, or `/api/categories` as per `server.js`) to dynamically create category buttons[cite: 164, 168, 174].
    * Handles generic messages (non-commands) by prompting users to use available commands[cite: 186].
    * Handles inline queries: Fetches products from `/api/products/search` based on the user's query and returns them as inline query results[cite: 190].
    * `setupBotFeatures()`: A function to set the bot's commands list and the chat menu button (which opens the Mini App)[cite: 200, 203, 205]. This is called after the server starts and the webhook is set (in production) or after a delay (in development).
    * Includes troubleshooting tips in console logs for bot setup issues[cite: 212].

* **`server.js`**[cite: 549]:
    * Sets up an Express server.
    * Uses `cors` middleware.
    * Uses `express.json()` for parsing JSON request bodies.
    * **API Endpoints**:
        * `/api/health`: A simple health check endpoint[cite: 553].
        * `/api/products`: Fetches all products from Supabase[cite: 554].
        * `/api/categories`: Fetches distinct product categories from Supabase[cite: 555].
        * `/api/products/:id`: Fetches a single product by its ID from Supabase[cite: 557].
        * `/api/products/search`: Searches products by name or description using a query parameter `q`[cite: 560].
        * `/api/orders`: Creates a new order. This endpoint is protected by `telegramAuthMiddleware`, `supabaseAuthMiddleware`, and uses `orderValidationRules`[cite: 566].
        * `/api/orders/user/:userId`: Fetches orders for a specific user. Also protected and validated[cite: 568].
        * `/api/create-payment-intent`: Creates a Stripe PaymentIntent. Protected and validated[cite: 569]. It includes `userId` and `userName` from Telegram data in the PaymentIntent metadata[cite: 570].
        * `/api/validate-telegram-data`: Validates `initData` from the Telegram Mini App[cite: 571].
    * **Middleware**:
        * `telegramAuthMiddleware` (in `middleware/telegramAuth.js`, not provided but inferred): Validates Telegram `initData` and attaches user information to the request object (e.g., `req.telegramUser`).
        * `supabaseAuthMiddleware` (in `middleware/supabaseAuth.js`, not provided but inferred): Likely handles Supabase-specific authentication or sets Supabase session context for RLS using functions like `set_telegram_user_id()`.
        * `validate` (with rules from `middleware/validation.js`, not provided but inferred): Validates request bodies/params for specific routes[cite: 551].
        * `errorHandler`, `notFoundHandler`, `ApiError` (from `middleware/errorHandler.js`, not provided but inferred): Custom error handling[cite: 551].
    * **Webhook Setup**:
        * In production, it sets up the Telegram bot webhook to `/api/webhook/${process.env.TELEGRAM_BOT_TOKEN}` after the server starts[cite: 573, 574]. It deletes any existing webhook first and includes retry logic for setting the new webhook[cite: 575, 578].
        * It calls `setupBotFeatures()` from `bot.js` after the webhook is confirmed[cite: 585].
    * Includes graceful shutdown logic for `SIGTERM`[cite: 591].

### 4. Frontend Implementation (`/frontend/src`)

* **Main Structure (`App.js`, `index.js`)**:
    * `index.js`: Renders the root `App` component into the DOM[cite: 100]. It also calls `reportWebVitals`[cite: 101].
    * `App.js`[cite: 541]:
        * Sets up the main application structure with context providers (`ThemeProvider`, `TelegramProvider`, `CartProvider`) and routing (`BrowserRouter`, `Routes`, `Route`)[cite: 538, 539].
        * An effect hook applies Telegram theme parameters (bg_color, text_color, etc.) as CSS custom properties to the `documentElement` and sets a `data-theme` attribute. It also listens for `themeChanged` events from the Telegram WebApp to update the theme dynamically[cite: 542, 543, 545].
        * Defines routes for different pages: `/`, `/category/:categoryName`, `/product/:id`, `/cart`, `/checkout`, `/order-success`, `/orders`[cite: 546, 547, 548].

* **Contexts**:
    * `TelegramContext.js`[cite: 5]:
        * Provides access to the Telegram WebApp instance (`window.Telegram.WebApp`).
        * Initializes the WebApp (`tg.ready()`, `tg.expand()`).
        * Retrieves and provides Telegram user data (`tg.initDataUnsafe.user`)[cite: 8].
        * Offers helper functions to interact with Telegram UI elements like the MainButton (`showMainButton`, `hideMainButton`) and BackButton (`showBackButton`, `hideBackButton`), show popups (`showPopup`), and close the app (`closeApp`)[cite: 9, 11, 13, 15].
        * Provides a `useTelegram` hook for easy consumption[cite: 18].
    * `CartContext.js`[cite: 403]:
        * Manages the shopping cart state (items, totalItems, totalAmount) using `useReducer`.
        * Persists cart state to `localStorage`[cite: 425, 427].
        * Provides actions: `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`[cite: 404, 428, 429, 430, 431].
        * `addToCart` handles existing items by updating quantity and generates unique IDs for new cart items using `uuidv4`[cite: 406, 410].
        * Provides a `useCart` hook[cite: 434].
    * `ThemeContext.js`[cite: 305]:
        * Manages the application's theme ('light' or 'dark').
        * Initializes the theme based on `window.Telegram.WebApp.colorScheme` or system preference if not in Telegram[cite: 306, 309].
        * Listens for theme changes from the Telegram app (`tg.onEvent('themeChanged')`) or system theme changes (`window.matchMedia`)[cite: 307, 311].
        * Applies the current theme to `document.documentElement` via a `data-theme` attribute[cite: 314].
        * Provides `theme` and `toggleTheme` (though `toggleTheme` is not actively used by `App.js` which syncs with Telegram's theme). Provides a `useTheme` hook[cite: 316].

* **Services (`services/api.js`)**[cite: 465]:
    * Configures an Axios instance with a `baseURL` from `REACT_APP_API_URL`.
    * Includes an interceptor to automatically add Telegram `initData` (obtained via `window.Telegram.WebApp.initData`) to the body of POST, PUT, and PATCH requests (except for `/validate-telegram-data`)[cite: 466, 468].
    * Provides functions to interact with backend API endpoints:
        * `getProducts()`: GET `/api/products`[cite: 469].
        * `getProduct(id)`: GET `/api/products/:id`[cite: 471].
        * `getCategories()`: GET `/api/categories`[cite: 473].
        * `createOrder(orderData)`: POST `/api/orders`[cite: 475].
        * `getUserOrders(userId)`: GET `/api/orders/user/:userId` (adds `initData` as a query param)[cite: 476].
        * `createPaymentIntent(amount, currency)`: POST `/api/create-payment-intent`[cite: 478].
        * `validateTelegramData(initData)`: POST `/api/validate-telegram-data`[cite: 479].

* **Components (`components/`)**:
    * `ProductCard.js`[cite: 252]: Displays a single product in a card format. Links to the product detail page. Includes an "Add to Cart" button that directly adds the product to the cart (potentially with default/no addons)[cite: 258]. Handles cases where product data might be incomplete[cite: 259].
    * `CartItem.js`[cite: 231]: Displays an item in the cart. Allows updating quantity and removing the item from the cart. Shows selected addons if any[cite: 236].
    * `CheckoutForm.js`[cite: 265]:
        * Integrates Stripe CardElement for payment input[cite: 263, 277].
        * Collects shipping address details[cite: 268].
        * Validates required shipping fields[cite: 274].
        * On submit:
            * Confirms the card payment with Stripe using a `clientSecret` (obtained in `CheckoutPage.js`)[cite: 277].
            * If payment is successful, creates an order via `createOrder()` API service[cite: 282].
            * Clears the cart and calls `onSuccess` callback[cite: 283, 285].
        * Uses `useTheme` to style the Stripe CardElement according to the current theme[cite: 267, 298].

* **Pages (`pages/`)**:
    * `HomePage.js`[cite: 378]:
        * Displays a list of products fetched via `getProducts()` and categories via `getCategories()`[cite: 383].
        * Allows filtering products by category. The selected category can also come from the URL parameter `:categoryName`[cite: 379, 382, 395].
        * Shows a "View Cart" button (Telegram MainButton) if `totalItems > 0`[cite: 380].
        * Uses `ProductCard` component to display each product.
    * `ProductDetailPage.js`[cite: 510]:
        * Fetches and displays details for a single product using `getProduct(id)` based on the URL parameter `:id`[cite: 509, 515].
        * Handles product addons: if `product.addons` exists (expected as an object where keys are addon groups and values are arrays of options), it allows the user to select options for each group[cite: 516, 517, 530]. Initializes `selectedAddons` with default values if possible[cite: 517].
        * Allows users to select quantity[cite: 512, 535].
        * "Add to Cart" button adds the product with selected quantity and addons to the cart using `addToCart()` from `CartContext` and shows a Telegram popup[cite: 524, 525].
        * Includes loading, error, and "product not found" states[cite: 527].
    * `CartPage.js`[cite: 82]:
        * Displays items from `CartContext` using `CartItem` component[cite: 83, 89].
        * Shows cart summary (subtotal, shipping, total)[cite: 90].
        * Telegram BackButton navigates to home (`/`)[cite: 85].
        * Telegram MainButton ("Checkout") navigates to `/checkout` if items are in the cart[cite: 85].
        * Allows clearing the entire cart[cite: 86].
        * Shows an "empty cart" message with a "Continue Shopping" button if the cart is empty[cite: 88].
    * `CheckoutPage.js`[cite: 320]:
        * Redirects to home if the cart is empty[cite: 322].
        * Telegram BackButton navigates to `/cart`[cite: 322].
        * Hides the Telegram MainButton[cite: 322].
        * Fetches a Stripe `clientSecret` by calling `createPaymentIntent()` on component mount[cite: 323, 324].
        * Wraps `CheckoutForm` with Stripe `Elements` provider, passing the `stripePromise` and `clientSecret`[cite: 332].
        * On successful checkout (callback from `CheckoutForm`), navigates to `/order-success`[cite: 326].
    * `OrderSuccessPage.js`[cite: 93]:
        * Displays an order confirmation message.
        * Hides Telegram BackButton[cite: 94].
        * Telegram MainButton ("Continue Shopping") navigates to `/`[cite: 94].
    * `OrdersPage.js`[cite: 358]:
        * Fetches and displays the user's past orders using `getUserOrders(userId)`. The `userId` is obtained from URL query parameters or from `TelegramContext`[cite: 357, 361].
        * Telegram BackButton navigates to `/`[cite: 360].
        * Hides the Telegram MainButton[cite: 360].
        * Formats dates for display[cite: 367].
        * Shows loading, error, or "no orders found" states[cite: 363, 364, 365].

* **Styling (`*.css`)**:
    * `App.css` defines global styles and CSS custom properties for theming (`--tg-theme-bg-color`, etc.) that are dynamically updated by `App.js` based on Telegram theme params[cite: 499, 500, 501, 502].
    * Each component and page has its own CSS file for specific styling (e.g., `HomePage.css`[cite: 334], `ProductCard.css` [cite: 241]).
    * Styles include considerations for dark mode using `(prefers-color-scheme: dark)` or `[data-theme="dark"]` selectors.

* **Utilities (`utils/errorHandler.js` - not provided but inferred)**:
    * Used by several pages and components (e.g., `CheckoutForm.js`[cite: 265], `HomePage.js`[cite: 378], `OrdersPage.js` [cite: 358]) to handle errors from API calls, typically setting error and loading states.

### 5. Telegram Bot Configuration

* Create a new bot or use an existing one via @BotFather on Telegram.
* Obtain the **Bot Token** and add it to your backend `.env` file (`TELEGRAM_BOT_TOKEN`).
* **Development**: The bot will use polling (as configured in `bot.js` when `NODE_ENV` is not 'production' or `WEBHOOK_URL` is not set)[cite: 132, 210].
* **Production**:
    * The `server.js` will attempt to set a webhook URL. The `WEBHOOK_URL` in your `.env` file must be a publicly accessible HTTPS URL pointing to your deployed backend at the path `/api/webhook/YOUR_BOT_TOKEN`[cite: 574].
    * The `server.js` also calls `setupBotFeatures()` to define commands and the menu button[cite: 203, 205].
* **Menu Button**: The chat menu button in Telegram should be configured to open your Mini App. `bot.js` attempts to set this programmatically using `bot.setChatMenuButton()` with the `MINI_APP_URL`[cite: 205]. If this fails, it can be set manually via @BotFather by providing the `MINI_APP_URL`[cite: 214, 215].
* **Inline Mode**: Enable inline mode for your bot via @BotFather if you want the inline product search to work.
* **Deep Linking**: The `/start product_<id>` command handler in `bot.js` supports deep linking directly to a product page in the Mini App[cite: 161].

### 6. Deployment & Integration

* **Backend**:
    * Deploy the Node.js/Express backend to a platform like Heroku, Vercel (for serverless functions, though the current `server.js` is more monolithic), AWS, Google Cloud, etc.
    * Ensure all environment variables (`.env` contents) are correctly set in the deployment environment.
    * The deployment must support HTTPS if you are setting a webhook.

* **Frontend**:
    * Build the React application (`npm run build`).
    * Deploy the static build files (from the `build` folder) to a static hosting service like Netlify, Vercel, GitHub Pages, AWS S3, etc.
    * The URL of the deployed frontend is your `MINI_APP_URL` and `REACT_APP_API_URL` (if different from backend `API_URL`).
    * Ensure the hosting supports HTTPS, as Telegram Mini Apps require it.

* **Supabase**:
    * Supabase is already a cloud-hosted service, so no separate deployment is needed for the database itself beyond the initial setup.

* **Stripe**:
    * Ensure your Stripe account is configured (live mode for production, test mode for development).
    * Stripe keys (`STRIPE_SECRET_KEY` for backend, `REACT_APP_STRIPE_PUBLISHABLE_KEY` for frontend) must be correctly set.

### 7. Data Flow Examples

* **Viewing Products**:
    1.  User interacts with Telegram bot (e.g., types `/shop` or clicks menu button).
    2.  `bot.js` sends a message with an inline keyboard button pointing to `MINI_APP_URL`.
    3.  User clicks button, Telegram opens the Mini App (frontend `HomePage.js`).
    4.  `HomePage.js` fetches products from backend `/api/products` (and categories from `/api/categories`).
    5.  `server.js` queries Supabase for products/categories and returns data.
    6.  Frontend displays products.

* **Adding to Cart (from Product Detail Page)**:
    1.  User navigates to `ProductDetailPage.js`.
    2.  User selects quantity/addons and clicks "Add to Cart".
    3.  `addToCart()` from `CartContext.js` updates the cart state (localStorage).
    4.  A Telegram popup is shown via `useTelegram().showPopup()`[cite: 525].
    5.  `HomePage.js` (if visible or navigated back to) or `App.js` might show/update the Telegram MainButton to "View Cart" based on `totalItems` from `CartContext`.

* **Checkout Process**:
    1.  User clicks "View Cart" (MainButton) or navigates to `CartPage.js`.
    2.  User clicks "Checkout" (MainButton on `CartPage.js` or button on page).
    3.  Navigates to `CheckoutPage.js`.
    4.  `CheckoutPage.js` fetches `clientSecret` from backend `/api/create-payment-intent`.
        * Backend `server.js` calls Stripe to create PaymentIntent, including Telegram user ID/name in metadata[cite: 570].
    5.  User fills shipping and payment details in `CheckoutForm.js`.
    6.  `CheckoutForm.js` submits payment to Stripe using `clientSecret`.
    7.  If payment is successful:
        * `CheckoutForm.js` calls backend `/api/orders` to save the order.
        * Backend `server.js` saves the order to Supabase.
        * `CartContext.clearCart()` is called.
        * User is navigated to `OrderSuccessPage.js`.

* **Viewing Orders**:
    1.  User types `/myorders` in Telegram.
    2.  `bot.js` sends a message with an inline keyboard button pointing to `MINI_APP_URL/orders?userId=<telegram_user_id>`.
    3.  User clicks button, Mini App opens `OrdersPage.js`.
    4.  `OrdersPage.js` fetches orders from backend `/api/orders/user/<userId>`, passing `initData` for validation.
    5.  `server.js` (after middleware validation) queries Supabase for the user's orders (RLS applies).
    6.  Frontend displays the orders.

This comprehensive workflow covers the setup, implementation, and interaction of all components within the provided codebase. Each step builds upon the previous, leading to a fully functional e-commerce Telegram Mini App.