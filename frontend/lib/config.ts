/**
 * Environment configuration for API endpoints
 * Use these constants instead of hardcoded URLs
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

/**
 * Development bypass for testing without Supabase auth
 * Set NEXT_PUBLIC_DEV_BYPASS_AUTH=true to skip auth checks
 */
export const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';
