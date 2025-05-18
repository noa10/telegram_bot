-- Create products table
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  category TEXT,
  product_code TEXT, -- For storing the original "Id" from Menu.txt
  addons JSONB, -- For storing add-ons as a JSON object
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_addons table
CREATE TABLE product_addons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_addon_options table to link products with available addons
CREATE TABLE product_addon_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  addon_id UUID REFERENCES product_addons(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  products JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_intent_id TEXT NOT NULL,
  shipping_address JSONB,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Everyone can read products
CREATE POLICY "Anyone can read products" ON products
  FOR SELECT USING (true);

-- Only authenticated users with admin role can modify products
CREATE POLICY "Only admins can insert products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'admin');

CREATE POLICY "Only admins can update products" ON products
  FOR UPDATE USING (auth.role() = 'admin');

CREATE POLICY "Only admins can delete products" ON products
  FOR DELETE USING (auth.role() = 'admin');

-- Create RLS policies for orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create a function to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT auth.role() = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if the request is from a trusted backend
-- This function will be used by the backend to set a session variable
CREATE OR REPLACE FUNCTION set_telegram_user_id(telegram_id TEXT)
RETURNS VOID AS $$
BEGIN
  -- Set a session variable with the Telegram user ID
  PERFORM set_config('app.telegram_user_id', telegram_id, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get the current Telegram user ID
CREATE OR REPLACE FUNCTION current_telegram_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.telegram_user_id', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users can only see their own orders
CREATE POLICY "Users can read their own orders" ON orders
  FOR SELECT USING (
    current_telegram_user_id() = user_id OR is_admin()
  );

-- Users can only create orders for themselves
CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (
    current_telegram_user_id() = user_id OR is_admin()
  );

-- Only admins can update orders
CREATE POLICY "Only admins can update orders" ON orders
  FOR UPDATE USING (is_admin());

-- Sample product data
INSERT INTO products (name, description, price, image_url, stock_quantity, category) VALUES
('Smartphone X', 'Latest smartphone with advanced features', 699.99, 'https://via.placeholder.com/300?text=Smartphone+X', 50, 'Electronics'),
('Wireless Earbuds', 'High-quality wireless earbuds with noise cancellation', 129.99, 'https://via.placeholder.com/300?text=Wireless+Earbuds', 100, 'Electronics'),
('Smart Watch', 'Fitness tracker and smartwatch with heart rate monitor', 199.99, 'https://via.placeholder.com/300?text=Smart+Watch', 30, 'Electronics'),
('Laptop Pro', 'Powerful laptop for professionals', 1299.99, 'https://via.placeholder.com/300?text=Laptop+Pro', 20, 'Electronics'),
('Coffee Maker', 'Automatic coffee maker with timer', 89.99, 'https://via.placeholder.com/300?text=Coffee+Maker', 40, 'Home'),
('Desk Lamp', 'Adjustable LED desk lamp', 49.99, 'https://via.placeholder.com/300?text=Desk+Lamp', 60, 'Home'),
('Backpack', 'Durable backpack with laptop compartment', 59.99, 'https://via.placeholder.com/300?text=Backpack', 75, 'Accessories'),
('Water Bottle', 'Insulated stainless steel water bottle', 24.99, 'https://via.placeholder.com/300?text=Water+Bottle', 100, 'Accessories'),
('Bluetooth Speaker', 'Portable Bluetooth speaker with 20-hour battery life', 79.99, 'https://via.placeholder.com/300?text=Bluetooth+Speaker', 45, 'Electronics'),
('Yoga Mat', 'Non-slip yoga mat with carrying strap', 29.99, 'https://via.placeholder.com/300?text=Yoga+Mat', 50, 'Fitness');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for product_addons and product_addon_options
CREATE TRIGGER update_product_addons_updated_at
BEFORE UPDATE ON product_addons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_addon_options_updated_at
BEFORE UPDATE ON product_addon_options
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
