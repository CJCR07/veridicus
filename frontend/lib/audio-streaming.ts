"use client";

import { WS_URL } from "./config";

export interface VibeInsight {
  type: 'affect' | 'error' | 'pong' | 'auth_required';
  text: string;
  confidence: number;
  indicator?: 'stress' | 'deception' | 'anxiety' | 'cognitive_load' | 'baseline';
  timestamp?: number;
}

// Rate limiting configuration
const MIN_SEND_INTERVAL_MS = 100; // Minimum 100ms between sends (max 10/sec)
const CHUNK_BUFFER_SIZE = 5; // Buffer 5 chunks before sending
const WS_PING_INTERVAL_MS = 30000; // 30 seconds

export class AudioStreamingService {
  private socket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private lastSendTime = 0;
  private audioChunkBuffer: Int16Array[] = [];
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private onInsight: (data: VibeInsight) => void) {}

  async start(caseId: string, token: string) {
    if (!token) {
      this.onInsight({ type: 'error', text: 'Authentication required', confidence: 0 });
      return;
    }

    // 1. Initialize WebSocket - send auth via first message instead of URL
    // This prevents token from appearing in server logs
    const wsUrl = `${WS_URL}/ws/vibe`;
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log('🔌 Vibe WebSocket connected');
      
      // Send authentication message immediately after connection
      this.socket?.send(JSON.stringify({ 
        type: 'auth', 
        token,
        caseId 
      }));
      
      // Start ping interval to keep connection alive
      this.pingInterval = setInterval(() => {
        if (this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, WS_PING_INTERVAL_MS);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as VibeInsight;
        this.onInsight(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onInsight({ type: 'error', text: 'Connection error', confidence: 0 });
    };

    this.socket.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason);
      if (event.code === 4001) {
        this.onInsight({ type: 'error', text: 'Authentication failed', confidence: 0 });
      } else if (event.code === 4003) {
        this.onInsight({ type: 'error', text: 'Case access denied', confidence: 0 });
      }
    };

    // 2. Initialize Audio Context
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioContextClass({
      sampleRate: 16000,
    });

    // 3. Define and Load AudioWorklet via Blob
    const workletCode = `
      class AudioProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0][0];
          if (input) {
            this.port.postMessage(input);
          }
          return true;
        }
      }
      registerProcessor('audio-processor', AudioProcessor);
    `;
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    await this.audioContext.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);

    // 4. Capture Stream
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = this.audioContext.createMediaStreamSource(this.stream);
    
    // 5. Connect Worklet
    const workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
    source.connect(workletNode);
    // Don't connect to destination (prevents echo)

    workletNode.port.onmessage = (e) => {
      this.processAudioChunk(e.data);
    };
  }

  private processAudioChunk(inputData: Float32Array) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    // Convert float32 to int16
    const pcmData = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
    }

    // Buffer chunks to reduce message frequency
    this.audioChunkBuffer.push(pcmData);
    
    if (this.audioChunkBuffer.length < CHUNK_BUFFER_SIZE) {
      return;
    }

    // Rate limiting
    const now = Date.now();
    if (now - this.lastSendTime < MIN_SEND_INTERVAL_MS) {
      return;
    }
    this.lastSendTime = now;

    // Combine buffered chunks
    const totalLength = this.audioChunkBuffer.reduce((acc, chunk) => acc + chunk.length, 0);
    const combinedData = new Int16Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioChunkBuffer) {
      combinedData.set(chunk, offset);
      offset += chunk.length;
    }
    this.audioChunkBuffer = [];

    // Convert to base64 and send
    const bytes = new Uint8Array(combinedData.buffer);
    let binary = '';
    const chunkSize = 8192; // Process in chunks to avoid stack overflow
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }
    const base64Audio = btoa(binary);
    
    this.socket.send(JSON.stringify({ type: 'audio', audio: base64Audio }));
  }

  stop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.stream?.getTracks().forEach(track => track.stop());
    this.audioContext?.close();
    this.socket?.close();
    this.stream = null;
    this.audioContext = null;
    this.socket = null;
    this.audioChunkBuffer = [];
    this.lastSendTime = 0;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
