import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.VITE_SUPABASE_ANON_KEY as string
);

async function testUpload() {
  console.log("Supabase URL:", process.env.VITE_SUPABASE_URL);
  
  // Create a dummy text file
  const fileContent = "This is a test upload for testing Supabase storage bucket policy.";
  const fileName = `test_${Math.random().toString(36).substring(7)}.txt`;
  
  // Create buffer from content
  const buffer = Buffer.from(fileContent);
  
  console.log(`Uploading dummy file: ${fileName} to bucket 'properties'...`);
  
  const { data, error } = await supabase.storage
    .from('properties')
    .upload(`test_folder/${fileName}`, buffer, {
      contentType: 'text/plain',
      upsert: true
    });
    
  if (error) {
    console.error("Upload failed!");
    console.error("Error details:", error);
  } else {
    console.log("Upload succeeded!");
    console.log("Upload Data:", data);
    
    console.log("Retrieving public URL...");
    const { data: urlData } = supabase.storage
      .from('properties')
      .getPublicUrl(`test_folder/${fileName}`);
      
    console.log("Public URL:", urlData.publicUrl);
  }
}

testUpload();
