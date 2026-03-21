import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL as string, process.env.VITE_SUPABASE_ANON_KEY as string);

async function test() {
  const { data, error } = await supabase.from('properties').select('*').limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
