import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  GOOGLE_AI_API_KEY: z.string().min(1),
  PORT: z.string().default('3001'),
});

const config = envSchema.safeParse(process.env);

if (!config.success) {
  console.error('❌ Invalid environment variables:', config.error.format());
  process.exit(1);
}

export const ENV = config.data;
