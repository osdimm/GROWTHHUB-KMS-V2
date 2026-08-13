/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string, fallback: string): string => {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key];
    }
  } catch {
    // Ignore error in non-browser context
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

export const supabaseUrl = getEnvVar(
  'VITE_SUPABASE_URL',
  'https://cjfbaqneivklchicodcv.supabase.co'
);

export const supabaseAnonKey = getEnvVar(
  'VITE_SUPABASE_ANON_KEY',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZmJhcW5laXZrbGNoaWNvZGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1OTUyODcsImV4cCI6MjEwMjE3MTI4N30.ybgjHvnzRX_9m7ZL7V5VK5g19lBoFxYK4ulT7TDdKMk'
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
