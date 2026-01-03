import { GoogleGenAI, Content } from '@google/genai';
import { executeForensicTool } from '../services/reasoning-service.js';

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

export const VERIDICUS_CORE_PROMPT = `
You are Veridicus, a forensic reasoning agent. Your mission is to analyze evidence corpora and identify deep logical inconsistencies, factual contradictions, and timeline anomalies.

OPERATING GUIDELINES:
1. DEDUCTIVE PRECISION: Always cite specific evidence IDs, page numbers, or timestamps.
2. CONTRADICTION FLAGGING: Explicitly look for statements in one exhibit that conflict with another.
3. THOUGHT TRACE: Expose your internal reasoning to weigh conflicting evidence.
4. STRUCTURED FINDINGS: When analyzing a case, look for specific contradictions and return them clearly.
`;

export const FORENSIC_TOOLS = [
  {
    name: "search_evidence",
    description: "Search for specific keywords or phrases across the case evidence corpus.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The keyword or phrase to search for." },
        fileType: { type: "string", description: "Optional filter by file type (e.g., 'pdf', 'audio')." }
      },
      required: ["query"]
    }
  },
  {
    name: "get_evidence_metadata",
    description: "Retrieve technical metadata and automated findings for a specific exhibit.",
    parameters: {
      type: "object",
      properties: {
        evidenceId: { type: "string", description: "The UUID of the evidence exhibit." }
      },
      required: ["evidenceId"]
    }
  }
];

export interface GeminiConfig {
  model?: keyof typeof MODELS;
  thinkingLevel?: typeof THINKING_LEVELS[keyof typeof THINKING_LEVELS];
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
  caseId?: string;
  userId?: string;
}

export interface Contradiction {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence_a_id?: string;
  evidence_b_id?: string;
  timestamps?: Record<string, unknown>;
}

export interface Citation {
  page?: number;
  timestamp?: string;
  source: string;
}

export interface GeminiResponse {
  text: string;
  thoughts: string[];
  usage: { inputTokens: number; outputTokens: number };
  contradictions: Contradiction[];
  citations?: Citation[];
}

/**
 * Generate content with Gemini 3 Pro (Deep Reasoning)
 */
export async function generateWithThinking(
  prompt: string,
  contents: Content[] = [],
  config: GeminiConfig = {}
): Promise<GeminiResponse> {
  const model = await (genAI.models as any).get(MODELS[config.model || 'PRO']);
  
  const response = await model.generateContent({
    contents: [
      ...contents,
      { role: 'user', parts: [{ text: prompt }] },
    ],
    config: {
      thinkingConfig: {
        includeThoughts: true
      },
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
        // Extract thought text properly
        const thoughtText = (part as any).thought?.text || (part as any).text || '';
        if (thoughtText) thoughts.push(thoughtText);
      } else if ('text' in part) {
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
    contradictions: [], // Thinking mode doesn't specifically target contradictions yet in this handler
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

  if (!cache.name || !cache.expireTime) {
    throw new Error('Failed to create cache: missing name or expireTime');
  }

  return {
    cacheId: cache.name,
    tokenCount: cache.usageMetadata?.totalTokenCount || 0,
    expiresAt: new Date(cache.expireTime),
  };
}

/**
 * Generate content using a cached context
 */
export async function generateWithCache(
  cacheId: string,
  prompt: string,
  config: GeminiConfig = {}
): Promise<GeminiResponse> {
  const cache = await (genAI.caches as any).get(cacheId);
  const model = await (genAI.models as any).get(MODELS.PRO);
  
  let response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      cachedContent: cache.name,
      tools: [{ functionDeclarations: FORENSIC_TOOLS }],
      toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
      thinkingConfig: {
        includeThoughts: true
      },
      temperature: config.temperature ?? 0.3,
    },
  });

  const chatContents: Content[] = [{ role: 'user', parts: [{ text: prompt }] }];
  let turnResponse = response;
  
  // Multi-turn tool execution loop (up to 5 turns)
  for (let turn = 0; turn < 5; turn++) {
    const candidate = turnResponse.candidates?.[0];
    const functionCalls = candidate?.content?.parts?.filter((p: any) => 'functionCall' in p);

    if (!functionCalls || functionCalls.length === 0) break;

    chatContents.push(candidate!.content!);

    const toolResults = await Promise.all(functionCalls.map(async (fc: any) => {
      const result = await executeForensicTool(
        fc.functionCall.name,
        fc.functionCall.args,
        config.caseId || '',
        config.userId || ''
      );
      return {
        role: 'function',
        parts: [{
          functionResponse: {
            name: fc.functionCall.name,
            response: result
          }
        }]
      };
    }));

    chatContents.push(...(toolResults as any));

    turnResponse = await model.generateContent({
      contents: chatContents,
      config: {
        cachedContent: cache.name,
        tools: [{ functionDeclarations: FORENSIC_TOOLS }],
        thinkingConfig: { includeThoughts: true }
      },
    });
  }

  // Final parsing from the last turn
  const thoughts: string[] = [];
  let text = '';
  const citations: Array<{ page?: number; timestamp?: string; source: string }> = [];

  for (const candidate of turnResponse.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if ('thought' in part && part.thought) {
        thoughts.push(part.text || '');
      } else if ('text' in part) {
        text += part.text || '';
      }
    }
  }

  // Attempt to parse structured JSON from the text
  let contradictions: Contradiction[] = [];
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.contradictions && Array.isArray(parsed.contradictions)) {
        contradictions = parsed.contradictions.map((c: Record<string, unknown>) => ({
          description: String(c.description || ''),
          severity: (['low', 'medium', 'high', 'critical'].includes(String(c.severity)) 
            ? c.severity as Contradiction['severity'] 
            : 'medium'),
          evidence_a_id: c.evidence_a_id as string | undefined,
          evidence_b_id: c.evidence_b_id as string | undefined,
          timestamps: (c.timestamps as Record<string, unknown>) || {}
        }));
      }
      if (parsed.summary && !text.includes(parsed.summary)) {
        text = parsed.summary + "\n\n" + text;
      }
    }
  } catch {
    // JSON parsing failed, continue with empty contradictions
  }

  return { 
    text, 
    thoughts, 
    citations, 
    contradictions,
    usage: {
      inputTokens: turnResponse.usageMetadata?.promptTokenCount || 0,
      outputTokens: turnResponse.usageMetadata?.candidatesTokenCount || 0,
    }
  };
}

export { genAI };
