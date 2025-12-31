import { GoogleGenAI, Content } from '@google/genai';

// Initialize Gemini client
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

// Model configurations
export const MODELS = {
  PRO: 'gemini-3-pro',           // Deep reasoning
  FLASH: 'gemini-3-flash',       // Fast analysis
  LIVE: 'gemini-live-3-flash',   // Real-time audio
} as const;

// Thinking levels for Gemini 3
export const THINKING_LEVELS = {
  MINIMAL: 'minimal',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export interface GeminiConfig {
  model?: keyof typeof MODELS;
  thinkingLevel?: typeof THINKING_LEVELS[keyof typeof THINKING_LEVELS];
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
}

/**
 * Generate content with Gemini 3 Pro (Deep Reasoning)
 */
export async function generateWithThinking(
  prompt: string,
  contents: Content[] = [],
  config: GeminiConfig = {}
): Promise<{
  text: string;
  thoughts: string[];
  usage: { inputTokens: number; outputTokens: number };
}> {
  const model = genAI.models.get(MODELS[config.model || 'PRO']);
  
  const response = await model.generateContent({
    contents: [
      ...contents,
      { role: 'user', parts: [{ text: prompt }] },
    ],
    config: {
      thinkingLevel: config.thinkingLevel || THINKING_LEVELS.HIGH,
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxOutputTokens ?? 65536,
      systemInstruction: config.systemInstruction,
    },
  });

  // Extract thoughts and text from response
  const thoughts: string[] = [];
  let text = '';

  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if ('thought' in part && part.thought) {
        thoughts.push(part.text || '');
      } else {
        text += part.text || '';
      }
    }
  }

  return {
    text,
    thoughts,
    usage: {
      inputTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
    },
  };
}

/**
 * Create a context cache for large evidence corpus
 */
export async function createContextCache(
  contents: Content[],
  systemInstruction: string,
  ttlHours: number = 24
): Promise<{ cacheId: string; tokenCount: number; expiresAt: Date }> {
  const cache = await genAI.caches.create({
    model: MODELS.PRO,
    config: {
      contents,
      systemInstruction,
      ttl: `${ttlHours * 3600}s`,
    },
  });

  return {
    cacheId: cache.name!,
    tokenCount: cache.usageMetadata?.totalTokenCount || 0,
    expiresAt: new Date(cache.expireTime!),
  };
}

/**
 * Generate content using a cached context
 */
export async function generateWithCache(
  cacheId: string,
  prompt: string,
  config: GeminiConfig = {}
): Promise<{
  text: string;
  thoughts: string[];
  citations: Array<{ page?: number; timestamp?: string; source: string }>;
}> {
  const cache = await genAI.caches.get(cacheId);
  const model = genAI.models.get(MODELS.PRO);

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      cachedContent: cache.name,
      thinkingLevel: config.thinkingLevel || THINKING_LEVELS.HIGH,
      temperature: config.temperature ?? 0.3, // Lower for forensic accuracy
    },
  });

  // Parse response for thoughts and citations
  const thoughts: string[] = [];
  let text = '';
  const citations: Array<{ page?: number; timestamp?: string; source: string }> = [];

  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if ('thought' in part && part.thought) {
        thoughts.push(part.text || '');
      } else {
        text += part.text || '';
      }
    }
  }

  // TODO: Parse structured citations from response

  return { text, thoughts, citations };
}

export { genAI };
