require('dotenv').config();
const supabase = require('./supabaseClient');

const seedProducts = async () => {
  try {
    console.log('Seeding products...');
    
    // Check if products already exist
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (checkError) {
      throw checkError;
    }
    
    // If products already exist, don't seed
    if (existingProducts && existingProducts.length > 0) {
      console.log('Products already exist. Skipping seed.');
      return;
    }
    
    // Sample product data
    const products = [
      {
        name: 'Smartphone X',
        description: 'Latest smartphone with advanced features',
        price: 699.99,
        image_url: 'https://via.placeholder.com/300?text=Smartphone+X',
        stock_quantity: 50,
        category: 'Electronics'
      },
      {
        name: 'Wireless Earbuds',
        description: 'High-quality wireless earbuds with noise cancellation',
        price: 129.99,
        image_url: 'https://via.placeholder.com/300?text=Wireless+Earbuds',
        stock_quantity: 100,
        category: 'Electronics'
      },
      {
        name: 'Smart Watch',
        description: 'Fitness tracker and smartwatch with heart rate monitor',
        price: 199.99,
        image_url: 'https://via.placeholder.com/300?text=Smart+Watch',
        stock_quantity: 30,
        category: 'Electronics'
      },
      {
        name: 'Laptop Pro',
        description: 'Powerful laptop for professionals',
        price: 1299.99,
        image_url: 'https://via.placeholder.com/300?text=Laptop+Pro',
        stock_quantity: 20,
        category: 'Electronics'
      },
      {
        name: 'Coffee Maker',
        description: 'Automatic coffee maker with timer',
        price: 89.99,
        image_url: 'https://via.placeholder.com/300?text=Coffee+Maker',
        stock_quantity: 40,
        category: 'Home'
      },
      {
        name: 'Desk Lamp',
        description: 'Adjustable LED desk lamp',
        price: 49.99,
        image_url: 'https://via.placeholder.com/300?text=Desk+Lamp',
        stock_quantity: 60,
        category: 'Home'
      },
      {
        name: 'Backpack',
        description: 'Durable backpack with laptop compartment',
        price: 59.99,
        image_url: 'https://via.placeholder.com/300?text=Backpack',
        stock_quantity: 75,
        category: 'Accessories'
      },
      {
        name: 'Water Bottle',
        description: 'Insulated stainless steel water bottle',
        price: 24.99,
        image_url: 'https://via.placeholder.com/300?text=Water+Bottle',
        stock_quantity: 100,
        category: 'Accessories'
      },
      {
        name: 'Bluetooth Speaker',
        description: 'Portable Bluetooth speaker with 20-hour battery life',
        price: 79.99,
        image_url: 'https://via.placeholder.com/300?text=Bluetooth+Speaker',
        stock_quantity: 45,
        category: 'Electronics'
      },
      {
        name: 'Yoga Mat',
        description: 'Non-slip yoga mat with carrying strap',
        price: 29.99,
        image_url: 'https://via.placeholder.com/300?text=Yoga+Mat',
        stock_quantity: 50,
        category: 'Fitness'
      }
    ];
    
    // Insert products
    const { error: insertError } = await supabase
      .from('products')
      .insert(products);
    
    if (insertError) {
      throw insertError;
    }
    
    console.log('Products seeded successfully!');
  } catch (error) {
    console.error('Error seeding products:', error);
  }
};

// Run the seed function
seedProducts()
  .then(() => {
    console.log('Seed completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
