# Telegram Mini App Integration Guide

This document provides guidance on integrating your Telegram Mini App with the Telegram platform.

## What is a Telegram Mini App?

Telegram Mini Apps are web applications that run inside the Telegram messenger. They provide a way to create rich, interactive experiences without requiring users to leave Telegram.

## Setting Up Your Bot with BotFather

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Start a chat with BotFather and use the `/newbot` command to create a new bot
3. Follow the instructions to choose a name and username for your bot
4. Once created, you'll receive a token for your bot - save this in your `.env` file as `TELEGRAM_BOT_TOKEN`

## Enabling Mini Apps for Your Bot

1. In your chat with BotFather, use the `/mybots` command
2. Select your bot from the list
3. Select "Bot Settings" > "Menu Button" to set up a menu button for your Mini App
4. Use the `/setmenubutton` command to set the menu button URL to your deployed Mini App URL

## Configuring Web App Settings

1. In your chat with BotFather, use the `/mybots` command
2. Select your bot from the list
3. Select "Bot Settings" > "Web App Settings"
4. Here you can configure various settings for your Mini App, including:
   - Domain allowlist
   - Bot username for links

## Telegram Mini App SDK

The Telegram Mini App SDK provides JavaScript methods to interact with the Telegram app. Key features include:

### Initialization

```javascript
// Check if Telegram WebApp is available
if (window.Telegram && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;
  
  // Initialize the WebApp
  tg.ready();
  
  // Expand the WebApp to full height
  tg.expand();
}
```

### Accessing User Data

```javascript
// Get user data
const user = tg.initDataUnsafe.user;
if (user) {
  console.log(`User ID: ${user.id}`);
  console.log(`Username: ${user.username}`);
  console.log(`First Name: ${user.first_name}`);
}
```

### Main Button

```javascript
// Show the main button
tg.MainButton.setText('Checkout');
tg.MainButton.show();

// Handle click events
tg.MainButton.onClick(() => {
  // Handle the click
});

// Hide the main button
tg.MainButton.hide();
```

### Back Button

```javascript
// Show the back button
tg.BackButton.show();

// Handle click events
tg.BackButton.onClick(() => {
  // Handle the click
});

// Hide the back button
tg.BackButton.hide();
```

### Theme Adaptation

```javascript
// Get theme parameters
const themeParams = tg.themeParams;

// Apply theme colors to CSS variables
document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color);
document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color);
document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color);
document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
```

## Security Considerations

### Validating Telegram Data

When your Mini App sends data to your backend, you should validate the `initData` to ensure the request is genuinely from Telegram:

1. The `initData` is a query string that contains information about the user and the Mini App
2. Your backend should validate this data by checking the hash signature
3. See the [Telegram documentation](https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app) for details on validation

### User Authentication

For user authentication, you can use the Telegram user ID from the `initData`. This provides a secure way to identify users without requiring them to create accounts or log in separately.

## Testing Your Mini App

1. During development, you can test your Mini App by sending a message with your bot that contains a button with the `web_app` parameter
2. You can also use the [Bot API method sendMessage](https://core.telegram.org/bots/api#sendmessage) with the `web_app` parameter in the `reply_markup`

## Deployment Considerations

1. Your Mini App must be served over HTTPS
2. The domain must be allowlisted in your bot's Web App settings
3. For production, deploy your Mini App to a reliable hosting service like Vercel

## Resources

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Telegram Mini Apps Design Guidelines](https://core.telegram.org/bots/webapps#design-guidelines)
