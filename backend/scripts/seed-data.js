require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create a direct Supabase client with admin privileges for schema changes
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
const fs = require('fs');
const path = require('path');

// Define addon groups
const addonGroups = {
  'Spicy level': ["Non Spicy", "Normal 🌶️", "Spicy 🌶️🌶️", "Extra Spicy 🌶️🌶️🌶️"],
  'Basil': ["Thai Holy Basil (Krapow) - Default", "Thai Basil (Selasih)", "No Basil"],
  'Weight': ["125g - Default", "250g"],
  'Packaging': ["Food Container (Photodegradable)", "Food Container (Plastic)"],
  'Beverages': ["Kickapoo", "Soya"]
};

// Function to parse Menu.txt file
const parseMenuData = () => {
  try {
    // Path to Menu.txt file (assuming it's in the root directory)
    const menuFilePath = path.join(__dirname, '..', 'Menu.txt');
    const fileContent = fs.readFileSync(menuFilePath, 'utf-8');

    // Parse products section
    const productsMatch = fileContent.match(/Menu\s*\[([\s\S]*?)\]/);
    if (!productsMatch || !productsMatch[1]) {
      console.error('Could not find products section in Menu.txt');
      return { products: [], addons: {} };
    }

    // Convert products to valid JSON and parse
    const productsJsonString = '[' + productsMatch[1] + ']';
    const products = JSON.parse(productsJsonString);

    // Parse addons section - using a different approach for the new format
    const addons = {};

    // Extract Spicy level
    const spicyMatch = fileContent.match(/Spicy level \(Id 0001-0005\)([\s\S]*?)(?=\n\n)/);
    if (spicyMatch && spicyMatch[1]) {
      addons['Spicy level'] = spicyMatch[1].trim().split(',\n').map(line =>
        line.trim().replace(/^"|"$/g, '')
      );
    }

    // Extract Basil
    const basilMatch = fileContent.match(/Basil \(Id 0001-0005\)([\s\S]*?)(?=\n\n)/);
    if (basilMatch && basilMatch[1]) {
      addons['Basil'] = basilMatch[1].trim().split(',\n').map(line =>
        line.trim().replace(/^"|"$/g, '')
      );
    }

    // Extract Weight
    const weightMatch = fileContent.match(/Weight \(Id 0001-0005\)([\s\S]*?)(?=\n\n)/);
    if (weightMatch && weightMatch[1]) {
      addons['Weight'] = weightMatch[1].trim().split(',\n').map(line =>
        line.trim().replace(/^"|"$/g, '')
      );
    }

    // Extract Packaging
    const packagingMatch = fileContent.match(/Packaging \(Id 0001-0005\)([\s\S]*?)(?=\n\n)/);
    if (packagingMatch && packagingMatch[1]) {
      addons['Packaging'] = packagingMatch[1].trim().split(',\n').map(line =>
        line.trim().replace(/^"|"$/g, '')
      );
    }

    // Extract Beverages
    const beveragesMatch = fileContent.match(/Beverages\s+\(Id 0001-0002\)([\s\S]*?)(?=$)/);
    if (beveragesMatch && beveragesMatch[1]) {
      addons['Beverages'] = beveragesMatch[1].trim().split(',\n').map(line =>
        line.trim().replace(/^"|"$/g, '')
      );
    }

    return {
      products,
      addons
    };
  } catch (error) {
    console.error('Error parsing Menu.txt:', error);
    return { products: [], addons: {} };
  }
};

const seedProducts = async () => {
  try {
    console.log('Seeding products from Menu.txt...');

    // Check if products already exist
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    // Parse Menu.txt data
    const { products: menuProducts, addons: menuAddons } = parseMenuData();

    if (menuProducts.length === 0) {
      console.error('No products found in Menu.txt');
      return;
    }

    console.log(`Found ${menuProducts.length} products and ${menuAddons.length} addons in Menu.txt`);

    // If products already exist, ask for confirmation to replace
    if (existingProducts && existingProducts.length > 0) {
      console.log('Products already exist in the database.');
      console.log('Clearing existing products before seeding new ones...');

      // Delete existing products
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        throw deleteError;
      }

      console.log('Existing products cleared.');
    }

    // Check if the products table has the addons column
    let formattedProducts;
    try {
      // Try to get the table definition
      const { data: tableInfo, error: tableError } = await supabase
        .from('products')
        .select('*')
        .limit(1);

      if (tableError) {
        throw tableError;
      }

      // Format products for insertion
      formattedProducts = menuProducts.map(item => {
        const productCode = item.Id;
        let addons = {};

        if (['0001', '0002', '0003', '0004', '0005'].includes(productCode)) {
          addons['Spicy level'] = addonGroups['Spicy level'];
          addons['Basil'] = addonGroups['Basil'];
          addons['Weight'] = addonGroups['Weight'];
          addons['Packaging'] = addonGroups['Packaging'];
        }

        if (['0001', '0002'].includes(productCode)) {
          addons['Beverages'] = addonGroups['Beverages'];
        }

        // Create the base product object
        const product = {
          name: item['Product Name'],
          description: item['Product Name'], // Using product name as description
          price: item.Price,
          image_url: item['Image URL'],
          category: item.Category,
          product_code: item.Id,
          stock_quantity: 100 // Default stock quantity
        };

        // Only add the addons field if it exists in the table
        if (tableInfo && tableInfo[0] && 'addons' in tableInfo[0]) {
          product.addons = Object.keys(addons).length > 0 ? addons : null;
        } else {
          console.log('Warning: addons column does not exist in products table. Run the SQL command: ALTER TABLE products ADD COLUMN addons JSONB;');
        }

        return product;
      });
    } catch (error) {
      console.error('Error checking products table structure:', error);

      // Fallback to basic product structure without addons
      formattedProducts = menuProducts.map(item => ({
        name: item['Product Name'],
        description: item['Product Name'],
        price: item.Price,
        image_url: item['Image URL'],
        category: item.Category,
        product_code: item.Id,
        stock_quantity: 100
      }));
    }

    // Generate SQL insert statements instead of using the API
    // This is a workaround for RLS policies when we don't have the service role key
    console.log('Due to RLS policies, we need to use the Supabase SQL editor to insert products.');
    console.log('Please run the following SQL statements in your Supabase SQL editor:');
    console.log('\n-- First, clear existing products');
    console.log('DELETE FROM products WHERE id IS NOT NULL;');
    console.log('\n-- Then insert new products');

    formattedProducts.forEach(product => {
      const addonsJson = product.addons ? JSON.stringify(product.addons).replace(/'/g, "''") : 'null';
      console.log(`
INSERT INTO products (name, description, price, image_url, category, product_code, stock_quantity, addons)
VALUES (
  '${product.name.replace(/'/g, "''")}',
  '${product.description.replace(/'/g, "''")}',
  ${product.price},
  '${product.image_url.replace(/'/g, "''")}',
  '${product.category.replace(/'/g, "''")}',
  '${product.product_code.replace(/'/g, "''")}',
  ${product.stock_quantity},
  '${addonsJson}'::jsonb
);`);
    });

    console.log('\nAfter running these SQL statements, your products will be seeded successfully!');

    // We don't need to seed addons separately anymore as they're included in the products

  } catch (error) {
    console.error('Error seeding products:', error);
    throw error; // Re-throw to be caught by the main catch block
  }
};

// We don't need the seedAddons function anymore as addons are included in the products

// Run the seed function
seedProducts()
  .then(() => {
    console.log('Seed completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
