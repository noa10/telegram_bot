// Script to update products to mark some addons as required
require('dotenv').config();
const supabase = require('./supabaseClient');

async function updateRequiredAddons() {
  console.log('Updating products to mark some addons as required...');

  try {
    // First, get the products we want to update
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, product_code, addons')
      .in('product_code', ['0001', '0002', '0003', '0004', '0005']);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${products.length} products to update`);

    // Process each product
    for (const product of products) {
      if (!product.addons) {
        console.log(`Product ${product.product_code} has no addons, skipping`);
        continue;
      }

      const updatedAddons = {};
      
      // Apply the required marker (*) based on product code
      switch (product.product_code) {
        case '0001': // First product
          if (product.addons['Spicy level']) updatedAddons['Spicy level*'] = product.addons['Spicy level'];
          if (product.addons['Basil']) updatedAddons['Basil*'] = product.addons['Basil'];
          if (product.addons['Weight']) updatedAddons['Weight'] = product.addons['Weight'];
          if (product.addons['Packaging']) updatedAddons['Packaging'] = product.addons['Packaging'];
          if (product.addons['Beverages']) updatedAddons['Beverages'] = product.addons['Beverages'];
          break;
          
        case '0002': // Second product
          if (product.addons['Spicy level']) updatedAddons['Spicy level*'] = product.addons['Spicy level'];
          if (product.addons['Basil']) updatedAddons['Basil'] = product.addons['Basil'];
          if (product.addons['Weight']) updatedAddons['Weight'] = product.addons['Weight'];
          if (product.addons['Packaging']) updatedAddons['Packaging*'] = product.addons['Packaging'];
          if (product.addons['Beverages']) updatedAddons['Beverages'] = product.addons['Beverages'];
          break;
          
        case '0003': // Third product
          if (product.addons['Spicy level']) updatedAddons['Spicy level'] = product.addons['Spicy level'];
          if (product.addons['Basil']) updatedAddons['Basil*'] = product.addons['Basil'];
          if (product.addons['Weight']) updatedAddons['Weight*'] = product.addons['Weight'];
          if (product.addons['Packaging']) updatedAddons['Packaging'] = product.addons['Packaging'];
          break;
          
        case '0004': // Fourth product
          if (product.addons['Spicy level']) updatedAddons['Spicy level'] = product.addons['Spicy level'];
          if (product.addons['Basil']) updatedAddons['Basil'] = product.addons['Basil'];
          if (product.addons['Weight']) updatedAddons['Weight*'] = product.addons['Weight'];
          if (product.addons['Packaging']) updatedAddons['Packaging*'] = product.addons['Packaging'];
          break;
          
        case '0005': // Fifth product
          if (product.addons['Spicy level']) updatedAddons['Spicy level*'] = product.addons['Spicy level'];
          if (product.addons['Basil']) updatedAddons['Basil'] = product.addons['Basil'];
          if (product.addons['Weight']) updatedAddons['Weight'] = product.addons['Weight'];
          if (product.addons['Packaging']) updatedAddons['Packaging'] = product.addons['Packaging'];
          break;
          
        default:
          console.log(`No specific rules for product ${product.product_code}, skipping`);
          continue;
      }

      // Update the product with the new addons
      const { error: updateError } = await supabase
        .from('products')
        .update({ addons: updatedAddons })
        .eq('id', product.id);

      if (updateError) {
        console.error(`Error updating product ${product.product_code}:`, updateError);
      } else {
        console.log(`Successfully updated product ${product.product_code}`);
      }
    }

    console.log('Update completed');
  } catch (error) {
    console.error('Error updating required addons:', error);
  }
}

// Run the function
updateRequiredAddons()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  });
