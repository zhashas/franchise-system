import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nhqkjqjljcrzvdzrmjqp.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocWtqcWpsamNyenZkenJtanFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA4MTA1MCwiZXhwIjoyMDkzNjU3MDUwfQ.HYczOzloA8Y08s3GAoXd6Hb8V_tVevLJ4DRZLOLn7J4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
