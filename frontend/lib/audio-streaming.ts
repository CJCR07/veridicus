"use client";

import { WS_URL } from "./config";

export class AudioStreamingService {
  private socket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;

  constructor(private onInsight: (data: any) => void) {}

  async start(corpusId: string, token?: string) {
    // 1. Initialize WebSocket with auth token
    const authParam = token ? `&token=${token}` : '';
    this.socket = new WebSocket(`${WS_URL}/ws/vibe?corpusId=${corpusId}${authParam}`);
    
    this.socket.onopen = () => console.log('🔌 Vibe WebSocket connected');
    this.socket.onmessage = (event) => this.onInsight(JSON.parse(event.data));
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onInsight({ type: 'error', text: 'Connection error', confidence: 0 });
    };

    // 2. Initialize Audio Context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
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
    URL.revokeObjectURL(url); // Fix memory leak

    // 4. Capture Stream
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = this.audioContext.createMediaStreamSource(this.stream);
    
    // 5. Connect Worklet
    const workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
    source.connect(workletNode);
    workletNode.connect(this.audioContext.destination);

    workletNode.port.onmessage = (e) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

      const inputData = e.data;
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }

      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
      this.socket.send(JSON.stringify({ audio: base64Audio }));
    };
  }

  stop() {
    this.stream?.getTracks().forEach(track => track.stop());
    this.audioContext?.close();
    this.socket?.close();
    this.stream = null;
    this.audioContext = null;
    this.socket = null;
  }
}
