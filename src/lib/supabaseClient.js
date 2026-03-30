import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bviswhyukhfcszvlbsko.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2aXN3aHl1a2hmY3N6dmxic2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDkyNTcsImV4cCI6MjA5MDQyNTI1N30.OgVDqSxELgeEC8jBZFWoT6BiHk5aDxo0xxqvhBOynoY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)