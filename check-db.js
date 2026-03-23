import { createClient } from '@supabase/supabase-js';
import process from 'process';

const url = "https://amwkaiuflkticrqebvwt.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtd2thaXVmbGt0aWNycWVidnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxOTc3NjEsImV4cCI6MjA4OTc3Mzc2MX0.AfwCumcGlq98OykqzP4kM8Sd9E-yuIqfe-6z1cCC_9I";

const supabase = createClient(url, key);

async function checkTables() {
  const { data, error } = await supabase.from('trips').select('*').limit(1);
  if (error) {
    console.error("Error fetching trips:", error.message);
  } else {
    console.log("Successfully connected! Trips table exists:", !!data);
  }
}

checkTables();
