-- Update products to mark some addons as required
-- This script adds a "*" to addon group names to mark them as required

-- First, let's update product with ID 0001 (assuming it's Pad Krapow)
UPDATE products
SET addons = jsonb_build_object(
  'Spicy level*', (addons->'Spicy level'),  -- Mark as required by adding *
  'Basil*', (addons->'Basil'),              -- Mark as required by adding *
  'Weight', (addons->'Weight'),             -- Optional
  'Packaging', (addons->'Packaging'),       -- Optional
  'Beverages', (addons->'Beverages')        -- Optional
)
WHERE product_code = '0001';

-- Update product with ID 0002 (assuming it's another dish)
UPDATE products
SET addons = jsonb_build_object(
  'Spicy level*', (addons->'Spicy level'),  -- Mark as required by adding *
  'Basil', (addons->'Basil'),               -- Optional
  'Weight', (addons->'Weight'),             -- Optional
  'Packaging*', (addons->'Packaging'),      -- Mark as required by adding *
  'Beverages', (addons->'Beverages')        -- Optional
)
WHERE product_code = '0002';

-- Update product with ID 0003
UPDATE products
SET addons = jsonb_build_object(
  'Spicy level', (addons->'Spicy level'),   -- Optional
  'Basil*', (addons->'Basil'),              -- Mark as required by adding *
  'Weight*', (addons->'Weight'),            -- Mark as required by adding *
  'Packaging', (addons->'Packaging')        -- Optional
)
WHERE product_code = '0003';

-- You can run this script with:
-- psql -U your_username -d your_database -f update-required-addons.sql
-- Or through the Supabase SQL editor
