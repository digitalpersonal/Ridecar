
import { createClient } from '@supabase/supabase-js';

// Chaves de fallback para o ambiente de Preview (AI Studio)
// Em produção (Vercel), as variáveis de ambiente terão prioridade.
const FALLBACK_URL = "https://pokcefdqswvcofgqwbbj.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBva2NlZmRxc3d2Y29mZ3F3YmJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTEyMTQsImV4cCI6MjA4MDc4NzIxNH0.qwBlX0nZ7uXdH4CYgsPbBIe5E08K6b7loa9nhSG0B2s";

// Tenta pegar do ambiente (Vite/Vercel), se falhar usa o fallback
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO CRÍTICO: Chaves do Supabase não encontradas.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
