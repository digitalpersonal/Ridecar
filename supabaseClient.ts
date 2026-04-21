
import { createClient } from '@supabase/supabase-js';

// IMPORTANTE: Para manter os dados originais (Produção), você deve configurar 
// as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
// Caso contrário, o App usará o banco de dados de demonstração (Fallback).
const FALLBACK_URL = "https://pokcefdqswvcofgqwbbj.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBva2NlZmRxc3d2Y29mZ3F3YmJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTEyMTQsImV4cCI6MjA4MDc4NzIxNH0.qwBlX0nZ7uXdH4CYgsPbBIe5E08K6b7loa9nhSG0B2s";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

if (supabaseUrl === FALLBACK_URL) {
  console.log("DATABASE: Utilizando banco de dados de DEMONSTRAÇÃO (Fallback).");
} else {
  console.log("DATABASE: Conectado ao banco de dados de PRODUÇÃO personalizado.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
