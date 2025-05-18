# Supabase Integration Guide

This document provides guidance on setting up and integrating Supabase with your E-commerce Telegram Mini App.

## What is Supabase?

Supabase is an open-source Firebase alternative that provides a PostgreSQL database, authentication, instant APIs, real-time subscriptions, and storage.

## Setting Up Supabase

### 1. Create a Supabase Account and Project

1. Go to [Supabase](https://supabase.com/) and sign up for an account
2. Create a new project and give it a name (e.g., "telegram-ecommerce")
3. Choose a strong database password and save it securely
4. Select a region close to your target audience
5. Wait for your database to be provisioned

### 2. Get Your API Keys

1. In your Supabase project dashboard, go to "Settings" > "API"
2. Copy the "URL" and "anon/public" key
3. Add these to your `.env` file as `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### 3. Set Up Database Schema

You can set up your database schema in two ways:

#### Option 1: Using the SQL Editor

1. In your Supabase project dashboard, go to "SQL Editor"
2. Create a new query
3. Copy and paste the contents of `backend/supabase-schema.sql`
4. Run the query to create tables and sample data

#### Option 2: Using the Table Editor

1. In your Supabase project dashboard, go to "Table Editor"
2. Create the following tables:

**Products Table:**
- `id` (uuid, primary key, default: uuid_generate_v4())
- `name` (text, not null)
- `description` (text)
- `price` (numeric, not null)
- `image_url` (text)
- `stock_quantity` (integer, default: 0)
- `category` (text)
- `created_at` (timestamp with time zone, default: now())
- `updated_at` (timestamp with time zone, default: now())

**Orders Table:**
- `id` (uuid, primary key, default: uuid_generate_v4())
- `user_id` (text, not null)
- `products` (jsonb, not null)
- `total_amount` (numeric, not null)
- `payment_intent_id` (text, not null)
- `shipping_address` (jsonb)
- `status` (text, not null)
- `created_at` (timestamp with time zone, default: now())
- `updated_at` (timestamp with time zone, default: now())

### 4. Set Up Row Level Security (RLS)

Row Level Security (RLS) is a feature that allows you to control access to rows in a database table based on the user making the request.

1. In your Supabase project dashboard, go to "Authentication" > "Policies"
2. For each table, enable RLS and create policies as defined in `backend/supabase-schema.sql`

## Integrating Supabase with Your App

### Backend Integration

The backend uses the Supabase JavaScript client to interact with the database:

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Example: Fetch products
const getProducts = async () => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) throw error;
  return data;
};
```

### Frontend Integration (Optional)

If you want to access Supabase directly from the frontend (not recommended for most operations), you can set up a similar client:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Example: Fetch products
const getProducts = async () => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) throw error;
  return data;
};
```

## Authentication with Telegram

Since we're using Telegram for authentication, we don't need to set up Supabase Auth. Instead, we use the Telegram user ID as the user identifier.

When creating orders, we store the Telegram user ID in the `user_id` field of the orders table. This allows us to fetch orders for a specific user.

## Seeding the Database

We've provided a script to seed the database with sample products:

```bash
npm run seed
```

This script checks if products already exist in the database and only seeds if the products table is empty.

## Advanced Features

### Real-time Updates

Supabase provides real-time functionality through PostgreSQL's LISTEN/NOTIFY feature. You can subscribe to changes in the database:

```javascript
// Subscribe to changes in the products table
const productsSubscription = supabase
  .from('products')
  .on('*', (payload) => {
    console.log('Change received!', payload);
    // Update your UI based on the change
  })
  .subscribe();
```

### Storage

Supabase provides a storage solution for files. You can use it to store product images:

```javascript
// Upload a file
const { data, error } = await supabase.storage
  .from('product-images')
  .upload('public/product-1.jpg', file);
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
