
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testSchema() {
  console.log("Testing properties table schema...");
  try {
    const { data, error } = await supabase.from('properties').select('*').limit(1);
    if (error) {
      console.error("Error fetching properties:", error);
      return;
    }
    if (data && data.length > 0) {
      console.log("Keys in properties table row:", Object.keys(data[0]));
    } else {
      console.log("No data in properties table to inspect keys.");
      // Try to insert a minimal object to see if it fails due to column mismatch
      const { error: insertError } = await supabase.from('properties').insert([{title: 'TEST_PROBE'}]).select();
      if (insertError) {
        console.error("Insert error:", insertError.message);
      } else {
        console.log("Insert successful (minimal data)");
      }
    }
  } catch (err) {
    console.error("Critical error:", err);
  }
}

testSchema();
