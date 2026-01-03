/**
 * Application constants
 * Centralized configuration values to avoid magic numbers
 */

// Re-export validation utilities from shared
export { isValidUUID, UUID_REGEX, isValidSeverity, SEVERITY_LEVELS } from '../../shared/utils/validation.js';

// File size limits
export const MAX_FILE_SIZE_MB = 500;
export const MAX_AUDIO_PAYLOAD_MB = 10;
export const MB = 1024 * 1024;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * MB;
export const MAX_AUDIO_PAYLOAD_BYTES = MAX_AUDIO_PAYLOAD_MB * MB;

// API configuration
export const DEFAULT_PORT = 3001;
export const API_VERSION = '1.0.0';

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 1000;
export const MAX_MESSAGES_PER_WINDOW = 10;
export const AUDIO_BATCH_INTERVAL_MS = 2000;
export const MAX_AUDIO_BUFFER_SIZE = 100;

// WebSocket ping interval
export const WS_PING_INTERVAL_MS = 30000;

