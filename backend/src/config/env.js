import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading from backend/.env or cwd .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(10),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  GROQ_API_KEY: z.string().default('placeholder'),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
  JWT_AUDIENCE: z.string().default('authenticated'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.warn('⚠️ Warning: Environment variables validation warning:');
  console.warn(JSON.stringify(_env.error.format(), null, 2));
}

export const env = _env.success
  ? _env.data
  : {
      PORT: parseInt(process.env.PORT || '5000', 10),
      NODE_ENV: process.env.NODE_ENV || 'development',
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
      SUPABASE_URL: process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'placeholder',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
      GROQ_API_KEY: process.env.GROQ_API_KEY || 'placeholder',
      GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'authenticated',
    };

