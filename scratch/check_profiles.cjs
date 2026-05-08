
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns in profiles:', Object.keys(data[0]));
  } else {
    console.log('No data in profiles, checking table info...');
    const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'profiles' });
    if (colError) console.error('RPC Error:', colError);
    else console.log('Columns:', cols);
  }
}

checkProfiles();
