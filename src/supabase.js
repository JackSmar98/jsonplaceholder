// src/supabase.js
import { createClient } from '@supabase/supabase-js';

// Tu URL del Proyecto Supabase.
const supabaseUrl = 'https://fbbzxqiuivyxkovnmlvh.supabase.co';

// Tu clave anónima pública de Supabase.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYnp4cWl1aXZ5eGtvdm5tbHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTQzMTQsImV4cCI6MjA2Mzk3MDMxNH0.haze3N1uhGVG4nTh6bICM9OM4XwPZYy6XVEXaMDDkLw';

// Validación para asegurar que las variables no estén vacías al inicializar
if (!supabaseUrl) {
  throw new Error("La URL de Supabase (supabaseUrl) es requerida pero no fue proporcionada. Revisa src/supabase.js");
}

if (!supabaseAnonKey) {
  throw new Error("La clave anónima de Supabase (supabaseAnonKey) es requerida pero no fue proporcionada. Revisa src/supabase.js");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);