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

const addAddonsColumn = async () => {
  try {
    console.log('Adding addons column to products table...');

    // Check if the column already exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (tableError) {
      throw tableError;
    }

    // If the column already exists, we're done
    if (tableInfo && tableInfo[0] && 'addons' in tableInfo[0]) {
      console.log('Addons column already exists in products table.');
      return;
    }

    // Otherwise, we need to run the SQL command directly
    console.log('Addons column does not exist. Please run the following SQL command in your Supabase SQL editor:');
    console.log('ALTER TABLE products ADD COLUMN addons JSONB;');
    console.log('Then run the seed-data.js script to populate the products table.');

  } catch (error) {
    console.error('Error checking products table:', error);
    process.exit(1);
  }
};

addAddonsColumn()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
